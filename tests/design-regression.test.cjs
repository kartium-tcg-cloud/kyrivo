const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const read = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

test("les tokens et les règles responsive/accessibilité de la refonte sont présents", () => {
  const css = read("src/app/globals.css");
  for (const selector of [
    ".ky-workspace", ".ky-page", ".ky-panel", ".ky-toolbar", ".ky-kpi",
    ".ky-data-table", ".ky-sidebar", ".ky-dialog", ".ky-auth-card",
    ".ky-marketing", ".ky-hero", ".ky-pricing-card",
  ]) assert.ok(css.includes(selector), selector + " est absent");
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /@media \(max-width: 639px\)/);
  assert.match(css, /focus-visible/);
});

test("les pages métier reprennent la même grille sans altération des règles", () => {
  for (const page of [
    "achats", "ventes", "stock", "contacts", "factures", "preferences", "dashboard",
  ]) {
    const source = read("src/app/" + page + "/page.tsx");
    assert.match(source, /ky-page/, page + " doit avoir le même espace de travail");
  }
  assert.match(read("src/app/layout.tsx"), /ky-workspace/);
  assert.match(read("src/components/Sidebar.tsx"), /ky-sidebar/);
  assert.match(read("src/components/Sidebar.tsx"), /aria-current=\{active \? "page" : undefined\}/);
});

test("les formulaires et les boutons courants partagent la même base", () => {
  const button = read("src/components/ui/Button.tsx");
  const modal = read("src/components/ui/Modal.tsx");
  assert.match(button, /ky-button-primary/);
  assert.match(button, /ky-button-secondary/);
  assert.match(modal, /ky-dialog/);
  assert.match(read("src/components/fees/TransactionFeesInline.tsx"), /ky-panel/);
});

test("les tableaux achats et ventes restent lisibles, actions repérables", () => {
  for (const name of ["achats/AchatsTableau", "ventes/VentesTableau"]) {
    const source = read("src/components/" + name + ".tsx");
    assert.match(source, /ky-data-table/);
    assert.match(source, /ky-row-actions/);
  }
  for (const name of ["achats/AchatsFiltres", "ventes/VentesFiltres"]) {
    assert.match(read("src/components/" + name + ".tsx"), /ky-toolbar/);
  }
});

test("les écrans marketing et tarifs conservent leurs fonctionnalités et prennent le style commun", () => {
  assert.match(read("src/app/page.tsx"), /ky-marketing/);
  assert.match(read("src/app/abonnements/page.tsx"), /ky-pricing-card/);
  assert.match(read("src/app/login/page.tsx"), /ky-auth-card/);
});
