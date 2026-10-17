"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { createClient } from "@/lib/supabase/client";
import {
  TransactionFeeCategory, TransactionFeeDraft, TransactionFeeKind,
  summarizeTransactionFees, validateTransactionFee,
} from "@/lib/transactionFees";

type FeeRow = TransactionFeeDraft & { id: string };
interface Props {
  ouvert: boolean;
  onFermer: () => void;
  companyId: string;
  purchaseId?: string;
  saleId?: string;
  onSaved?: () => Promise<void> | void;
}

const categories: { value: TransactionFeeCategory; label: string }[] = [
  { value: "shipping", label: "Livraison / transport" },
  { value: "marketplace", label: "Commission plateforme" },
  { value: "payment_processing", label: "Frais de paiement" },
  { value: "packaging", label: "Emballage" },
  { value: "insurance", label: "Assurance" },
  { value: "customs", label: "Douane" },
  { value: "tax", label: "Autre taxe" },
  { value: "other", label: "Autre" },
];
const euro = (n: number) => n.toLocaleString("fr-BE", { style: "currency", currency: "EUR" });

export default function TransactionFeesModal({ ouvert, onFermer, companyId, purchaseId, saleId, onSaved }: Props) {
  const [rows, setRows] = useState<FeeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState<TransactionFeeKind>("expense");
  const [category, setCategory] = useState<TransactionFeeCategory>("shipping");
  const [label, setLabel] = useState("");
  const [amountTTC, setAmountTTC] = useState("");
  const [vatRate, setVatRate] = useState("0");
  const [recoverableVat, setRecoverableVat] = useState("0");
  const [included, setIncluded] = useState(false);
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!companyId || (!purchaseId && !saleId)) return;
    setLoading(true);
    try {
      let query = createClient().from("transaction_fees").select("*").eq("company_id", companyId);
      query = purchaseId ? query.eq("purchase_id", purchaseId) : query.eq("sale_id", saleId!);
      const { data, error } = await query.order("created_at", { ascending: true });
      if (error) throw error;
      setRows((data ?? []).map((v) => ({
        id: String(v.id), companyId: String(v.company_id),
        purchaseId: v.purchase_id ?? null, saleId: v.sale_id ?? null,
        kind: v.kind, category: v.category, label: v.label,
        amountHT: Number(v.amount_ht), vatRate: Number(v.vat_rate),
        vatAmount: Number(v.vat_amount), amountTTC: Number(v.amount_ttc),
        recoverableVatAmount: Number(v.recoverable_vat_amount),
        includedInParentTotal: Boolean(v.included_in_parent_total),
        vatTreatment: v.vat_treatment, notes: v.notes ?? "",
      })));
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger les frais de cette opération.");
    } finally {
      setLoading(false);
    }
  }, [companyId, purchaseId, saleId]);

  useEffect(() => { if (ouvert) void load(); }, [ouvert, load]);

  const reset = () => {
    setEditingId(null); setLabel(""); setAmountTTC(""); setVatRate("0");
    setRecoverableVat("0"); setIncluded(false); setNotes(""); setKind("expense");
    setCategory("shipping");
  };
  const editing = (r: FeeRow) => {
    setEditingId(r.id); setKind(r.kind); setCategory(r.category); setLabel(r.label);
    setAmountTTC(String(r.amountTTC)); setVatRate(String(r.vatRate));
    setRecoverableVat(String(r.recoverableVatAmount));
    setIncluded(r.includedInParentTotal); setNotes(r.notes);
  };

  const save = async () => {
    if (busy || loading) return;
    const gross = Number(amountTTC);
    const rate = Number(vatRate);
    // Centimes sur les résultats, sans cumul de nombres flottants.
    const cents = Math.round(gross * 100);
    const vatCents = rate > 0 ? Math.round(cents * rate / (100 + rate)) : 0;
    const fee: TransactionFeeDraft = {
      companyId, purchaseId: purchaseId ?? null, saleId: saleId ?? null,
      kind, category, label: label.trim(), amountTTC: cents / 100,
      amountHT: (cents - vatCents) / 100, vatAmount: vatCents / 100,
      vatRate: rate, recoverableVatAmount: Number(recoverableVat),
      includedInParentTotal: kind === "customer_charge" ? true : included,
      vatTreatment: "pending_review", notes: notes.trim(),
    };
    if (kind === "customer_charge" && !saleId) {
      toast.error("Les frais facturés au client sont liés à une vente uniquement.");
      return;
    }
    const errors = validateTransactionFee(fee);
    if (errors.length) { toast.error(errors.join(" ")); return; }
    setBusy(true);
    try {
      const payload = {
        ...(editingId ? { id: editingId } : {}),
        company_id: companyId, purchase_id: purchaseId ?? null, sale_id: saleId ?? null,
        kind, category, label: fee.label, amount_ht: fee.amountHT,
        vat_rate: fee.vatRate, vat_amount: fee.vatAmount, amount_ttc: fee.amountTTC,
        recoverable_vat_amount: fee.recoverableVatAmount,
        included_in_parent_total: fee.includedInParentTotal,
        vat_treatment: fee.vatTreatment, notes: fee.notes,
      };
      const { error } = await createClient().from("transaction_fees").upsert(payload);
      if (error) throw error;
      reset(); await load(); await onSaved?.();
      toast.success("Frais enregistrés.");
    } catch (error) {
      console.error(error);
      toast.error("Impossible d'enregistrer ce frais.");
    } finally { setBusy(false); }
  };

  const remove = async (r: FeeRow) => {
    if (busy || !confirm("Supprimer ce frais ? Cette opération ne modifie pas les montants de la facture.")) return;
    setBusy(true);
    try {
      const { error } = await createClient().from("transaction_fees")
        .delete().eq("id", r.id).eq("company_id", companyId);
      if (error) throw error;
      await load(); await onSaved?.();
      if (editingId === r.id) reset();
    } catch (error) {
      console.error(error); toast.error("Impossible de supprimer ce frais.");
    } finally { setBusy(false); }
  };

  const totals = rows.length ? summarizeTransactionFees(rows) : null;
  const input = "w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100";
  const close = () => { if (!busy) { reset(); onFermer(); } };

  return (
    <Modal ouvert={ouvert} onFermer={close}
      titre={purchaseId ? "Frais de cet achat" : "Frais de cette vente"}
      maxWidthClassName="max-w-[760px]">
      <div className="max-h-[75vh] space-y-5 overflow-y-auto p-1">
        <p className="text-xs leading-relaxed text-neutral-400">
          Ces frais sont suivis pour la rentabilité. Ils ne modifient jamais automatiquement
          le total de l’achat, la TVA sur marge ou les factures déjà émises.
        </p>
        {loading ? <p className="text-sm text-neutral-400">Chargement des frais…</p> : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                <div>
                  <div className="text-sm font-medium text-neutral-100">{r.label}</div>
                  <div className="text-xs text-neutral-400">
                    {categories.find((c) => c.value === r.category)?.label} · {r.kind === "expense" ? "Frais supporté" : "Déjà facturé au client"}
                    {r.includedInParentTotal ? " · inclus dans le total" : " · payé séparément"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <strong className="text-sm tabular-nums">{euro(r.amountTTC)}</strong>
                  <button type="button" onClick={() => editing(r)} disabled={busy}
                    className="rounded-md border border-neutral-700 px-2 py-1 text-xs hover:bg-neutral-800">Modifier</button>
                  <button type="button" onClick={() => void remove(r)} disabled={busy}
                    className="rounded-md border border-red-900 px-2 py-1 text-xs text-red-300 hover:bg-red-900/20">Supprimer</button>
                </div>
              </div>
            ))}
            {rows.length === 0 && <p className="rounded-lg border border-dashed border-neutral-800 p-3 text-sm text-neutral-500">Aucun frais lié à cette opération.</p>}
            {totals && (
              <div className="space-y-1 rounded-lg bg-neutral-900/70 p-3 text-sm">
                <div>Frais supportés : <strong>{euro(totals.expenseTTC)}</strong></div>
                <div>Dont frais payés séparément : <strong>{euro(totals.externalExpenseTTC)}</strong></div>
                {totals.customerChargeTTC > 0 && <div>Frais facturés au client, déjà inclus dans la vente : <strong>{euro(totals.customerChargeTTC)}</strong></div>}
              </div>
            )}
          </div>
        )}
        <div className="space-y-3 rounded-xl border border-amber-500/20 bg-neutral-900/50 p-4">
          <h3 className="text-sm font-semibold text-white">{editingId ? "Modifier le frais" : "Ajouter un frais"}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {saleId && <label className="text-xs text-neutral-300">
              Nature
              <select className={input} value={kind} onChange={e => { setKind(e.target.value as TransactionFeeKind); setIncluded(e.target.value === "customer_charge"); }}>
                <option value="expense">Frais payés par le vendeur</option>
                <option value="customer_charge">Frais déjà facturés au client</option>
              </select>
            </label>}
            <label className="text-xs text-neutral-300">Catégorie
              <select className={input} value={category} onChange={e => setCategory(e.target.value as TransactionFeeCategory)}>
                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </label>
            <label className="text-xs text-neutral-300">Désignation
              <input className={input} maxLength={120} value={label} onChange={e=>setLabel(e.target.value)} placeholder="Ex. Livraison Bpost" />
            </label>
            <label className="text-xs text-neutral-300">Montant TTC (€)
              <input className={input} type="number" min="0.01" step="0.01" value={amountTTC} onChange={e=>setAmountTTC(e.target.value)} />
            </label>
            <label className="text-xs text-neutral-300">TVA indiquée sur le frais (%)
              <input className={input} type="number" min="0" max="100" step="0.01" value={vatRate} onChange={e=>setVatRate(e.target.value)} />
            </label>
            {kind === "expense" && <label className="text-xs text-neutral-300">TVA récupérable estimée (€) — facultatif
              <input className={input} type="number" min="0" step="0.01" value={recoverableVat} onChange={e=>setRecoverableVat(e.target.value)} />
            </label>}
          </div>
          {kind === "expense" ? <label className="flex items-center gap-2 text-xs text-neutral-300">
            <input type="checkbox" checked={included} onChange={e=>setIncluded(e.target.checked)} />
            Ce montant est déjà compris dans le total payé de l'achat/la vente.
          </label> : <p className="text-xs text-amber-300">
            Enregistrez d'abord ce montant dans une ligne de vente existante. Cette fiche l'identifie,
            sans le refacturer et sans l'ajouter deux fois.
          </p>}
          <label className="block text-xs text-neutral-300">Notes (facultatif)
            <textarea className={input} rows={2} maxLength={2000} value={notes} onChange={e=>setNotes(e.target.value)} />
          </label>
          <div className="flex justify-end gap-2">
            {editingId && <button type="button" onClick={reset} className="rounded-lg border border-neutral-700 px-4 py-2 text-sm">Annuler la modification</button>}
            <button type="button" onClick={() => void save()} disabled={busy || loading}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-neutral-950 disabled:opacity-40">
              {busy ? "Enregistrement…" : editingId ? "Enregistrer les changements" : "Ajouter le frais"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
