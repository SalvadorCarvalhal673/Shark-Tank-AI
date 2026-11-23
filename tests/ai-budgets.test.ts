import test from "node:test";
import assert from "node:assert/strict";
import { BudgetController } from "../src/features/ai/budgets.ts";
test("AI budget reserves concurrent costs atomically and settles only once",()=>{
  const b=new BudgetController({serverNano:BigInt(60000000)});
  const a=b.reserve("server-principal","run","request-1",8000,2000);assert.ok(a.ok);
  assert.equal(b.reserve("server-principal","run","request-2",1,1).ok,false);
  assert.equal(b.reserve("other","other-run","request-3",8000,2000).ok,false);
  if(a.ok){assert.equal(b.finish(a.lease,{inputTokens:3000,outputTokens:800}),true);assert.equal(b.finish(a.lease),false);}
  assert.equal(b.snapshot().chargedNano,BigInt(14000000));
  assert.equal(b.reserve("server-principal","run","request-1",1,1).ok,false);
});
test("AI budget limits episodes, global requests, token counts and reset-session bypasses",()=>{
  const b=new BudgetController({perEpisode:1,globalRequests:2});
  const a=b.reserve("p","run","a",1,1);if(a.ok)b.finish(a.lease);
  assert.equal(b.reserve("p","run","b",1,1).ok,false);
  const c=b.reserve("p","new-run","c",1,1);assert.ok(c.ok);if(c.ok)b.finish(c.lease);
  assert.equal(b.reserve("new-principal","another-run","d",1,1).ok,false);
  for(const n of [-1,NaN,8001])assert.equal(new BudgetController().reserve("p","run","q",n,1).ok,false);
});
test("AI budget charges failures conservatively and does not refund unverified provider usage",()=>{
  const b=new BudgetController();const a=b.reserve("p","r","q",8000,2000);
  assert.ok(a.ok);if(a.ok)b.finish(a.lease);
  assert.equal(b.snapshot().chargedNano,BigInt(36000000));
  assert.throws(()=>new BudgetController({deadlineMs:15001}));
});
