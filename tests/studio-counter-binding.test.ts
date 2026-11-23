import test from "node:test";
import assert from "node:assert/strict";
import { counterBinding, counterSlots } from "../src/features/studio/counter-binding.ts";
import { demonstrationAnswers, demonstrationPitch } from "../src/features/studio/model.ts";
import { advanceRun, createRun, type SessionRun } from "../src/features/simulation/negotiation/session-storage.ts";
import { NEGOTIATION_RULES } from "../src/features/simulation/negotiation/investor-policy.ts";

// Issue #28: the studio shows exactly which offer, session and revision a counter binds to and how the
// three shared counters stand; repeated or stale actions never add a journal entry.

const opened = () => demonstrationAnswers.reduce<SessionRun>((run, text, turn) =>
  advanceRun(run, { kind: "answer", sessionId: run.session.id, expectedRevision: run.session.revision, turn, text }), createRun("binding-test", demonstrationPitch)!);
const counterFor = (run: SessionRun, equityDelta = -1) => {
  const binding = counterBinding(run.session, "maya");
  assert.ok(binding.ready);
  const offer = run.session.offers.find(item => item.id === binding.offerId)!;
  return { kind: "counter", sessionId: binding.sessionId, expectedRevision: binding.expectedRevision, offerId: binding.offerId,
    terms: { amount: offer.amount, equity: run.session.limits.maya!.equityFloor + equityDelta } } as const;
};

test("before negotiation nothing is bound and all counters are left", () => {
  const run = createRun("binding-test", demonstrationPitch)!;
  const binding = counterBinding(run.session, "maya");
  assert.equal(binding.ready, false);
  assert.deepEqual(binding.slots, ["left", "left", "left"]);
  assert.equal(counterSlots(null).length, NEGOTIATION_RULES.counterBudget);
});

test("the binding names the active offer, current revision and the shared round it would use", () => {
  const run = opened();
  const binding = counterBinding(run.session, "maya");
  assert.ok(binding.ready);
  const offer = run.session.offers.find(item => item.investor === "maya" && item.status === "active")!;
  assert.equal(binding.offerId, offer.id);
  assert.equal(binding.expectedRevision, run.session.revision);
  assert.equal(binding.sessionId, run.session.id);
  assert.equal(binding.round, 1);
  assert.deepEqual(binding.slots, ["next", "left", "left"]);
});

test("a repeated or stale counter never duplicates the journal", () => {
  const run = opened();
  const action = counterFor(run);
  const once = advanceRun(run, action);
  assert.equal(once.actions.length, run.actions.length + 1);
  assert.equal(once.session.roundsUsed, 1);
  const twice = advanceRun(once, action);
  assert.equal(twice, once, "the same action again is stale and changes nothing");
  assert.equal(advanceRun(once, { ...action, sessionId: "another-session" }), once, "wrong session is rejected");
  assert.equal(advanceRun(once, { ...action, expectedRevision: once.session.revision }), once, "a superseded offer id is rejected");
  const rebound = counterBinding(once.session, "maya");
  assert.ok(rebound.ready);
  assert.notEqual(rebound.offerId, action.offerId, "the binding follows the revised offer");
  assert.deepEqual(rebound.slots, ["used", "next", "left"]);
});

test("after the shared allowance is used, nothing is bound for any investor", () => {
  let run = opened();
  for (let round = 0; round < NEGOTIATION_RULES.counterBudget; round++) {
    const binding = counterBinding(run.session, "adrian");
    assert.ok(binding.ready, `round ${round + 1}`);
    const offer = run.session.offers.find(item => item.id === binding.offerId)!;
    run = advanceRun(run, { kind: "counter", sessionId: binding.sessionId, expectedRevision: binding.expectedRevision, offerId: binding.offerId,
      terms: { amount: offer.amount, equity: offer.equity } });
  }
  assert.equal(run.session.roundsUsed, NEGOTIATION_RULES.counterBudget);
  for (const investor of ["maya", "adrian", "sofia"] as const) {
    const binding = counterBinding(run.session, investor);
    assert.equal(binding.ready, false);
    assert.deepEqual(binding.slots, ["used", "used", "used"]);
  }
});
