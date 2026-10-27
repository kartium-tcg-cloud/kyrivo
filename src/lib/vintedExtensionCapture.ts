import type { VintedDraft, VintedKind } from "@/lib/vintedEmailParser";

type VisibleItem = {
  itemId: string;
  title: string;
  url: string;
  displayPrice?: string;
};
type ExtensionCapture = {
  schemaVersion: 1;
  transferId: string;
  timestamp: number;
  kind: VintedKind;
  items: VisibleItem[];
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const VINTED_HOST = /(^|\.)vinted\.(?:fr|be|nl|de|es|it|pt|pl|com|co\.uk)$/i;

/** Validation côté Kyrivo : la passerelle et les champs de la page sont non fiables. */
export function parseVintedExtensionCapture(value: unknown, now = Date.now()): {
  transferId: string;
  drafts: VintedDraft[];
} {
  if (!isObject(value) || value.schemaVersion !== 1 ||
      typeof value.transferId !== "string" ||
      !/^[a-zA-Z0-9-]{8,80}$/.test(value.transferId) ||
      typeof value.timestamp !== "number" ||
      value.timestamp > now + 60_000 || now - value.timestamp > 30 * 60 * 1000 ||
      (value.kind !== "sale" && value.kind !== "purchase") ||
      !Array.isArray(value.items) || value.items.length < 1 || value.items.length > 60) {
    throw new Error("Capture de l'extension invalide ou expirée.");
  }

  const kind: VintedKind = value.kind;
  const drafts: VintedDraft[] = [];
  const ids = new Set<string>();
  for (const raw of value.items) {
    if (!isObject(raw) || typeof raw.itemId !== "string" ||
        !/^\d{4,20}$/.test(raw.itemId) ||
        typeof raw.title !== "string" || !raw.title.trim() ||
        raw.title.length > 150 || typeof raw.url !== "string" ||
        raw.url.length > 400 || (raw.displayPrice !== undefined &&
        (typeof raw.displayPrice !== "string" || raw.displayPrice.length > 40))) continue;

    let url: URL;
    try { url = new URL(raw.url); } catch { continue; }
    const itemIdFromUrl = url.pathname.match(/^\/items\/(\d{4,20})(?:[\/-]|$)/)?.[1];
    if (url.protocol !== "https:" || !VINTED_HOST.test(url.hostname) ||
        itemIdFromUrl !== raw.itemId || ids.has(raw.itemId)) continue;

    ids.add(raw.itemId);
    const title = raw.title.trim().replace(/\s+/g, " ").slice(0, 150);
    const warnings = [
      "Article repéré sur la page Vinted, pas encore une transaction vérifiée.",
      "Complétez et vérifiez la date, les montants, les frais et les autres informations depuis vos justificatifs.",
    ];
    if (raw.displayPrice?.trim()) {
      warnings.push("Prix affiché sur la page : " + raw.displayPrice.trim() + " (indicatif, non repris comme prix payé ou encaissé).");
    }

    drafts.push({
      key: kind + ":vinted-web:" + raw.itemId,
      kind,
      title,
      items: [title],
      counterparty: "",
      date: null,
      sellerPrice: null,
      shippingFee: null,
      vintedFee: null,
      paidTotal: null,
      paymentDescription: "",
      orderReference: null,
      status: "review",
      warnings,
    });
  }

  if (!drafts.length) throw new Error("La page ne contient aucun article Vinted exploitable.");
  return { transferId: value.transferId, drafts };
}
