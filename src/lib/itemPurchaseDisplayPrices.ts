/**
 * Montants d'affichage d'une fiche article.
 *
 * purchase_items.total_cost est le coût TTC ENREGISTRÉ du lot :
 * il peut déjà inclure les frais de plateforme (ex. Vinted).
 * unit_cost est la base HT enregistrée ; ne pas recalculer le TTC depuis
 * unit_cost × (1 + vat_rate) : cela perdrait ces frais et pourrait être faux
 * pour les achats à un particulier.
 *
 * Aucune écriture ou modification du moteur TVA.
 */
export interface ItemPurchasePriceFields {
  quantity: number | string | null;
  total_cost: number | string | null;
  unit_cost: number | string | null;
  vat_rate?: number | string | null;
  vat_type?: string | null;
}

function validMoney(value: number | string | null): number | null {
  if (value === null || value === "" || !Number.isFinite(Number(value))) return null;
  const money = Number(value);
  return money >= 0 ? money : null;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function getItemPurchaseDisplayPrices(item: ItemPurchasePriceFields) {
  const quantity = Number(item.quantity);
  const totalTTC = validMoney(item.total_cost);
  const unitTTC =
    totalTTC !== null && Number.isFinite(quantity) && quantity > 0
      ? round2(totalTTC / quantity)
      : null;

  // Un achat particulier ne comporte pas de TVA déductible ni de prix HT
  // fiscal distinct : éviter de lui coller une étiquette « HT » fictive.
  const vatRate = Number(item.vat_rate ?? 0);
  const unitHT =
    item.vat_type === "pro" && Number.isFinite(vatRate) && vatRate > 0
      ? validMoney(item.unit_cost)
      : null;

  return {
    unitTTC,
    totalTTC: totalTTC === null ? null : round2(totalTTC),
    unitHT,
  };
}
