const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const XLSX = require("xlsx");

function getModule(relativePath, overrides = {}) {
  const source = fs.readFileSync(path.join(__dirname, relativePath), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  }}).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module, exports: module.exports, console, Date, Promise, Object,
    require: (id) => overrides[id] ?? require(id),
  }, { filename: relativePath });
  return module.exports;
}
const calculations = getModule("../src/lib/saleCalculations.ts");
const { exportPurchasesToExcel } = getModule("../src/lib/exportPurchases.ts");
const { exportSalesToExcel } = getModule("../src/lib/exportSales.ts", {
  "@/lib/saleCalculations": calculations,
});
const outputName = (kind) => `kyrivo-${kind}-${new Date().toISOString().slice(0,10)}.xlsx`;

test("Excel Achats : montant déboursé conservé, vendeur fiscal séparé, pas de double frais", async () => {
  const p = outputName("achats");
  try {
    await exportPurchasesToExcel([{
      id: "purchase1", date: "2026-10-15", numInterne: "A1", fournisseur: "vinted seller",
      produit: "Pokémon", type: "particulier", prixHT: 108, prixTVA: 0, prixTTC: 108,
      vatRate: 0, paiement: "Vinted", numFacture: "", avecStock: true,
      source: "vinted_import", sourceDetails: {
        sellerPrice: 100, shippingFee: 5, buyerProtectionFee: 3, otherFees: 0,
        paidTotal: 108, orderReference: "V123", amountsConfirmed: true,
      },
      documentUrl: "documents/proof.pdf",
      articles: [{
        id: "article1", reference: "2026-0000001", nom: "Carte", quantite: 1, stockRestant: 1,
        coutHT: 100, coutTTC: 100, fiscalUnitCost: 100, economicUnitCost: 108,
        fiscalCostReviewRequired: false, statut: "in_stock",
      }],
    }]);
    const wb = XLSX.readFile(p);
    assert.deepEqual(wb.SheetNames, ["Achats", "Détail Vinted"]);
    const lines = XLSX.utils.sheet_to_json(wb.Sheets.Achats);
    assert.equal(lines[0]["Montant TTC achat"], 108);
    assert.equal(lines[0]["Prix fiscal vendeur unitaire"], 100);
    assert.equal(lines[0]["Coût économique unitaire"], 108);
    assert.equal(lines[0]["Frais Vinted inclus TTC"], 8);
    const details = XLSX.utils.sheet_to_json(wb.Sheets["Détail Vinted"]);
    assert.equal(details[0]["Prix vendeur TTC"], 100);
    assert.equal(details[0]["Livraison acheteur TTC"], 5);
    assert.equal(details[0]["Protection acheteur TTC"], 3);
    assert.equal(details[0]["Total payé TTC"], 108);
  } finally { if (fs.existsSync(p)) fs.unlinkSync(p); }
});

test("Excel Ventes : bénéfice après TVA et frais, prix fiscal préservé", async () => {
  const p = outputName("ventes");
  try {
    await exportSalesToExcel([{
      id: "sale1", date: "2026-10-15", numInterne: "V1", customerName: "Client",
      vatMode: "margin_vat", paymentMethod: "Vinted",
      subtotalHT: 141.67, vatAmount: 8.33, totalTTC: 150, marginAmount: 33.67,
      invoiceNumber: "FAC000001", lines: [{
        id: "line1", saleId: "sale1", companyId: "co1", createdAt: "2026-10-15",
        itemName: "Carte", quantity: 1, unitPrice: 150, totalPrice: 150,
        purchaseCost: 100, economicPurchaseCost: 108, vatRate: 20,
      }],
    }]);
    const wb = XLSX.readFile(p);
    const lines = XLSX.utils.sheet_to_json(wb.Sheets.Ventes);
    assert.equal(lines[0]["TTC total vente"], 150);
    assert.equal(lines[0]["TVA collectée"], 8.33);
    assert.equal(lines[0]["Coût achat TTC"], 100);
    assert.equal(lines[0]["Coût économique achat TTC"], 108);
    assert.equal(lines[0]["Marge économique ligne après TVA"], 33.67);
    assert.equal(lines[0]["Marge économique vérifiable après TVA"], 33.67);
  } finally { if (fs.existsSync(p)) fs.unlinkSync(p); }
});

test("PDF client : aucune ligne de coût d'achat ou de frais Vinted internes ; marge TTC sans TVA affichée", () => {
  const source = fs.readFileSync(path.join(__dirname, "../src/lib/invoiceZip.ts"), "utf8");
  const section = source.slice(source.indexOf("function drawItemsTable"), source.indexOf("function drawFooter"));
  assert.ok(section.includes('const labelTotal = "Total TTC"'));
  assert.ok(section.includes('if (sale.vatMode === "margin_vat")'));
  assert.ok(!section.includes("economicPurchaseCost"));
  assert.ok(!section.includes("sourceDetails"));
});
