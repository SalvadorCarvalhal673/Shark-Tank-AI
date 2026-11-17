import assert from "node:assert/strict";
import test from "node:test";
import {
  assessEvidence, INVESTOR_ORDER, NEGOTIATION_RULES, type InvestorId,
} from "../src/features/simulation/negotiation/investor-policy.ts";
import {
  applyFounderAction, startNegotiation, type FounderAction, type NegotiationSession,
} from "../src/features/simulation/negotiation/session.ts";
import type { Pitch } from "../src/features/simulation/pitch.ts";

const pitch: Pitch = {
  startup: "Atlas Energy",
  pitch: "We sell energy monitoring subscriptions to local retail shops.",
  currency: "EUR", amount: 10_000_000, equity: 1000,
};
const qualifying = [
  "Revenue: €9,000.50; Runway: 8 months; Use of funds: install monitoring hardware",
  "Target segment: local retail shops; Acquisition channel: regional hardware distributors",
  "Customer evidence: buyers requested weekly reporting; Milestone: deliver automated dashboards",
];
const missing = "I cannot provide those details today.";

type WithoutEnvelope<Action> = Action extends FounderAction ? Omit<Action, "sessionId" | "expectedRevision"> : never;
type Intent = WithoutEnvelope<FounderAction>;

function create(id = "run-1", input: unknown = pitch) {
  const session = startNegotiation(id, input);
  assert.ok(session);
  return session;
}

function envelope(session: NegotiationSession, intent: Intent): FounderAction {
  return { ...intent, sessionId: session.id, expectedRevision: session.revision };
}

function apply(session: NegotiationSession, intent: Intent) {
  return applyFounderAction(session, envelope(session, intent));
}

function open(mask = 7, initial = create(), measured = false) {
  return qualifying.reduce((session, text, turn) => apply(session, {
    kind: "answer", turn, text: mask & (1 << turn)
      ? (turn === 1 && measured ? text + "; Conversion rate: 5%" : text)
      : missing,
  }), initial);
}

function active(session: NegotiationSession, investor: InvestorId) {
  const offer = session.offers.find((offer) => offer.investor === investor && offer.status === "active");
  assert.ok(offer);
  return offer;
}

function counter(session: NegotiationSession, investor: InvestorId, amount: number, equity: number) {
  return apply(session, { kind: "counter", offerId: active(session, investor).id, terms: { amount, equity } });
}

function lastCounter(session: NegotiationSession) {
  const record = session.history.findLast((entry) => entry.kind === "counter");
  assert.ok(record);
  return record;
}

function assertInvariants(session: NegotiationSession) {
  const allIds = session.offers.map(({ id }) => id);
  assert.equal(new Set(allIds).size, allIds.length);
  const activeOffers = session.offers.filter(({ status }) => status === "active");
  assert.ok(activeOffers.length <= INVESTOR_ORDER.length);
  assert.equal(new Set(activeOffers.map(({ investor }) => investor)).size, activeOffers.length);
  const accepted = session.offers.filter(({ status }) => status === "accepted");
  assert.ok(accepted.length <= 1);
  if (session.outcome?.kind === "accepted-deal") assert.equal(accepted[0]?.id, session.outcome.offerId);
  else assert.equal(accepted.length, 0);
  assert.equal(session.stage === "finished", session.outcome !== null);
  if (session.stage === "finished") assert.equal(activeOffers.length, 0);
  if (session.stage === "final-offers") assert.equal(session.roundsUsed, NEGOTIATION_RULES.counterBudget);
  if (session.stage === "negotiation") assert.ok(session.roundsUsed < NEGOTIATION_RULES.counterBudget);
  assert.equal(session.history.filter(({ kind }) => kind === "counter").length, session.roundsUsed);
  assert.ok(session.roundsUsed <= NEGOTIATION_RULES.counterBudget);
  assert.deepEqual([...new Set(session.history.map(({ revision }) => revision))],
    Array.from({ length: session.revision }, (_, index) => index + 1));
  for (const offer of activeOffers) assert.ok(offer.equity >= session.limits[offer.investor]!.equityFloor);
}

