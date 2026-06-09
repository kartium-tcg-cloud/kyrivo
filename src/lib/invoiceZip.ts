// src/lib/invoiceZip.ts
// Génération de factures PDF premium + ZIP
// Design sombre/premium inspiré Stripe / Linear / Notion / Vercel — v3

import jsPDF from "jspdf";
import JSZip from "jszip";
import { saveAs } from "file-saver";

import { CompanyPreferences } from "@/types/preferences";
import { Sale } from "@/types/sale";

import { upsertCompanyPreferences } from "@/lib/preferences";


// ═══════════════════════════════════════════════════════════
// SYSTÈME DE DESIGN
// ═══════════════════════════════════════════════════════════

const COLORS = {
  // Neutres — échelle fine
  ink: [17, 17, 17] as [number, number, number],
  inkSoft: [55, 55, 55] as [number, number, number],
  inkMid: [95, 95, 95] as [number, number, number],
  inkMuted: [125, 125, 125] as [number, number, number],
  inkFaint: [170, 170, 170] as [number, number, number],
  inkGhost: [205, 205, 205] as [number, number, number],

  // Backgrounds
  paper: [255, 255, 255] as [number, number, number],
  surface: [250, 250, 250] as [number, number, number],
  surfaceAlt: [246, 246, 246] as [number, number, number],

  // Bordures
  ruleFaint: [235, 235, 235] as [number, number, number],
  rule: [222, 222, 222] as [number, number, number],
  ruleStrong: [180, 180, 180] as [number, number, number],

  // Header
  headerBg: [10, 10, 10] as [number, number, number],
  headerInk: [255, 255, 255] as [number, number, number],
  headerSub: [165, 165, 165] as [number, number, number],
  headerHint: [110, 110, 110] as [number, number, number],

  // Accent doré
  amber: [217, 119, 6] as [number, number, number],
  amberDeep: [180, 83, 9] as [number, number, number],
  amberSoft: [251, 191, 36] as [number, number, number],
  amberBg: [254, 243, 199] as [number, number, number],
  amberBgAlt: [255, 251, 235] as [number, number, number],
};

const LAYOUT = {
  pageWidth: 210,
  pageHeight: 297,
  marginX: 18,
  contentWidth: 174,

  headerHeight: 38,  // réduit de 44 → 38 (~14%)
  metaY: 50,         // décalé avec le header
  partiesY: 78,      // décalé avec le header
  tableY: 140,       // décalé avec le header

  // Footer ANCRÉ EN BAS — coordonnée fixe
  // Tout ce qui est avant le footer doit s'arrêter à footerTop - 4mm
  footerTop: 258,
  footerBottom: 290,
};

const FONT = {
  family: "helvetica" as const,
  hero: 24,
  display: 11,
  large: 14,
  body: 9.5,
  bodySmall: 9,
  small: 8.5,
  caption: 7.5,
  micro: 6.8,
  total: 16,
  label: 7.2,
};

const SPACING = {
  tableRowDense: 8.5,
  tableRowNormal: 9.5,
  tableRowComfort: 10.5,
};

// ═══════════════════════════════════════════════════════════
// HELPERS BAS NIVEAU
// ═══════════════════════════════════════════════════════════

function drawText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  opts: {
    size?: number;
    bold?: boolean;
    color?: [number, number, number];
    align?: "left" | "center" | "right";
    letterSpacing?: number;
  } = {}
) {
  doc.setFont(FONT.family, opts.bold ? "bold" : "normal");
  doc.setFontSize(opts.size ?? FONT.body);
  doc.setTextColor(...(opts.color ?? COLORS.ink));

  if (opts.letterSpacing !== undefined) {
    doc.setCharSpace(opts.letterSpacing);
  } else {
    doc.setCharSpace(0);
  }

  doc.text(text, x, y, opts.align ? { align: opts.align } : undefined);
  doc.setCharSpace(0);
}

