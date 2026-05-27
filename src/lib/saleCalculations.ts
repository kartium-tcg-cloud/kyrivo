function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function convertTTCtoHT(ttc: number, vatRate: number): number {
  if (vatRate <= 0) return round2(ttc);
  return round2(ttc / (1 + vatRate / 100));
}

export function convertHTtoTTC(ht: number, vatRate: number): number {
  return round2(ht * (1 + vatRate / 100));
}

export function calculateStandardVAT(params: {
  unitPriceHT: number;
  quantity: number;
  vatRate: number;
}): {
  subtotalHT: number;
  vatAmount: number;
  totalTTC: number;
} {
  const subtotalHT = round2(params.unitPriceHT * params.quantity);
  const vatAmount = round2(subtotalHT * (params.vatRate / 100));
  const totalTTC = round2(subtotalHT + vatAmount);

  return { subtotalHT, vatAmount, totalTTC };
}

export function calculateMarginVAT(params: {
  salePriceTTC: number;
  purchaseCost: number;
  vatRate: number;
}): {
  marginGross: number;
  marginBaseHT: number;
  vatAmount: number;
  marginNet: number;
} {
  const marginGross = round2(params.salePriceTTC - params.purchaseCost);

  if (marginGross <= 0) {
    return {
      marginGross,
      marginBaseHT: 0,
      vatAmount: 0,
      marginNet: marginGross,
    };
  }

  const ratio = params.vatRate / 100;
  const marginBaseHT = round2(marginGross / (1 + ratio));
  const vatAmount = round2(marginGross - marginBaseHT);
  const marginNet = marginBaseHT;

  return { marginGross, marginBaseHT, vatAmount, marginNet };
}

export function calculateMarginSale(params: {
  lines: {
    unitPrice: number; // TTC total de la ligne
    quantity: number;
    purchaseCost: number; // coût unitaire TTC
    vatRate: number;
  }[];
}): {
  totalTTC: number;
  subtotalHT: number;
  vatAmount: number;
  marginAmount: number;
} {
  let totalTTC = 0;
  let subtotalHT = 0;
  let vatAmount = 0;
  let marginAmount = 0;

  params.lines.forEach((line) => {
    const lineTTC = round2(line.unitPrice);
    const lineCost = round2(line.purchaseCost * line.quantity);

    const calc = calculateMarginVAT({
      salePriceTTC: lineTTC,
      purchaseCost: lineCost,
      vatRate: line.vatRate,
    });

    totalTTC = round2(totalTTC + lineTTC);
    subtotalHT = round2(subtotalHT + (lineTTC - calc.vatAmount));
    vatAmount = round2(vatAmount + calc.vatAmount);
    marginAmount = round2(marginAmount + calc.marginNet);
  });

  return { totalTTC, subtotalHT, vatAmount, marginAmount };
}

export function calculateStandardSale(params: {
  lines: {
    unitPrice: number; // HT unitaire
    quantity: number;
    vatRate: number;
  }[];
}): {
  totalTTC: number;
  subtotalHT: number;
  vatAmount: number;
} {
  let subtotalHT = 0;
  let vatAmount = 0;
  let totalTTC = 0;

  params.lines.forEach((line) => {
    const calc = calculateStandardVAT({
      unitPriceHT: line.unitPrice,
      quantity: line.quantity,
      vatRate: line.vatRate,
    });

    subtotalHT = round2(subtotalHT + calc.subtotalHT);
    vatAmount = round2(vatAmount + calc.vatAmount);
    totalTTC = round2(totalTTC + calc.totalTTC);
  });

  return { subtotalHT, vatAmount, totalTTC };
}