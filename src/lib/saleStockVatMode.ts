import type { SaleVatMode } from "@/types/sale";

/**
 * Régime TVA proposé lorsqu'un article est choisi en stock.
 * Une suggestion seulement : l'utilisateur conserve le bouton de choix manuel.
 */
export function suggestedVatModeForStock(marginEligible: boolean): SaleVatMode {
  return marginEligible ? "margin_vat" : "standard_vat";
}
