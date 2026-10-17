const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const read = p => fs.readFileSync(path.join(root, p), "utf8");

test("Import Vinted désactivé : aucun bouton ni fenêtre d'import dans Achats", () => {
  const page = read("src/app/achats/page.tsx");
  assert.doesNotMatch(page, /<VintedImportModal\b/);
  assert.doesNotMatch(page, /onImporterVinted\s*=/);
  assert.doesNotMatch(page, /<button[^>]*>\s*Importer depuis Vinted/);
  const header = read("src/components/achats/AchatsHeader.tsx");
  assert.doesNotMatch(header, /Importer depuis Vinted|onImporterVinted/);
});

test("Import Vinted désactivé : ni Préférences ni assistant de configuration", () => {
  const prefs = read("src/app/preferences/page.tsx");
  const wizard = read("src/components/onboarding/AccountSetupWizard.tsx");
  assert.doesNotMatch(prefs, /J'utilise Vinted|J’utilise Vinted|enableVinted/);
  assert.doesNotMatch(wizard, /J'utilise Vinted|J’utilise Vinted|enableVinted/);
});

test("Revue des anciens coûts fiscaux conservée sans import", () => {
  const page = read("src/app/achats/page.tsx");
  assert.match(page, /<VintedFiscalReviewModal\b/);
});
