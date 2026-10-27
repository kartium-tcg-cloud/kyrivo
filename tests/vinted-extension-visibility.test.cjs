const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("la page publique d'import Vinted ne fait pas la promotion de l'extension en test", () => {
  const source = fs.readFileSync(path.join(__dirname, "../src/app/import-vinted/page.tsx"), "utf8");
  assert.doesNotMatch(source, /Tester l'extension Chrome Kyrivo/);
  assert.doesNotMatch(source, /Installation expérimentale depuis le dossier/);
  assert.doesNotMatch(source, /Importez depuis l'extension Chrome en test/);
  assert.doesNotMatch(source, /Utilisez l'extension de test ou/);
  assert.match(source, /Collez les reçus Vinted ou déposez vos emails exportés/);
  assert.match(source, /Aucune transaction importée. Commencez par fournir/);
});

test("le transfert privé reste actif pour les essais du propriétaire", () => {
  const source = fs.readFileSync(path.join(__dirname, "../src/app/import-vinted/page.tsx"), "utf8");
  assert.match(source, /new URLSearchParams\(window\.location\.search\)\.get\("extension"\)/);
  assert.match(source, /parseVintedExtensionCapture\(event\.data\.payload\)/);
  assert.match(source, /addVintedDrafts\(companyId, drafts\)/);
  assert.match(source, /KYRIVO_VINTED_REQUEST_V1/);
  assert.match(source, /\{extensionStatus && \(/);
});
