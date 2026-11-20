import test from "node:test";
import assert from "node:assert/strict";
import { parseAppResponse } from "../src/features/ai/response.ts";
import { scriptedFallback } from "../src/features/ai/fallback.ts";
import { buildContext } from "../src/features/ai/context.ts";
import { request } from "./fixtures/ai/request.ts";
test("AI application envelope rejects forged scripted financial lines, extra fields and wrong binding",()=>{
  const ctx=buildContext(request())!,r=scriptedFallback(ctx,"timeout");
  assert.ok(parseAppResponse(JSON.stringify(r),ctx));
  for(const bad of [{...r,dialogue:"I accept the deal."},{...r,binding:{...r.binding,requestId:"wrong"}},
    {...r,accepted:true},{...r,provenance:"mock"},{...r,contractVersion:2}])
    assert.equal(parseAppResponse(JSON.stringify(bad),ctx),null);
});
