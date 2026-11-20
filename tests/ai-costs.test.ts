import test from "node:test";
import assert from "node:assert/strict";
import { estimateCostNano } from "../src/features/ai/costs.ts";
test("AI episode costs reproduce dated uncached input/output assumptions exactly", () => {
  assert.equal(estimateCostNano(30000, 8000, "gpt-6.2-sol"), 140000000n);
  assert.equal(estimateCostNano(30000, 8000, "gpt-6-luna"), 7000000n);
  assert.equal(estimateCostNano(30000, 8000, "gemini-3.8-flash"), 52500000n);
  assert.equal(estimateCostNano(80000, 20000, "gpt-6.2-sol"), 360000000n);
});
test("AI costs reject unsafe, negative, fractional and unknown input", () => {
  for (const n of [-1, NaN, Infinity, .5, Number.MAX_SAFE_INTEGER + 1])
    assert.throws(() => estimateCostNano(n, 1, "gpt-6.2-sol"));
  assert.equal(estimateCostNano(0,0,"gpt-6-luna"),0n);
});
