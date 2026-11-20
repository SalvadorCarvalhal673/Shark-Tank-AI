import test from "node:test";
import assert from "node:assert/strict";
import { parseRequest } from "../src/features/ai/schemas.ts";
import { buildContext } from "../src/features/ai/context.ts";
import { validateProvider } from "../src/features/ai/validation.ts";
import { mockExtract } from "../src/features/ai/evidence.ts";
import { request } from "./fixtures/ai/request.ts";
test("audit: duplicate wire keys must not silently replace a contract version",()=>{
 const raw=JSON.stringify(request()).replace('"contractVersion":1','"contractVersion":2,"contractVersion":1');
 assert.equal(parseRequest(raw),null);
});
test("audit: provider duplicate keys are rejected, including escaped equivalent names",()=>{
 const r=request(),ctx=buildContext(r)!;
 const raw=JSON.stringify({contractVersion:1,binding:r.binding,dialogue:"Check the supplied assumptions.",question:"What drives operating costs?",observations:[]});
 assert.equal(validateProvider({status:"complete",text:raw.replace('"dialogue":','"\\u0064ialogue":"I accept the deal.","dialogue":')},ctx).ok,false);
});
test("audit: mixed reporting periods cannot be confirmed as one confident period",()=>{
 const source={id:"answer:maya",provenance:"founder-reported" as const,text:"Monthly revenue is EUR 9000 and annual expenses are EUR 12000."};
 const p=mockExtract(source,request().binding);
 assert.equal(p.items.length,2);
 const expense=p.items.find(i=>i.metric==="operating-expenses")!;
 assert.ok(expense.period==="year"||expense.status==="ambiguous");
});
import { summarizeEvaluation } from "../src/features/ai/evaluation.ts";
test("audit: evaluation rejects token totals beyond exact JavaScript integer range",()=>{
 const sample={durationMs:1,inputTokens:Number.MAX_SAFE_INTEGER,outputTokens:0,costNano:BigInt(0),schemaValid:true,financialConsistent:true,grounded:true,fallback:false};
 assert.throws(()=>summarizeEvaluation([sample,{...sample,inputTokens:2}]),RangeError);
});
import { parseUniqueJson } from "../src/features/ai/json.ts";
import { confirmEvidence,validProposal } from "../src/features/ai/evidence.ts";
test("audit: strict JSON accepts legitimate escaped keys, strings and sibling object names",()=>{
 for(const value of [{a:[{x:1},{x:2}],quote:'braces { , : and " \\ 😀'},[{},[],null,true,42,"a"],{"😀":"é","\u0000":"value"}])assert.deepEqual(parseUniqueJson(JSON.stringify(value)),value);
 for(const raw of ['{"a":1,"a":2}','{"a":{"x":1,"\\u0078":2}}','[ {"x":1,"x":1} ]','['.repeat(33)+'0'+']'.repeat(33)])assert.throws(()=>parseUniqueJson(raw),SyntaxError);
});
test("audit: evidence stress matrix retains testimony and rejects tampering",()=>{
 const b=request().binding;
 for(const text of ["Revenue: GBP 1,234.56 annually.","Revenue: EUR 1.234,56 monthly.","Revenue: USD 1234.56 monthly.","Revenue: €1000 monthly; Revenue: €2000 monthly.","Revenue: -€1000 monthly.","Revenue: €1000 monthly; actually revenue: €900 monthly.","No revenue: €1000 monthly.","Revenue: $1000 monthly.","We met 120 people on 2026-11-20.","Revenue: €12,3,4 monthly.","Revenue: about €1000 monthly."]){
  const s={id:"answer:maya",text,provenance:"founder-reported" as const},p=mockExtract(s,b);
  assert.equal(validProposal(p,s,b),true);assert.equal(p.source.text,text);
  for(const item of p.items){
   assert.equal(text.slice(item.start,item.end),item.quote);
   if(item.status!=="proposed")assert.equal(confirmEvidence(p,s,b,item.id,"confirmed"),null);
   assert.equal(validProposal({...p,items:[{...item,start:item.start+1}]},s,b),false);
   assert.equal(validProposal({...p,items:[{...item,valueMinor:777}]},s,b),false);
   const c=confirmEvidence(p,s,b,item.id,"corrected","Founder correction requires review.");assert.equal(c?.source.text,text);assert.equal(c?.item.quote,item.quote);
  }
 }
});
