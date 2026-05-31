import { Sale } from "@/types/sale";

// ── Colonnes ──────────────────────────────────────────────────────────────────
//
// Règles de stockage dans sale_lines (confirmées dans saleCalculations.ts) :
//   TVA standard → line.totalPrice = unitPriceHT × quantity  (= HT subtotal)
//   TVA sur marge → line.totalPrice = prix TTC total de la ligne (lump sum)
//
// Les montants de niveau vente (HT total, TVA collectée, TTC total) n'apparaissent
// QUE sur la première ligne de chaque vente pour éviter les doublons en cas de
// vente multi-articles (un SUM() Excel resterait correct).

type SaleExportRow = {
  // Identifiants
  Date: string;
  "N° facture": string;
  "Facturée le": string;
  "N° vente": string;
  Client: string;

  // Montants comptables niveau vente — première ligne uniquement
  "Mode TVA": string;
  "HT total vente": number | "";
  "Taux TVA": number | "";
  "TVA collectée": number | "";
  "TTC total vente": number | "";
  "Marge totale": number | "";

  // Détail ligne article
  Article: string;
  Référence: string;
  Quantité: number | "";
  "Prix ligne HT": number | "";  // standard : HT ligne ; marge : vide
  "Prix ligne TTC": number | ""; // standard : TTC calculé ; marge : TTC saisi
  "Coût achat TTC": number | "";
  "Marge ligne": number | "";    // marginAmount stocké (HT net pour marge)

  // Divers
  Paiement: string;
  Notes: string;
};

// Colonnes recevant le format €
const AMOUNT_COLS = new Set<string>([
  "HT total vente",
  "TVA collectée",
  "TTC total vente",
  "Marge totale",
  "Prix ligne HT",
  "Prix ligne TTC",
  "Coût achat TTC",
  "Marge ligne",
]);

// Colonne taux TVA — format numérique + " %"
const RATE_COLS = new Set<string>(["Taux TVA"]);

// ── Helpers ───────────────────────────────────────────────────────────────────

function dateFR(iso: string): string {
  if (!iso) return "";
  const s = iso.split("T")[0].split("-");
  return s.length === 3 ? `${s[2]}/${s[1]}/${s[0]}` : iso;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function getVatModeLabel(vatMode: Sale["vatMode"]) {
  return vatMode === "margin_vat" ? "TVA sur marge" : "TVA standard";
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

export async function exportSalesToExcel(ventes: Sale[]) {
  const XLSX = await import("xlsx");

  const rows: SaleExportRow[] = ventes.flatMap((vente) => {
    const lines       = vente.lines && vente.lines.length > 0 ? vente.lines : [null];
    const isStandard  = vente.vatMode === "standard_vat";
    const firstVatRate = vente.lines?.[0]?.vatRate ?? 0;

    return lines.map((line, idx) => {
      const isFirst = idx === 0;

      // ── Prix ligne HT ───────────────────────────────────────
      // Standard : line.totalPrice = unitPriceHT × qty = sous-total HT de la ligne
      // Marge    : n/a (le prix de vente est intrinsèquement TTC)
      const prixLigneHT: number | "" =
        line && isStandard ? line.totalPrice : "";

      // ── Prix ligne TTC ──────────────────────────────────────
      // Standard : HT × (1 + taux)  → donne le vrai TTC ligne
      // Marge    : line.totalPrice est déjà le TTC saisi par l'utilisateur
      const prixLigneTTC: number | "" = line
        ? isStandard
          ? round2(line.totalPrice * (1 + line.vatRate / 100))
          : line.totalPrice
        : isFirst
          ? vente.totalTTC
          : "";

      return {
        // Identifiants (toutes les lignes)
        Date:          dateFR(vente.date),
        "N° facture":  vente.invoiceNumber ?? "",
        "Facturée le": dateFR(vente.billedAt ?? ""),
        "N° vente":    vente.numInterne,
        Client:        vente.customerName,

        // Montants comptables — première ligne uniquement pour un SUM correct
        "Mode TVA":       isFirst ? getVatModeLabel(vente.vatMode) : "",
        "HT total vente": isFirst ? vente.subtotalHT   : "",
        "Taux TVA":       isFirst ? firstVatRate        : "",
        "TVA collectée":  isFirst ? vente.vatAmount     : "",
        "TTC total vente":isFirst ? vente.totalTTC      : "",
        "Marge totale":   isFirst ? vente.marginAmount  : "",

        // Détail ligne
        Article:           line?.itemName        ?? "",
        Référence:         line?.itemReference   ?? "",
        Quantité:          line?.quantity        ?? "",
        "Prix ligne HT":   prixLigneHT,
        "Prix ligne TTC":  prixLigneTTC,
        "Coût achat TTC":  line?.purchaseCost    ?? "",
        "Marge ligne":     line?.marginAmount    ?? "",

        // Divers
        Paiement: vente.paymentMethod,
        Notes:    line?.notes || vente.notes || "",
      };
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = buildColWidths(rows);
  applyStyles(worksheet, XLSX);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Ventes");

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `kyrivo-ventes-${today}.xlsx`);
}
