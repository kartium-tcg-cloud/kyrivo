const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = p => fs.readFileSync(path.join(root,p), "utf8");

test("Achat: le mapping fournit le vrai TTC unitaire à partir du total TTC enregistré", () => {
  const page = read("src/app/achats/page.tsx");
  assert.match(page, /coutTTC:\s*\n\s*item\.total_cost !== null && item\.quantity\s*\n\s*\? Number\(item\.total_cost\) \/ Number\(item\.quantity\)/);
  assert.match(page, /coutHT: Number\(item\.unit_cost\)/);
});

test("Liste d'achats: les articles détaillés affichent TTC plutôt que HT en montant principal", () => {
  const tableau = read("src/components/achats/AchatsTableau.tsx");
  const articles = tableau.slice(tableau.indexOf("{achat.articles.map((article) => ("));
  const end = articles.indexOf("</Link>");
  const row = articles.slice(0, end);
  assert.match(row, /Coût unitaire TTC/);
  assert.match(row, /formatEuro\(article\.coutTTC\)/);
  assert.doesNotMatch(row, /\{formatEuro\(article\.coutHT\)\}\s*<\/span>\s*<\/Link>/);
  assert.match(row, /achat\.type === "pro" && Number\(achat\.vatRate \?\? 0\) > 0/);
  assert.match(row, /\{formatEuro\(article\.coutHT\)\} HT/);
});

test("Le TTC n'est pas inventé en l'absence de montant enregistré", () => {
  const source = read("src/components/achats/AchatsTableau.tsx");
  assert.match(source, /article\.coutTTC != null && Number\.isFinite\(article\.coutTTC\)/);
  assert.match(source, /: "—"/);
});

test("Aucune mutation des achats ni du calcul de marge", () => {
  const source = read("src/components/achats/AchatsTableau.tsx");
  assert.doesNotMatch(source, /\.insert\(|\.update\(|\.upsert\(|\.delete\(/);
  const articlePage = read("src/app/items/[id]/page.tsx");
  assert.match(articlePage, /Coût unitaire TTC/);
});
