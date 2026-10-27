const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function source(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

test("achats : chaque nom détaillé est visible dans la liste, catégorie conservée", () => {
  const table = source("src/components/achats/AchatsTableau.tsx");
  assert.match(table, /achat\.articles\.map\(\(article\) => \(/);
  assert.match(table, /\{article\.nom\}/);
  assert.match(table, /\{achat\.produit\}/);
  assert.match(table, /label="Article\(s\)"/);
});

test("taille : saisie facultative et persistée à la création comme à la modification", () => {
  const form = source("src/components/achats/AchatFormModal.tsx");
  const page = source("src/app/achats/page.tsx");
  const types = source("src/types/achat.ts");
  const purchases = source("src/lib/purchases.ts");
  assert.match(form, /purchase-size-\$\{item\.id\}/);
  assert.match(form, /taille: item\.taille\.trim\(\) \|\| undefined/);
  assert.match(form, /taille: article\.taille \|\| ""/);
  assert.match(form, /notes: "", taille: ""/);
  assert.match(page, /taille: item\.item_size \?\? undefined/);
  assert.match(page, /item_size: item\.taille\?\.trim\(\) \|\| null/g);
  assert.match(types, /taille\?: string/g);
  assert.match(purchases, /item_size\?: string \| null/);
});

test("stock : taille visible mobile/desktop, recherchable et modifiable", () => {
  const stock = source("src/app/stock/page.tsx");
  const detail = source("src/app/items/[id]/page.tsx");
  assert.match(stock, /item_name, item_size, category/);
  assert.match(stock, /label="Taille \/ Pointure"/);
  assert.match(stock, /Taille \/ Pointure : \{item\.item_size\}/);
  assert.match(stock, /\[item\.item_reference, item\.item_name, item\.item_size \?\? ""/);
  assert.match(stock, /item_size: itemSize\.trim\(\) \|\| null/);
  assert.match(stock, /item_size: itemSize/);
  assert.match(detail, /label="Taille \/ Pointure" value=\{item\.item_size \|\| "—"\}/);
});

test("base : champ nullable, limité à 32 caractères, aucune migration de données", () => {
  const sql = source("supabase/migrations/20261027_purchase_item_size.sql");
  assert.match(sql, /ADD COLUMN item_size text/);
  assert.match(sql, /char_length\(item_size\) <= 32/);
  assert.doesNotMatch(sql, /UPDATE\s+public\.purchase_items/i);
});

test("modifier la taille seule ne change ni quantité ni statut", () => {
  const stock = source("src/app/stock/page.tsx");
  assert.match(stock, /const stockChanged = parsed !== Number\(item\.stock_quantity\)/);
  assert.match(stock, /status: Number\(item\.stock_quantity\) === newStock/);
  assert.match(stock, /: \{ item_size: itemSize\.trim\(\) \|\| null \}/);
});
