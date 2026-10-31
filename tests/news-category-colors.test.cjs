const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const read = p => fs.readFileSync(path.join(root,p), "utf8");

function loadNews() {
  const compiled = ts.transpileModule(read("src/lib/news.ts"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(compiled, {
    module: mod,
    exports: mod.exports,
    require: name => {
      if (name === "@/lib/releases") return { latestRelease: {
        version: "1.1", title: "Une mise à jour", summary: "Améliorations",
        dateISO: "2026-10-17", dateLabel: "17 octobre 2026",
      } };
      throw new Error("Unexpected module: "+name);
    },
  });
  return mod.exports;
}

test("Chaque catégorie de Nouveautés possède une couleur distincte et cohérente", () => {
  const { newsCategories, newsCategoryStyles } = loadNews();
  assert.equal(newsCategories.length, 4);
  const hues = ["blue", "cyan", "emerald", "amber"];
  newsCategories.forEach((name, i) => {
    const style = newsCategoryStyles[name];
    assert.ok(style, "Palette absente : "+name);
    for (const prop of ["badge", "selectedFilter", "marker", "cardAccent", "cardHover"]) {
      assert.ok(style[prop].includes(hues[i]), name+" / "+prop);
    }
  });
  assert.equal(new Set(hues).size, 4);
});

test("La liste utilise la palette pour filtres, étiquettes et bordures tout en conservant le filtrage", () => {
  const feed = read("src/app/nouveautes/NewsFeed.tsx");
  assert.match(feed, /selectedCategories\.includes\(article\.category\)/);
  assert.match(feed, /newsCategoryStyles\[category\]/);
  assert.match(feed, /style\.selectedFilter/);
  assert.match(feed, /newsCategoryStyles\[article\.category\]\.badge/);
  assert.match(feed, /newsCategoryStyles\[article\.category\]\.cardAccent/);
  assert.match(feed, /aria-pressed=\{selected\}/);
  assert.match(feed, /aria-live="polite"/);
});

test("Couleurs réutilisées dans les pages des articles", () => {
  const vinted = read("src/app/nouveautes/import-vinted/page.tsx");
  const release = read("src/app/nouveautes/v1-1/page.tsx");
  assert.match(vinted, /newsCategoryStyles\["Actualité"\]\.badge/);
  assert.match(release, /newsCategoryStyles\["Mises à jour"\]\.badge/);
});
