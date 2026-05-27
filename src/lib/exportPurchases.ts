import { Achat } from "@/types/achat";

type PurchaseExportRow = {
  Date: string;
  "N° achat": string;
  Fournisseur: string;
  Article: string;
  Référence: string;
  Quantité: number | "";
  "Stock restant": number | "";
  "Coût unitaire HT": number | "";
  "Coût unitaire TTC": number | "";
  "Total achat TTC": number;
  "Type achat": string;
  Paiement: string;
  Notes: string;
};

function buildColumnWidths(rows: PurchaseExportRow[]) {
  const columns = Object.keys(rows[0] || {}) as (keyof PurchaseExportRow)[];

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

export async function exportPurchasesToExcel(achats: Achat[]) {
  const XLSX = await import("xlsx");

  const rows: PurchaseExportRow[] = achats.flatMap((achat) => {
    const articles =
      achat.articles && achat.articles.length > 0 ? achat.articles : [null];

    return articles.map((article) => ({
      Date: achat.date,
      "N° achat": achat.numInterne,
      Fournisseur: achat.fournisseur,

      Article: article?.nom ?? achat.produit,
      Référence: article?.reference ?? "",
      Quantité: article?.quantite ?? "",
      "Stock restant": article?.stockRestant ?? "",

      "Coût unitaire HT": article?.coutHT ?? "",
      "Coût unitaire TTC": article?.coutTTC ?? "",

      "Total achat TTC": article?.coutTTC
        ? Math.round(article.coutTTC * article.quantite * 100) / 100
        : achat.prixTTC,

      "Type achat": achat.type,
      Paiement: achat.paiement,
      Notes: article?.notes || achat.commentaire || "",
    }));
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = buildColumnWidths(rows);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Achats");

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `kyrivo-achats-${today}.xlsx`);
}