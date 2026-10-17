const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const source = fs.readFileSync(path.join(__dirname, "../src/lib/transactionFees.ts"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const target = { exports: {} };
vm.runInNewContext(compiled, { module: target, exports: target.exports });
const { validateTransactionFee, summarizeTransactionFees } = target.exports;

function expense(overrides = {}) {
  return {
    purchaseId: "purchase-1", saleId: null,
    kind: "expense", category: "shipping", label: "Transport",
    amountHT: 5, vatRate: 21, vatAmount: 1.05, amountTTC: 6.05,
    recoverableVatAmount: 1.05, includedInParentTotal: false,
    vatTreatment: "pending_review", notes: "",
    ...overrides,
  };
}

test("une dépense interne de 6,05 € reste une charge distincte de la TVA récupérable", () => {
  const totals = summarizeTransactionFees([expense()]);
  assert.equal(totals.expenseTTC, 6.05);
  assert.equal(totals.recoverableExpenseVat, 1.05);
  assert.equal(totals.customerChargeTTC, 0);
  assert.equal(totals.externalExpenseTTC, 6.05);
});

test("une charge incluse dans le prix Vinted ne se rajoute jamais au total", () => {
  const totals = summarizeTransactionFees([
    expense({ amountHT: 4, vatRate: 0, vatAmount: 0, amountTTC: 4,
      recoverableVatAmount: 0, includedInParentTotal: true }),
  ]);
  assert.equal(totals.expenseTTC, 4);
  assert.equal(totals.externalExpenseTTC, 0);
});

test("frais refacturé au client : revenu, pas dépense", () => {
  const totals = summarizeTransactionFees([
    expense({ amountHT: 5, vatAmount: 0, amountTTC: 5, vatRate: 0, recoverableVatAmount: 0 }),
    expense({ purchaseId: null, saleId: "sale-1", kind: "customer_charge",
      amountHT: 5, vatAmount: 0, amountTTC: 5, vatRate: 0, recoverableVatAmount: 0 }),
  ]);
  assert.equal(totals.expenseTTC, 5);
  assert.equal(totals.customerChargeTTC, 5);
  assert.equal(totals.externalExpenseTTC, 5);
  assert.equal(totals.externalCustomerChargeTTC, 5);
});

test("la TVA déductible ne dépasse jamais la TVA constatée", () => {
  assert.ok(validateTransactionFee(expense({ recoverableVatAmount: 1.06 })).length > 0);
});

test("une recette ne peut pas avoir de TVA récupérable", () => {
  assert.ok(validateTransactionFee(expense({ purchaseId: null, saleId: "sale-1",
    kind: "customer_charge" })).length > 0);
});

test("pas de double parent, pas de total HT+TVA incohérent", () => {
  assert.ok(validateTransactionFee(expense({ saleId: "sale-1" })).length > 0);
  assert.ok(validateTransactionFee(expense({ amountTTC: 5 })).length > 0);
});

test("somme en centimes entiers sans accumulation de centimes fantômes", () => {
  const fees = Array.from({ length: 100 }, (_, i) => expense({
    label: "Frais " + i, amountHT: 0.01, vatRate: 0, vatAmount: 0, amountTTC: 0.01,
    recoverableVatAmount: 0,
  }));
  assert.equal(summarizeTransactionFees(fees).expenseTTC, 1);
});

test("precision financière : refuse les fractions cachées de centime", () => {
  assert.ok(validateTransactionFee(expense({ amountHT: 5.005 })).length > 0);
  assert.ok(validateTransactionFee(expense({ amountTTC: 6.051 })).length > 0);
});
test("les frais client sont uniquement un mémo d'une ligne déjà facturée", () => {
  assert.ok(validateTransactionFee(expense({
    purchaseId: null, saleId: "sale-1", kind: "customer_charge",
    recoverableVatAmount: 0, includedInParentTotal: false,
  })).length > 0);
});
test("la TVA déclarée doit rester cohérente avec le taux", () => {
  assert.ok(validateTransactionFee(expense({
    vatRate: 0, amountHT: 5, vatAmount: 1.05, amountTTC: 6.05,
  })).length > 0);
  assert.ok(validateTransactionFee(expense({
    vatRate: 21, amountHT: 6.04, vatAmount: 0.01, amountTTC: 6.05,
    recoverableVatAmount: 0.01,
  })).length > 0);
});
