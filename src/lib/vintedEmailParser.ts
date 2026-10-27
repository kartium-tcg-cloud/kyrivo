/**
 * Import Vinted v1: deterministic extraction from user-provided email bodies.
 * No external requests, no account credentials and NO automatic bookkeeping.
 * Personal addresses, contact emails and complete source bodies are never
 * returned in draft records or written to session storage.
 */
export type VintedKind = "purchase" | "sale";
export type VintedDraft = {
  key: string;
  kind: VintedKind;
  title: string;
  items: string[];
  /** Prix individuels suggérés par les fiches Vinted ; à confirmer avant validation. */
  itemPrices?: Array<number | null>;
  counterparty: string;
  date: string | null;
  sellerPrice: number | null;
  shippingFee: number | null;
  vintedFee: number | null;
  paidTotal: number | null;
  paymentDescription: string;
  orderReference: string | null;
  status: "ready" | "review";
  warnings: string[];
};

function money(input: string): number | null {
  const match = input.match(/(?:\d{1,3}(?:[ .\u00a0\u202f]\d{3})+|\d+)(?:[,.]\d{1,2})?\s*€/);
  if (!match) return null;
  let value = match[0].replace(/[€\s\u00a0\u202f']/g, "");
  if (value.includes(",")) value = value.replace(/\./g, "").replace(",", ".");
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 999999 ? Math.round(number * 100) / 100 : null;
}
function normalize(text: string): string {
  let raw = text.replace(/\r\n?/g, "\n").replace(/&#xA0;|&nbsp;/gi, " ").replace(/\u00a0|\u202f/g, " ");
  // Raw EML: prefer the text/plain part; decode common MIME transport encodings.
  if (/^MIME-Version:|^Content-Type:\s*multipart/im.test(raw)) {
    const parts = raw.split(/\n--[^\n]+\n/g);
    const plain = parts.find(p => /Content-Type:\s*text\/plain/i.test(p));
    const html = parts.find(p => /Content-Type:\s*text\/html/i.test(p));
    const selected = plain || html;
    if (selected) {
      const gap = selected.search(/\n\s*\n/);
      const body = gap >= 0 ? selected.slice(gap).trim() : selected;
      if (/Content-Transfer-Encoding:\s*base64/i.test(selected)) {
        try {
          const bin = atob(body.replace(/\s/g, ""));
          raw = new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
        } catch { raw = body; }
      } else if (/Content-Transfer-Encoding:\s*quoted-printable/i.test(selected)) {
        const bytes = body.replace(/=\r?\n/g, "").replace(/=([0-9A-F]{2})/gi, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));
        raw = new TextDecoder().decode(Uint8Array.from(bytes, c => c.charCodeAt(0)));
      } else {
        raw = body;
      }
    }
  }
  if (/<(?:html|body|table|tr|td|div|p|br|strong)\b/i.test(raw)) {
    raw = raw.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
    raw = raw.replace(/<\/(?:tr|p|div|li|h\d)>/gi, "\n").replace(/<\/(?:td|th)>/gi, " | ").replace(/<br\s*\/?>/gi, "\n");
    raw = raw.replace(/<[^>]*>/g, " ").replace(/&euro;|&#8364;/gi, "€").replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'");
  }
  return raw.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*\*/g, "")
    .replace(/\\\s*$/gm, "").replace(/\t/g, " | ").replace(/[ \t]+/g, " ");
}
function rows(text: string): string[] {
  return text.split("\n").map(x => x.replace(/^\s*\|/, "").replace(/\|\s*$/, "").trim())
    .filter(x => x && !/^[|\-\s:]+$/.test(x) && !/^[-:]+(?:\s*\|\s*[-:]+)+$/.test(x));
}
function field(rowsList: string[], label: RegExp): string {
  for (const line of rowsList) {
    const parts = line.split(/\s*\|\s*/).map(x => x.trim()).filter(Boolean);
    if (parts.length > 1 && label.test(parts[0])) return parts.slice(1).join(" ");
    if (label.test(line)) return line.replace(label, "").replace(/^[\s:|]+/, "").trim();
  }
  return "";
}
function parseDate(value: string): string | null {
  const m = value.match(/\b(\d{1,2})\/(\d{1,2})\/(20\d{2})\b/);
  if (m) return m[3] + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0");
  const iso = value.match(/\b20\d{2}-\d{2}-\d{2}\b/);
  return iso?.[0] ?? null;
}
function stableHash(text: string): string {
  let h = 2166136261;
  for (let i=0; i<text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}
function cleanTitle(text: string): string {
  return text.replace(/^[\s|"'“”]+|[\s|"'“”]+$/g, "").trim().slice(0, 150);
}
function isHeader(line: string): boolean {
  return /^(?:Bonjour\b|L['’]équipe Vinted|Merci\b|Ton paiement|Votre paiement|Mode de paiement|Frais\b|Article\s*\||Montant payé|Commande|Vendeur|Expédie|N°\s*de transaction|Date du paiement|Nous\b|Reçu\b|Voici\b|En tant\b|Adresse\b|Email\b|Coordonnées\b|Cet e-mail)/i.test(line);
}
function purchaseItems(list: string[]): string[] {
  const start = list.findIndex(line => /^Commande\s*(?:\||$)/i.test(line));
  const end = list.findIndex((line, i) => i > start && /^Montant payé\s*(?:\||$)/i.test(line));
  if (start < 0 || end <= start) return [];
  return list.slice(start + 1, end).flatMap(line => line.split(/\s*\|\s*/))
    .map(cleanTitle).filter(x => x.length > 1 && !isHeader(x) && !/^[\d., €]+$/.test(x) && !/^(?:-+|:)+$/.test(x)).slice(0, 80);
}
function parseOne(raw: string): VintedDraft | null {
  const text = normalize(raw);
  const list = rows(text);
  const purchase = /(?:Ton reçu pour la commande|Reçu pour (?:ta|votre) commande Vinted|Ton paiement a été reçu|Votre paiement a été reçu|N°\s*de transaction)/i.test(text)
    && !/(?:a acheté)\s*\n/i.test(text);
  const sold = /(?:Ton article s['’]est vendu|a acheté)/i.test(text);
  if (!purchase && !sold) return null;
  const kind: VintedKind = purchase ? "purchase" : "sale";
  const warnings: string[] = [];
  let title = "";
  let counterparty = "";
  let sellerPrice: number | null = null;
  let shippingFee: number | null = null;
  let vintedFee: number | null = null;
  let paidTotal: number | null = null;
  let orderReference: string | null = null;
  let date: string | null = null;
  let items: string[] = [];
  let paymentDescription = "";

  if (purchase) {
    const sellerValue = field(list, /^Vendeur\b/i);
    counterparty = (sellerValue.split(/\s+/)[0] || "").slice(0, 100);
    items = purchaseItems(list);
    title = cleanTitle(items.length === 1 ? items[0] : items.length > 1 ? "Lot de " + items.length + " articles" : "");
    sellerPrice = money(field(list, /^Article$/i));
    shippingFee = money(field(list, /^Frais de port$|^Frais de livraison$/i));
    vintedFee = money(field(list, /^Frais Vinted$|^Frais de Protection acheteurs?$|^Protection acheteurs?$/i));
    paidTotal = money(field(list, /^Montant payé$/i));
    const ref = field(list, /^N[°o]\s*de transaction$/i);
    orderReference = ref.match(/\b\d{7,20}\b/)?.[0] ?? null;
    date = parseDate(field(list, /^Date du paiement$/i));
    paymentDescription = field(list, /^Mode de paiement$/i).slice(0, 220);
    if (sellerPrice === null || paidTotal === null) warnings.push("Prix de l'article ou total manquant.");
    if (shippingFee === null || vintedFee === null) warnings.push("Frais à compléter manuellement.");
    if (sellerPrice !== null && shippingFee !== null && vintedFee !== null && paidTotal !== null &&
      Math.round((sellerPrice + shippingFee + vintedFee) * 100) !== Math.round(paidTotal * 100)) {
      warnings.push("La somme article + livraison + frais Vinted ne correspond pas au total payé.");
    }
    if (!date) warnings.push("Date du paiement non reconnue.");
    if (!orderReference) warnings.push("Numéro de transaction absent.");
  } else {
    const buyer = text.match(/\b([A-Za-z0-9_.-]{2,45})\s+a acheté(?=\s|$)/i);
    counterparty = buyer?.[1] ?? "";
    const begin = list.findIndex(l => /\ba acheté\b/i.test(l));
    const saleRow = list.slice(begin + 1).find(line =>
      line.includes("€") && !isHeader(line) && !/Adresse|Formulaire|Facture|Envoy/i.test(line));
    if (saleRow) {
      const columns = saleRow.split(/\s*\|\s*/).filter(Boolean).map(x => x.trim());
      sellerPrice = money(columns[columns.length - 1] || "");
      title = cleanTitle(columns.find(x => x.length > 3 && !/^\d+$/.test(x) && !x.includes("€")) ?? "");
      const lot = title.match(/\b(?:lot|bundle)\s*(?:de\s*)?(\d+)\s*(?:articles|items)?/i);
      if (lot) warnings.push("Lot : vérifier les articles et la répartition du prix.");
    }
    items = title ? [title] : [];
    paidTotal = sellerPrice;
    // Inbox thread is NOT an order id. Combine it with the title and amount.
    orderReference = text.match(/\/inbox\/(\d{5,20})/)?.[1] ?? null;
    warnings.push("Commande annoncée : le paiement définitif n'est pas confirmé par cet email.");
    warnings.push("Vérifiez la date de vente et les éventuels frais payés par le vendeur.");
    if (!title || sellerPrice === null) warnings.push("Titre ou prix de vente introuvable.");
  }
  if (!counterparty) warnings.push("Vendeur ou acheteur non identifié.");
  if (!title) warnings.push("Article non identifié.");
  const identity = [kind, orderReference ?? "", counterparty.toLowerCase(), title.toLowerCase(), sellerPrice ?? "", date ?? ""].join("|");
  return {
    key: kind + ":" + (kind === "purchase" && orderReference ? orderReference : stableHash(identity)),
    kind, title, items, counterparty, date, sellerPrice, shippingFee, vintedFee,
    paidTotal, paymentDescription, orderReference,
    status: warnings.length ? "review" : "ready", warnings,
  };
}

/** One email per file, or pasted messages separated by a blank line and --- */
export function parseVintedEmails(input: string): VintedDraft[] {
  const segments = input.split(/\n\s*---+\s*\n/g).filter(x => x.trim());
  const drafts = segments.map(parseOne).filter((x): x is VintedDraft => x !== null);
  return [...new Map(drafts.map(d => [d.key, d])).values()];
}
