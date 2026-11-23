import test from "node:test";
import assert from "node:assert/strict";
import { activeSpeaker, cameraPresets, demonstrationAnswers, demonstrationPitch } from "../src/features/studio/model.ts";
import { applyFounderAction, startNegotiation, type NegotiationSession } from "../src/features/simulation/negotiation/session.ts";
import { INVESTOR_ORDER } from "../src/features/simulation/negotiation/investor-policy.ts";

// Issue #19: the camera frames the speaker of each newly committed moment. The key changes once per
// moment, so the studio moves the camera once and a manual choice holds until the next moment.

const answer = (session: NegotiationSession, turn: number) =>
  applyFounderAction(session, { kind: "answer", sessionId: session.id, expectedRevision: session.revision, turn, text: demonstrationAnswers[turn] });

test("every speaker has a camera preset", () => {
  assert.deepEqual(activeSpeaker(null), { view: "panel", key: "idle" });
  for (const view of ["panel", ...INVESTOR_ORDER] as const) assert.ok(cameraPresets[view]);
});

test("each question frames the asking investor, and a new question changes the key", () => {
  let session = startNegotiation("speaker-test", demonstrationPitch)!;
  const keys = new Set<string>();
  for (const [turn, investor] of INVESTOR_ORDER.entries()) {
    const before = JSON.stringify(session);
    const speaker = activeSpeaker(session);
    assert.equal(speaker.view, investor);
    assert.equal(JSON.stringify(session), before, "deriving the speaker never changes the session");
    keys.add(speaker.key);
    session = answer(session, turn);
  }
  assert.equal(keys.size, 3);
  assert.equal(activeSpeaker(session).view, "panel", "simultaneous openings frame the whole panel");
});

test("a counter frames the investor who replied; a stale action keeps the same key", () => {
  const session = demonstrationAnswers.reduce((current, _, turn) => answer(current, turn), startNegotiation("speaker-test", demonstrationPitch)!);
  const offer = session.offers.find(item => item.investor === "sofia" && item.status === "active")!;
  const action = { kind: "counter", sessionId: session.id, expectedRevision: session.revision, offerId: offer.id, terms: { amount: offer.amount, equity: offer.equity } } as const;
  const next = applyFounderAction(session, action);
  assert.equal(activeSpeaker(next).view, "sofia");
  assert.notEqual(activeSpeaker(next).key, activeSpeaker(session).key);
  assert.equal(activeSpeaker(applyFounderAction(next, action)).key, activeSpeaker(next).key, "a rejected repeat moves nothing");
  const deal = applyFounderAction(next, { kind: "accept", sessionId: next.id, expectedRevision: next.revision, offerId: next.offers.find(item => item.investor === "adrian" && item.status === "active")!.id });
  assert.equal(activeSpeaker(deal).view, "adrian", "the investor in the accepted deal is framed");
  const walked = applyFounderAction(next, { kind: "walk-away", sessionId: next.id, expectedRevision: next.revision });
  assert.equal(activeSpeaker(walked).view, "panel");
});
