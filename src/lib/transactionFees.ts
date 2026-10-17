/**
 * Financial foundation: keeps an internal expense separate from a customer
 * charge. All amounts are monetary values in EUR at two decimal places.
 *
 * This module NEVER computes margin-VAT or amends invoice/sale totals.
 * Those operations require tax classification and a linked document context.
 */
export type TransactionFeeKind = "expense" | "customer_charge";
export type TransactionFeeCategory =
  | "shipping"
  | "marketplace"
  | "payment_processing"
  | "packaging"
  | "insurance"
  | "customs"
  | "tax"
  | "other";

export type TransactionFeeVatTreatment =
  | "pending_review"
  | "standard"
  | "margin_accessory"
  | "outside_scope";

export interface TransactionFeeDraft {
  id?: string;
  companyId?: string;
  purchaseId?: string | null;
  saleId?: string | null;
  kind: TransactionFeeKind;
  category: TransactionFeeCategory;
  label: string;
  amountHT: number;
  vatRate: number;
  vatAmount: number;
  amountTTC: number;
  recoverableVatAmount: number;
  includedInParentTotal: boolean;
  vatTreatment: TransactionFeeVatTreatment;
  notes: string;
}

export interface FeeTotals {
  /** Internal costs paid by the merchant. Never shown on customer invoices. */
  expenseTTC: number;
  /** Additional amounts charged to customers: revenue, NOT expense. */
  customerChargeTTC: number;
  /** Expense VAT explicitly recorded as recoverable; not a tax ruling. */
  recoverableExpenseVat: number;
  /** Expense amount not yet included in the parent document's declared total. */
  externalExpenseTTC: number;
  /** Customer charge not yet included in the parent sale's declared total. */
  externalCustomerChargeTTC: number;
}

function cents(amount: number): number {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Montant de frais invalide.");
  }
  const raw = amount * 100;
  const value = Math.round(raw);
  // Values are entered as euros/cents. Reject fractions of a cent rather
  // than silently changing their meaning on save.
  if (Math.abs(raw - value) > 1e-7) {
    throw new Error("Montant à deux décimales maximum.");
  }
  if (!Number.isSafeInteger(value)) {
    throw new Error("Montant de frais trop élevé.");
  }
  return value;
}

function euros(value: number): number {
  return value / 100;
}

export function validateTransactionFee(fee: TransactionFeeDraft): string[] {
  const errors: string[] = [];
  if (!["expense", "customer_charge"].includes(fee.kind)) errors.push("Nature du frais invalide.");
  if (!["shipping", "marketplace", "payment_processing", "packaging", "insurance", "customs", "tax", "other"].includes(fee.category)) {
    errors.push("Catégorie de frais invalide.");
  }
  if (!fee.label.trim() || fee.label.trim().length > 120) errors.push("Libellé de frais obligatoire (120 caractères maximum).");
  if (fee.notes.length > 2000) errors.push("Notes limitées à 2 000 caractères.");
  if (!Number.isFinite(fee.vatRate) || fee.vatRate < 0 || fee.vatRate > 100) {
    errors.push("Taux de TVA sur le frais invalide.");
  }

  try {
    const total = cents(fee.amountTTC);
    const ht = cents(fee.amountHT);
    const vat = cents(fee.vatAmount);
    const deductible = cents(fee.recoverableVatAmount);
    if (total <= 0) errors.push("Montant TTC du frais supérieur à zéro requis.");
    if (ht + vat !== total) errors.push("Le montant HT et la TVA ne correspondent pas au TTC.");
    if (deductible > vat) errors.push("La TVA récupérable ne peut pas dépasser la TVA du frais.");
    if (fee.kind === "customer_charge" && deductible !== 0) errors.push("Une recette ne contient pas de TVA déductible.");
    if (fee.kind === "customer_charge" && !fee.includedInParentTotal) {
      errors.push("Un frais client déjà facturé doit être inclus dans la vente existante.");
    }
    if (fee.vatRate === 0 && vat > 0) errors.push("La TVA du frais doit être nulle si son taux est 0 %.");
    if (fee.vatRate > 0 && Number.isFinite(fee.vatRate) && Math.abs(vat - Math.round(total * fee.vatRate / (100 + fee.vatRate))) > 1) {
      errors.push("TVA incohérente avec le taux et le TTC du frais.");
    }
  } catch {
    errors.push("Montants de frais invalides.");
  }

  if (fee.purchaseId && fee.saleId) errors.push("Un frais ne peut appartenir à deux opérations.");
  if (fee.kind === "customer_charge" && fee.purchaseId) {
    errors.push("Un frais facturé au client doit être rattaché à une vente.");
  }
  return errors;
}

/**
 * Totals for audit and future export. Never apply these totals blindly to
 * sale.total_ttc, sale.vat_amount or purchase_item.total_cost.
 */
export function summarizeTransactionFees(fees: TransactionFeeDraft[]): FeeTotals {
  const totals = {
    expenseTTC: 0,
    customerChargeTTC: 0,
    recoverableExpenseVat: 0,
    externalExpenseTTC: 0,
    externalCustomerChargeTTC: 0,
  };

  for (const fee of fees) {
    const issues = validateTransactionFee(fee);
    if (issues.length > 0) throw new Error(issues.join(" "));
    const value = cents(fee.amountTTC);

    if (fee.kind === "expense") {
      totals.expenseTTC += value;
      totals.recoverableExpenseVat += cents(fee.recoverableVatAmount);
      if (!fee.includedInParentTotal) totals.externalExpenseTTC += value;
    } else {
      totals.customerChargeTTC += value;
      if (!fee.includedInParentTotal) totals.externalCustomerChargeTTC += value;
    }
  }

  return {
    expenseTTC: euros(totals.expenseTTC),
    customerChargeTTC: euros(totals.customerChargeTTC),
    recoverableExpenseVat: euros(totals.recoverableExpenseVat),
    externalExpenseTTC: euros(totals.externalExpenseTTC),
    externalCustomerChargeTTC: euros(totals.externalCustomerChargeTTC),
  };
}
