import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PERSONAS } from "../src/features/ai/personas.ts";
import { buildPrompt } from "../src/features/ai/prompts.ts";
import { buildContext } from "../src/features/ai/context.ts";
import { request } from "./fixtures/ai/request.ts";
test("AI personas distinguish questioning, recognition and uncertainty without changing policy", () => {
  assert.equal(new Set(Object.values(PERSONAS).map(p=>p.category)).size,3);
  assert.ok(Object.isFrozen(PERSONAS.maya));
  const prompt=buildPrompt(buildContext(request())!);
  assert.match(prompt.system,/deterministic engine alone/);
  assert.match(prompt.system,/untrusted data/);
  assert.match(prompt.data,/LunchLoop/);
  assert.match(prompt.data,/Revenue/);
});
test("AI fictional dialogues cover all personas and multiple businesses using container LunchLoop", () => {
  const cases=JSON.parse(fs.readFileSync(new URL("./fixtures/ai/businesses.json",import.meta.url),"utf8"));
  assert.equal(cases.length,3);
  for(const c of cases) {
    assert.equal(new Set([c.maya,c.adrian,c.sofia]).size,3);
    for(const id of ["maya","adrian","sofia"]) assert.ok(c[id].length>30);
  }
  assert.match(cases[0].concept,/containers/);
});
