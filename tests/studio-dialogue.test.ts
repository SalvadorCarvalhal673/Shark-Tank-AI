import test from "node:test";
import assert from "node:assert/strict";
import { DIALOGUE_SOURCE, dialogueLines, dialogueStatus, speakerName } from "../src/features/studio/dialogue.ts";
import { demonstrationAnswers, demonstrationPitch } from "../src/features/studio/model.ts";
import { applyFounderAction, startNegotiation, type NegotiationSession } from "../src/features/simulation/negotiation/session.ts";
import { INVESTOR_ORDER, NEGOTIATION_RULES } from "../src/features/simulation/negotiation/investor-policy.ts";
import { counterCopy, openingCopy, outcomeCopy } from "../src/features/simulation/negotiation/presentation.ts";

// Issue #18: the studio transcript names every speaker, shows complete committed text in order, labels
// replies as scripted and never invents a processing state.

const answer = (session: NegotiationSession, turn: number) =>
  applyFounderAction(session, { kind: "answer", sessionId: session.id, expectedRevision: session.revision, turn, text: demonstrationAnswers[turn] });
const opened = () => demonstrationAnswers.reduce((session, _, turn) => answer(session, turn), startNegotiation("dialogue-test", demonstrationPitch)!);

test("before any answer the open question is the only line, spoken by the first investor", () => {
  const session = startNegotiation("dialogue-test", demonstrationPitch)!;
  const lines = dialogueLines(session);
  assert.equal(lines.length, 1);
  assert.equal(lines[0].speaker, INVESTOR_ORDER[0]);
  assert.equal(lines[0].text, NEGOTIATION_RULES.investors[INVESTOR_ORDER[0]].question, "the complete question, not a summary");
  assert.match(dialogueStatus(session), /Waiting for your answer to Maya Chen/);
  assert.match(dialogueStatus(null), /No session yet/);
});

test("answers appear in full, in order, after the question they answer", () => {
  let session = startNegotiation("dialogue-test", demonstrationPitch)!;
  session = answer(session, 0);
  const lines = dialogueLines(session);
  assert.deepEqual(lines.map(line => line.speaker), ["maya", "founder", "adrian"]);
  assert.equal(lines[1].text, demonstrationAnswers[0]);
  assert.equal(lines[2].text, NEGOTIATION_RULES.investors.adrian.question, "the next open question follows");
});

test("opening decisions name the investor, use the committed copy and the exact offer terms", () => {
  const session = opened(), before = JSON.stringify(session);
  const lines = dialogueLines(session);
  assert.equal(JSON.stringify(session), before, "building the transcript never changes the session");
  const openings = lines.filter(line => line.termsLabel === "Opening offer");
  assert.equal(openings.length, session.offers.length);
  for (const line of openings) {
    const offer = session.offers.find(item => item.investor === line.speaker)!;
    assert.deepEqual(line.terms, { amount: offer.amount, equity: offer.equity });
    assert.equal(line.text, openingCopy["required-signals-supplied"]);
  }
  assert.equal(new Set(lines.map(line => line.id)).size, lines.length, "line keys are unique");
  assert.match(dialogueStatus(session), /recorded instantly by the scripted rules at revision 3/);
});

test("a counter shows the founder's exact proposal and the investor's committed reply", () => {
  const session = opened();
  const offer = session.offers.find(item => item.investor === "maya" && item.status === "active")!;
  const proposed = { amount: offer.amount + 1, equity: 2000 };
  const next = applyFounderAction(session, { kind: "counter", sessionId: session.id, expectedRevision: session.revision, offerId: offer.id, terms: proposed });
  const [founder, reply] = dialogueLines(next).slice(-2);
  assert.equal(founder.speaker, "founder");
  assert.deepEqual(founder.terms, proposed);
  assert.equal(reply.speaker, "maya");
  assert.equal(reply.text, counterCopy["above-cash-ceiling"]);
  assert.equal(reply.terms, undefined, "a withdrawal shows no new terms");
  assert.equal(founder.revision, next.revision);
});

test("a stale or repeated action adds no transcript line", () => {
  const session = opened();
  const offer = session.offers.find(item => item.investor === "sofia" && item.status === "active")!;
  const stale = applyFounderAction(session, { kind: "counter", sessionId: session.id, expectedRevision: session.revision - 1, offerId: offer.id, terms: { amount: offer.amount, equity: offer.equity } });
  assert.equal(dialogueLines(stale).length, dialogueLines(session).length);
});

test("the end of the session is announced by the panel and the status stays honest", () => {
  const session = opened();
  const finished = applyFounderAction(session, { kind: "walk-away", sessionId: session.id, expectedRevision: session.revision });
  const last = dialogueLines(finished).at(-1)!;
  assert.equal(last.speaker, "panel");
  assert.equal(last.text, outcomeCopy["founder-walk-away"]);
  assert.match(dialogueStatus(finished), /Session finished/);
  for (const state of [dialogueStatus(null), dialogueStatus(session), dialogueStatus(finished)])
    assert.doesNotMatch(state, /thinking|typing|generating/i, "no simulated waiting");
  assert.match(DIALOGUE_SOURCE, /Scripted/);
  assert.equal(speakerName("founder"), "You · Founder");
  assert.equal(speakerName("adrian"), "Adrian Vale · Growth");
});
