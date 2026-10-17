const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const read = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

test("l'historique v1.1 est accessible publiquement, même sans compte", () => {
  const proxy = read("src/proxy.ts");
  assert.match(proxy, /PUBLIC_PREFIXES[\s\S]*?["']\/mises-a-jour["']/);
  const home = read("src/app/page.tsx");
  assert.match(home, /href: "\/mises-a-jour", label: "Mises à jour"/);
});

test("le lien Mises à jour est placé après Abonnement dans la navigation", () => {
  const sidebar = read("src/components/Sidebar.tsx");
  const abos = sidebar.indexOf('{/* Abonnement — toujours visible */}');
  const updates = sidebar.indexOf('{/* Journal des mises à jour — public, après Abonnement */}');
  const disconnect = sidebar.indexOf('{/* Se connecter / Se déconnecter */}');
  assert.ok(abos >= 0 && abos < updates && updates < disconnect, "ordre des entrées");
  assert.match(sidebar.slice(updates, disconnect), /href="\/mises-a-jour"/);
});

test("les deux pages sont indexables avec des URLs canoniques et le sitemap", () => {
  const index = read("src/app/mises-a-jour/page.tsx");
  const article = read("src/app/mises-a-jour/v1-1/page.tsx");
  const sitemap = read("src/app/sitemap.ts");
  assert.match(index, /https:\/\/kyrivo.fr\/mises-a-jour/);
  assert.match(article, /https:\/\/kyrivo.fr\/mises-a-jour\/v1-1/);
  assert.match(sitemap, /\$\{BASE\}\/mises-a-jour/);
  assert.match(sitemap, /\$\{BASE\}\/mises-a-jour\/v1-1/);
  assert.match(article, /TechArticle/);
  assert.match(article, /datePublished/);
});

test("l'article contient les catégories demandées, les limites et l'email du support", () => {
  const source = read("src/lib/releases.ts");
  const article = read("src/app/mises-a-jour/v1-1/page.tsx");
  assert.match(source, /version: "1.1"/);
  assert.match(source, /dateISO: "2026-10-17"/);
  for (const category of ["Évolutions majeures", "Corrections de bugs", "Améliorations mineures"]) {
    assert.ok(source.includes(category), category);
  }
  assert.match(source, /import Vinted/i);
  assert.match(source, /double souscription/i);
  assert.match(source, /frais/i);
  assert.match(article, /contact@kartium-tcg\.com/);
  assert.match(article, /mailto:contact@kartium-tcg\.com/);
  assert.match(article, /<article/);
});
