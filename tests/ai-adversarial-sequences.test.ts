import test from "node:test";
import assert from "node:assert/strict";
import { buildContext } from "../src/features/ai/context.ts";
import { scriptedFallback } from "../src/features/ai/fallback.ts";
import { RequestLifecycle } from "../src/features/ai/lifecycle.ts";
import { BudgetController } from "../src/features/ai/budgets.ts";
import { advanceRun } from "../src/features/simulation/negotiation/session-storage.ts";
import { valuations,ownershipAfterInvestment } from "../src/features/simulation/negotiation/financials.ts";
import { committedRequest } from "./fixtures/ai/committed.ts";
import { request } from "./fixtures/ai/request.ts";
test("AI terminal all-withdrawn counter retains its exact investor explanation",()=>{
  const c=committedRequest();let run=c.run;
  for(const investor of ["maya","adrian","sofia"] as const){
    const offer=run.session.offers.find(o=>o.investor===investor&&o.status==="active")!;
    run=advanceRun(run,{kind:"counter",sessionId:run.session.id,expectedRevision:run.session.revision,
      offerId:offer.id,terms:{amount:10000001,equity:1000}});
  }
  assert.equal(run.session.outcome?.kind,"all-withdrawn");
  const ctx=buildContext({...c.request,actions:run.actions,binding:{...c.request.binding,revision:6,purpose:"counter-explanation"}})!;
  assert.ok(ctx);assert.match(scriptedFallback(ctx,"network").dialogue,/cash limit/);
});
test("AI generated independent counter sequences never mutate engine finance or budgets",()=>{
  let seed=173;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
  for(let sample=0;sample<100;sample++){
    const c=committedRequest();let run=c.run;
    for(let round=0;round<3&&run.session.stage==="negotiation";round++){
      const active=run.session.offers.filter(o=>o.status==="active");
      const offer=active[random()%active.length];
      const next=advanceRun(run,{kind:"counter",sessionId:run.session.id,expectedRevision:run.session.revision,
        offerId:offer.id,terms:{amount:1+random()%15000000,equity:1+random()%10000}});
      assert.notEqual(next,run);run=next;
      const ctx=buildContext({...c.request,actions:run.actions,binding:{...c.request.binding,revision:run.session.revision,
        investorId:offer.investor,purpose:"counter-explanation"}})!;
      assert.ok(ctx);const before=JSON.stringify(ctx.session);scriptedFallback(ctx,"timeout");
      for(const fact of ctx.financialFacts){
        assert.deepEqual(fact.valuation,valuations({amount:fact.amountMinor,equity:fact.equityBps}));
        const cap=ownershipAfterInvestment(ctx.session.pitch.founderOwnershipBps,fact.equityBps);
        assert.ok(cap); assert.equal(cap.founderAfterBps+cap.otherExistingAfterBps+cap.investorBps,10000);
      }
      assert.equal(JSON.stringify(ctx.session),before);assert.equal(ctx.session.roundsUsed,round+1);
    }
  }
});
test("AI old speaking completion is invalidated by a new request at the same revision",()=>{
  const b=request().binding,l=new RequestLifecycle();
  l.setContext({sessionId:b.sessionId,revision:0,investorId:"maya",mode:"html",recoveryId:"fresh"});
  l.begin(b);l.consume(b);l.begin({...b,requestId:"new"});
  assert.equal(l.presentationFinished(b),false);
});
test("AI budget lease cannot be forged or settled by a different controller",()=>{
  const a=new BudgetController(),b=new BudgetController();
  const x=a.reserve("p","run","q",1,1),y=b.reserve("p","run","q",1,1);
  assert.ok(x.ok&&y.ok);
  if(x.ok&&y.ok){assert.equal(a.finish({...x.lease}),false);assert.equal(a.finish(y.lease),false);assert.equal(a.finish(x.lease),true);}
});
