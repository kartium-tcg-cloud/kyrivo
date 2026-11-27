/**
 * Estimation facultative, indépendante du calcul de TVA et des factures.
 * Le CA de référence est le total de vente hors TVA (subtotalHT).
 * NULL / undefined = aucune estimation sur cette vente historique.
 * Ces montants ne sont PAS une déclaration URSSAF, notamment car les
 * encaissements effectifs ne sont pas suivis séparément dans Kyrivo.
 */
export function socialContributionAmount(
  revenueHT: number,
  rate: number | null | undefined
): number | null {
  if (rate == null) return null;
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
    throw new RangeError("Le taux de cotisations doit être compris entre 0 et 100 %.");
  }
  if (!Number.isFinite(revenueHT)) {
    throw new RangeError("Le chiffre d'affaires est invalide.");
  }
  const revenueCents = Math.round(revenueHT * 100);
  return Math.round(revenueCents * rate / 100) / 100;
}

export function socialContributionSummary(params: {
  revenueHT: number;
  margin: number;
  rate: number | null | undefined;
}) {
  const contribution = socialContributionAmount(params.revenueHT, params.rate);
  if (contribution === null) return null;
  return {
    rate: params.rate as number,
    contribution,
    revenueAfter: Math.round((params.revenueHT - contribution) * 100) / 100,
    marginAfter: Math.round((params.margin - contribution) * 100) / 100,
  };
}
