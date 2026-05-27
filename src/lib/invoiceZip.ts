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

  headerHeight: 44,
  metaY: 56,
  partiesY: 84,
  tableY: 142,

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
  const cardHeight = 50;

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
    partiesY + 16,
    { size: 10.5, bold: true, color: COLORS.ink }
  );

  const addressFirst = (preferences.invoiceCompanyAddress || "")
    .split("\n")[0]
    ?.trim() || "—";

  drawText(doc, addressFirst, marginX + 7, partiesY + 22, {
    size: FONT.body,
    color: COLORS.inkSoft,
  });

  drawDottedLine(
    doc,
    marginX + 7,
    partiesY + 26,
    marginX + cardWidth - 7,
    COLORS.ruleFaint
  );

  drawText(
    doc,
    `TVA  ·  ${safe(preferences.invoiceCompanyVat)}`,
    marginX + 7,
    partiesY + 32,
    { size: FONT.small, color: COLORS.inkMid }
  );

  drawText(
    doc,
    safe(preferences.invoiceCompanyEmail),
    marginX + 7,
    partiesY + 38,
    { size: FONT.small, color: COLORS.inkMid }
  );

  drawText(
    doc,
    safe(preferences.invoiceCompanyPhone),
    marginX + 7,
    partiesY + 44,
    { size: FONT.small, color: COLORS.inkMid }
  );

  // ─── CLIENT ──────────────────────────────────────────────
  const clientX = marginX + cardWidth + gap;

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
    partiesY + 16,
    { size: 10.5, bold: true, color: COLORS.ink }
  );

  drawDottedLine(
    doc,
    clientX + 7,
    partiesY + 22,
    clientX + cardWidth - 7,
    COLORS.ruleFaint
  );

  if (sale.paymentMethod) {
    drawLabel(doc, "Mode de paiement", clientX + 7, partiesY + 28, {
      color: COLORS.inkMuted,
      size: 6.5,
    });
    drawText(doc, sale.paymentMethod, clientX + 7, partiesY + 34, {
      size: FONT.bodySmall,
      color: COLORS.ink,
    });
  }

  if (sale.notes) {
    drawLabel(doc, "Référence client", clientX + 7, partiesY + 40, {
      color: COLORS.inkMuted,
      size: 6.5,
    });
    const noteText = truncate(doc, sale.notes, cardWidth - 14, FONT.small);
    drawText(doc, noteText, clientX + 7, partiesY + 45, {
      size: FONT.small,
      color: COLORS.inkSoft,
    });
  }
}

// ═══════════════════════════════════════════════════════════
// SECTION : TABLEAU ARTICLES
// ═══════════════════════════════════════════════════════════

/**
 * Tableau articles — densité auto + remplissage subtil pour peu d'articles.
 *
 * IMPORTANT — Stratégie anti-vide :
 * Au lieu de lignes fantômes claires (qui se voyaient), on calcule
 * l'espace disponible jusqu'au bloc totaux et on ajuste rowHeight pour
 * que le tableau prenne tout l'espace naturellement.
 */