function drawLabel(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  opts: {
    color?: [number, number, number];
    align?: "left" | "center" | "right";
    size?: number;
  } = {}
) {
  drawText(doc, text.toUpperCase(), x, y, {
    size: opts.size ?? FONT.label,
    bold: true,
    color: opts.color ?? COLORS.inkMuted,
    align: opts.align,
    letterSpacing: 1.3,
  });
}

function drawBox(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  color: [number, number, number]
) {
  doc.setFillColor(...color);
  doc.rect(x, y, w, h, "F");
}

function drawBorder(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  color: [number, number, number],
  lineWidth = 0.15
) {
  doc.setDrawColor(...color);
  doc.setLineWidth(lineWidth);
  doc.rect(x, y, w, h, "S");
}

function drawLine(
  doc: jsPDF,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: [number, number, number] = COLORS.rule,
  lineWidth = 0.15
) {
  doc.setDrawColor(...color);
  doc.setLineWidth(lineWidth);
  doc.line(x1, y1, x2, y2);
}

function drawDottedLine(
  doc: jsPDF,
  x1: number,
  y: number,
  x2: number,
  color: [number, number, number] = COLORS.rule
) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.2);
  const dotSpacing = 1.2;
  for (let x = x1; x <= x2; x += dotSpacing) {
    doc.line(x, y, x + 0.3, y);
  }
}

// ═══════════════════════════════════════════════════════════
// HELPERS MÉTIER
// ═══════════════════════════════════════════════════════════

function euro(value: number): string {
  return `${value.toFixed(2)} €`;
}

function safe(value?: string): string {
  return value?.trim() || "—";
}

function formatInvoiceNumber(prefix: string, num: number): string {
  return `${prefix}${String(num).padStart(6, "0")}`;
}

