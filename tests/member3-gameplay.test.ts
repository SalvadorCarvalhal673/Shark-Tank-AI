import assert from "node:assert/strict";
import test from "node:test";
import { readFounderOwnership, readPitch } from "../src/features/simulation/pitch.ts";
import { pitchExamples } from "../src/features/simulation/pitch-examples.ts";
import { demoScenarios } from "../src/features/studio/model.ts";

test("both fictional LunchLoop examples pass the existing exact pitch parsers", () => {
  assert.equal(pitchExamples.length, 2);
  const parsed = pitchExamples.map(({ pitch }) => {
    const data = new FormData();
    data.set("startup", pitch.startup);
    data.set("pitch", pitch.pitch);
    data.set("currency", pitch.currency);
    data.set("amount", String(pitch.amount / 100));
    data.set("equity", String(pitch.equity / 100));
    const terms = readPitch(data);
    assert.ok(typeof terms !== "string");
    const ownership = readFounderOwnership(String(pitch.founderOwnershipBps / 100), false);
    assert.ok(typeof ownership === "number");
    return { terms, ownership };
  });
  assert.deepEqual(parsed.map(({ terms, ownership }) => [terms.amount, terms.equity, ownership]), [
    [10_000_000, 1000, 6000],
    [10_000_000, 2000, 8000],
  ]);
});

test("studio quick-start keeps the two existing fictional LunchLoop cases distinct", () => {
  assert.equal(demoScenarios.length, 2);
  assert.deepEqual(demoScenarios.map(({ pitch }) => [pitch.amount, pitch.equity, pitch.founderOwnershipBps]), [
    [10_000_000, 2000, 8000],
    [10_000_000, 1000, 6000],
  ]);
  assert.ok(demoScenarios.every(({ answers }) => answers.length === 3));
});
