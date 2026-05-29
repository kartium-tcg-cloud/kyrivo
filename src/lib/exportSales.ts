import { Sale } from "@/types/sale";

type SaleExportRow = {
  Date: string;
  "N° facture": string;
  "Facturée le": string;
  "N° vente": string;
  Client: string;
  Article: string;
  Référence: string;
  Quantité: number | "";
  "Prix vente TTC": number | "";
  "Coût achat TTC": number | "";
  Marge: number | "";
  "Mode TVA": string;
  "TVA collectée": number;
  Paiement: string;
  Notes: string;
};

const AMOUNT_COLS = new Set<string>([
  "Prix vente TTC",
  "Coût achat TTC",
  "Marge",
  "TVA collectée",
]);

function dateFR(iso: string): string {
  if (!iso) return "";
  const s = iso.split("T")[0].split("-");
  return s.length === 3 ? `${s[2]}/${s[1]}/${s[0]}` : iso;
}

function getVatModeLabel(vatMode: Sale["vatMode"]) {
  return vatMode === "margin_vat" ? "Marge" : "Standard";
}

function buildColWidths(rows: SaleExportRow[]) {
  const keys = Object.keys(rows[0] || {}) as (keyof SaleExportRow)[];
  return keys.map((key) => {
    const h = String(key).length;
    const c = rows.reduce((m, r) => {
      const v = r[key];
      return Math.max(m, v === null || v === undefined ? 0 : String(v).length);
    }, 0);
    return { wch: Math.min(Math.max(h, c) + 2, 45) };
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyStyles(ws: any, XLSX: any) {
  const ref: string | undefined = ws["!ref"];
  if (!ref) return;

  const range = XLSX.utils.decode_range(ref);

  // Noms de colonne indexés
  const headers: Record<number, string> = {};
  for (let C = range.s.c; C <= range.e.c; C++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
    if (cell) headers[C] = String(cell.v);
  }

  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[addr];
      if (!cell) continue;

      if (R === 0) {
        cell.s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "E5E7EB" }, patternType: "solid" },
          alignment: { horizontal: "center" },
        };
      } else if (cell.t === "n" && AMOUNT_COLS.has(headers[C])) {
        cell.z = '#,##0.00 "€"';
      }
    }
  }

  // Première ligne figée
  ws["!sheetViews"] = [
    { state: "frozen", ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft" },
  ];

  // Filtre automatique sur la ligne d'en-tête
  ws["!autofilter"] = { ref: `A1:${XLSX.utils.encode_col(range.e.c)}1` };
}

export async function exportSalesToExcel(ventes: Sale[]) {
  const XLSX = await import("xlsx");

  const rows: SaleExportRow[] = ventes.flatMap((vente) => {
    const lines = vente.lines && vente.lines.length > 0 ? vente.lines : [null];

    return lines.map((line) => ({
      Date: dateFR(vente.date),
      "N° facture": vente.invoiceNumber ?? "",
      "Facturée le": dateFR(vente.billedAt ?? ""),
      "N° vente": vente.numInterne,
      Client: vente.customerName,

      Article: line?.itemName ?? "",
      Référence: line?.itemReference ?? "",
      Quantité: line?.quantity ?? "",

      "Prix vente TTC": line?.totalPrice ?? vente.totalTTC,
      "Coût achat TTC": line?.purchaseCost ?? "",
      Marge: line?.marginAmount ?? vente.marginAmount,

      "Mode TVA": getVatModeLabel(vente.vatMode),
      "TVA collectée": vente.vatAmount,

      Paiement: vente.paymentMethod,
      Notes: line?.notes || vente.notes || "",
    }));
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = buildColWidths(rows);
  applyStyles(worksheet, XLSX);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Ventes");

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `kyrivo-ventes-${today}.xlsx`);
}