function formatDateFR(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function truncate(doc: jsPDF, text: string, maxWidth: number, size: number): string {
  doc.setFontSize(size);
  if (doc.getTextWidth(text) <= maxWidth) return text;

  let truncated = text;
  while (doc.getTextWidth(truncated + "…") > maxWidth && truncated.length > 1) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + "…";
}

function getTableDensity(lineCount: number): {
  rowHeight: number;
  showRefBelow: boolean;
} {
  if (lineCount <= 3) {
    return { rowHeight: SPACING.tableRowComfort, showRefBelow: true };
  }
  if (lineCount <= 8) {
    return { rowHeight: SPACING.tableRowNormal, showRefBelow: true };
  }
  return { rowHeight: SPACING.tableRowDense, showRefBelow: false };
}

// ═══════════════════════════════════════════════════════════
// SECTION : HEADER
// ═══════════════════════════════════════════════════════════

function drawHeader(doc: jsPDF, preferences: CompanyPreferences) {
  const { pageWidth, headerHeight, marginX } = LAYOUT;

  drawBox(doc, 0, 0, pageWidth, headerHeight, COLORS.headerBg);

  // ─── Bloc gauche : marque émetteur ───────────────────────
  drawLabel(doc, "Émetteur", marginX, 14, {
    color: COLORS.headerHint,
    size: 6.5,
  });

  drawText(doc, safe(preferences.invoiceCompanyName), marginX, 22, {
    size: FONT.display,
    bold: true,
    color: COLORS.headerInk,
  });

  drawText(doc, "Document professionnel", marginX, 30, {
    size: FONT.caption,
    color: COLORS.headerSub,
    letterSpacing: 0.2,
  });

  // ─── Séparateur vertical doré à 48% ──────────────────────
  const sepX = pageWidth * 0.48;
  drawBox(doc, sepX, 10, 0.3, headerHeight - 20, COLORS.amberDeep);

  // ─── Bloc droite : titre FACTURE ─────────────────────────
  drawLabel(doc, "Invoice", pageWidth - marginX, 14, {
    color: COLORS.headerHint,
    align: "right",
    size: 6.5,
  });

  drawText(doc, "FACTURE", pageWidth - marginX, 27, {
    size: FONT.hero,
    bold: true,
    color: COLORS.amberSoft,
    align: "right",
    letterSpacing: 2,
  });

  // Double ligne dorée sous le header
  drawBox(doc, 0, headerHeight, pageWidth, 0.4, COLORS.amber);
  drawBox(doc, 0, headerHeight + 0.9, pageWidth, 0.15, COLORS.amberDeep);
}

// ═══════════════════════════════════════════════════════════
// SECTION : META BAR
// ═══════════════════════════════════════════════════════════

function drawMetaBar(doc: jsPDF, sale: Sale, invoiceNumber: string) {
  const { marginX, contentWidth, metaY } = LAYOUT;
  const colWidth = contentWidth / 3;

  const cols = [
    { label: "Référence facture", value: invoiceNumber, accent: false },
    { label: "Date d'émission", value: formatDateFR(sale.date), accent: false },
    {
      label: "Régime fiscal",
      value: sale.vatMode === "margin_vat" ? "TVA sur marge" : "TVA standard",
      accent: sale.vatMode === "margin_vat",
    },
  ];

  cols.forEach((col, i) => {
    const x = marginX + i * colWidth;

    drawLabel(doc, col.label, x, metaY, { color: COLORS.inkMuted });

    drawText(doc, col.value, x, metaY + 7, {
      size: 11,
      bold: true,
      color: col.accent ? COLORS.amber : COLORS.ink,
    });

    if (i < cols.length - 1) {
      const sepX = x + colWidth - 4;
      for (let yy = metaY - 2; yy <= metaY + 9; yy += 1.4) {
        doc.setDrawColor(...COLORS.ruleStrong);
        doc.setLineWidth(0.2);
        doc.line(sepX, yy, sepX, yy + 0.4);
      }
    }
  });

  drawLine(
    doc,
    marginX,
    metaY + 14,
    marginX + contentWidth,
    metaY + 14,
    COLORS.ruleFaint
  );
}

// ═══════════════════════════════════════════════════════════
// SECTION : ÉMETTEUR + CLIENT
// ═══════════════════════════════════════════════════════════

function drawPartiesBlock(
  doc: jsPDF,
  sale: Sale,
  preferences: CompanyPreferences
) {
  const { marginX, contentWidth, partiesY } = LAYOUT;
  const gap = 8;
  const cardWidth = (contentWidth - gap) / 2;
  const cardHeight = 58; // agrandi (était 50) pour accueillir l'adresse client

  // ─── ÉMETTEUR ────────────────────────────────────────────
  drawBox(doc, marginX, partiesY, cardWidth, cardHeight, COLORS.surface);
  drawBorder(doc, marginX, partiesY, cardWidth, cardHeight, COLORS.ruleFaint);
  drawBox(doc, marginX, partiesY, 0.8, cardHeight, COLORS.amber);

  drawLabel(doc, "Émis par", marginX + 7, partiesY + 8, {
    color: COLORS.amber,
  });

  drawText(
    doc,
    safe(preferences.invoiceCompanyName),
    marginX + 7,
    partiesY + 17,
    { size: 10.5, bold: true, color: COLORS.ink }
  );

  const addrLines = (preferences.invoiceCompanyAddress || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 2);

  drawText(doc, addrLines[0] || "—", marginX + 7, partiesY + 24, {
    size: FONT.body,
    color: COLORS.inkSoft,
  });

  if (addrLines[1]) {
    drawText(doc, addrLines[1], marginX + 7, partiesY + 29, {
      size: FONT.body,
      color: COLORS.inkSoft,
    });
  }

  drawDottedLine(
    doc,
    marginX + 7,
    partiesY + 34,
    marginX + cardWidth - 7,
    COLORS.ruleFaint
  );

  drawText(
    doc,
    `TVA  ·  ${safe(preferences.invoiceCompanyVat)}`,
    marginX + 7,
    partiesY + 40,
    { size: FONT.small, color: COLORS.inkMid }
  );

  drawText(
    doc,
    safe(preferences.invoiceCompanyEmail),
    marginX + 7,
    partiesY + 46,
    { size: FONT.small, color: COLORS.inkMid }
  );

  drawText(
    doc,
    safe(preferences.invoiceCompanyPhone),
    marginX + 7,
    partiesY + 52,
    { size: FONT.small, color: COLORS.inkMid }
  );

  // ─── CLIENT ──────────────────────────────────────────────
  const clientX = marginX + cardWidth + gap;
  const contact = sale.contact;

  drawBox(doc, clientX, partiesY, cardWidth, cardHeight, COLORS.surface);
  drawBorder(doc, clientX, partiesY, cardWidth, cardHeight, COLORS.ruleFaint);
  drawBox(doc, clientX, partiesY, 0.8, cardHeight, COLORS.ink);

  drawLabel(doc, "Adressé à", clientX + 7, partiesY + 8, {
    color: COLORS.inkSoft,
  });

  drawText(
    doc,
    sale.customerName || "Client",
    clientX + 7,
    partiesY + 17,
    { size: 10.5, bold: true, color: COLORS.ink }
  );

  // Curseur dynamique pour gérer adresse + TVA + paiement sans débordement
  let clientCursor = partiesY + 17;

  if (contact?.address) {
    const contactAddrLines = contact.address
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 2);

    contactAddrLines.forEach((line, i) => {
      clientCursor += i === 0 ? 7 : 5;
      drawText(doc, truncate(doc, line, cardWidth - 14, FONT.small), clientX + 7, clientCursor, {
        size: FONT.small,
        color: COLORS.inkSoft,
      });
    });
    clientCursor += 3;
  } else {
    clientCursor += 7;
  }

  drawDottedLine(doc, clientX + 7, clientCursor, clientX + cardWidth - 7, COLORS.ruleFaint);
  clientCursor += 6;

  if (contact?.vatNumber) {
    drawText(doc, `TVA  ·  ${contact.vatNumber}`, clientX + 7, clientCursor, {
      size: FONT.small,
      color: COLORS.inkMid,
    });
    clientCursor += 6;
  }

  if (sale.paymentMethod) {
    drawLabel(doc, "Mode de paiement", clientX + 7, clientCursor, {
      color: COLORS.inkMuted,
      size: 6.5,
    });
    clientCursor += 6;
    drawText(doc, sale.paymentMethod, clientX + 7, clientCursor, {
      size: FONT.bodySmall,
      color: COLORS.ink,
    });
    clientCursor += 7;
  }

  if (sale.notes && clientCursor < partiesY + cardHeight - 8) {
    drawLabel(doc, "Référence client", clientX + 7, clientCursor, {
      color: COLORS.inkMuted,
      size: 6.5,
    });
    clientCursor += 5;
    drawText(doc, truncate(doc, sale.notes, cardWidth - 14, FONT.small), clientX + 7, clientCursor, {
      size: FONT.small,
      color: COLORS.inkSoft,
    });
  }
}

