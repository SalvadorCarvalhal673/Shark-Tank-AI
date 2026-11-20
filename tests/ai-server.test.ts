import test from "node:test";
import assert from "node:assert/strict";
import { invokeMock } from "../src/features/ai/server/mock-service.ts";
import { MockProvider } from "../src/features/ai/server/mock-provider.ts";
import { request } from "./fixtures/ai/request.ts";
test("AI mock service replays, validates and returns deterministic output with no network",async()=>{
  const raw=JSON.stringify(request()),signal=new AbortController().signal;
  assert.deepEqual(await invokeMock(raw,signal),await invokeMock(raw,signal));
  assert.equal((await invokeMock(raw,signal)).ok,true);
  assert.equal((await invokeMock("{}",signal)).ok,false);
});
test("AI mock provider models refusal, incomplete, invalid output, cancellation and network failure",async()=>{
  const raw=JSON.stringify(request()),signal=new AbortController().signal;
  for(const mode of ["refusal","incomplete","invalid"] as const)
    assert.equal((await invokeMock(raw,signal,new MockProvider(mode))).ok,false);
  await assert.rejects(invokeMock(raw,signal,new MockProvider("network")));
  const abort=new AbortController();
  const pending=invokeMock(raw,abort.signal,new MockProvider("valid",50));abort.abort();
  await assert.rejects(pending);
});
