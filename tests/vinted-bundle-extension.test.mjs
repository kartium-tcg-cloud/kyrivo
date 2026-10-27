import test from "node:test";
import assert from "node:assert/strict";
import { parseVintedExtensionCapture } from "../src/lib/vintedExtensionCapture.ts";
import fs from "node:fs";

const now = Date.now();
const base = {
  schemaVersion: 2, timestamp: now, kind: "purchase", transferId: "bundle-transfer-123456",
  items: [
    { itemId: "1290049201", title: "Booster Pokémon", url: "https://www.vinted.be/items/1290049201-booster", displayPrice: "10,00 €" },
    { itemId: "1290049202", title: "Carte Lorcana", url: "https://www.vinted.be/items/1290049202-carte", displayPrice: "20,00 €" },
  ],
  order: { paidTotal: "34,00 €", shippingFee: "3,00 €", buyerProtectionFee: "1,00 €" },
};
test("deux fiches constituent une seule commande et deux articles, pas deux achats", () => {
  const { drafts } = parseVintedExtensionCapture(base, now);
  assert.equal(drafts.length, 1);
  assert.equal(drafts[0].items.length, 2);
  assert.deepEqual(drafts[0].items, ["Booster Pokémon", "Carte Lorcana"]);
  assert.deepEqual(drafts[0].itemPrices, [10, 20]);
  assert.equal(drafts[0].sellerPrice, 30);
  assert.equal(drafts[0].shippingFee, 3);
  assert.equal(drafts[0].vintedFee, 1);
  assert.equal(drafts[0].paidTotal, 34);
  assert.equal(drafts[0].status, "review");
});

test("calcul hors frais quand les trois montants du récapitulatif sont connus", () => {
  const { drafts } = parseVintedExtensionCapture({ ...base, items: base.items.map(i => ({ ...i, displayPrice: "" })) }, now);
  assert.equal(drafts[0].sellerPrice, 30);
  assert.deepEqual(drafts[0].itemPrices, [null, null]);
  assert.equal(drafts[0].items.length, 2);
});

test("prix partiels : aucune répartition fictive du montant global", () => {
  const { drafts } = parseVintedExtensionCapture({ ...base, items: [
    base.items[0], { ...base.items[1], displayPrice: "" },
  ], order: {} }, now);
  assert.deepEqual(drafts[0].itemPrices, [10, null]);
  assert.equal(drafts[0].sellerPrice, null);
  assert.equal(drafts[0].paidTotal, null);
});

test("doublons et éléments étrangers ignorés, clé stable pour cette commande", () => {
  const list = [base.items[0], base.items[1], base.items[0],
    { itemId: "1290049203", title: "Faux", url: "https://fake.vinted.be.evil.com/items/1290049203" }];
  const { drafts } = parseVintedExtensionCapture({ ...base, items: list }, now);
  assert.equal(drafts.length, 1);
  assert.equal(drafts[0].items.length, 2);
  const again = parseVintedExtensionCapture({ ...base, items: [base.items[1], base.items[0]] }, now);
  assert.equal(again.drafts[0].key, drafts[0].key);
});

test("ancien format v1 toujours accepté par Kyrivo", () => {
  const { drafts } = parseVintedExtensionCapture({
    ...base, schemaVersion: 1, order: undefined, items: [base.items[0]],
  }, now);
  assert.equal(drafts.length, 1);
  assert.match(drafts[0].key, /vinted-web/);
});

test("saisie par article et montants : formulaire achat et vente conservent les lignes", () => {
  const purchases = fs.readFileSync(new URL("../src/components/achats/AchatFormModal.tsx", import.meta.url), "utf8");
  const sales = fs.readFileSync(new URL("../src/components/ventes/VenteFormModal.tsx", import.meta.url), "utf8");
  assert.match(purchases, /groupPrices\[index\]/);
  assert.match(purchases, /groupPrices\s*\?/);
  assert.match(sales, /d\.items\.length \? d\.items/);
  assert.match(sales, /d\.itemPrices\[index\]/);
});

test("l'extension retient les pages du lot, propose les prix et ne lit aucune API Vinted", () => {
  const popup = fs.readFileSync(new URL("../extension/kyrivo-vinted/popup.js", import.meta.url), "utf8");
  const bridge = fs.readFileSync(new URL("../extension/kyrivo-vinted/bridge.js", import.meta.url), "utf8");
  const html = fs.readFileSync(new URL("../extension/kyrivo-vinted/popup.html", import.meta.url), "utf8");
  assert.match(popup, /chrome\.storage\.local\.set/);
  assert.match(popup, /items: workspace\.items/);
  assert.match(popup, /schemaVersion: 2/);
  assert.match(popup, /captureCurrentVintedPage/);
  assert.match(bridge, /pending\.schemaVersion !== 2/);
  assert.match(html, /Nombre d’articles dans cette commande/);
  assert.doesNotMatch(popup + bridge, /\bfetch\s*\(|XMLHttpRequest|\.cookies/);
});