// ═══════════════════════════════════════════════════════════
// SECTION : TABLEAU ARTICLES
// ═══════════════════════════════════════════════════════════

/**
 * Tableau articles — densité auto + pagination correcte.
 *
 * Stratégie :
 * - Pour ≤4 articles : rowHeight élargi pour remplir jusqu'à targetTableEndY (~198mm).
 * - Le check de saut de page est PRE-dessin : on vérifie AVANT de tracer la ligne
 *   qu'elle tiendrait sur la page, sinon on saute et on redessine le header.
 * - buildInvoicePdf gère ensuite si les blocs finaux tiennent après le tableau.
 */
function drawItemsTable(doc: jsPDF, sale: Sale): number {
  const { marginX, contentWidth, tableY } = LAYOUT;

  // Seuil interne : si la PROCHAINE ligne dépasserait cette valeur, saut de page.
  // Laisse de la marge pour que buildInvoicePdf puisse décider du saut post-tableau.
  const maxRowEndY = 230;

  const lines = sale.lines || [];
  const baseDensity = getTableDensity(lines.length);
  let { rowHeight, showRefBelow } = baseDensity;

  const targetTableEndY = 198;
  const tblHeaderH = 10;
  const availableForRows = targetTableEndY - tableY - tblHeaderH;

  if (lines.length > 0 && lines.length <= 4) {
    const calculatedHeight = availableForRows / lines.length;
    rowHeight = Math.min(20, Math.max(rowHeight, calculatedHeight));
  }

  const colArticle = marginX + 5;
  const colQty = marginX + 100;
  const colUnit = marginX + 135;
  const colTotal = marginX + contentWidth - 5;

  // Helper : dessine le header sombre et retourne Y après lui
  const drawTblHeader = (startY: number): number => {
    drawBox(doc, marginX, startY, contentWidth, tblHeaderH, COLORS.headerBg);
    drawBox(doc, marginX, startY + tblHeaderH - 0.3, contentWidth, 0.3, COLORS.amberDeep);
    const hTY = startY + 6.5;
    drawLabel(doc, "Désignation", colArticle, hTY, { color: COLORS.headerInk, size: FONT.label });
    drawLabel(doc, "Qté",         colQty,     hTY, { color: COLORS.headerInk, align: "right", size: FONT.label });
    drawLabel(doc, "Prix unitaire", colUnit,  hTY, { color: COLORS.headerInk, align: "right", size: FONT.label });
    drawLabel(doc, "Total HT",    colTotal,   hTY, { color: COLORS.headerInk, align: "right", size: FONT.label });
    return startY + tblHeaderH;
  };

  let y = drawTblHeader(tableY);

  lines.forEach((line, i) => {
    // ─── Saut de page PRE-dessin ──────────────────────────
    // Si cette ligne dépasserait maxRowEndY, on ferme proprement et on repart.
    if (y + rowHeight > maxRowEndY) {
      drawLine(doc, marginX, y, marginX + contentWidth, y, COLORS.ruleStrong, 0.4);
      doc.addPage();
      y = drawTblHeader(20);
    }

    if (i % 2 === 1) {
      drawBox(doc, marginX, y, contentWidth, rowHeight, COLORS.surface);
    }

    const textY = y + rowHeight * 0.55;

    const truncatedName = truncate(doc, line.itemName, 80, FONT.body);
    drawText(doc, truncatedName, colArticle,
      textY - (showRefBelow && line.itemReference ? 1.8 : 0),
      { size: FONT.body, color: COLORS.ink });

    if (showRefBelow && line.itemReference) {
      drawText(doc, `Réf. ${line.itemReference}`, colArticle, textY + 3, {
        size: FONT.micro, color: COLORS.inkFaint, letterSpacing: 0.4,
      });
    }

    drawText(doc, String(line.quantity), colQty,  textY, { size: FONT.body, align: "right", color: COLORS.inkMid });
    // Prix unitaire affiché = total ligne ÷ quantité (fiable pour TVA standard ET TVA marge)
    // Pour TVA marge, unit_price stocke le TTC total de la ligne, pas le prix unitaire réel.
    const _qty = Math.max(Number(line.quantity) || 1, 1);
    const displayUnitPrice = Math.round((Number(line.totalPrice) / _qty) * 100) / 100;
    drawText(doc, euro(displayUnitPrice), colUnit,  textY, { size: FONT.body, align: "right", color: COLORS.inkMid });
    drawText(doc, euro(line.totalPrice), colTotal, textY, { size: FONT.body, bold: true, align: "right", color: COLORS.ink });

    if (i < lines.length - 1) {
      drawLine(doc, marginX + 5, y + rowHeight, marginX + contentWidth - 5, y + rowHeight, COLORS.ruleFaint);
    }

    y += rowHeight;
  });

  // Ligne de fermeture
  drawLine(doc, marginX, y, marginX + contentWidth, y, COLORS.ruleStrong, 0.4);

  return y;
}

