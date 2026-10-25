const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const read = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

test("l'import ne télécharge pas tout l'historique des achats/ventes", () => {
  const page = read("src/app/import-vinted/page.tsx");
  const lookup = read("src/lib/vintedImportLookup.ts");
  assert.doesNotMatch(page, /getPurchases| getSales/);
  assert.match(page, /findExistingVintedKeys/);
  assert.match(lookup, /\.select\("source_details"\)/);
  assert.match(lookup, /\.eq\("company_id", companyId\)/);
  assert.match(lookup, /\.in\("source_details->>" \+ jsonField, group\)/);
  assert.match(lookup, /const \[purchaseKeys, saleKeys, legacyPurchaseRefs\]/);
  assert.match(page, /inputText\.length > 1024 \* 1024/);
});

test("index garantissant l'unicité des achats Vinted par entreprise", () => {
  const sql = read("supabase/migrations/20261025_vinted_purchase_import_unique.sql");
  assert.match(sql, /create unique index if not exists purchases_vinted_import_key_idx/i);
  assert.match(sql, /on public\.purchases \(company_id, \(source_details->>'importKey'\)\)/);
  assert.match(sql, /where source = 'vinted_import'/);
  assert.doesNotMatch(sql, /\b(?:drop|delete|truncate)\b/i);
});
