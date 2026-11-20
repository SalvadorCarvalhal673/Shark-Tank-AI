import test from "node:test";
import assert from "node:assert/strict";
import { RequestLifecycle,withDeadline,RequestTimeout } from "../src/features/ai/lifecycle.ts";
import { request } from "./fixtures/ai/request.ts";
const b=request().binding;
const view={sessionId:b.sessionId,revision:0,investorId:"maya" as const,mode:"html",recoveryId:"fresh"};
test("AI lifecycle rejects duplicate/out-of-order replies and emits presentation-only events",()=>{
  const l=new RequestLifecycle();l.setContext(view);
  const first=l.begin(b)!;assert.equal(l.begin(b),null);
  const next={...b,requestId:"request-2"};assert.ok(l.begin(next));assert.equal(first.aborted,true);
  assert.equal(l.consume(b),false);assert.equal(l.consume(next),true);assert.equal(l.consume(next),false);
  assert.equal(l.presentationFinished(next),true);assert.equal(l.presentationFinished(next),false);
  assert.deepEqual(l.drainEvents().map(e=>e.kind),["request-started","request-cancelled","request-started","dialogue-ready","presentation-finished"]);
});
test("AI restart, revision, investor, recovery, mode change and unmount cancel obsolete requests",()=>{
  for(const change of [{sessionId:"new-run"},{revision:1},{investorId:"adrian" as const},{mode:"studio"},{recoveryId:"recovered"}]){
    const l=new RequestLifecycle();l.setContext(view);const signal=l.begin(b)!;
    l.setContext({...view,...change});assert.equal(signal.aborted,true);assert.equal(l.consume(b),false);
    assert.equal(l.epoch,1);
  }
  const l=new RequestLifecycle();l.setContext(view);l.begin(b);l.dispose();
  assert.equal(l.consume(b),false);assert.equal(l.begin({...b,epoch:l.epoch,requestId:"new"}),null);
});
test("AI accepted outcome invalidation at a later revision prevents narration overwrites",()=>{
  const l=new RequestLifecycle();l.setContext(view);l.begin(b);
  l.setContext({...view,revision:7});assert.equal(l.consume(b),false);
  const final={...b,revision:7,epoch:l.epoch,purpose:"outcome" as const,requestId:"outcome"};
  assert.ok(l.begin(final));assert.equal(l.consume(final),true);
});
test("AI deadlines cancel ignoring providers and external abort without waiting for completion",async()=>{
  const never=()=>new Promise<never>(()=>{});
  await assert.rejects(withDeadline(never,new AbortController().signal,5),RequestTimeout);
  const abort=new AbortController();const pending=withDeadline(never,abort.signal,100);abort.abort();
  await assert.rejects(pending,/cancelled/);
  assert.equal(await withDeadline(async()=>42,new AbortController().signal,100),42);
});