test("initialization validates runtime inputs and copies only declared fields", () => {
  assert.equal(create().pitch.founderOwnershipBps, 10_000);
  for (const ownership of [0, 10_000]) assert.equal(create("ownership", { ...pitch, founderOwnershipBps: ownership }).pitch.founderOwnershipBps, ownership);
  for (const value of [null, -1, 10_001, "100", Infinity, 0.1]) {
    assert.equal(startNegotiation("run-1", { ...pitch, founderOwnershipBps: value }), null);
  }
  for (const input of [null, {}, { ...pitch, currency: "USD?" }, { ...pitch, equity: 0 }, { ...pitch, amount: 10 ** 11 }]) {
    assert.equal(startNegotiation("run-1", input), null);
  }
  for (const id of [null, "", "run:1", "x".repeat(81)]) assert.equal(startNegotiation(id, pitch), null);
  const incoming = { ...pitch, startup: " Atlas Energy ", ignored: true };
  const session = create("run-1", incoming);
  incoming.amount = 1;
  assert.deepEqual(session.pitch, { ...pitch, founderOwnershipBps: 10_000 });
  assert.equal(session.rulesVersion, 1);
});

for (let mask = 0; mask < 8; mask++) {
  test(`participation mask ${mask} and every available acceptance`, () => {
    const session = open(mask);
    assert.equal(session.revision, 3);
    assert.deepEqual(session.offers.map(({ investor }) => investor),
      INVESTOR_ORDER.filter((_, index) => mask & (1 << index)));
    assertInvariants(session);
    if (!mask) {
      assert.deepEqual(session.outcome, { kind: "no-offers" });
      return;
    }
    for (const offer of session.offers) {
      const finished = apply(session, { kind: "accept", offerId: offer.id });
      assert.deepEqual(finished.outcome, { kind: "accepted-deal", offerId: offer.id });
      assert.equal(finished.revision, 4);
      assert.equal(apply(finished, { kind: "accept", offerId: offer.id }), finished);
      assertInvariants(finished);
    }
    assert.deepEqual(apply(session, { kind: "walk-away" }).outcome, { kind: "founder-walk-away" });
  });
}

test("evidence reports observed descriptions and figures without claiming quality", () => {
  for (const [index, investor] of INVESTOR_ORDER.entries()) {
    const result = assessEvidence(investor, qualifying[index], []);
    assert.equal(result.quality, "not-independently-verified");
    assert.equal(result.repeated, false);
    assert.ok(result.signals.filter(({ status }) => status === "supplied").length >= (index === 0 ? 3 : 2));
  }
  for (const [investor, text] of [
    ["maya", "Revenue: 12,3,4 this year"],
    ["maya", "Revenue: 2025-04-17"],
    ["maya", "Revenue: 1/2 this year"],
    ["maya", "We met 2026. Revenue revenue runway runway."],
    ["maya", "No revenue: 9000; runway: 8 months is unknown"],
    ["adrian", "Target segment: target segment segment; Acquisition channel: channel channel"],
    ["adrian", "Target segment: local retail shops; no acquisition channel: regional distributors"],
    ["sofia", "Customer evidence: customer customer evidence; Milestone: milestone milestone"],
    ["sofia", "No Customer evidence: buyers requested reporting; Milestone: deploy weekly dashboards"],
  ] as const) {
    const evidence = assessEvidence(investor, text, []);
    assert.ok(evidence.signals.some(({ status }) => status === "missing"));
    const answers = [...qualifying];
    answers[INVESTOR_ORDER.indexOf(investor)] = text;
    const session = answers.reduce((current, answer, turn) => apply(current, { kind: "answer", turn, text: answer }), create());
    assert.ok(session.offers.every((offer) => offer.investor !== investor));
  }

  const combined = qualifying.join("; ");
  const repeated = [combined, combined.toUpperCase().replaceAll(" ", "  "), combined]
    .reduce((current, text, turn) => apply(current, { kind: "answer", text, turn }), create());
  assert.deepEqual(repeated.offers.map(({ investor }) => investor), ["maya"]);
  assert.ok(repeated.answers.slice(1).every(({ evidence }) => evidence.repeated &&
    evidence.signals.every(({ status }) => status === "missing")));
  for (const text of ["We hired 500 people", "No conversion rate: 5%", "CAC unknown: 30"]) {
    const evidence = assessEvidence("adrian", qualifying[1] + "; " + text, []);
    assert.equal(evidence.signals.find(({ signal }) => signal === "acquisition-measure")?.status, "missing");
  }
});

