import { Sale } from "@/types/sale";

type SaleExportRow = {
  Date: string;
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

function getVatModeLabel(vatMode: Sale["vatMode"]) {
  if (vatMode === "margin_vat") return "Marge";
  return "Standard";
}

function buildColumnWidths(rows: SaleExportRow[]) {
  const columns = Object.keys(rows[0] || {}) as (keyof SaleExportRow)[];

  return columns.map((key) => {
    const headerLength = String(key).length;

    const maxContentLength = rows.reduce((max, row) => {
      const value = row[key];
      const length =
        value === null || value === undefined ? 0 : String(value).length;

      return Math.max(max, length);
    }, 0);

    return {
      wch: Math.min(Math.max(headerLength, maxContentLength) + 2, 45),
    };
  });
}

export async function exportSalesToExcel(ventes: Sale[]) {
  const XLSX = await import("xlsx");

  const rows: SaleExportRow[] = ventes.flatMap((vente) => {
    const lines = vente.lines && vente.lines.length > 0 ? vente.lines : [null];

    return lines.map((line) => ({
      Date: vente.date,
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
  worksheet["!cols"] = buildColumnWidths(rows);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Ventes");

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `kyrivo-ventes-${today}.xlsx`);
}