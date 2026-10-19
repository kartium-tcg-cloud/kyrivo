const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "src/lib/itemPurchaseDisplayPrices.ts"), "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = { exports: {} };
vm.runInNewContext(js, { module: mod, exports: mod.exports, Number, Math });
const { getItemPurchaseDisplayPrices: display } = mod.exports;

test("Achat professionnel : TTC affiché en premier, HT conservé en second", () => {
  const price = display({ quantity: 3, total_cost: 72.60, unit_cost: 20, vat_type: "pro", vat_rate: 21 });
  assert.equal(price.unitTTC, 24.2);
  assert.equal(price.unitHT, 20);
  assert.equal(price.totalTTC, 72.6);
});

test("Achat particulier : montant réellement payé sans faux montant HT", () => {
  const price = display({ quantity: 1, total_cost: 40, unit_cost: 40, vat_type: "particulier", vat_rate: 0 });
  assert.equal(price.unitTTC, 40);
  assert.equal(price.unitHT, null);
  assert.equal(price.totalTTC, 40);
});

test("TVA à zéro : ne fabrique pas de distinction HT/TTC", () => {
  const price = display({ quantity: 2, total_cost: 24, unit_cost: 12, vat_type: "pro", vat_rate: 0 });
  assert.equal(price.unitTTC, 12);
  assert.equal(price.unitHT, null);
});

test("Frais intégrés : la valeur TTC provient de total_cost, pas de unit_cost ou d'un taux TVA", () => {
  const price = display({ quantity: 1, total_cost: 14.45, unit_cost: 10, vat_type: "pro", vat_rate: 21 });
  assert.equal(price.unitTTC, 14.45);
  assert.equal(price.unitHT, 10);
});

test("Arrondi unitaire à l'affichage, total de lot conservé", () => {
  const price = display({ quantity: 3, total_cost: "1.00", unit_cost: "0.33", vat_type: "particulier", vat_rate: "0" });
  assert.equal(price.unitTTC, 0.33);
  assert.equal(price.totalTTC, 1);
});

test("Coût incomplet ou quantité invalide : afficher un tiret plutôt qu'un TTC imaginé", () => {
  assert.equal(display({ quantity: 0, total_cost: 10, unit_cost: 8, vat_type: "pro", vat_rate: 21 }).unitTTC, null);
  assert.equal(display({ quantity: 2, total_cost: null, unit_cost: 8, vat_type: "pro", vat_rate: 21 }).unitTTC, null);
  assert.equal(display({ quantity: 2, total_cost: -10, unit_cost: 8, vat_type: "pro", vat_rate: 21 }).totalTTC, null);
});

test("Fiche article : TTC principal, HT conditionnel et aucun accès en écriture", () => {
  const page = fs.readFileSync(path.join(root, "src/app/items/[id]/page.tsx"), "utf8");
  assert.match(page, /getItemPurchaseDisplayPrices\(item\)/);
  assert.match(page, /Coût unitaire TTC/);
  assert.match(page, /Coût total TTC/);
  assert.match(page, /prices\.unitHT !== null/);
  assert.doesNotMatch(page, /<DetailRow label="Coût HT"/);
  assert.doesNotMatch(page, /\.insert\(|\.update\(|\.upsert\(|\.delete\(/);
});
