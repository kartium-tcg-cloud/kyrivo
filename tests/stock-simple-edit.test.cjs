const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function read(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

test("modifier un achat Vinted ouvre un formulaire d'édition, jamais le contrôle fiscal", () => {
  const achats = read("src/app/achats/page.tsx");
  const handler = achats.match(/const ouvrirEdition = \(achat: Achat\) => \{([\s\S]*?)\n  \};/);
  assert.ok(handler, "gestionnaire de modification présent");
  assert.match(handler[1], /achat\.source === "vinted_import"/);
  assert.match(handler[1], /setVintedItemsForEdit\(achat\)/);
  assert.doesNotMatch(handler[1], /setAchatFiscalReview/);
  assert.doesNotMatch(handler[1], /fiscalCostReviewRequired/);
});

test("le contrôle TVA reste une action volontaire et distincte", () => {
  const achats = read("src/app/achats/page.tsx");
  const table = read("src/components/achats/AchatsTableau.tsx");
  assert.match(achats, /onReviewFiscal=\{setAchatFiscalReview\}/);
  assert.match(table, /onReviewFiscal\(achat\)/);
  assert.match(table, /TVA sur marge : vérifier le prix vendeur/);
});

test("l'édition Vinted ne touche qu'aux champs descriptifs", () => {
  const editor = read("src/components/achats/VintedItemsEditModal.tsx");
  assert.match(editor, /titre="Modifier les articles"/);
  assert.match(editor, /item_name: name, item_size: info \|\| null, notes: notes \|\| ""/);
  assert.match(editor, /\.eq\("purchase_document_id", achat\.id\)/);
  assert.match(editor, /\.eq\("company_id", membership\.company_id\)/);
  assert.doesNotMatch(editor, /\.update\(\{[^}]*fiscal_unit_cost/);
  assert.doesNotMatch(editor, /\.from\("sale_lines"\)/);
  assert.doesNotMatch(editor, /\.from\("purchases"\)/);
});

test("la fenêtre Stock édite les champs utiles sans imposer d'écran fiscal", () => {
  const stock = read("src/app/stock/page.tsx");
  for (const field of ["stock-item-name", "stock-item-category", "stock-item-size", "stock-item-notes"]) {
    assert.ok(stock.includes(field), `champ manquant : ${field}`);
  }
  assert.match(stock, /const stockChanged = parsed !== Number\(item\.stock_quantity\)/);
  assert.match(stock, /\.\.\.\(stockChanged \? \{/);
  assert.match(stock, /\{Number\(newStock\) !== Number\(item\.stock_quantity\) && \(/);
  assert.match(stock, /\.select\("id"\)/);
  assert.doesNotMatch(stock, /VintedFiscalReviewModal/);
  assert.match(stock, /onCloseRef\.current\(\)/);
});
