import test from "node:test";
import assert from "node:assert/strict";
import { RequestLifecycle } from "../src/features/ai/lifecycle.ts";
import { BudgetController } from "../src/features/ai/budgets.ts";
import { runMockConversation } from "../src/features/ai/server/mock-runner.ts";
import { MockProvider } from "../src/features/ai/server/mock-provider.ts";
import type { InvestorProvider } from "../src/features/ai/server/provider.ts";
import { request } from "./fixtures/ai/request.ts";

test("audit: obsolete cancelled runner cannot invalidate its replacement", async () => {
  const first=request(), lifecycle=new RequestLifecycle(),budget=new BudgetController();
  lifecycle.setContext({sessionId:first.binding.sessionId,revision:0,investorId:"maya",mode:"html",recoveryId:"fresh"});
  let started!:()=>void;
  const entered=new Promise<void>(resolve=>{started=resolve;});
  const never:InvestorProvider={kind:"mock",generate:async()=>{started();return new Promise(()=>{});}};
  const old=runMockConversation(JSON.stringify(first),{lifecycle,budget,signal:new AbortController().signal,principal:"old",provider:never});
  await entered;
  const second={...first,binding:{...first.binding,requestId:"replacement"}};
  const replacement=runMockConversation(JSON.stringify(second),{lifecycle,budget,signal:new AbortController().signal,principal:"new",provider:new MockProvider()});
  assert.equal((await old).kind,"discarded");
  assert.equal((await replacement).kind,"ready");
  assert.equal(lifecycle.epoch,0);
  assert.equal(budget.snapshot().active,0);
});

test("audit: context changes and late cancellation preserve newer delivery",async()=>{
 for(const change of [{mode:"studio"},{recoveryId:"restored"},{sessionId:"restarted"}]){
  const r=request(),lifecycle=new RequestLifecycle(),budget=new BudgetController(),external=new AbortController();
  const view={sessionId:r.binding.sessionId,revision:0,investorId:"maya" as const,mode:"html",recoveryId:"fresh"};
  lifecycle.setContext(view);
  let entered!:()=>void;const started=new Promise<void>(resolve=>{entered=resolve;});
  const old=runMockConversation(JSON.stringify(r),{lifecycle,budget,signal:external.signal,principal:"old",provider:{kind:"mock",generate:async()=>{entered();return new Promise(()=>{});}}});
  await started;lifecycle.setContext({...view,...change});
  const next={...r,binding:{...r.binding,sessionId:change.sessionId??r.binding.sessionId,epoch:lifecycle.epoch,requestId:"next"}};
  const newer=runMockConversation(JSON.stringify(next),{lifecycle,budget,signal:new AbortController().signal,principal:"next"});
  assert.equal((await old).kind,"discarded");assert.equal((await newer).kind,"ready");
  external.abort();assert.equal(lifecycle.presentationFinished(next.binding),true);
  assert.equal(lifecycle.presentationFinished(next.binding),false);assert.equal(budget.snapshot().active,0);
 }
});
test("audit: request-local cancellation ignores old identities and delivered requests",()=>{
 const r=request(),l=new RequestLifecycle();
 l.setContext({sessionId:r.binding.sessionId,revision:0,investorId:"maya",mode:"html",recoveryId:"fresh"});
 l.begin(r.binding);const next={...r.binding,requestId:"replacement"};const signal=l.begin(next)!;
 assert.equal(l.cancelRequest(r.binding),false);assert.equal(signal.aborted,false);
 assert.equal(l.consume(next),true);assert.equal(l.cancelRequest(next),false);
 assert.equal(l.presentationFinished(next),true);
});

test("audit: already-aborted work must not supersede an active request",async()=>{
 const r=request(),lifecycle=new RequestLifecycle(),budget=new BudgetController();
 lifecycle.setContext({sessionId:r.binding.sessionId,revision:0,investorId:"maya",mode:"html",recoveryId:"fresh"});
 const active=lifecycle.begin(r.binding)!;const stopped=new AbortController();stopped.abort();
 const result=await runMockConversation(JSON.stringify({...r,binding:{...r.binding,requestId:"already-cancelled"}}),{lifecycle,budget,signal:stopped.signal,principal:"p"});
 assert.equal(result.kind,"discarded");assert.equal(active.aborted,false);assert.equal(lifecycle.consume(r.binding),true);
});
