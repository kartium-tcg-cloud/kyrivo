const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const root = path.join(__dirname, "..");
const read = p => fs.readFileSync(path.join(root,p), "utf8");

function load(p) {
 const compiled = ts.transpileModule(read(p), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
 }).outputText;
 const mod = { exports: {} };
 vm.runInNewContext(compiled, { module: mod, exports: mod.exports, Math, Number, RangeError });
 return mod.exports;
}
const { socialContributionAmount, socialContributionSummary } = load("src/lib/socialContributions.ts");

test("Sans taux, ne crée aucune cotisation fictive sur les anciennes ventes", () => {
 assert.equal(socialContributionAmount(100, null), null);
 assert.equal(socialContributionAmount(100, undefined), null);
 assert.equal(socialContributionSummary({ revenueHT: 100, margin: 60, rate: null }), null);
});
test("Taux nul explicitement saisi : cotisations connues égales à zéro", () => {
 assert.equal(socialContributionAmount(100, 0), 0);
});
test("Exemple micro-entreprise : 100 € de CA HT à 12,3 %", () => {
 const v = socialContributionSummary({ revenueHT: 100, margin: 60, rate: 12.3 });
 assert.equal(v.contribution, 12.3);
 assert.equal(v.revenueAfter, 87.7);
 assert.equal(v.marginAfter, 47.7);
});
test("Arrondis en centimes et TVA déjà retirée de la base", () => {
 assert.equal(socialContributionAmount(19.99, 12.3), 2.46);
 assert.equal(socialContributionAmount(100, 12.3), 12.3);
 assert.equal(socialContributionAmount(200, 12.3), 24.6);
});
test("Taux impossible refusé : évite montants négatifs ou gonflés", () => {
 assert.throws(() => socialContributionAmount(100, -1), /taux/);
 assert.throws(() => socialContributionAmount(100, 101), /taux/);
 assert.throws(() => socialContributionAmount(100, NaN), /taux/);
});
test("La migration ne réécrit pas les ventes historiques et vérifie les bornes", () => {
 const sql=read("supabase/migrations/20261127_optional_social_contributions.sql");
 assert.match(sql,/ADD COLUMN IF NOT EXISTS default_social_contribution_rate numeric\(5,2\)/i);
 assert.match(sql,/ADD COLUMN IF NOT EXISTS social_contribution_rate numeric\(5,2\)/i);
 assert.match(sql,/CHECK \(social_contribution_rate IS NULL OR social_contribution_rate BETWEEN 0 AND 100\)/i);
 assert.doesNotMatch(sql,/UPDATE\s+(public\.)?sales\s+SET/i);
});
test("Les préférences ont un taux facultatif, indépendant de la TVA", () => {
 const prefs=read("src/lib/preferences.ts");
 const t=read("src/types/preferences.ts");
 const screen=read("src/app/preferences/page.tsx");
 assert.match(t,/defaultSocialContributionRate:\s*number\s*\|\s*null/);
 assert.match(prefs,/default_social_contribution_rate:\s*preferences\.defaultSocialContributionRate/);
 assert.match(screen,/value=\{preferences\.defaultSocialContributionRate\s*\?\?\s*""\}/);
});
test("Taux propre à la vente : créé, conservé en édition et exporté", () => {
 const page=read("src/app/ventes/page.tsx");
 const modal=read("src/components/ventes/VenteFormModal.tsx");
 const exportCode=read("src/lib/exportSales.ts");
 assert.match(page,/social_contribution_rate:\s*vente\.socialContributionRate/);
 assert.match(page,/social_contribution_rate:\s*venteEnEdition\.socialContributionRate\s*\?\?\s*null/);
 assert.match(modal,/venteInitiale\.socialContributionRate == null/);
 assert.match(modal,/socialContributionRate:\s*contributionRate/);
 assert.match(exportCode,/Cotisations sociales estimées/);
 assert.match(exportCode,/Marge estimée après frais et cotisations/);
});
test("Ventes et dashboard montrent les montants sociaux sans changer la TVA", () => {
 const list=read("src/components/ventes/VentesTableau.tsx");
 const page=read("src/app/ventes/page.tsx");
 const dashboard=read("src/components/dashboard/PeriodStats.tsx");
 assert.match(list,/firstItem\.itemName/);
 assert.match(list,/firstItem\.itemReference/);
 assert.match(page,/CA HT après cotisations/);
 assert.match(dashboard,/cotisationsEstimees/);
 assert.match(dashboard,/socialContributionAmount/);
});
test("Annonce publiée dans la catégorie bleue Mises à jour", () => {
 const news=read("src/lib/news.ts");
 const article=read("src/app/nouveautes/cotisations-sociales/page.tsx");
 assert.match(news,/slug:\s*"cotisations-sociales"/);
 assert.match(news,/category:\s*"Mises à jour"/);
 assert.match(article,/newsCategoryStyles\["Mises à jour"\]\.badge/);
 assert.match(article,/les encaissements vérifiés/i);
 assert.match(read("src/app/sitemap.ts"),/\$\{BASE\}\/nouveautes\/cotisations-sociales/);
});
