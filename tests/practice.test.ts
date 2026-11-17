import assert from "node:assert/strict";
import test from "node:test";
import { answerQuestion, assessment, counterOffer, finishPractice, postMoneyValue, startPractice } from "../src/features/simulation/practice.ts";
import { readPitch, type Pitch } from "../src/features/simulation/pitch.ts";

const pitch: Pitch = {
  startup: "Atlas Energy",
  pitch: "We help small shops cut their energy costs with a monthly monitoring service.",
  amount: 10_000_000,
  equity: 1000,
  currency: "EUR",
};

function initialSession() {
  const session = startPractice(pitch);
  assert.ok(session);
  return session;
}

function negotiation() {
  return [
    "Revenue is 9000 each month and the investment funds another four months.",
    "Independent stores buy through local partners that already run their retail operations.",
    "Five shop owners completed our pilot and requested weekly energy reports for staff.",
  ].reduce(answerQuestion, initialSession());
}

test("pitch input converts decimal amounts and rejects invalid equity", () => {
  const form = new FormData();
  for (const [name, value] of Object.entries({ ...pitch, amount: "100.17", equity: "7.25" })) form.set(name, String(value));
  assert.deepEqual(readPitch(form), { ...pitch, amount: 10017, equity: 725 });
  form.set("equity", "100.01");
  assert.equal(typeof readPitch(form), "string");
});

test("a complete pitch can end in one deal after a counteroffer", () => {
  const session = negotiation();
  const offer = session.offers[0];
  const next = counterOffer(session, offer.id, { amount: 10_000_000, equity: 1200 });
  assert.equal(next.offers[0].status, "superseded");
  assert.equal(finishPractice(next, offer.id), next);
  const finished = finishPractice(next, "counter-0");
  assert.equal(finished.stage, "finished");
  assert.equal(finished.offers.filter((item) => item.status === "accepted").length, 1);
  assert.equal(finished.offers.filter((item) => item.status === "active").length, 0);
  assert.equal(assessment(finished).at(-1)?.result, "Deal accepted");
});

test("short answers can produce a no-deal assessment", () => {
  const finished = ["Not sure yet", "Not sure yet", "Not sure yet"].reduce(answerQuestion, initialSession());
  assert.equal(finished.stage, "finished");
  assert.equal(finished.offers.length, 0);
  assert.equal(assessment(finished).at(-1)?.result, "No deal");
});

test("reject invalid transitions and terms and withdraw on a declined counter", () => {
  const initial = initialSession();
  assert.equal(finishPractice(initial), initial);
  const session = negotiation();
  const offer = session.offers[0];
  assert.equal(counterOffer(session, offer.id, { amount: 3, equity: 0 }), session);
  assert.equal(answerQuestion(session, "An answer after the questions have ended", 3), session);
  const countered = counterOffer(session, offer.id, { amount: 20_000_000, equity: 1000 });
  assert.equal(countered.offers[0].status, "withdrawn");
  assert.equal(finishPractice(countered, offer.id), countered);
  assert.equal(finishPractice(countered).stage, "finished");
});

test("post-money valuation divides investment by equity fraction", () => {
  assert.equal(postMoneyValue(pitch), 100_000_000);
});
