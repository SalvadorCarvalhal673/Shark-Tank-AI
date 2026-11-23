import test from "node:test";
import assert from "node:assert/strict";
import { hasConsent,redact,prepareTransmission,DISCLOSURE } from "../src/features/ai/privacy.ts";
import { buildContext } from "../src/features/ai/context.ts";
import { request } from "./fixtures/ai/request.ts";
const r=request(),consent={version:1,accepted:true,sessionId:r.binding.sessionId,provider:"openai",scope:"investor-dialogue"};
test("AI consent is explicit, versioned and bound to the selected provider and run",()=>{
  assert.equal(hasConsent(consent,r.binding,"openai"),true);
  for(const c of [null,{...consent,accepted:false},{...consent,version:2},{...consent,sessionId:"other"},{...consent,localSaving:true}])
    assert.equal(hasConsent(c,r.binding,"openai"),false);
  assert.equal(hasConsent(consent,r.binding,"google"),false);
  assert.equal(prepareTransmission(buildContext(r)!,null,"openai"),null);
  assert.match(DISCLOSURE.retention,/zero retention is not promised/);
});
test("AI transmission minimizes/redacts copies while original founder evidence survives unchanged",()=>{
  const text="Contact founder@example.com or +351 912 345 678. api_key=fictional-secret. We wash reusable containers.";
  const ctx=buildContext({...r,pitch:{...r.pitch,pitch:text}})!;
  const t=prepareTransmission(ctx,consent,"openai")!;
  assert.ok(t);assert.equal(t.sources[0].text.includes("founder@example.com"),false);
  assert.equal(t.sources[0].text.includes("+351"),false);
  assert.equal(t.sources[0].text.includes("fictional-secret"),false);
  assert.equal(ctx.session.pitch.pitch,text);
  assert.equal(Object.hasOwn(t,"financialFacts"),false);
  assert.equal(redact("Revenue is EUR9000 monthly."),"Revenue is EUR9000 monthly.");
});
