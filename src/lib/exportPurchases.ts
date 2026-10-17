import { Achat } from "@/types/achat";

// ── Colonnes ──────────────────────────────────────────────────────────────────
// Ordre : identifiants → montants comptables groupés → article détail → divers

type PurchaseExportRow = {
  // Identifiants
  Date: string;
  "N° achat": string;
  Fournisseur: string;

  // Montants comptables — niveau achat (vides sur les lignes 2..N d'un même achat)
  "Montant HT achat": number | "";
  "Taux TVA achat": number | "";
  "TVA déductible": number | "";
  "Montant TTC achat": number | "";
  "Source achat": string;
  "Frais Vinted inclus TTC": number | "";

  // Qualification
  "Nature achat": string;
  "Impact stock": string;

  // Détail article
  Article: string;
  Référence: string;
  Quantité: number | "";
  "Stock restant": number | "";
  "Coût unitaire HT": number | "";
  "Coût unitaire TTC": number | "";
  "Prix fiscal vendeur unitaire": number | "";
  "Coût économique unitaire": number | "";
  "Prix fiscal à vérifier": string;
  "Total ligne TTC": number | "";

  // Divers
  Paiement: string;
  Notes: string;
};

// Colonnes recevant le format € (nombres, pas texte)
const AMOUNT_COLS = new Set<string>([
  "Montant HT achat",
  "TVA déductible",
  "Montant TTC achat",
  "Frais Vinted inclus TTC",
  "Prix fiscal vendeur unitaire",
  "Coût économique unitaire",
  "Coût unitaire HT",
  "Coût unitaire TTC",
  "Total ligne TTC",
]);

// Colonne taux TVA — format numérique + " %"
const RATE_COLS = new Set<string>(["Taux TVA achat"]);

// ── Helpers ───────────────────────────────────────────────────────────────────

function dateFR(iso: string): string {
  if (!iso) return "";
  const s = iso.split("T")[0].split("-");
  return s.length === 3 ? `${s[2]}/${s[1]}/${s[0]}` : iso;
}

function getNatureAchat(achat: Achat): string {
  if (achat.avecStock === false) return "Dépense sans stock";
  if (achat.type === "particulier") return "Particulier / marge";
  if (Number(achat.prixTVA) > 0) return "Professionnel avec TVA";
  return "Professionnel sans TVA";
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
      } else if (cell.t === "n") {
        const col = headers[C];
        if (AMOUNT_COLS.has(col)) {
          cell.z = '#,##0.00 "€"';
        } else if (RATE_COLS.has(col)) {
          cell.z = '#,##0.00" %"';
        }
      }
    }
  }

  ws["!sheetViews"] = [
    { state: "frozen", ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft" },
  ];

  ws["!autofilter"] = { ref: `A1:${XLSX.utils.encode_col(range.e.c)}1` };
}

// ── Export principal ──────────────────────────────────────────────────────────

export async function exportPurchasesToExcel(achats: Achat[]) {
  const XLSX = await import("xlsx");

  const rows: PurchaseExportRow[] = achats.flatMap((achat) => {
    const nature      = getNatureAchat(achat);
    const impactStock = achat.avecStock !== false ? "Oui" : "Non";
    const articles    = achat.articles && achat.articles.length > 0
      ? achat.articles
      : [null];

    return articles.map((article, articleIndex) => {
      // Les montants comptables au niveau achat n'apparaissent que sur
      // la première ligne pour éviter les doublons en cas d'achat multi-articles.
      const isFirst = articleIndex === 0;

      const totalLigneTTC: number | "" = article?.coutTTC
        ? Math.round(article.coutTTC * article.quantite * 100) / 100
        : isFirst
          ? achat.prixTTC
          : "";

      return {
        // Identifiants
        Date:        dateFR(achat.date),
        "N° achat":  achat.numInterne,
        Fournisseur: achat.fournisseur,

        // Montants comptables — seulement sur la première ligne
        "Montant HT achat":  isFirst ? achat.prixHT       : "",
        "Taux TVA achat":    isFirst ? (achat.vatRate ?? 0) : "",
        "TVA déductible":    isFirst ? achat.prixTVA       : "",
        "Montant TTC achat": isFirst ? achat.prixTTC       : "",
        "Source achat": isFirst ? (achat.source === "vinted_import" ? "Import Vinted" : "Manuel") : "",
        "Frais Vinted inclus TTC": isFirst && achat.source === "vinted_import" && achat.sourceDetails
          ? Math.round((achat.sourceDetails.shippingFee + achat.sourceDetails.buyerProtectionFee + achat.sourceDetails.otherFees) * 100) / 100
          : "",

        // Qualification
        "Nature achat": isFirst ? nature      : "",
        "Impact stock": isFirst ? impactStock : "",

        // Détail article
        Article:            article?.nom        ?? achat.produit,
        Référence:          article?.reference  ?? "",
        Quantité:           article?.quantite   ?? "",
        "Stock restant":    article?.stockRestant ?? "",
        "Coût unitaire HT": article?.coutHT     ?? "",
        "Coût unitaire TTC":article?.coutTTC    ?? "",
        "Prix fiscal vendeur unitaire": article?.fiscalUnitCost ?? "",
        "Coût économique unitaire": article?.economicUnitCost ?? "",
        "Prix fiscal à vérifier": article?.fiscalCostReviewRequired ? "Oui" : "",
        "Total ligne TTC":  totalLigneTTC,

        // Divers
        Paiement: achat.paiement,
        Notes:    article?.notes || achat.commentaire || "",
      };
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = buildColWidths(rows);
  applyStyles(worksheet, XLSX);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Achats");

  // Un seul relevé de frais Vinted par achat, même lorsqu'un achat comporte
  // plusieurs articles. Ne jamais additionner ces frais une seconde fois à
  // Montant TTC achat : ils sont DÉJÀ inclus dans ce total.
  const detailsVinted = achats.filter((achat) => achat.source === "vinted_import" && achat.sourceDetails)
    .map((achat) => ({
      "Date achat": dateFR(achat.date),
      "N° achat": achat.numInterne,
      "Référence Vinted": achat.sourceDetails?.orderReference ?? "",
      "Prix vendeur TTC": achat.sourceDetails!.sellerPrice,
      "Livraison acheteur TTC": achat.sourceDetails!.shippingFee,
      "Protection acheteur TTC": achat.sourceDetails!.buyerProtectionFee,
      "Autres frais TTC": achat.sourceDetails!.otherFees,
      "Total payé TTC": achat.sourceDetails!.paidTotal,
      "Prix vérifié": achat.sourceDetails!.amountsConfirmed ? "Oui" : "Non",
      "Justificatif lié": achat.documentUrl ? "Oui" : "Non",
      Notes: achat.commentaire ?? "",
    }));
  if (detailsVinted.length > 0) {
    const detailsSheet = XLSX.utils.json_to_sheet(detailsVinted);
    detailsSheet["!cols"] = Object.keys(detailsVinted[0]).map((key) => ({ wch: Math.min(45, key.length + 4) }));
    XLSX.utils.book_append_sheet(workbook, detailsSheet, "Détail Vinted");
  }

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `kyrivo-achats-${today}.xlsx`);
}
