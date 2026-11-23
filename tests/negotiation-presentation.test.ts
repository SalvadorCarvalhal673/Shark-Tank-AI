import assert from "node:assert/strict";
import test from "node:test";
import { readFounderOwnership, readTerms } from "../src/features/simulation/pitch.ts";
import { acceptanceAction, counterCopy, pendingForSession, type PendingOffer } from "../src/features/simulation/negotiation/presentation.ts";
import { applyFounderAction, startNegotiation, type NegotiationSession } from "../src/features/simulation/negotiation/session.ts";

function opened(id = "test") {
  let state = startNegotiation(id, { startup: "Atlas", pitch: "An energy monitoring service for local shops.", currency: "EUR", amount: 10000000, equity: 1000 });
  assert.ok(state);
  for (const [turn, text] of [
    "Revenue: 9000",
    "Target segment: local shop owners; Acquisition channel: local retail distributors",
    "Customer evidence: owners requested monitoring; Milestone: deliver daily dashboards",
  ].entries()) state = applyFounderAction(state, { kind: "answer", sessionId: state.id, expectedRevision: state.revision, turn, text });
  return state;
}

test("ownership defaults only for a genuine blank and terms retain exact integer values", () => {
  for (const [raw, bps] of [["", 10000], ["0", 0], [".5", 50], ["62.25", 6225], ["100", 10000]] as const) {
    assert.equal(readFounderOwnership(raw, false), bps);
  }
  for (const raw of [" ", "1e2", "100.01", "-1", "abc", "0.001"]) assert.equal(typeof readFounderOwnership(raw, false), "string");
  assert.equal(typeof readFounderOwnership("", true), "string");
  const form = new FormData();
  form.set("amount", "100.17");
  form.set("equity", ".5");
  assert.deepEqual(readTerms(form), { amount: 10017, equity: 50 });
});

test("confirmations bind to the exact rendered session revision and offer", () => {
  const session = opened();
  const offer = session.offers[0];
  const pending: PendingOffer = { kind: "confirm", sessionId: session.id, expectedRevision: session.revision, offerId: offer.id };
  assert.equal(pendingForSession(session, pending), pending);
  const action = acceptanceAction(session, pending);
  assert.ok(action);
  const changed = applyFounderAction(session, {
    kind: "counter", sessionId: session.id, expectedRevision: session.revision,
    offerId: session.offers[1].id, terms: { amount: 9000000, equity: 1200 },
  });
  assert.equal(pendingForSession(changed, pending), null);
  assert.equal(acceptanceAction(changed, pending), null);
  assert.equal(applyFounderAction(changed, action), changed);
  assert.equal(pendingForSession(opened("restart"), pending), null);
  const accepted = applyFounderAction(session, action);
  assert.equal(applyFounderAction(accepted, action), accepted);
  assert.equal(accepted.offers.filter(({ status }) => status === "accepted").length, 1);
  assert.equal(pendingForSession(accepted, pending), null);
});

test("counter feedback maps every decision and final offers invalidate counter drafts", () => {
  assert.deepEqual(Object.keys(counterCopy).sort(), [
    "above-cash-ceiling", "at-concession-limit", "below-withdrawal-band", "limited-concession", "within-limits",
  ]);
  let session: NegotiationSession = opened();
  const first = session.offers[0];
  const pending: PendingOffer = { kind: "counter", sessionId: session.id, expectedRevision: session.revision, offerId: first.id };
  for (let i = 0; i < 3; i++) {
    const current = session.offers.find(({ investor, status }) => investor === "maya" && status === "active")!;
    session = applyFounderAction(session, { kind: "counter", sessionId: session.id, expectedRevision: session.revision, offerId: current.id, terms: { amount: current.amount, equity: 1000 } });
  }
  assert.equal(session.stage, "final-offers");
  assert.equal(pendingForSession(session, pending), null);
  assert.equal(pendingForSession(session, { ...pending, expectedRevision: session.revision, offerId: session.offers.at(-1)!.id }), null);
});
