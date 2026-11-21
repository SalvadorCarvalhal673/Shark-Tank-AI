import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { summarizeEvaluation } from "../src/features/ai/evaluation.ts";
import { runMockConversation } from "../src/features/ai/server/mock-runner.ts";
import { MockProvider } from "../src/features/ai/server/mock-provider.ts";
import { RequestLifecycle } from "../src/features/ai/lifecycle.ts";
import { BudgetController } from "../src/features/ai/budgets.ts";
import { request } from "./fixtures/ai/request.ts";
function setup(){
  const r=request(),lifecycle=new RequestLifecycle();
  lifecycle.setContext({sessionId:r.binding.sessionId,revision:0,investorId:"maya",mode:"html",recoveryId:"fresh"});
  return {r,lifecycle,budget:new BudgetController(),signal:new AbortController().signal,principal:"controlled-host"};
}
test("AI evaluation percentiles/costs are reproducible and do not claim synthetic latency as live performance",()=>{
  const report=summarizeEvaluation([1,2,3,4,100].map(durationMs=>({durationMs,inputTokens:10,outputTokens:2,costNano:BigInt(1),
    schemaValid:true,financialConsistent:true,grounded:true,fallback:false})));
  assert.equal(report.p50Ms,3);assert.equal(report.p95Ms,100);assert.equal(report.costNano,BigInt(5));
  assert.throws(()=>summarizeEvaluation([]));
});
test("AI composed mock runner validates, preserves authority and settles budget",async()=>{
  const s=setup(),before=JSON.stringify(s.r);
  const result=await runMockConversation(JSON.stringify(s.r),s);
  assert.equal(result.kind,"ready");
  if(result.kind==="ready"){assert.equal(result.response.provenance,"mock");assert.equal(result.response.fallback,null);}
  assert.equal(s.budget.snapshot().active,0);assert.equal(JSON.stringify(s.r),before);
});
test("AI composed runner covers every synthetic provider failure and budget/consent rejection",async()=>{
  for(const mode of ["network","refusal","incomplete","invalid"] as const){
    const s=setup(),result=await runMockConversation(JSON.stringify(s.r),{...s,provider:new MockProvider(mode)});
    assert.equal(result.kind,"ready");if(result.kind==="ready")assert.equal(result.response.provenance,"scripted");
  }
  const timeout=setup(),t=await runMockConversation(JSON.stringify(timeout.r),{...timeout,provider:new MockProvider("valid",50),deadlineMs:5});
  assert.equal(t.kind,"ready");if(t.kind==="ready")assert.equal(t.response.fallback,"timeout");
  const denied=setup(),d=await runMockConversation(JSON.stringify(denied.r),{...denied,testConsentBoundary:true});
  assert.equal(d.kind,"ready");if(d.kind==="ready")assert.equal(d.response.fallback,"no-consent");
  const exhausted=setup(),e=await runMockConversation(JSON.stringify(exhausted.r),{...exhausted,budget:new BudgetController({serverNano:BigInt(0)})});
  assert.equal(e.kind,"ready");if(e.kind==="ready")assert.equal(e.response.fallback,"budget");
});
test("AI composed runner discards late completion on revision/mode changes",async()=>{
  const s=setup(),pending=runMockConversation(JSON.stringify(s.r),{...s,provider:new MockProvider("valid",30)});
  s.lifecycle.setContext({sessionId:s.r.binding.sessionId,revision:1,investorId:"maya",mode:"studio",recoveryId:"fresh"});
  assert.equal((await pending).kind,"discarded");assert.equal(s.budget.snapshot().active,0);
});
test("AI protected UI remains isolated while the authorized server route uses only the guarded entry",()=>{
  const root=new URL("../src/",import.meta.url);
  const files=fs.readdirSync(root,{recursive:true,withFileTypes:true}).filter(e=>e.isFile()&&/\.(ts|tsx)$/.test(e.name));
  for(const f of files){
    const file=new URL((f.parentPath.replaceAll("\\","/").split("/src/")[1]??"")+"/"+f.name,root);
    if(file.pathname.includes("/features/ai/"))continue;
    if(file.pathname.endsWith("/app/api/investor/route.ts"))continue;
    assert.doesNotMatch(fs.readFileSync(file,"utf8"),/features\/ai|from\s+["'][^"']*\/ai\//);
  }
  const route=fs.readFileSync(new URL("../src/app/api/investor/route.ts",import.meta.url),"utf8");
  assert.match(route,/import ["']server-only["']/);
  assert.match(route,/createInvestorEndpoint\(\(\) => backendMode\(\)\)/);
  assert.doesNotMatch(route,/openai-adapter|fetch\(|process\.env|credential/i);
});

test("AI consent gate never invokes a provider and global duplicate leaves no pending presentation",async()=>{
  const s=setup();let calls=0;
  const provider={kind:"mock" as const,generate:async()=>{calls++;throw new Error("Must not be called");}};
  await runMockConversation(JSON.stringify(s.r),{...s,provider,testConsentBoundary:true});
  assert.equal(calls,0);assert.equal(s.budget.snapshot().requests,0);
  const a=setup();await runMockConversation(JSON.stringify(a.r),a);
  const next=setup();const result=await runMockConversation(JSON.stringify(next.r),{...next,budget:a.budget});
  assert.equal(result.kind,"discarded");
  assert.ok(next.lifecycle.drainEvents().some(e=>e.kind==="request-cancelled"));
});
