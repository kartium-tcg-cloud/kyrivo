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


type GroupCapture = {
  schemaVersion: 2;
  transferId: string;
  timestamp: number;
  kind: VintedKind;
  items: VisibleItem[];
  order?: Record<string, unknown>;
};

function euros(value: unknown): number | null {
  if (typeof value !== "string" || !value || value.length > 40) return null;
  const match = value.match(/(?:\d{1,3}(?:[ .\u00a0\u202f]\d{3})+|\d+)(?:[,.]\d{1,2})?\s*€/);
  if (!match) return null;
  const number = Number(match[0].replace(/[€\s\u00a0\u202f]/g, "").replace(",", "."));
  return Number.isFinite(number) && number >= 0 && number <= 999999
    ? Math.round(number * 100) / 100 : null;
}

function groupKey(kind: VintedKind, ids: string[]): string {
  const sorted = [...ids].sort().join("|");
  let hash = 2166136261;
  const input = kind + "|" + sorted;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return kind + ":vinted-group:" + [...ids].sort()[0] + ":" + (hash >>> 0).toString(36);
}

function groupDraft(capture: GroupCapture): VintedDraft | null {
  const items: Array<{ itemId: string; title: string; price: number | null }> = [];
  const ids = new Set<string>();
  for (const raw of capture.items) {
    if (!isObject(raw) || typeof raw.itemId !== "string" ||
        !/^\d{4,20}$/.test(raw.itemId) || typeof raw.title !== "string" ||
        !raw.title.trim() || raw.title.length > 150 ||
        typeof raw.url !== "string" || raw.url.length > 400 ||
        (raw.displayPrice !== undefined &&
          (typeof raw.displayPrice !== "string" || raw.displayPrice.length > 40))) continue;
    let url: URL;
    try { url = new URL(raw.url); } catch { continue; }
    const urlId = url.pathname.match(/^\/items\/(\d{4,20})(?:[\/-]|$)/)?.[1];
    if (url.protocol !== "https:" || !VINTED_HOST.test(url.hostname) ||
        urlId !== raw.itemId || ids.has(raw.itemId)) continue;
    ids.add(raw.itemId);
    items.push({
      itemId: raw.itemId,
      title: raw.title.trim().replace(/\s+/g, " "),
      price: euros(raw.displayPrice || ""),
    });
  }
  if (!items.length) return null;

  const order = isObject(capture.order) ? capture.order : {};
  const observedSeller = euros(order.sellerPrice);
  const shippingFee = euros(order.shippingFee);
  const vintedFee = euros(order.buyerProtectionFee);
  const paidTotal = euros(order.paidTotal);
  const itemPrices = items.map(item => item.price);
  const sumItems = itemPrices.every((price): price is number => price !== null)
    ? Math.round(itemPrices.reduce((sum, price) => sum + (price || 0), 0) * 100) / 100
    : null;

  // Priorité à un montant explicitement identifié sur le récapitulatif.
  // Déduire les frais seulement si le total et tous les frais sont connus.
  const inferredSeller = paidTotal !== null && shippingFee !== null && vintedFee !== null
    ? Math.round((paidTotal - shippingFee - vintedFee) * 100) / 100
    : null;
  const sellerPrice = observedSeller !== null
    ? observedSeller
    : inferredSeller !== null && inferredSeller >= 0
      ? inferredSeller
      : sumItems;

  const warnings = [
    items.length > 1
      ? "Commande groupée : " + items.length + " articles dans un seul achat ou une seule vente."
      : "Article repéré sur Vinted : vérifiez la transaction avant l'enregistrement.",
    "Les prix des fiches sont indicatifs ; vérifiez les montants payés au vendeur et les justificatifs.",
    "Vérifiez la date, les participants, les frais et la répartition des prix.",
  ];
  if (observedSeller === null && inferredSeller !== null && inferredSeller >= 0) {
    warnings.push("Prix vendeur proposé = total payé - livraison - protection : à confirmer.");
  } else if (observedSeller === null && sumItems !== null) {
    warnings.push("Prix vendeur proposé = somme des prix affichés : à confirmer.");
  }
  if (paidTotal === null) warnings.push("Total réellement payé/encaissé non reconnu : à compléter.");
  if (shippingFee === null || vintedFee === null) warnings.push("Frais Vinted/livraison non vérifiés : à compléter.");
  if (observedSeller !== null && sumItems !== null &&
      Math.abs(observedSeller - sumItems) > 0.01) {
    warnings.push("Prix du lot différent de la somme des fiches : vérifiez la remise/répartition.");
  }
  if (sellerPrice !== null && paidTotal !== null &&
      shippingFee !== null && vintedFee !== null &&
      Math.abs(sellerPrice + shippingFee + vintedFee - paidTotal) > 0.01) {
    warnings.push("Les montants de la commande ne sont pas réconciliés : corrigez-les avant validation.");
  }
  return {
    key: groupKey(capture.kind, items.map(item => item.itemId)),
    kind: capture.kind,
    title: items.length > 1 ? "Lot de " + items.length + " articles" : items[0].title,
    items: items.map(item => item.title),
    itemPrices,
    counterparty: "",
    date: null,
    sellerPrice,
    shippingFee,
    vintedFee,
    paidTotal,
    paymentDescription: "",
    orderReference: null,
    status: "review",
    warnings,
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const VINTED_HOST = /(^|\.)vinted\.(?:fr|be|nl|de|es|it|pt|pl|com|co\.uk)$/i;

/** Validation côté Kyrivo : la passerelle et les champs de la page sont non fiables. */
export function parseVintedExtensionCapture(value: unknown, now = Date.now()): {
  transferId: string;
  drafts: VintedDraft[];
} {
  if (!isObject(value) || (value.schemaVersion !== 1 && value.schemaVersion !== 2) ||
      typeof value.transferId !== "string" ||
      !/^[a-zA-Z0-9-]{8,80}$/.test(value.transferId) ||
      typeof value.timestamp !== "number" ||
      value.timestamp > now + 60_000 || now - value.timestamp > 30 * 60 * 1000 ||
      (value.kind !== "sale" && value.kind !== "purchase") ||
      !Array.isArray(value.items) || value.items.length < 1 || value.items.length > 60) {
    throw new Error("Capture de l'extension invalide ou expirée.");
  }

  if (value.schemaVersion === 2) {
    const draft = groupDraft(value as GroupCapture);
    if (!draft) throw new Error("La commande ne contient aucun article Vinted exploitable.");
    return { transferId: value.transferId, drafts: [draft] };
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