function drawItemsTable(doc: jsPDF, sale: Sale): number {
  const { marginX, contentWidth, tableY } = LAYOUT;
  const maxTableEndY = 235;

  const lines = sale.lines || [];
  const baseDensity = getTableDensity(lines.length);
  let { rowHeight, showRefBelow } = baseDensity;

  // ─── ESPACE CIBLE ────────────────────────────────────────
  // On veut que le tableau termine vers y = 200 max (pour laisser
  // ~50mm pour totaux + footer en bas de page).
  // Si on a peu de lignes, on augmente la rowHeight pour combler.
  const targetTableEndY = 198;
  const headerHeight = 10;
  const availableForRows = targetTableEndY - tableY - headerHeight;

  if (lines.length > 0 && lines.length <= 4) {
    // Élargit la rowHeight pour remplir naturellement
    const calculatedHeight = availableForRows / lines.length;
    // Cap entre 10mm (mini) et 20mm (maxi pour rester lisible)
    rowHeight = Math.min(20, Math.max(rowHeight, calculatedHeight));
  }

  // Positions colonnes
  const colArticle = marginX + 5;
  const colQty = marginX + 100;
  const colUnit = marginX + 135;
  const colTotal = marginX + contentWidth - 5;

  // ─── HEADER FONCÉ ────────────────────────────────────────
  drawBox(doc, marginX, tableY, contentWidth, headerHeight, COLORS.headerBg);
  drawBox(doc, marginX, tableY + headerHeight - 0.3, contentWidth, 0.3, COLORS.amberDeep);

  const headerTextY = tableY + 6.5;

  drawLabel(doc, "Désignation", colArticle, headerTextY, {
    color: COLORS.headerInk,
    size: FONT.label,
  });
  drawLabel(doc, "Qté", colQty, headerTextY, {
    color: COLORS.headerInk,
    align: "right",
    size: FONT.label,
  });
  drawLabel(doc, "Prix unitaire", colUnit, headerTextY, {
    color: COLORS.headerInk,
    align: "right",
    size: FONT.label,
  });
  drawLabel(doc, "Total HT", colTotal, headerTextY, {
    color: COLORS.headerInk,
    align: "right",
    size: FONT.label,
  });

  // ─── LIGNES ARTICLES ─────────────────────────────────────
  let y = tableY + headerHeight;

  lines.forEach((line, i) => {
    if (i % 2 === 1) {
      drawBox(doc, marginX, y, contentWidth, rowHeight, COLORS.surface);
    }

    // Texte centré verticalement dans la ligne
    const textY = y + rowHeight * 0.55;

    const truncatedName = truncate(doc, line.itemName, 80, FONT.body);
    drawText(
      doc,
      truncatedName,
      colArticle,
      textY - (showRefBelow && line.itemReference ? 1.8 : 0),
      { size: FONT.body, color: COLORS.ink }
    );

    if (showRefBelow && line.itemReference) {
      drawText(doc, line.itemReference, colArticle, textY + 3, {
        size: FONT.micro,
        color: COLORS.inkFaint,
        letterSpacing: 0.4,
      });
    }

    drawText(doc, String(line.quantity), colQty, textY, {
      size: FONT.body,
      align: "right",
      color: COLORS.inkMid,
    });

    drawText(doc, euro(line.unitPrice), colUnit, textY, {
      size: FONT.body,
      align: "right",
      color: COLORS.inkMid,
    });

    drawText(doc, euro(line.totalPrice), colTotal, textY, {
      size: FONT.body,
      bold: true,
      align: "right",
      color: COLORS.ink,
    });

    if (i < lines.length - 1) {
      drawLine(
        doc,
        marginX + 5,
        y + rowHeight,
        marginX + contentWidth - 5,
        y + rowHeight,
        COLORS.ruleFaint
      );
    }

    y += rowHeight;
    if (y > maxTableEndY) {
        doc.addPage();
        y = 30;
    }
  });

  // Ligne de fermeture appuyée
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
    const noticeHeight = 38; // hauteur pour s'aligner avec le bloc totaux complet

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
    drawLabel(doc, "Mention obligatoire", marginX + 13, y + 7, {
      color: COLORS.amberDeep,
      size: 6.5,
    });

    // Texte légal sur 2 lignes pour mieux tenir dans la largeur
    drawText(
      doc,
      "Régime particulier de la marge",
      marginX + 13,
      y + 14,
      { size: FONT.small, bold: true, color: COLORS.inkSoft }
    );

    drawText(
      doc,
      "Biens d'occasion — Art. 297 A CGI / 312-325",
      marginX + 13,
      y + 19,
      { size: FONT.small, color: COLORS.inkMid }
    );

    drawText(
      doc,
      "Directive 2006/112/CE",
      marginX + 13,
      y + 24,
      { size: FONT.small, color: COLORS.inkMid }
    );

    drawText(
      doc,
      "TVA non déductible par l'acquéreur.",
      marginX + 13,
      y + 32,
      { size: FONT.caption, color: COLORS.inkMuted }
    );
  }

  // ─── BLOC TOTAUX À DROITE ────────────────────────────────
  let totalsY = y;

  // Sous-total HT
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

  // TVA
  const tvaLabel = sale.vatMode === "margin_vat" ? "TVA sur marge" : "TVA";
  drawText(doc, tvaLabel, totalsX, totalsY, {
    size: FONT.bodySmall,
    color: COLORS.inkMid,
  });
  drawText(doc, euro(sale.vatAmount), totalsX + totalsWidth, totalsY, {
    size: FONT.bodySmall,
    align: "right",
    color: COLORS.inkSoft,
  });

  totalsY += 4;

  // Séparateur
  drawLine(doc, totalsX, totalsY, totalsX + totalsWidth, totalsY, COLORS.rule, 0.3);

  totalsY += 4;

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
  drawTotalsBlock(doc, sale, tableEndY);

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