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

const AMOUNT_COLS = new Set<string>([
  "Coût unitaire HT",
  "Coût unitaire TTC",
  "Total achat TTC",
]);

function dateFR(iso: string): string {
  if (!iso) return "";
  const s = iso.split("T")[0].split("-");
  return s.length === 3 ? `${s[2]}/${s[1]}/${s[0]}` : iso;
}

function buildColWidths(rows: PurchaseExportRow[]) {
  const keys = Object.keys(rows[0] || {}) as (keyof PurchaseExportRow)[];
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

export async function exportPurchasesToExcel(achats: Achat[]) {
  const XLSX = await import("xlsx");

  const rows: PurchaseExportRow[] = achats.flatMap((achat) => {
    const articles =
      achat.articles && achat.articles.length > 0 ? achat.articles : [null];

    return articles.map((article) => ({
      Date: dateFR(achat.date),
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
  worksheet["!cols"] = buildColWidths(rows);
  applyStyles(worksheet, XLSX);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Achats");

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `kyrivo-achats-${today}.xlsx`);
}
