import test from "node:test";
import assert from "node:assert/strict";
import { mockExtract,confirmEvidence,validProposal } from "../src/features/ai/evidence.ts";
import { request } from "./fixtures/ai/request.ts";
const binding=request().binding;
const source=(text:string)=>({id:"draft",text,provenance:"founder-reported" as const});
test("AI evidence mock identifies natural revenue and expenses without rewriting testimony",()=>{
  const s=source("We currently generate around €9,000 every month and spend approximately €12,000 on operations.");
  const p=mockExtract(s,binding);assert.equal(p.items.length,2);
  assert.deepEqual(p.items.map(i=>i.valueMinor),[900000,1200000]);
  assert.equal(p.items[0].metric,"revenue");assert.equal(p.items[1].metric,"operating-expenses");
  assert.equal(p.source.text,s.text);assert.equal(p.items[0].basis,"inferred");
  assert.equal(validProposal(p,s,binding),true);
});
test("AI evidence handles currencies, number formats, periods and unrelated dates conservatively",()=>{
  for(const figure of ["€9,000.50","EUR 9.000,50","€9000,50"]){
    const p=mockExtract(source("Revenue: "+figure+" monthly."),binding);
    assert.equal(p.items[0].valueMinor,900050);assert.equal(p.items[0].period,"month");
  }
  assert.equal(mockExtract(source("Our launch date is 2026-11-20 and 120 students visited."),binding).items.length,0);
  assert.equal(mockExtract(source("Revenue: $9000 monthly."),binding).items[0].status,"ambiguous");
});
test("AI evidence requires explicit resolution for negation, correction, contradiction and missing periods",()=>{
  for(const text of ["Revenue is not €9000 monthly.","Revenue: €9000.","Revenue: €9000 monthly; actually revenue: €8000 monthly."]){
    const s=source(text),p=mockExtract(s,binding);
    assert.equal(confirmEvidence(p,s,binding,p.items[0].id,"confirmed"),null);
    assert.ok(confirmEvidence(p,s,binding,p.items[0].id,"corrected","Current monthly revenue is EUR8000."));
  }
});
test("AI evidence confirmation retains sources and rejects forged quotes, stale bindings and unknown keys",()=>{
  const s=source("Revenue: €9000 monthly."),p=mockExtract(s,binding);
  const c=confirmEvidence(p,s,binding,"item-0","confirmed")!;
  assert.equal(c.provenance,"founder-confirmed-unverified");assert.equal(c.source.text,s.text);
  assert.ok(Object.isFrozen(c));
  assert.equal(confirmEvidence(p,s,{...binding,epoch:1},"item-0","confirmed"),null);
  assert.equal(validProposal({...p,items:[{...p.items[0],quote:"€99999"}]},s,binding),false);
  assert.equal(validProposal({...p,accepted:true},s,binding),false);
});

test("AI evidence never turns signed, abbreviated or ranged figures into positive exact evidence",()=>{
  for(const text of ["Revenue: -€9000 monthly.","Revenue: €9000–12000 monthly."]){
    const p=mockExtract(source(text),binding);assert.equal(p.items[0].status,"ambiguous");assert.equal(p.items[0].valueMinor,null);
  }
  assert.equal(mockExtract(source("Revenue: €9k monthly."),binding).items.length,0);
});

test("AI evidence validator rejects altered values, currencies and negation status despite a real quote",()=>{
  const s=source("Revenue is not €9000 monthly."),p=mockExtract(s,binding);
  for(const change of [{valueMinor:999},{currency:"USD"},{status:"proposed"}])
    assert.equal(validProposal({...p,items:[{...p.items[0],...change}]},s,binding),false);
});
