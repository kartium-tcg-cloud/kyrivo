const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const source=fs.readFileSync(path.join(__dirname,"../src/lib/feeQueries.ts"),"utf8");
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
const records=Array.from({length:1002},(_,i)=>({
 id:`f${i}`,company_id:"company-one",purchase_id:"P1",sale_id:null,
 kind:"expense",category:"shipping",label:`Frais ${i}`,
 amount_ht:"1.00",amount_ttc:"1.00",vat_rate:0,
 vat_amount:0,recoverable_vat_amount:0,included_in_parent_total:false,
 vat_treatment:"pending_review",notes:"",
}));
const calls=[];
const client={
 from(table){
  assert.equal(table,"transaction_fees");
  const q={
    select(){return q},
    eq(field,value){assert.equal(field,"company_id");assert.equal(value,"company-one");return q},
    in(field,ids){assert.equal(field,"purchase_id");assert.deepEqual(Array.from(ids),["P1"]);return q},
    order(){return q},
    async range(from,to){calls.push([from,to]);return {data:records.slice(from,to+1),error:null}},
  };
  return q;
 },
};
const module={exports:{}};
vm.runInNewContext(compiled,{
 module,exports:module.exports,
 require:id=>id==="@/lib/supabase/client"?{createClient:()=>client}:require(id),
});
const {getTransactionFees}=module.exports;
test("pagination complete: plus de 1 000 frais sans tronquer un export",async()=>{
 const fees=await getTransactionFees({companyId:"company-one",purchaseIds:["P1"]});
 assert.equal(fees.length,1002);
 assert.deepEqual(calls,[[0,999],[1000,1999]]);
 assert.equal(fees[1001].label,"Frais 1001");
});
test("aucun identifiant demandé: aucune requête réseau",async()=>{
 const previous=calls.length;
 assert.equal((await getTransactionFees({companyId:"company-one",saleIds:[]})).length,0);
 assert.equal(calls.length,previous);
});
