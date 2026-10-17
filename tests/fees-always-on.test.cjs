const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const read = name => fs.readFileSync(path.join(__dirname, "..", name), "utf8");

test("les frais sont visibles sans préférence dans achats et ventes", () => {
  for (const kind of ["achats", "ventes"]) {
    const page = read("src/app/" + kind + "/page.tsx");
    assert.doesNotMatch(page, /enableTransactionFees|setEnableTransactionFees/);
    assert.match(page, /onManageFees=\{set(?:Purchase|Sale)ForFees\}/);
    assert.match(page, /<TransactionFeesModal\b/);
  }
  for (const kind of ["achats/AchatFormModal", "ventes/VenteFormModal"]) {
    const form = read("src/components/" + kind + ".tsx");
    assert.match(form, /<TransactionFeesInline\b/);
    assert.doesNotMatch(form, /enableFees|openFeesAfterSave/);
  }
});

test("la préférence de frais n'est plus proposée ni conservée dans les paramètres", () => {
  for (const file of [
    "src/app/preferences/page.tsx",
    "src/components/onboarding/AccountSetupWizard.tsx",
    "src/types/preferences.ts",
    "src/lib/preferences.ts",
  ]) {
    assert.doesNotMatch(read(file), /enableTransactionFees|enable_transaction_fees|Activer les frais|Afficher la gestion des frais/);
  }
});
