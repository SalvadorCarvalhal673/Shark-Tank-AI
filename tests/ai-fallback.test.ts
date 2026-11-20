import test from "node:test";
import assert from "node:assert/strict";
import { scriptedFallback } from "../src/features/ai/fallback.ts";
import { buildContext } from "../src/features/ai/context.ts";
import { advanceRun } from "../src/features/simulation/negotiation/session-storage.ts";
import { request } from "./fixtures/ai/request.ts";
import { committedRequest } from "./fixtures/ai/committed.ts";
test("AI every fallback reason preserves session, journal and counter budget",()=>{
  const ctx=buildContext(request())!,before=JSON.stringify(ctx.session);
  for(const reason of ["missing-credentials","timeout","refusal","network","invalid-output","budget","no-consent","cancelled"] as const){
    const result=scriptedFallback(ctx,reason);
    assert.equal(result.provenance,"scripted");assert.equal(result.fallback,reason);
    assert.match(result.question!,/financial figure/);assert.equal(JSON.stringify(ctx.session),before);
  }
});
test("AI fallback narrates actual counter withdrawal and explicit accepted outcomes",()=>{
  const c=committedRequest();
  let run=advanceRun(c.run,{kind:"counter",sessionId:c.run.session.id,expectedRevision:3,
    offerId:c.run.session.offers.find(o=>o.investor==="sofia")!.id,terms:{amount:10000000,equity:1000}});
  const counter={...c.request,actions:run.actions,binding:{...c.request.binding,revision:4,purpose:"counter-explanation" as const}};
  assert.match(scriptedFallback(buildContext(counter)!,"network").dialogue,/exceeds my cash limit/);
  run=advanceRun(run,{kind:"accept",sessionId:run.session.id,expectedRevision:4,offerId:run.session.offers.find(o=>o.investor==="maya")!.id});
  const final={...counter,actions:run.actions,binding:{...counter.binding,revision:5,purpose:"outcome" as const}};
  assert.match(scriptedFallback(buildContext(final)!,"timeout").dialogue,/confirmed one offer/);
  assert.equal(run.session.roundsUsed,1);
});
