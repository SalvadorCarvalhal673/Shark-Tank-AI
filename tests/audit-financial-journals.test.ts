import test from "node:test";
import assert from "node:assert/strict";
import { valuations,ownershipAfterInvestment } from "../src/features/simulation/negotiation/financials.ts";
import { createRun,advanceRun,decodeSave } from "../src/features/simulation/negotiation/session-storage.ts";
import { demonstrationPitch,demonstrationAnswers } from "../src/features/studio/model.ts";

// Alternative oracle: nearest integer selected by comparing exact distances,
// not the production quotient/remainder implementation.
function nearest(n:bigint,d:bigint){const low=n/d,high=low+BigInt(1);return Number(n-low*d<high*d-n?low:high);}
test("audit: all equity values and all founder ownership values reconcile independently",()=>{
 for(let e=1;e<=10000;e++)for(const amount of [1,17,99999999999]){
  const post=nearest(BigInt(amount)*BigInt(10000),BigInt(e));
  assert.deepEqual(valuations({amount,equity:e}),{preMoney:post-amount,postMoney:post});
  assert.ok(Number.isSafeInteger(post));
 }
 for(let f=0;f<=10000;f++)for(const e of [1,32,4999,5000,9999,10000]){
  const c=ownershipAfterInvestment(f,e)!;assert.equal(c.founderAfterBps,nearest(BigInt(f)*BigInt(10000-e),BigInt(10000)));
  assert.equal(c.founderAfterBps+c.otherExistingAfterBps+e,10000);
  assert.ok(c.founderAfterBps>=0&&c.otherExistingAfterBps>=0);
  assert.equal(c.founderRelativeDilutionBps,f===0?null:e);
 }
});
test("audit: 600 seeded mixed action journals preserve replay, chosen offers and terminal state",()=>{
 const outcomes=new Set<string>();
 for(const initialSeed of [20261120,81173,314159]){
  let seed=initialSeed;const rand=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0;};
  for(let episode=0;episode<200;episode++){
   const pitch={...demonstrationPitch,amount:episode%2?1:99999999999,equity:1+rand()%10000,founderOwnershipBps:rand()%10001};
   let run=createRun(`audit-${initialSeed}-${episode}`,pitch)!;
   for(let turn=0;turn<3;turn++)run=advanceRun(run,{kind:"answer",sessionId:run.session.id,expectedRevision:run.session.revision,turn,text:episode%10===0?"I have no available evidence today.":demonstrationAnswers[turn]});
   for(let round=0;round<3&&run.session.stage!=="finished";round++){
    const s=run.session,active=s.offers.filter(o=>o.status==="active"),offer=active[rand()%active.length];
    const stale={kind:"accept",sessionId:s.id,expectedRevision:s.revision-1,offerId:offer.id};
    assert.equal(advanceRun(run,stale),run);
    assert.equal(advanceRun(run,{...stale,expectedRevision:s.revision,offerId:"other:maya:3"}),run);
    const action={kind:"counter",sessionId:s.id,expectedRevision:s.revision,offerId:offer.id,terms:{amount:episode%5===0?99999999999:Math.max(1,offer.amount-(rand()%3)),equity:1+rand()%10000}};
    const before=JSON.stringify(run);const old=run;run=advanceRun(run,action);
    assert.equal(JSON.stringify(old),before);assert.equal(advanceRun(run,action),run);
    assert.equal(run.session.roundsUsed,round+1);
   }
   if(run.session.stage!=="finished"){
    const selected=run.session.offers.find(o=>o.status==="active")!;
    const action={kind:episode%2?"accept":"walk-away",sessionId:run.session.id,expectedRevision:run.session.revision,...(episode%2?{offerId:selected.id}:{})};
    run=advanceRun(run,action);
    if(episode%2)assert.deepEqual(run.session.offers.find(o=>o.status==="accepted"),{...selected,status:"accepted"});
   }
   outcomes.add(run.session.outcome!.kind);
   assert.equal(advanceRun(run,{kind:"walk-away",sessionId:run.session.id,expectedRevision:run.session.revision}),run);
   const raw=JSON.stringify({schemaVersion:1,rulesVersion:1,sessionId:run.session.id,pitch:run.session.pitch,actions:run.actions,saveId:"save",writerId:"writer",generation:1,savedAt:1});
   const restored=decodeSave(raw);assert.equal(restored.kind,"valid");if(restored.kind==="valid")assert.deepEqual(restored.run,run);
   assert.ok(run.actions.length<=7);assert.ok(run.session.offers.filter(o=>o.status==="accepted").length<=1);
  }
 }
 assert.deepEqual([...outcomes].sort(),["accepted-deal","all-withdrawn","founder-walk-away","no-offers"]);
});
