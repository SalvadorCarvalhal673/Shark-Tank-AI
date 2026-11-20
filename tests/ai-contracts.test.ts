import test from "node:test";
import assert from "node:assert/strict";
import { parseRequest } from "../src/features/ai/schemas.ts";
import { buildContext } from "../src/features/ai/context.ts";
import { MAX_REQUEST_BYTES } from "../src/features/ai/contracts.ts";
import { request } from "./fixtures/ai/request.ts";
test("AI request exact schema rejects versions, hidden financial fields and malformed payloads", () => {
  const r=request(); assert.ok(parseRequest(JSON.stringify(r)));
  for(const bad of [{...r,contractVersion:2},{...r,offer:{amount:1}},{...r,binding:{...r.binding,revision:8}},
    {...r,pitch:{...r.pitch,valuation:5}},{...r,actions:[{kind:"accept"}]}])
    assert.equal(parseRequest(JSON.stringify(bad)),null);
  assert.equal(parseRequest("{"),null);
  assert.equal(parseRequest(" ".repeat(MAX_REQUEST_BYTES+1)),null);
});
test("AI maximum valid Unicode and JSON-escaped pitch, answers and history fit bounded request", () => {
  const r=request();
  const full={...r,pitch:{...r.pitch,startup:"界".repeat(80),pitch:"界".repeat(3000)},
    binding:{...r.binding,revision:3,purpose:"answer-feedback" as const,investorId:"sofia" as const},
    actions:[0,1,2].map(turn=>({kind:"answer" as const,sessionId:r.binding.sessionId,expectedRevision:turn,turn,text:"界".repeat(1500)})),
    history:Array.from({length:6},(_,i)=>({id:"h"+i,investorId:"maya" as const,text:("\u0001".repeat(599)+"x")}))};
  assert.ok(parseRequest(JSON.stringify(full))); assert.ok(buildContext(full));
  assert.equal(parseRequest(JSON.stringify({...full,pitch:{...full.pitch,startup:"x".repeat(81)}})),null);
});
test("AI context replays canonically, rejects stale actions/stages and owns immutable copies", () => {
  const r=request(), ctx=buildContext(r)!;
  assert.ok(ctx); assert.equal(ctx.session.revision,0);
  assert.ok(Object.isFrozen(ctx.request.pitch));
  assert.equal(buildContext({...r,binding:{...r.binding,revision:1}}),null);
  assert.equal(buildContext({...r,binding:{...r.binding,investorId:"sofia"}}),null);
  assert.equal(buildContext({...r,binding:{...r.binding,purpose:"outcome"}}),null);
  Object.assign(r.pitch, {pitch:"Changed founder description after context construction."});
  assert.notEqual(ctx.session.pitch.pitch,r.pitch.pitch);
});