const policies = [
  { investor: "maya", amount: 10_000_000, equity: 1300, floor: 1100, band: 300 },
  { investor: "adrian", amount: 9_000_000, equity: 1500, floor: 1200, band: 400 },
  { investor: "sofia", amount: 8_000_000, equity: 1200, floor: 1100, band: 200 },
] as const;

for (const { investor, amount, equity, floor, band } of policies) {
  test(`${investor} cash and equity thresholds are inclusive at the approved boundaries`, () => {
    const session = open();
    const opening = active(session, investor);
    assert.equal(opening.amount, amount);
    assert.equal(opening.equity, equity);
    assert.deepEqual(session.limits[investor], { cashCeiling: amount, equityFloor: floor, withdrawalBandBps: band });
    const agreement = counter(session, investor, amount, floor);
    assert.equal(lastCounter(agreement).decision, "agree");
    assert.deepEqual(agreement.outcome, null);
    assert.equal(active(agreement, investor).equity, floor);
    const revised = counter(session, investor, amount - 1, floor - band);
    assert.equal(lastCounter(revised).decision, "revise");
    assert.equal(active(revised, investor).amount, amount - 1);
    assert.equal(active(revised, investor).equity, equity - 100);
    assert.equal(lastCounter(counter(session, investor, amount, floor - band - 1)).reason, "below-withdrawal-band");
    assert.equal(lastCounter(counter(session, investor, amount + 1, floor)).reason, "above-cash-ceiling");
    assert.equal(lastCounter(counter(session, investor, amount, floor - 1)).decision, "revise");

    const noChangeAgreement = counter(session, investor, amount, equity);
    assert.equal(lastCounter(noChangeAgreement).decision, "agree");
    assert.equal(active(noChangeAgreement, investor).id, opening.id);
    assert.equal(noChangeAgreement.roundsUsed, 1);
    for (const result of [agreement, revised, noChangeAgreement]) {
      assert.equal(result.revision, 4);
      assertInvariants(result);
    }
  });
}

test("Adrian stretches on measured cash only when agreeing to in-range equity", () => {
  const measured = open(7, create(), true);
  const opening = active(measured, "adrian");
  assert.equal(opening.amount, 9_000_000);
  assert.equal(measured.limits.adrian?.cashCeiling, 10_000_000);
  const revised = counter(measured, "adrian", 10_000_000, 1199);
  assert.equal(lastCounter(revised).decision, "revise");
  assert.equal(active(revised, "adrian").amount, 9_000_000);
  const agreed = counter(revised, "adrian", 10_000_000, 1200);
  assert.equal(lastCounter(agreed).decision, "agree");
  assert.equal(active(agreed, "adrian").amount, 10_000_000);
  assert.equal(lastCounter(counter(measured, "adrian", 10_000_001, 1200)).decision, "withdraw");
});

test("small investments and 100% equity open with valid rounded terms and fixed floors", () => {
  for (const currency of ["EUR", "USD", "GBP"] as const) {
    const session = open(7, create("small", { ...pitch, amount: 1, equity: 10_000, currency }));
    assert.equal(session.pitch.currency, currency);
    for (const offer of session.offers) {
      assert.equal(offer.amount, 1);
      assert.equal(offer.equity, 10_000);
      assert.equal(session.limits[offer.investor]?.cashCeiling, 1);
      assert.equal(session.limits[offer.investor]?.equityFloor,
        10_000 - NEGOTIATION_RULES.investors[offer.investor].concessionBps);
    }
  }
});

test("successive same-investor concessions keep the original floor and exhaust rounds", () => {
  let session = open();
  const ids = [active(session, "maya").id];
  const limits = session.limits.maya;
  for (const expectedEquity of [1200, 1100, 1100]) {
    session = counter(session, "maya", 10_000_000, 1000);
    const offer = active(session, "maya");
    assert.equal(offer.equity, expectedEquity);
    assert.equal(session.limits.maya, limits);
    assertInvariants(session);
    ids.push(offer.id);
  }
  assert.equal(new Set(ids).size, 3);
  assert.equal(ids[2], ids[3]);
  assert.equal(lastCounter(session).decision, "unchanged");
  assert.equal(session.stage, "final-offers");
  assert.equal(counter(session, "maya", 10_000_000, 1100), session);
  assert.equal(apply(session, { kind: "accept", offerId: ids[1] }), session);
  const finished = apply(session, { kind: "accept", offerId: ids[3] });
  assert.deepEqual(finished.outcome, { kind: "accepted-deal", offerId: ids[3] });
  assertInvariants(finished);
});

