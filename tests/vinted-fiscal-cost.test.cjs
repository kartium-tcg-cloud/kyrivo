const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
function tsModule(file) {
 const source = fs.readFileSync(path.join(__dirname, file), "utf8");
 const code = ts.transpileModule(source, { compilerOptions: {
   module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
 }}).outputText;
 const module = { exports: {} };
 vm.runInNewContext(code, { exports: module.exports, module });
 return module.exports;
}
const { validateVintedCosts, vintedFiscalUnitCost } = tsModule("../src/lib/vintedCosts.ts");
const { calculateMarginVAT, calculateMarginSale } = tsModule("../src/lib/saleCalculations.ts");
function details(overrides = {}) {
 return { sellerPrice: 100, shippingFee: 5, buyerProtectionFee: 3,
   otherFees: 0, paidTotal: 108, amountsConfirmed: true, ...overrides };
}
test("vendeur 100, transport 5, protection 3 : prix fiscal 100, total payé 108", () => {
 assert.equal(validateVintedCosts(details()).length, 0);
 assert.equal(vintedFiscalUnitCost(details()), 100);
});
test("la marge fiscale utilise 100 et non le total payé 108", () => {
 const result = calculateMarginVAT({ salePriceTTC: 150, purchaseCost: vintedFiscalUnitCost(details()), vatRate: 20 });
 assert.equal(result.vatAmount, 8.33);
 const bad = calculateMarginVAT({ salePriceTTC: 150, purchaseCost: 108, vatRate: 20 });
 assert.equal(bad.vatAmount, 7);
 assert.equal(150 - 108 - result.vatAmount, 33.67);
});
test("prix vendeur manquant, pas de confirmation ou total incohérent : import refusé", () => {
 assert.ok(validateVintedCosts(details({ sellerPrice: NaN })).length > 0);
 assert.ok(validateVintedCosts(details({ amountsConfirmed: false })).length > 0);
 assert.ok(validateVintedCosts(details({ paidTotal: 107.99 })).length > 0);
 assert.ok(validateVintedCosts(details({ shippingFee: -1 })).length > 0);
});
test("autres frais distincts permettent de réconcilier les lignes manquantes de la commande", () => {
 assert.equal(vintedFiscalUnitCost(details({ otherFees: 2.5, paidTotal: 110.5 })), 100);
});
test("TVA sur marge plancher zéro par article, pas compensation des pertes entre lignes", () => {
 const v = calculateMarginSale({ lines: [
   { unitPrice: 80, quantity: 1, purchaseCost: 100, vatRate: 20 },
   { unitPrice: 150, quantity: 1, purchaseCost: 100, vatRate: 20 },
 ]});
 assert.equal(v.vatAmount, 8.33);
 assert.equal(v.totalTTC, 230);
 assert.equal(v.marginAmount, 21.67); // -20 + (50 - 8.33)
});