// ═══════════════════════════════════════════════════════════
// SECTION : TOTAUX + MENTION TVA MARGE (fusionnés)
// ═══════════════════════════════════════════════════════════

/**
 * Bloc totaux — fusionné avec la mention TVA marge.
 * La mention apparaît à GAUCHE des totaux, sur la même hauteur visuelle.
 * Évite tout chevauchement avec le footer.
 */
function drawTotalsBlock(doc: jsPDF, sale: Sale, tableEndY: number): number {
  const { marginX, contentWidth } = LAYOUT;

  let y = tableEndY + 8;

  // Largeur du bloc totaux à droite
  const totalsWidth = 84;
  const totalsX = marginX + contentWidth - totalsWidth;

  // ─── MENTION TVA MARGE À GAUCHE (si applicable) ──────────
  if (sale.vatMode === "margin_vat") {
    const noticeWidth = totalsX - marginX - 8;
    const noticeHeight = 52; // agrandi (était 46) : titre sur 2 lignes pour éviter le débordement

    drawBox(doc, marginX, y, noticeWidth, noticeHeight, COLORS.amberBgAlt);
    drawBorder(doc, marginX, y, noticeWidth, noticeHeight, COLORS.amber, 0.2);
    drawBox(doc, marginX, y, 1, noticeHeight, COLORS.amberDeep);

    // Picto "i" en cercle
    const iconX = marginX + 7;
    const iconY = y + 8;

    doc.setDrawColor(...COLORS.amberDeep);
    doc.setLineWidth(0.35);
    doc.circle(iconX, iconY, 2, "S");

    drawText(doc, "i", iconX, iconY + 1.1, {
      size: 7.5,
      bold: true,
      color: COLORS.amberDeep,
      align: "center",
    });

    // Label
    drawLabel(doc, "Mention TVA sur marge", marginX + 13, y + 7, {
      color: COLORS.amberDeep,
      size: 6.5,
    });

    // Titre sur 2 lignes pour ne pas déborder du cadre
    drawText(doc, "Régime particulier de la marge", marginX + 13, y + 14, {
      size: FONT.small,
      bold: true,
      color: COLORS.inkSoft,
    });
    drawText(doc, "— biens d'occasion", marginX + 13, y + 18.5, {
      size: FONT.small,
      bold: true,
      color: COLORS.inkSoft,
    });

    // Mention acquéreur
    drawText(
      doc,
      "TVA non déductible par l'acquéreur.",
      marginX + 13,
      y + 24,
      { size: FONT.small, color: COLORS.inkMid }
    );

    // Séparateur pointillé
    drawDottedLine(doc, marginX + 13, y + 28.5, marginX + noticeWidth - 6, COLORS.amberDeep);

    // Références légales bicountry
    drawLabel(doc, "Références légales", marginX + 13, y + 33.5, {
      color: COLORS.amberDeep,
      size: 6.0,
    });

    drawText(
      doc,
      "Directive 2006/112/CE, art. 311 à 343",
      marginX + 13,
      y + 38.5,
      { size: FONT.caption, color: COLORS.inkMuted }
    );

    drawText(
      doc,
      "France : art. 297 A et suivants du CGI",
      marginX + 13,
      y + 43.5,
      { size: FONT.caption, color: COLORS.inkMuted }
    );

    drawText(
      doc,
      "Belgique : art. 58, §4 du Code de la TVA",
      marginX + 13,
      y + 48.5,
      { size: FONT.caption, color: COLORS.inkMuted }
    );
  }

  // ─── BLOC TOTAUX À DROITE ────────────────────────────────
  let totalsY = y;

  if (sale.vatMode === "margin_vat") {
    // Régime marge : ne pas afficher HT ni TVA séparément sur la facture client
    // (TVA sur marge non déductible, non récupérable par l'acquéreur)
    drawText(doc, "Total des articles", totalsX, totalsY + 5, {
      size: FONT.bodySmall,
      color: COLORS.inkMid,
    });
    drawText(doc, euro(sale.totalTTC), totalsX + totalsWidth, totalsY + 5, {
      size: FONT.bodySmall,
      align: "right",
      color: COLORS.inkSoft,
    });

    totalsY += 10;
    drawLine(doc, totalsX, totalsY, totalsX + totalsWidth, totalsY, COLORS.rule, 0.3);
    totalsY += 4;
  } else {
    // Régime TVA standard : afficher HT + TVA détaillée
    drawText(doc, "Sous-total HT", totalsX, totalsY + 5, {
      size: FONT.bodySmall,
      color: COLORS.inkMid,
    });
    drawText(doc, euro(sale.subtotalHT), totalsX + totalsWidth, totalsY + 5, {
      size: FONT.bodySmall,
      align: "right",
      color: COLORS.inkSoft,
    });

    totalsY += 11;

    drawText(doc, "TVA", totalsX, totalsY, {
      size: FONT.bodySmall,
      color: COLORS.inkMid,
    });
    drawText(doc, euro(sale.vatAmount), totalsX + totalsWidth, totalsY, {
      size: FONT.bodySmall,
      align: "right",
      color: COLORS.inkSoft,
    });

    totalsY += 4;
    drawLine(doc, totalsX, totalsY, totalsX + totalsWidth, totalsY, COLORS.rule, 0.3);
    totalsY += 4;
  }

  // ─── TOTAL TTC — bloc premium ────────────────────────────
  const totalBoxHeight = 16;

  drawBox(doc, totalsX, totalsY, totalsWidth, totalBoxHeight, COLORS.amberBg);
  drawBox(doc, totalsX, totalsY, 1.2, totalBoxHeight, COLORS.amberDeep);
  drawBorder(doc, totalsX, totalsY, totalsWidth, totalBoxHeight, COLORS.amberDeep, 0.25);

  drawLabel(doc, "Total à payer", totalsX + 5, totalsY + 6, {
    color: COLORS.amberDeep,
    size: 6.8,
  });

 
  drawText(doc, euro(sale.totalTTC), totalsX + totalsWidth - 5, totalsY + 11, {
    size: FONT.total,
    bold: true,
    align: "right",
    color: COLORS.ink,
  });

  return totalsY + totalBoxHeight;
}

