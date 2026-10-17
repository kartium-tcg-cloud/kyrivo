import { createClient } from "@/lib/supabase/client";
import { TransactionFeeDraft } from "@/lib/transactionFees";

/** Loads fees only for documents in the current user's company. RLS is the second line of defence. */
export async function getTransactionFees(params: {
  companyId: string;
  purchaseIds?: string[];
  saleIds?: string[];
}): Promise<TransactionFeeDraft[]> {
  const { companyId, purchaseIds, saleIds } = params;
  const column = purchaseIds ? "purchase_id" : "sale_id";
  const ids = purchaseIds ?? saleIds ?? [];
  if (!ids.length) return [];
  const supabase = createClient();
  const output: TransactionFeeDraft[] = [];
  // Stay under PostgREST URL and filter-size limits.
  for (let i = 0; i < ids.length; i += 100) {
    const { data, error } = await supabase.from("transaction_fees")
      .select("*").eq("company_id", companyId).in(column, ids.slice(i, i + 100));
    if (error) throw error;
    for (const f of data ?? []) {
      output.push({
        id: f.id,
        companyId: f.company_id,
        purchaseId: f.purchase_id,
        saleId: f.sale_id,
        kind: f.kind,
        category: f.category,
        label: f.label,
        amountHT: Number(f.amount_ht),
        vatRate: Number(f.vat_rate),
        vatAmount: Number(f.vat_amount),
        amountTTC: Number(f.amount_ttc),
        recoverableVatAmount: Number(f.recoverable_vat_amount),
        includedInParentTotal: Boolean(f.included_in_parent_total),
        vatTreatment: f.vat_treatment,
        notes: f.notes ?? "",
      });
    }
  }
  return output;
}
