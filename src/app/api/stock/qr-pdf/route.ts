// Génération d'un PDF A4 d'étiquettes QR pour les articles en stock.
// Sécurité : la liste d'IDs reçue est toujours recroisée avec company_id
// côté serveur — un ID ne pouvant pas être renvoyé s'il n'appartient pas
// à la société de l'utilisateur authentifié.

import { NextRequest, NextResponse } from "next/server";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://kyrivo.kartium-tcg.com";

// ─── Layout A4 portrait (mm) ──────────────────────────────────
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 10;
const COLS = 3;
const ROWS = 6;
const GAP = 6;
const QR_SIZE = 24;

function truncateText(doc: jsPDF, text: string, maxWidth: number, fontSize: number): string {
  doc.setFontSize(fontSize);
  if (doc.getTextWidth(text) <= maxWidth) return text;

  let truncated = text;
  while (truncated.length > 1 && doc.getTextWidth(truncated + "…") > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + "…";
}

function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("company_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership?.company_id) {
    return NextResponse.json(
      { error: "Aucune société associée à ce compte." },
      { status: 403 }
    );
  }

  let body: { itemIds?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const itemIds = Array.isArray(body.itemIds)
    ? body.itemIds.filter((id): id is string => typeof id === "string" && id.length > 0)
    : [];

  if (itemIds.length === 0) {
    return NextResponse.json({ error: "Aucun article sélectionné." }, { status: 400 });
  }

  // ─── Recroisement company_id : ne renvoie jamais un article
  // d'une autre société, même si des IDs trafiqués sont envoyés. ───
  const { data: items, error } = await supabase
    .from("purchase_items")
    .select("id, item_reference, item_name, category")
    .in("id", itemIds)
    .eq("company_id", membership.company_id);

  if (error) {
    return NextResponse.json(
      { error: "Erreur lors de la récupération des articles." },
      { status: 500 }
    );
  }

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Aucun article valide trouvé." }, { status: 404 });
  }

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  const cellWidth = (PAGE_WIDTH - 2 * MARGIN - (COLS - 1) * GAP) / COLS;
  const cellHeight = (PAGE_HEIGHT - 2 * MARGIN - (ROWS - 1) * GAP) / ROWS;
  const perPage = COLS * ROWS;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const indexOnPage = i % perPage;

    if (i > 0 && indexOnPage === 0) doc.addPage();

    const col = indexOnPage % COLS;
    const row = Math.floor(indexOnPage / COLS);

    const cellX = MARGIN + col * (cellWidth + GAP);
    const cellY = MARGIN + row * (cellHeight + GAP);

    // Cadre étiquette
    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.2);
    doc.roundedRect(cellX, cellY, cellWidth, cellHeight, 2, 2);

    const itemUrl = `${APP_URL}/items/${item.id}`;
    const qrDataUrl = await QRCode.toDataURL(itemUrl, {
      margin: 4,
      width: 256,
      color: { dark: "#000000", light: "#ffffff" },
    });

    const qrX = cellX + (cellWidth - QR_SIZE) / 2;
    const qrY = cellY + 2.5;
    doc.addImage(qrDataUrl, "PNG", qrX, qrY, QR_SIZE, QR_SIZE);

    const textCenterX = cellX + cellWidth / 2;
    const textMaxWidth = cellWidth - 4;

    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 20, 20);
    const reference = truncateText(doc, item.item_reference, textMaxWidth, 8);
    doc.text(reference, textCenterX, qrY + QR_SIZE + 4, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(90, 90, 90);
    const name = truncateText(doc, item.item_name, textMaxWidth, 7);
    doc.text(name, textCenterX, qrY + QR_SIZE + 7.5, { align: "center" });

    if (item.category) {
      doc.setTextColor(150, 150, 150);
      const category = truncateText(doc, item.category, textMaxWidth, 6);
      doc.text(category, textCenterX, qrY + QR_SIZE + 10.5, { align: "center" });
    }
  }

  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  const filename = `kyrivo-qr-stock-${formatDateISO(new Date())}.pdf`;

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
