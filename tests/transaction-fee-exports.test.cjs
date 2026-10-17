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
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  }}).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module, exports: module.exports, console, Date, Promise, Object,
    require: id => overrides[id] ?? require(id),
  }, { filename: relativePath });
  return module.exports;
}
const calc = getModule("../src/lib/saleCalculations.ts");
const { exportPurchasesToExcel } = getModule("../src/lib/exportPurchases.ts");
const { exportSalesToExcel } = getModule("../src/lib/exportSales.ts", {
  "@/lib/saleCalculations": calc,
});
const fileName = kind => `kyrivo-${kind}-${new Date().toISOString().slice(0,10)}.xlsx`;
const fee = overrides => ({
  companyId:"co1", purchaseId:null, saleId:null, kind:"expense", category:"shipping",
  label:"Port", amountHT:5, vatRate:0, vatAmount:0, amountTTC:5,
  recoverableVatAmount:0, includedInParentTotal:false, vatTreatment:"pending_review",
  notes:"", ...overrides,
});

test("achat + frais de livraison inclus : débours total inchangé, onglet frais séparé", async () => {
 const p = fileName("achats");
 try {
  await exportPurchasesToExcel([{
   id:"P1", date:"2026-10-17", numInterne:"ACH1", fournisseur:"Test",
   produit:"Cartes", type:"particulier", prixHT:108, prixTVA:0, prixTTC:108,
   vatRate:0, paiement:"Virement", numFacture:"", avecStock:false,
  }], [fee({purchaseId:"P1",includedInParentTotal:true,amountHT:8,amountTTC:8, label:"Transport et protection"})]);
  const wb=XLSX.readFile(p), a=XLSX.utils.sheet_to_json(wb.Sheets.Achats)[0];
  assert.equal(a["Montant TTC achat"],108);
  assert.equal(a["Frais supplémentaires supportés TTC"],8);
  assert.equal(a["Frais payés hors montant achat TTC"],0);
  assert.equal(a["Débours global estimé TTC"],108);
  assert.equal(XLSX.utils.sheet_to_json(wb.Sheets["Frais achats"]).length,1);
 } finally {if(fs.existsSync(p))fs.unlinkSync(p);}
});

test("vente TVA marge 8,33 inchangée, frais externes 7, bénéfice 26,67 €",async()=>{
 const p=fileName("ventes");
 try{
 await exportSalesToExcel([{
  id:"S1", date:"2026-10-17",numInterne:"VEN1",customerName:"Client",
  vatMode:"margin_vat",paymentMethod:"Virement",subtotalHT:141.67,
  vatAmount:8.33,totalTTC:150,marginAmount:33.67,
  lines:[{id:"L1",saleId:"S1",companyId:"co1",createdAt:"2026-10-17",
   itemName:"Carte",quantity:1,unitPrice:150,totalPrice:150,
   purchaseCost:100,economicPurchaseCost:108,vatRate:20}],
 }],[fee({saleId:"S1",label:"Expédition",amountHT:7,amountTTC:7})]);
 const wb=XLSX.readFile(p), row=XLSX.utils.sheet_to_json(wb.Sheets.Ventes)[0];
 assert.equal(row["TVA collectée"],8.33);
 assert.equal(row["TTC total vente"],150);
 assert.equal(row["Marge économique vérifiable après TVA"],33.67);
 assert.equal(row["Frais de vente supportés TTC"],7);
 assert.equal(row["Marge estimée après frais"],26.67);
 assert.equal(XLSX.utils.sheet_to_json(wb.Sheets["Frais ventes"]).length,1);
 }finally{if(fs.existsSync(p))fs.unlinkSync(p)}
});

test("frais déjà facturés au client restent documentés, sans doubler le TTC ni réduire le bénéfice",async()=>{
 const p=fileName("ventes");
 try{
 await exportSalesToExcel([{
  id:"S2",date:"2026-10-17",numInterne:"VEN2",customerName:"Client",
  vatMode:"margin_vat",paymentMethod:"Virement",subtotalHT:141.67,
  vatAmount:8.33,totalTTC:150,marginAmount:33.67,
  lines:[{id:"L2",saleId:"S2",companyId:"co1",createdAt:"2026-10-17",
   itemName:"Carte",quantity:1,unitPrice:150,totalPrice:150,
   purchaseCost:100,economicPurchaseCost:108,vatRate:20}],
 }],[fee({saleId:"S2",label:"Port facturé déjà dans la vente",kind:"customer_charge",
   amountHT:6,amountTTC:6,includedInParentTotal:true})]);
 const wb=XLSX.readFile(p),row=XLSX.utils.sheet_to_json(wb.Sheets.Ventes)[0];
 assert.equal(row["TTC total vente"],150);
 assert.equal(row["Marge estimée après frais"],33.67);
 assert.equal(row["Frais de vente supportés TTC"],0);
 }finally{if(fs.existsSync(p))fs.unlinkSync(p);}
});
