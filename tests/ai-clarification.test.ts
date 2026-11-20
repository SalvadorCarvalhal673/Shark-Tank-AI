import test from "node:test";
import assert from "node:assert/strict";
import { startClarifications,clarify } from "../src/features/ai/clarification.ts";
import { request } from "./fixtures/ai/request.ts";
const b=request().binding;
test("AI optional clarification is limited to one per investor without consuming binding actions",()=>{
  const state=startClarifications(b.sessionId);
  const asked=clarify(state,{kind:"ask",binding:b,text:"Which operating period did you mean?"},b,true);
  assert.equal(asked.entries.maya?.status,"asked");
  const answered=clarify(asked,{kind:"answer",binding:b,text:"I meant the latest completed month."},b,true);
  assert.equal(answered.entries.maya?.status,"answered");
  assert.equal(clarify(answered,{kind:"ask",binding:b,text:"Another question?"},b,true),answered);
  assert.equal(Object.keys(state.entries).length,0);
  assert.ok(Object.isFrozen(answered.entries.maya));
});
test("AI clarification skip/cancel/unnecessary and stale actions do not reopen allowance",()=>{
  for(const kind of ["skip","cancel"]){
    const asked=clarify(startClarifications(b.sessionId),{kind:"ask",binding:b,text:"Which period?"},b,true);
    const finished=clarify(asked,{kind,binding:b,text:null},b,true);
    assert.equal(clarify(finished,{kind:"ask",binding:b,text:"Again?"},b,true),finished);
    assert.equal(clarify(asked,{kind:"answer",binding:{...b,epoch:1},text:"Another month"},b,true),asked);
  }
  const state=startClarifications(b.sessionId);
  assert.equal(clarify(state,{kind:"ask",binding:b,text:"Which period?"},b,false),state);
  assert.equal(clarify(state,{kind:"ask",binding:{...b,sessionId:"other"},text:"Which period?"},b,true),state);
  const unnecessary=clarify(state,{kind:"unnecessary",binding:b,text:null},b,true);
  assert.equal(unnecessary.entries.maya?.status,"unnecessary");
});