test("competing counters leave other offers intact, and withdrawal exhausts the last offer", () => {
  const initial = open();
  const adrian = active(initial, "adrian");
  const sofia = active(initial, "sofia");
  const first = counter(initial, "maya", 10_000_001, 1100);
  assert.equal(active(first, "adrian"), adrian);
  assert.equal(active(first, "sofia"), sofia);
  assert.equal(apply(first, { kind: "accept", offerId: active(initial, "maya").id }), first);
  const second = counter(first, "adrian", 9_000_001, 1200);
  const third = counter(second, "sofia", 8_000_001, 1100);
  assert.equal(third.roundsUsed, 3);
  assert.deepEqual(third.outcome, { kind: "all-withdrawn" });
  assertInvariants(third);
  const onlyMaya = open(1);
  assert.deepEqual(counter(onlyMaya, "maya", 10_000_001, 1100).outcome, { kind: "all-withdrawn" });

  const mixed = counter(counter(counter(initial, "maya", 10_000_000, 1100),
    "adrian", 9_000_001, 1200), "sofia", 7_900_000, 1050);
  assert.equal(mixed.stage, "final-offers");
  assert.equal(active(mixed, "sofia").amount, 7_900_000);
  assert.deepEqual(apply(mixed, { kind: "walk-away" }).outcome, { kind: "founder-walk-away" });
  assertInvariants(mixed);
});

test("stale, malformed and old-session actions preserve reference, revision, history and budget", () => {
  const initial = create();
  const action = envelope(initial, { kind: "answer", turn: 0, text: qualifying[0] });
  const answered = applyFounderAction(initial, action);
  const newSession = create("run-2");
  assert.equal(applyFounderAction(answered, action), answered);
  assert.equal(applyFounderAction(newSession, action), newSession);
  assert.equal(apply(initial, { kind: "answer", turn: 1, text: qualifying[0] }), initial);
  for (const text of [" ".repeat(30), "x".repeat(9), "x".repeat(1501)]) {
    assert.equal(apply(initial, { kind: "answer", turn: 0, text }), initial);
  }
  assert.equal(apply(initial, { kind: "walk-away" }), initial);
  const session = open();
  const maya = active(session, "maya");
  const request = envelope(session, { kind: "counter", offerId: maya.id, terms: { amount: maya.amount, equity: 1100 } });
  const competing = envelope(session, { kind: "accept", offerId: active(session, "adrian").id });
  const revised = applyFounderAction(session, request);
  assert.equal(applyFounderAction(revised, competing), revised);
  assert.equal(applyFounderAction(revised, request), revised);
  assert.equal(apply(revised, { kind: "accept", offerId: maya.id }), revised);
  for (const input of [null, [], "accept", { ...request, terms: { amount: Infinity, equity: 1 } },
    { ...request, terms: { amount: 1, equity: 0 } }, { ...request, expectedRevision: -1 },
    { ...request, kind: "unknown" }]) {
    assert.equal(applyFounderAction(session, input), session);
  }
});

test("counter history and offers contain only explicit fields and copy submitted terms", () => {
  const session = open();
  const offer = active(session, "maya");
  for (const amount of [offer.amount, offer.amount + 1]) {
    const contaminated = { ...pitch, amount, equity: 1100, status: "accepted", revision: 99, investor: "other" };
    const result = applyFounderAction(session, {
      ...envelope(session, { kind: "counter", offerId: offer.id, terms: contaminated }),
      rollback: true, outcome: "accepted",
    });
    contaminated.amount = 1;
    const event = lastCounter(result);
    assert.deepEqual(event.proposed, { amount, equity: 1100 });
    assert.deepEqual(Object.keys(event).sort(), [
      "decision", "investor", "kind", "previousOfferId", "proposed", "reason", "resultingOfferId", "revision", "round",
    ]);
    for (const item of result.offers) {
      assert.deepEqual(Object.keys(item).sort(), ["amount", "equity", "id", "investor", "status"]);
    }
  }
});

