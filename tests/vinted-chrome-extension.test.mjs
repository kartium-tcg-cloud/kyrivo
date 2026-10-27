import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { parseVintedExtensionCapture } from "../src/lib/vintedExtensionCapture.ts";

const now = Date.now();
function sample(overrides = {}) {
  return {
    schemaVersion: 1,
    transferId: "test-transfer-123456789",
    timestamp: now,
    kind: "purchase",
    items: [{
      itemId: "1234567890",
      title: "Booster Pokémon EV10",
      url: "https://www.vinted.be/items/1234567890-booster",
      displayPrice: "8,70 €"
    }],
    ...overrides,
  };
}

test("capture Chrome : brouillon vérifiable sans prix fiscal ni date inventés", () => {
  const { drafts, transferId } = parseVintedExtensionCapture(sample(), now);
  assert.equal(transferId, "test-transfer-123456789");
  assert.equal(drafts.length, 1);
  assert.equal(drafts[0].kind, "purchase");
  assert.equal(drafts[0].title, "Booster Pokémon EV10");
  assert.equal(drafts[0].status, "review");
  assert.equal(drafts[0].sellerPrice, null);
  assert.equal(drafts[0].paidTotal, null);
  assert.equal(drafts[0].shippingFee, null);
  assert.equal(drafts[0].date, null);
  assert.match(drafts[0].warnings.join(" "), /indicatif/);
});

test("capture Chrome : origine Vinted obligatoire, sans données de session", () => {
  assert.throws(() => parseVintedExtensionCapture(sample({
    items: [{ itemId: "1234567890", title: "Article", url: "https://vinted.fake.example/items/1234567890" }]
  }), now), /aucun article/i);
  assert.throws(() => parseVintedExtensionCapture(sample({ timestamp: now - 31 * 60_000 }), now), /expirée/i);
  assert.throws(() => parseVintedExtensionCapture(sample({ items: [] }), now), /invalide/i);
});

test("capture Chrome : références répétées supprimées et URL validées", () => {
  const item = sample().items[0];
  const { drafts } = parseVintedExtensionCapture(sample({ kind: "sale", items: [
    item, item,
    { itemId: "1234567891", title: "Carte Lorcana", url: "https://www.vinted.fr/items/1234567891-carte" },
    { itemId: "1234567892", title: "Fausse carte", url: "https://www.vinted.fr/items/0000000000-mismatch" }
  ] }), now);
  assert.equal(drafts.length, 2);
  assert.equal(drafts[0].key, "sale:vinted-web:1234567890");
  assert.equal(drafts[1].sellerPrice, null);
});

test("extension : aucune requête réseau, cookies ni identifiant", () => {
  const popup = fs.readFileSync(new URL("../extension/kyrivo-vinted/popup.js", import.meta.url), "utf8");
  const bridge = fs.readFileSync(new URL("../extension/kyrivo-vinted/bridge.js", import.meta.url), "utf8");
  const manifest = JSON.parse(fs.readFileSync(new URL("../extension/kyrivo-vinted/manifest.json", import.meta.url), "utf8"));
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions, ["activeTab", "scripting", "storage"]);
  assert.doesNotMatch(popup + bridge, /\bfetch\s*\(|\bXMLHttpRequest\b|\.cookies\b|\.webRequest\b/);
  assert.match(popup, /chrome\.scripting\.executeScript/);
  assert.match(bridge, /KYRIVO_VINTED_REQUEST_V1/);
});

test("formulaires : ne pas préremplir avec un faux zéro ou une fausse date", () => {
  const purchases = fs.readFileSync(new URL("../src/components/achats/AchatFormModal.tsx", import.meta.url), "utf8");
  const sales = fs.readFileSync(new URL("../src/components/ventes/VenteFormModal.tsx", import.meta.url), "utf8");
  assert.match(purchases, /fromExtension && d\.sellerPrice === null \? ""/);
  assert.match(purchases, /fromExtension && d\.paidTotal === null \? ""/);
  assert.match(purchases, /fromExtension \? "" : dateAujourdhui\(\)/);
  assert.match(sales, /fromExtension \? "" : dateAujourdhui\(\)/);
});

test("site : transfert volontaire dans la file et jamais vers la base", () => {
  const page = fs.readFileSync(new URL("../src/app/import-vinted/page.tsx", import.meta.url), "utf8");
  assert.match(page, /parseVintedExtensionCapture\(event\.data\.payload\)/);
  assert.match(page, /addVintedDrafts\(companyId, drafts\)/);
  assert.match(page, /KYRIVO_VINTED_ACCEPTED_V1/);
  assert.doesNotMatch(page, /insert\(\{.*extension/i);
});
