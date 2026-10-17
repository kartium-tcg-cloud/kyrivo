import type { VintedSourceDetails } from "@/types/achat";

export function cents(value: number): number {
  if (!Number.isFinite(value) || value < 0 || value > 999999) {
    throw new Error("Montant Vinted invalide.");
  }
  const monetaryCents = Math.round(value * 100);
  if (!Number.isSafeInteger(monetaryCents) || Math.abs(value * 100 - monetaryCents) > 0.00001) {
    throw new Error("Montant Vinted limité à deux décimales.");
  }
  return monetaryCents;
}

export function validateVintedCosts(details: VintedSourceDetails): string[] {
  const errors: string[] = [];
  try {
    const article = cents(details.sellerPrice);
    const shipping = cents(details.shippingFee);
    const protection = cents(details.buyerProtectionFee);
    const other = cents(details.otherFees);
    const paid = cents(details.paidTotal);
    if (article <= 0) errors.push("Le prix payé au vendeur doit être supérieur à zéro.");
    if (paid <= 0) errors.push("Le total payé doit être supérieur à zéro.");
    if (article + shipping + protection + other !== paid) {
      errors.push("Le total payé ne correspond pas au prix du vendeur et aux frais détaillés.");
    }
    if (!details.amountsConfirmed) {
      errors.push("Confirmez les montants à partir du récapitulatif de la commande.");
    }
  } catch {
    errors.push("Un montant Vinted est invalide.");
  }
  return errors;
}

export function vintedFiscalUnitCost(details: VintedSourceDetails): number {
  const errors = validateVintedCosts(details);
  if (errors.length > 0) throw new Error(errors.join(" "));
  // Separate delivery/insurance/protection purchased by the buyer are not
  // automatically included in the fiscal purchase price under margin VAT.
  return cents(details.sellerPrice) / 100;
}