// ═══════════════════════════════════════════════════════════
// SECTION : FOOTER (position fixe en bas)
// ═══════════════════════════════════════════════════════════

/**
 * Footer ancré en bas via LAYOUT.footerTop.
 * Indépendant du contenu — ne peut PAS chevaucher le bloc totaux.
 */
function drawFooter(doc: jsPDF, preferences: CompanyPreferences) {
  const { marginX, pageWidth, contentWidth, footerTop } = LAYOUT;
  const colWidth = (contentWidth - 8) / 2;

  // Séparateur principal au-dessus du footer
  drawLine(
    doc,
    marginX,
    footerTop,
    marginX + contentWidth,
    footerTop,
    COLORS.rule,
    0.3
  );

  // Centre marker doré sur le séparateur
  drawBox(doc, pageWidth / 2 - 4, footerTop - 0.4, 8, 0.8, COLORS.amber);

  // ─── COLONNE GAUCHE : conditions paiement ────────────────
  if (preferences.invoicePaymentTerms?.trim()) {
    drawLabel(doc, "Conditions de paiement", marginX, footerTop + 6, {
      color: COLORS.inkMuted,
    });
    drawText(
      doc,
      preferences.invoicePaymentTerms,
      marginX,
      footerTop + 12,
      { size: FONT.small, color: COLORS.inkSoft }
    );
  }

  // ─── COLONNE DROITE : pied de facture ────────────────────
  if (preferences.invoiceFooter?.trim()) {
    const rightX = marginX + colWidth + 8;
    drawLabel(doc, "Informations", rightX, footerTop + 6, {
      color: COLORS.inkMuted,
    });
    drawText(
      doc,
      preferences.invoiceFooter,
      rightX,
      footerTop + 12,
      { size: FONT.small, color: COLORS.inkSoft }
    );
  }

  // ─── Signature ultra-discrète bas droite ─────────────────
doc.setFont("helvetica", "normal");
doc.setFontSize(8);
doc.setTextColor(180, 180, 180);

doc.text(
  "Facture générée par Kyrivo by Kartium TCG",
  pageWidth - marginX,
  footerTop + 20,
  {
    align: "right",
  }
);

  drawBox(doc, pageWidth - marginX - 1, footerTop + 21.5, 0.6, 0.6, COLORS.amber);
}

