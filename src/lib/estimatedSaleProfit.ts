import type { Sale, SaleLine } from "@/types/sale";
import type { TransactionFeeDraft } from "@/lib/transactionFees";
import { calculateMarginVAT } from "@/lib/saleCalculations";

const cents = (number: number) => Math.round(number * 100);

/** Displays an estimate, never a certified accounting result or VAT declaration.
 * Customer-charge entries are *not* added as revenue: the charge must already
 * be included in an existing sale line and reflected in sale.totalTTC.
 * Returns null if at least one sale line has an unknown acquisition cost.
 */
export function estimateSaleProfit(sale: Sale, fees: TransactionFeeDraft[] = []): number | null {
  if (!sale.lines?.length || sale.lines.some((line) =>
    line.economicPurchaseCost == null || (sale.vatMode === "margin_vat" && line.purchaseCost == null)
  )) return null;

  let profitCents = 0;
  for (const line of sale.lines as SaleLine[]) {
    const lineValue = line.totalPrice;
    const cost = (line.economicPurchaseCost ?? 0) * line.quantity;
    const vat = sale.vatMode === "margin_vat"
      ? calculateMarginVAT({
          salePriceTTC: lineValue,
          purchaseCost: (line.purchaseCost ?? 0) * line.quantity,
          vatRate: line.vatRate,
        }).vatAmount
      : 0; // In standard mode line.totalPrice is already ex-VAT (HT).
    profitCents += cents(lineValue) - cents(cost) - cents(vat);
  }
  const expenses = fees.filter((fee) => fee.kind === "expense" && fee.saleId === sale.id);
  for (const fee of expenses) {
    // Recoverable VAT is user-declared, and must never exceed the VAT shown.
    profitCents -= cents(fee.amountTTC) - cents(fee.recoverableVatAmount);
  }
  return profitCents / 100;
}
