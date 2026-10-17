"use client";

import { useState } from "react";
import {
  TransactionFeeCategory,
  TransactionFeeDraft,
  TransactionFeeKind,
  summarizeTransactionFees,
  validateTransactionFee,
} from "@/lib/transactionFees";

interface Props {
  fees: TransactionFeeDraft[];
  onChange: (fees: TransactionFeeDraft[]) => void;
  isSale: boolean;
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
const input = "mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100";

export default function TransactionFeesInline({ fees, onChange, isSale }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [kind, setKind] = useState<TransactionFeeKind>("expense");
  const [category, setCategory] = useState<TransactionFeeCategory>("shipping");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("0");
  const [recoverable, setRecoverable] = useState("0");
  const [included, setIncluded] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const reset = () => {
    setEditingIndex(null);
    setKind("expense");
    setCategory("shipping");
    setLabel("");
    setAmount("");
    setRate("0");
    setRecoverable("0");
    setIncluded(false);
    setNotes("");
    setError("");
    setExpanded(false);
  };

  const edit = (fee: TransactionFeeDraft, index: number) => {
    setEditingIndex(index);
    setKind(fee.kind);
    setCategory(fee.category);
    setLabel(fee.label);
    setAmount(String(fee.amountTTC));
    setRate(String(fee.vatRate));
    setRecoverable(String(fee.recoverableVatAmount));
    setIncluded(fee.includedInParentTotal);
    setNotes(fee.notes);
    setError("");
    setExpanded(true);
  };

  const save = () => {
    const gross = Number(amount);
    const vatRate = Number(rate);
    const vatRecoverable = Number(recoverable);
    if (!amount.trim() || !Number.isFinite(gross) || !Number.isFinite(vatRate) ||
        !Number.isFinite(vatRecoverable) || gross <= 0 ||
        Math.abs(gross * 100 - Math.round(gross * 100)) > 1e-7) {
      setError("Indiquez un montant TTC positif, avec deux décimales maximum.");
      return;
    }

    const cents = Math.round(gross * 100);
    const vatCents = vatRate > 0 ? Math.round(cents * vatRate / (100 + vatRate)) : 0;
    const fee: TransactionFeeDraft = {
      kind, category, label: label.trim(), amountTTC: cents / 100,
      amountHT: (cents - vatCents) / 100, vatAmount: vatCents / 100,
      vatRate, recoverableVatAmount: kind === "expense" ? vatRecoverable : 0,
      includedInParentTotal: kind === "customer_charge" ? true : included,
      vatTreatment: "pending_review", notes: notes.trim(),
    };
    const issues = validateTransactionFee(fee);
    if (kind === "customer_charge" && !isSale) issues.push("Cette recette ne peut être associée qu'à une vente.");
    if (issues.length) { setError(issues.join(" ")); return; }

    onChange(editingIndex === null
      ? [...fees, fee]
      : fees.map((existing, index) => index === editingIndex ? fee : existing));
    reset();
  };

  const totals = fees.length ? summarizeTransactionFees(fees) : null;

  return (
    <section className="space-y-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Frais de {isSale ? "cette vente" : "cet achat"}</h3>
          <p className="mt-1 text-xs text-neutral-400">Suivi des frais pour la rentabilité, sans modification automatique de la TVA ni de la facture.</p>
        </div>
        {!expanded && (
          <button type="button" onClick={() => setExpanded(true)}
            className="rounded-lg border border-amber-500/40 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/10">
            + Ajouter un frais
          </button>
        )}
      </div>
      {fees.map((fee, index) => (
        <div key={index} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-700/70 bg-neutral-900/60 px-3 py-2">
          <div>
            <div className="text-sm text-neutral-100">{fee.label} · {euro(fee.amountTTC)}</div>
            <div className="text-xs text-neutral-400">
              {categories.find(c => c.value === fee.category)?.label} · {fee.kind === "customer_charge" ? "Déjà facturé au client" : fee.includedInParentTotal ? "Déjà inclus dans le total" : "Payé séparément"}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => edit(fee, index)} className="text-xs text-amber-300">Modifier</button>
            <button type="button" onClick={() => { onChange(fees.filter((_, i) => i !== index)); if (editingIndex === index) reset(); else if (editingIndex !== null && editingIndex > index) setEditingIndex(editingIndex - 1); }} className="text-xs text-red-300">Supprimer</button>
          </div>
        </div>
      ))}
      {totals && (
        <p className="text-xs text-neutral-300">
          Frais supportés : <strong>{euro(totals.expenseTTC)}</strong>
          {totals.customerChargeTTC > 0 ? " · Déjà facturés au client : " : ""}
          {totals.customerChargeTTC > 0 && <strong>{euro(totals.customerChargeTTC)}</strong>}
        </p>
      )}
      {expanded && (
        <div className="space-y-3 rounded-lg border border-neutral-700 bg-neutral-900/60 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {isSale && (
              <label className="text-xs text-neutral-300">Nature
                <select className={input} value={kind} onChange={e => { const next = e.target.value as TransactionFeeKind; setKind(next); setIncluded(next === "customer_charge"); }}>
                  <option value="expense">Frais payés par le vendeur</option>
                  <option value="customer_charge">Déjà facturés au client</option>
                </select>
              </label>
            )}
            <label className="text-xs text-neutral-300">Catégorie
              <select className={input} value={category} onChange={e => setCategory(e.target.value as TransactionFeeCategory)}>
                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </label>
            <label className="text-xs text-neutral-300">Désignation
              <input className={input} maxLength={120} value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex. Frais de transport" />
            </label>
            <label className="text-xs text-neutral-300">Montant TTC (€)
              <input className={input} type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} />
            </label>
            <label className="text-xs text-neutral-300">TVA sur le frais (%)
              <input className={input} type="number" min="0" max="100" step="0.01" value={rate} onChange={e => setRate(e.target.value)} />
            </label>
            {kind === "expense" && (
              <label className="text-xs text-neutral-300">TVA récupérable estimée (€)
                <input className={input} type="number" min="0" step="0.01" value={recoverable} onChange={e => setRecoverable(e.target.value)} />
              </label>
            )}
          </div>
          {kind === "expense" ? (
            <label className="flex items-start gap-2 text-xs text-neutral-300">
              <input type="checkbox" checked={included} onChange={e => setIncluded(e.target.checked)} />
              Ce frais est déjà inclus dans le montant total de l'opération (ne pas le déduire deux fois).
            </label>
          ) : (
            <p className="text-xs text-amber-300">À utiliser uniquement si le montant est déjà présent dans les lignes de vente. Il ne sera pas ajouté à la facture.</p>
          )}
          <label className="block text-xs text-neutral-300">Notes (facultatif)
            <textarea className={input} value={notes} onChange={e => setNotes(e.target.value)} rows={2} maxLength={2000} />
          </label>
          {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={reset} className="rounded-lg border border-neutral-700 px-3 py-2 text-xs text-neutral-300">Annuler</button>
            <button type="button" onClick={save} className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-neutral-950">
              {editingIndex === null ? "Ajouter à l'opération" : "Valider la modification"}
            </button>
          </div>
        </div>
      )}
      <p className="text-[11px] text-neutral-500">Les frais ajoutés seront enregistrés en même temps que l'opération. Les champs non validés via « Ajouter à l'opération » ne sont pas enregistrés.</p>
    </section>
  );
}
