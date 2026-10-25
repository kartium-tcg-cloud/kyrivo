const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = name => fs.readFileSync(path.join(__dirname, "..", name), "utf8");

test("le bouton Vinted Bêta est prominent et identique pour achats et ventes", () => {
  const cta = read("src/components/vinted/VintedImportCTA.tsx");
  for (const page of [
    "src/components/achats/AchatsHeader.tsx",
    "src/components/ventes/VentesHeader.tsx",
  ]) {
    const source = read(page);
    assert.match(source, /import VintedImportCTA from/);
    assert.match(source, /<VintedImportCTA \/>/);
    assert.match(source, /sm:flex-row sm:items-stretch/);
    assert.match(source, /Ajouter une (?:vente|achat)/);
  }
  assert.match(cta, /href="\/import-vinted"/);
  assert.match(cta, /Importer Vinted/);
  assert.match(cta, /Testez avec un email/);
  assert.match(cta, /Bêta/);
  assert.match(cta, /aria-label="Fonctionnalité en bêta"/);
  assert.match(cta, /bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-300/);
  assert.match(cta, /min-h-\[60px\] w-full/);
  assert.match(cta, /sm:w-auto/);
  assert.match(cta, /focus-visible:outline/);
});

test("l'import indique les deux emails exacts et exige leur contenu complet", () => {
  const source = read("src/app/import-vinted/page.tsx");
  assert.match(source, /Ton reçu pour la commande/);
  assert.match(source, /Ton article s&apos;est vendu/);
  assert.match(source, /Pour importer un achat/);
  assert.match(source, /Pour importer une vente/);
  assert.match(source, /contenu entier de l&apos;email/);
  assert.match(source, /titre du mail seul ne suffit pas/);
  assert.match(source, /contact@kartium-tcg\.com/);
  assert.match(source, /Outil en cours de développement/);
});

test("nouvelle actualité Vinted publiée en première position", () => {
  const source = read("src/lib/news.ts");
  assert.match(source, /slug: "import-vinted"/);
  assert.match(source, /href: "\/nouveautes\/import-vinted"/);
  assert.match(source, /category: "Actualité"/);
  assert.match(source, /dateISO: "2026-10-25"/);
  assert.ok(source.indexOf('slug: "import-vinted"') < source.indexOf('slug: "v1-1"'));
});

test("l'article explique le parcours complet, les limites et les retours", () => {
  const page = read("src/app/nouveautes/import-vinted/page.tsx");
  for (const value of [
    "Ton reçu pour la commande",
    "Ton article s&apos;est vendu",
    "Copiez-collez le contenu complet",
    "chaque transaction",
    "stock Kyrivo",
    "annulations",
    "remboursements",
    "en développement",
    "contact@kartium-tcg.com",
    "mailto:contact@kartium-tcg.com",
  ]) {
    assert.ok(page.includes(value), value);
  }
  assert.match(page, /canonical: CANONICAL/);
  assert.match(page, /datePublished/);
  const sitemap = read("src/app/sitemap.ts");
  assert.match(sitemap, /\$\{BASE\}\/nouveautes\/import-vinted/);
});
