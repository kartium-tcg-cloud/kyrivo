const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const path = require("node:path");

function load(p, overrides={}) {
 const src=fs.readFileSync(path.join(__dirname,p),"utf8");
 const code=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const module={exports:{}};
 vm.runInNewContext(code,{module,exports:module.exports,require:n=>overrides[n]??require(n),Math,Number});
 return module.exports;
}
const calc=load("../src/lib/saleCalculations.ts");
const {estimateSaleProfit}=load("../src/lib/estimatedSaleProfit.ts",{"@/lib/saleCalculations":calc});
const sale=(overrides={})=>({
 id:"sale-1",vatMode:"margin_vat",
 lines:[{quantity:1,totalPrice:150,purchaseCost:100,economicPurchaseCost:108,vatRate:20}],
 ...overrides,
});
const fee=(overrides={})=>({
 saleId:"sale-1",kind:"expense",amountTTC:7,recoverableVatAmount:0,
 ...overrides,
});
test("TVA sur marge fiscale 8,33 €, profit avant frais 33,67 € puis 26,67 €",()=>{
 assert.equal(estimateSaleProfit(sale()),33.67);
 assert.equal(estimateSaleProfit(sale(),[fee()]),26.67);
});
test("frais déjà facturé au client : revenu déjà dans la vente, jamais ajouté une seconde fois",()=>{
 assert.equal(estimateSaleProfit(sale(),[fee({kind:"customer_charge",amountTTC:6})]),33.67);
});
test("TVA récupérable déclarée diminue le coût effectif sans réécrire la TVA sur marge",()=>{
 assert.equal(estimateSaleProfit(sale(),[fee({amountTTC:12,recoverableVatAmount:2})]),23.67);
});
test("vente standard : prix HT avant coût économique net et frais",()=>{
 assert.equal(estimateSaleProfit(sale({vatMode:"standard_vat",lines:[
  {quantity:2,totalPrice:120,economicPurchaseCost:45,vatRate:21},
 ]}),[fee()]),23);
});
test("coût d'achat historique absent : pas de faux bénéfice affiché",()=>{
 assert.equal(estimateSaleProfit(sale({lines:[{quantity:1,totalPrice:150,vatRate:20}]})),null);
});
test("régime marge : TVA article par article sans compensation des pertes",()=>{
 const s=sale({lines:[
  {quantity:1,totalPrice:80,purchaseCost:100,economicPurchaseCost:108,vatRate:20},
  {quantity:1,totalPrice:150,purchaseCost:100,economicPurchaseCost:108,vatRate:20},
 ]});
 assert.equal(estimateSaleProfit(s),5.67);
});
