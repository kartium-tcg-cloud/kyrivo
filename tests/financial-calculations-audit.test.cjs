const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
function load(p, stubs = {}) {
  const src = fs.readFileSync(path.join(root, p), "utf8");
  const js = ts.transpileModule(src, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  }}).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(js, {
    module: mod, exports: mod.exports, Math, Number, Date, console,
    require: name => stubs[name] || require(name),
  });
  return mod.exports;
}
const calc = load("src/lib/saleCalculations.ts");
const fees = load("src/lib/transactionFees.ts");
const types = load("src/types/subscription.ts");
const billing = load("src/lib/billing.ts", { "@/types/subscription": types });
const euro = n => Math.round(n * 100) / 100;

test("TVA standard HT saisi : 2 × 100 € HT à 21 % = 242 € TTC", () => {
  const r = calc.calculateStandardSale({ lines: [{
    unitPrice: 100, quantity: 2, vatRate: 21,
  }]});
  assert.equal(r.subtotalHT, 200);
  assert.equal(r.vatAmount, 42);
  assert.equal(r.totalTTC, 242);
});

test("TVA standard TTC saisi : conserver le TTC réel après arrondi", () => {
  const r = calc.calculateStandardSale({ lines: [{
    unitPrice: 19.99, quantity: 3, vatRate: 21, isTTC: true,
  }]});
  assert.equal(r.totalTTC, 59.97);
  assert.equal(r.subtotalHT, 49.56);
  assert.equal(r.vatAmount, 10.41);
  assert.equal(euro(r.subtotalHT + r.vatAmount), r.totalTTC);
});

test("TVA standard à 0 % : HT et TTC identiques", () => {
  const r = calc.calculateStandardSale({ lines: [{
    unitPrice: 23.50, quantity: 2, vatRate: 0, isTTC: true,
  }]});
  assert.equal(r.subtotalHT, 47);
  assert.equal(r.vatAmount, 0);
  assert.equal(r.totalTTC, 47);
});

test("TVA sur marge : calcule uniquement la TVA contenue dans la marge bénéficiaire", () => {
  const r = calc.calculateMarginVAT({ salePriceTTC: 150, purchaseCost: 100, vatRate: 21 });
  assert.equal(r.marginGross, 50);
  assert.equal(r.marginBaseHT, 41.32);
  assert.equal(r.vatAmount, 8.68);
  assert.equal(r.marginNet, 41.32);
});

test("TVA sur marge : une perte n'engendre pas de TVA négative", () => {
  const r = calc.calculateMarginVAT({ salePriceTTC: 80, purchaseCost: 100, vatRate: 21 });
  assert.equal(r.marginGross, -20);
  assert.equal(r.vatAmount, 0);
  assert.equal(r.marginNet, -20);
});

test("Marge économique distincte de la base fiscale, avec frais inclus dans le coût", () => {
  const r = calc.calculateMarginSale({ lines: [{
    unitPrice: 150, quantity: 1, purchaseCost: 100,
    economicPurchaseCost: 108, vatRate: 21,
  }]});
  assert.equal(r.totalTTC, 150);
  assert.equal(r.vatAmount, 8.68);
  assert.equal(r.marginAmount, 33.32);
});

test("Frais : total TTC et TVA déductible enregistrée sont séparés", () => {
  const r = fees.summarizeTransactionFees([{
    kind: "expense", category: "shipping", label: "Frais",
    amountHT: 5, vatRate: 21, vatAmount: 1.05, amountTTC: 6.05,
    recoverableVatAmount: 1.05, includedInParentTotal: false,
    purchaseId: "purchase-a", notes: "", vatTreatment: "standard",
  }]);
  assert.equal(r.expenseTTC, 6.05);
  assert.equal(r.externalExpenseTTC, 6.05);
  assert.equal(r.recoverableExpenseVat, 1.05);
});

test("Forfaits : tarifs utilisés dans la simulation d'upgrade", () => {
  assert.equal(billing.getSubscriptionPrice({ plan: "pro", period: "monthly" }), 9.9);
  assert.equal(billing.getSubscriptionPrice({ plan: "pro", period: "quarterly" }), 26.4);
  assert.equal(billing.getSubscriptionPrice({ plan: "business", period: "quarterly" }), 64.9);
  assert.equal(billing.getSubscriptionPrice({ plan: "entreprise", period: "quarterly" }), 214.9);
});

test("Crédit d'upgrade : 250 lignes restantes en Pro = 4,95 €", () => {
  const r = billing.calculateUpgradeCreditPreview({
    currentPlan: "pro", currentBillingPeriod: "monthly",
    targetPlan: "business", targetBillingPeriod: "monthly",
    fullRemainingMonths: 0, usedLines: 250,
  });
  assert.equal(r.currentMonthCredit, 4.95);
  assert.equal(r.creditAmount, 4.95);
  assert.equal(r.finalPrice, 19.95);
});
