const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const root = path.join(__dirname, "..");
function source(p) { return fs.readFileSync(path.join(root, p), "utf8"); }

const code = ts.transpileModule(source("src/lib/saleStockVatMode.ts"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const moduleStub = { exports: {} };
vm.runInNewContext(code, { exports: moduleStub.exports, module: moduleStub });
const { suggestedVatModeForStock } = moduleStub.exports;

test("un achat à un particulier suggère TVA sur marge même quand standard était coché", () => {
  assert.equal(suggestedVatModeForStock(true), "margin_vat");
});

test("un achat non éligible à la marge suggère TVA standard même quand marge était cochée", () => {
  assert.equal(suggestedVatModeForStock(false), "standard_vat");
});

test("tous les articles en stock restent recherchables sans filtre de TVA", () => {
  const form = source("src/components/ventes/VenteFormModal.tsx");
  assert.doesNotMatch(form, /stockItemsFiltres/);
  assert.match(form, /const filtered = q\s*\? stockItems\.filter\(/);
  assert.match(form, /: stockItems;/);
  assert.match(form, /Aucun article en stock disponible/);
});

test("sélection d'article suggère TVA sans imposer la revue des frais Vinted", () => {
  const form = source("src/components/ventes/VenteFormModal.tsx");
  const chooser = form.slice(form.indexOf("const choisirItemStock ="), form.indexOf("const mappedLines:"));
  assert.ok(chooser.includes("suggestedVatModeForStock(item.marginEligible)"));
  assert.match(chooser, /setForm\(\(prev\) => \(\{ \.\.\.prev, vatMode: suggestedVatMode \}\)\)/);
  assert.match(chooser, /purchaseItemId: item\.id/);
  assert.match(chooser, /purchaseCost: String\(item\.unitCost\)/);
  assert.doesNotMatch(chooser, /fiscalCostReviewRequired|Retrouvez son achat|setErreurs\(\["Ce stock/);
  const submit = form.slice(form.indexOf("const handleSubmit ="), form.indexOf("const payload: VentePayload"));
  assert.doesNotMatch(submit, /fiscalReviewErrors|fiscalCostReviewRequired/);
  assert.match(form, /onClick=\{\(\) => updateForm\("vatMode", mode\)\}/);
});

test("sélection au toucher, clic et clavier ; prix fiscal reste éditable", () => {
  const form = source("src/components/ventes/VenteFormModal.tsx");
  assert.match(form, /onClick=\{\(\) => \{\s*choisirItemStock\(line\.id, item\.id\)/);
  assert.match(form, /updateLine\(line\.id, "purchaseCost", e\.target\.value\)/);
  assert.match(form, /Coût repris de l'achat enregistré/);
});
