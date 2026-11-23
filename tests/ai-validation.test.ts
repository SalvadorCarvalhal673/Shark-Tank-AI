import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { validateProvider, PROVIDER_SCHEMA } from "../src/features/ai/validation.ts";
import { buildContext } from "../src/features/ai/context.ts";
import { request } from "./fixtures/ai/request.ts";
const ctx=buildContext(request())!;
const output=()=>({contractVersion:1,binding:ctx.request.binding,dialogue:"Explain the operating cost assumptions behind this business.",
  question:"What financial measure can you share?",observations:[{category:"finance",text:"The pitch describes a return-based service.",
    references:[{sourceId:"pitch",quote:"Reusable lunch containers"}]}]});
const check=(v:unknown)=>validateProvider({status:"complete",text:JSON.stringify(v)},ctx);
test("AI valid structured output is grounded, frozen and bound to the exact investor request",()=>{
  const r=check(output());assert.equal(r.ok,true);if(r.ok)assert.ok(Object.isFrozen(r.value.observations));
  assert.equal(PROVIDER_SCHEMA.additionalProperties,false);
});
test("AI output rejects malformed, missing, extra, wrong investor/session/epoch and forged evidence",()=>{
  assert.equal(validateProvider({status:"complete",text:"{"},ctx).ok,false);
  const o=output();
  for(const v of [{...o,dialogue:undefined},{...o,valuation:500},{...o,binding:{...o.binding,investorId:"sofia"}},
    {...o,binding:{...o.binding,sessionId:"other"}},{...o,binding:{...o.binding,epoch:1}},
    {...o,observations:[{category:"finance",text:"Made up",references:[{sourceId:"answer:maya",quote:"profit"}]}]},
    {...o,dialogue:"x".repeat(601)},{...o,question:null}])assert.equal(check(v).ok,false);
});
test("AI refusal and incomplete responses never become trusted dialogue",()=>{
  assert.deepEqual(validateProvider({status:"refusal",text:"No"},ctx),{ok:false,reason:"refusal"});
  assert.equal(validateProvider({status:"incomplete",text:JSON.stringify(output())},ctx).ok,false);
});
test("AI adversarial financial commitments, numeric claims and injection fixtures fail closed",()=>{
  const fixtures=JSON.parse(fs.readFileSync(new URL("./fixtures/ai/adversarial.json",import.meta.url),"utf8"));
  for(const dialogue of fixtures)assert.equal(check({...output(),dialogue}).ok,false,dialogue);
});