test("seeded sequences preserve invariants and reproduce identical sessions", () => {
  let seed = 3219876;
  function next(limit: number) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return Math.floor(seed / 2 ** 32 * limit);
  }

  for (let attempt = 0; attempt < 400; attempt++) {
    const id = `generated-${attempt}`;
    let session = create(id);
    const replay: FounderAction[] = [];
    for (let step = 0; step < 12; step++) {
      const activeOffers = session.offers.filter(({ status }) => status === "active");
      const offer = activeOffers[next(activeOffers.length)];
      const choice = next(10);
      let intent: Intent;
      if (session.stage === "questions") {
        const turn = session.answers.length;
        intent = { kind: "answer", turn, text: next(3) ? qualifying[turn] : missing };
      } else if (offer && choice < 7) {
        const equity = session.limits[offer.investor]!.equityFloor - next(500);
        intent = { kind: "counter", offerId: offer.id, terms: { amount: offer.amount + next(3) - 1, equity } };
      } else if (offer && choice < 9) {
        intent = { kind: "accept", offerId: offer.id };
      } else {
        intent = { kind: "walk-away" };
      }
      const valid = envelope(session, intent);
      const action = next(5) ? valid : { ...valid, expectedRevision: valid.expectedRevision - 1 };
      const previous = session;
      const snapshot = structuredClone(previous);
      session = applyFounderAction(previous, action);
      replay.push(action);
      assert.deepEqual(previous, snapshot);
      assert.equal(session.revision, previous.revision + (previous === session ? 0 : 1));
      if (session !== previous) assert.equal(applyFounderAction(session, action), session);
      assertInvariants(session);
    }
    assert.deepEqual(replay.reduce(applyFounderAction, create(id)), session);
  }
});


test("negotiation snapshots and registered rules prevent cross-revision mutation", () => {
  const original = open();
  const before = structuredClone(original);
  const revised = counter(original, "maya", 10_000_000, 1100);
  assert.equal(active(original, "adrian"), active(revised, "adrian"));
  assert.equal(Reflect.set(active(revised, "adrian"), "amount", 0), false);
  assert.equal(Reflect.set(revised.pitch, "founderOwnershipBps", 0), false);
  assert.equal(Reflect.set(revised.limits.maya!, "equityFloor", 1), false);
  assert.equal(Reflect.set(revised.answers[0].evidence.signals[0], "status", "missing"), false);
  assert.equal(Reflect.set(lastCounter(revised).proposed, "equity", 0), false);
  assert.equal(Reflect.set(revised.history, "0", {}), false);
  assert.equal(Reflect.set(NEGOTIATION_RULES, "counterBudget", 0), false);
  assert.equal(Reflect.set(NEGOTIATION_RULES.investors.maya, "concessionBps", 9999), false);
  assert.equal(Reflect.set(INVESTOR_ORDER, "0", "sofia"), false);
  assert.deepEqual(original, before);

  const ended = apply(revised, { kind: "accept", offerId: active(revised, "maya").id });
  assert.equal(Reflect.set(ended.outcome!, "offerId", "other"), false);
  assert.equal(ended.history.at(-1)?.kind, "finished");
  assertInvariants(ended);
});

test("initialization and dispatch validate the same values that enter the state", () => {
  let pitchReads = 0;
  const initial = create("accessor", { ...pitch, get amount() { return ++pitchReads === 1 ? pitch.amount : -1; } });
  assert.equal(pitchReads, 1);
  assert.equal(initial.pitch.amount, pitch.amount);

  const session = open(7, initial);
  const offer = active(session, "maya");
  let envelopeReads = 0;
  let termsReads = 0;
  const terms = { get amount() { return ++termsReads === 1 ? offer.amount : -1; }, equity: 1100 };
  const action = {
    ...envelope(session, { kind: "counter", offerId: offer.id, terms }),
    get terms() { return ++envelopeReads === 1 ? terms : { amount: -1, equity: 1100 }; },
  };
  const next = applyFounderAction(session, action);
  assert.equal(envelopeReads, 1);
  assert.equal(termsReads, 1);
  assert.equal(active(next, "maya").amount, offer.amount);
  assert.deepEqual(lastCounter(next).proposed, { amount: offer.amount, equity: 1100 });
});
