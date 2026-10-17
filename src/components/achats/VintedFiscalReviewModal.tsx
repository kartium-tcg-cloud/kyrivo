"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { createClient } from "@/lib/supabase/client";
import { getPurchaseDocumentSignedUrl, uploadPurchaseDocument } from "@/lib/purchases";
import type { Achat, AchatArticle } from "@/types/achat";

interface Props {
  achat: Achat | null;
  onFermer: () => void;
  onSaved: () => Promise<void>;
}

/**
 * Revue HUMAINE du prix fournisseur des seuls articles en stock.
 * Ne change jamais purchase_items.unit_cost, le coût économique historique,
 * ni une sale_line déjà émise. Seul fiscal_unit_cost est qualifié pour les
 * VENTES FUTURES sous le régime de la marge.
 */
export default function VintedFiscalReviewModal({ achat, onFermer, onSaved }: Props) {
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptLink, setReceiptLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!achat) return;
    setPrices({});
    setConfirmed({});
    setReceiptFile(null);
    setErrors({});
    setReceiptLink(null);
    let canceled = false;
    if (achat.documentUrl) {
      getPurchaseDocumentSignedUrl(achat.documentUrl)
        .then((url) => { if (!canceled) setReceiptLink(url); })
        .catch(() => { if (!canceled) setReceiptLink(null); });
    }
    return () => { canceled = true; };
  }, [achat]);

  if (!achat) return null;

  const needingReview = (achat.articles ?? []).filter(
    (item) => item.stockRestant > 0 && item.fiscalCostReviewRequired
  );

  async function confirmPrice(item: AchatArticle) {
    if (!achat || busy) return;
    const raw = prices[item.id]?.trim();
    const amount = raw ? Number(raw) : NaN;
    const money = Math.round(amount * 100);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 999999 ||
        Math.abs(amount * 100 - money) > 0.0001) {
      setErrors((e) => ({ ...e, [item.id]: "Renseignez le prix TTC exact payé au vendeur, au centime." }));
      return;
    }
    if (!confirmed[item.id]) {
      setErrors((e) => ({ ...e, [item.id]: "Confirmez le montant après avoir consulté le justificatif." }));
      return;
    }
    if (!receiptLink && !receiptFile) {
      setErrors((e) => ({ ...e, [item.id]: "Joignez un reçu Vinted ou un justificatif du prix vendeur." }));
      return;
    }
    if (receiptFile && (
      !["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(receiptFile.type)
      || receiptFile.size > 10 * 1024 * 1024
    )) {
      setErrors((e) => ({ ...e, [item.id]: "Fichier PDF ou image de 10 Mo maximum." }));
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Session expirée.");
      const { data: membership, error: memberError } = await supabase
        .from("memberships")
        .select("company_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (memberError || !membership) throw new Error("Société introuvable.");

      if (receiptFile) {
        const filePath = await uploadPurchaseDocument(receiptFile, achat.id);
        const { error: documentError } = await supabase.from("purchases")
          .update({ document_url: filePath })
          .eq("id", achat.id)
          .eq("company_id", membership.company_id);
        if (documentError) throw documentError;
      }

      const { data: updated, error: updateError } = await supabase
        .from("purchase_items")
        .update({
          // Conserver le coût réellement supporté tel qu'il était enregistré
          // historiquement (article + frais), sans réécrire unit_cost.
          economic_unit_cost: item.economicUnitCost ?? item.coutTTC ?? item.coutHT,
          fiscal_unit_cost: money / 100,
          fiscal_cost_review_required: false,
          fiscal_cost_reviewed_at: new Date().toISOString(),
          fiscal_cost_reviewed_by: user.id,
        })
        .eq("id", item.id)
        .eq("purchase_document_id", achat.id)
        .eq("company_id", membership.company_id)
        .eq("fiscal_cost_review_required", true)
        .select("id");
      if (updateError || !updated?.length) throw new Error(updateError?.message || "Cet article n'est plus à vérifier.");

      toast.success("Prix fiscal vérifié pour les ventes futures ; ventes passées inchangées.");
      await onSaved();
      onFermer();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible d'enregistrer la vérification.";
      setErrors((e) => ({ ...e, [item.id]: message }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal ouvert={true} onFermer={busy ? () => {} : onFermer} titre="Vérifier les coûts fiscaux Vinted"
      maxWidthClassName="max-w-[700px]"
      footer={<button type="button" onClick={onFermer} disabled={busy}
        className="rounded-lg border border-neutral-700 px-4 py-2.5 text-sm text-white disabled:opacity-50">Fermer</button>}>
      <div className="space-y-4 text-sm text-neutral-200">
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed">
          Pour la TVA sur marge, renseignez le prix figurant sur le justificatif de vente du vendeur,
          hors frais de port payés séparément et protection acheteur Vinted. Le coût historique du
          stock et les ventes passées ne seront pas modifiés.
        </p>
        <div className="space-y-2">
          <p className="font-semibold">Justificatif du prix d'achat</p>
          {receiptLink && <a href={receiptLink} target="_blank" rel="noopener noreferrer"
            className="inline-block text-amber-400 underline">Consulter le document déjà lié à l'achat</a>}
          <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
            className="block w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm" />
          <p className="text-xs text-neutral-400">
            Une preuve du prix vendeur est nécessaire. Vous pouvez utiliser un reçu déjà lié à l'achat.
          </p>
        </div>
        {needingReview.length === 0 && <p>Les articles de cet achat ne nécessitent plus de vérification.</p>}
        {needingReview.map((item) => (
          <div key={item.id} className="space-y-3 rounded-xl border border-neutral-700 bg-neutral-900/40 p-4">
            <div className="font-semibold">{item.nom} <span className="text-neutral-400">({item.stockRestant} en stock)</span></div>
            <p className="text-xs text-neutral-400">
              Coût historique enregistré : {item.coutTTC?.toFixed(2) ?? item.coutHT.toFixed(2)} € / unité.
              Ce montant peut comprendre des frais ; il n'est pas repris automatiquement comme prix fiscal.
            </p>
            <label className="block">
              <span className="block pb-1 text-xs font-semibold">Prix TTC par unité payé au vendeur (€)</span>
              <input type="number" min="0.01" max="999999" step="0.01"
                value={prices[item.id] ?? ""}
                onChange={(e) => { setPrices((v) => ({ ...v, [item.id]: e.target.value })); setConfirmed((v) => ({ ...v, [item.id]: false })); }}
                placeholder="Ex. 100,00"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-base text-white" />
            </label>
            <label className="flex items-start gap-2 text-xs">
              <input type="checkbox" checked={!!confirmed[item.id]}
                onChange={(e) => setConfirmed((v) => ({ ...v, [item.id]: e.target.checked }))}
                className="mt-0.5 accent-amber-500" />
              <span>J'ai vérifié ce prix sur le justificatif du vendeur ; les frais acheteur distincts n'y sont pas inclus.</span>
            </label>
            {errors[item.id] && <p role="alert" className="text-xs text-red-400">{errors[item.id]}</p>}
            <button type="button" onClick={() => confirmPrice(item)} disabled={busy}
              className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-neutral-950 disabled:opacity-50">
              {busy ? "Enregistrement…" : "Valider ce prix fiscal"}
            </button>
          </div>
        ))}
      </div>
    </Modal>
  );
}