// ═══════════════════════════════════════════════════════════
// ASSEMBLAGE
// ═══════════════════════════════════════════════════════════

function buildInvoicePdf(params: {
  sale: Sale;
  preferences: CompanyPreferences;
  invoiceNumber: string;
}): jsPDF {
  const { sale, preferences, invoiceNumber } = params;

  const doc = new jsPDF({
    unit: "mm",
    format: "a4",
    orientation: "portrait",
  });

  drawHeader(doc, preferences);
  drawMetaBar(doc, sale, invoiceNumber);
  drawPartiesBlock(doc, sale, preferences);

  const tableEndY = drawItemsTable(doc, sale);

  // ─── Garde anti-chevauchement ────────────────────────────
  // Hauteur minimale nécessaire depuis tableEndY pour les blocs finaux :
  //   8mm gap + notice TVA marge 52mm (cas le plus haut)
  //   8mm gap + totaux standard   40mm
  // Le footer est ensuite ancré à LAYOUT.footerTop (258mm).
  const totalsNeeded = sale.vatMode === "margin_vat" ? 60 : 48;

  let totalsBaseY = tableEndY;

  if (tableEndY + totalsNeeded > LAYOUT.footerTop) {
    // Plus assez de place sur la page courante → nouvelle page.
    // On ancre les totaux juste au-dessus du footer pour un rendu propre.
    doc.addPage();
    totalsBaseY = LAYOUT.footerTop - totalsNeeded - 6;
  }

  drawTotalsBlock(doc, sale, totalsBaseY);
  drawFooter(doc, preferences);

  return doc;
}

// ═══════════════════════════════════════════════════════════
// GÉNÉRATION ZIP
// ═══════════════════════════════════════════════════════════

export async function generateInvoicesZip(params: {
  sales: Sale[];
  preferences: CompanyPreferences;
}) {
  const { sales, preferences } = params;

  const zip = new JSZip();

  const startNumber =
    preferences.invoiceNextNumber || 1;

  let currentNumber = startNumber;

  for (const sale of sales) {
    const invoiceNumber = formatInvoiceNumber(
      preferences.invoicePrefix || "F-",
      currentNumber
    );

    const doc = buildInvoicePdf({
      sale,
      preferences,
      invoiceNumber,
    });

    const pdfBlob = doc.output("blob");

    zip.file(
      `${invoiceNumber}.pdf`,
      pdfBlob
    );

    currentNumber++;
  }

  const updatedPreferences =
    await upsertCompanyPreferences({
      ...preferences,
      invoiceNextNumber:
        startNumber + sales.length,
    });

  const zipBlob = await zip.generateAsync({
    type: "blob",
  });

  const today = new Date()
    .toISOString()
    .slice(0, 10);

  saveAs(
    zipBlob,
    `kyrivo-factures-${today}.zip`
  );

  return updatedPreferences;
}