import { createClient } from "@/lib/supabase/client";
import { TransactionFeeDraft, validateTransactionFee } from "@/lib/transactionFees";

/** Persist validated draft fees only after their parent purchase or sale was created. */
export async function saveDraftTransactionFees(params: {
  companyId: string;
  purchaseId?: string;
  saleId?: string;
  fees: TransactionFeeDraft[];
}): Promise<void> {
  const { companyId, purchaseId, saleId, fees } = params;
  if (!fees.length) return;
  if (Boolean(purchaseId) === Boolean(saleId)) throw new Error("Opération invalide pour les frais.");
  const rows = fees.map((fee) => {
    const validFee: TransactionFeeDraft = {
      ...fee, companyId, purchaseId: purchaseId ?? null, saleId: saleId ?? null,
    };
    const errors = validateTransactionFee(validFee);
    if (errors.length) throw new Error(errors.join(" "));
    return {
      company_id: companyId,
      purchase_id: purchaseId ?? null,
      sale_id: saleId ?? null,
      kind: fee.kind,
      category: fee.category,
      label: fee.label,
      amount_ht: fee.amountHT,
      vat_rate: fee.vatRate,
      vat_amount: fee.vatAmount,
      amount_ttc: fee.amountTTC,
      recoverable_vat_amount: fee.recoverableVatAmount,
      included_in_parent_total: fee.includedInParentTotal,
      vat_treatment: fee.vatTreatment,
      notes: fee.notes,
    };
  });
  const { error } = await createClient().from("transaction_fees").insert(rows);
  if (error) throw error;
}
