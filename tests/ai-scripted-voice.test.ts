import test from "node:test";
import assert from "node:assert/strict";
import { clarificationQuestion, coachingSuggestions, scriptedReply } from "../src/features/ai/scripted-voice.ts";
import { applyFounderAction, startNegotiation, type NegotiationSession } from "../src/features/simulation/negotiation/session.ts";
import { INVESTOR_ORDER } from "../src/features/simulation/negotiation/investor-policy.ts";
import { counterCopy, outcomeCopy, signalCopy } from "../src/features/simulation/negotiation/presentation.ts";
import { demonstrationAnswers, demonstrationPitch } from "../src/features/studio/model.ts";

// Issues #57–#60 and #62 without a provider: contextual, persona-specific scripted text derived only
// from the founder's own words and committed engine decisions. It never changes the session.

const start = () => startNegotiation("scripted-voice", demonstrationPitch)!;
const answer = (session: NegotiationSession, text: string) =>
  applyFounderAction(session, { kind: "answer", sessionId: session.id, expectedRevision: session.revision, turn: session.answers.length, text });

test("#57/#60: the clarification question targets what the founder's draft is missing", () => {
  const session = start();
  const vague = clarificationQuestion(session, "We help campus cafes reduce waste.")!;
  assert.equal(vague.investorId, "maya");
  assert.match(vague.question!, /financial measure/);
  assert.equal(vague.note, "The rules cannot yet find: " + signalCopy["named-financial-figure"]);
  const partial = clarificationQuestion(session, "Revenue: €9000 per month")!;
  assert.match(partial.question!, /runway/i, "asks about the next missing signal, not the one already supplied");
  const complete = clarificationQuestion(session, demonstrationAnswers[0])!;
  assert.equal(complete.question, null, "no clarification is invented when nothing is missing");
  const second = answer(session, demonstrationAnswers[0]);
  const repeated = clarificationQuestion(second, demonstrationAnswers[0])!;
  assert.equal(repeated.investorId, "adrian");
  assert.match(repeated.question!, /repeats an earlier answer/);
  for (const result of [vague, partial, repeated]) assert.ok(result.question!.length <= 240, "fits the approved clarification bound");
  const before = JSON.stringify(session);
  clarificationQuestion(session, "anything");
  assert.equal(JSON.stringify(session), before);
});

test("#58/#59: feedback follows each investor's persona and the committed evidence", () => {
  let session = start();
  for (const text of demonstrationAnswers) session = answer(session, text);
  const replies = INVESTOR_ORDER.map(id => scriptedReply(session, id, "answer-feedback").dialogue);
  assert.equal(new Set(replies).size, 3, "each investor speaks differently");
  for (const reply of replies) assert.match(reply, /not verified fact/, "complete answers are acknowledged without claiming verification");
  let weak = start();
  weak = answer(weak, "We are excited about our product and the market.");
  const feedback = scriptedReply(weak, "maya", "answer-feedback");
  assert.match(feedback.dialogue, /financial measure/);
  assert.ok(feedback.suggestions.includes(signalCopy["named-financial-figure"]));
});

test("#61/#63: counter and outcome text restate committed engine reasons only", () => {
  let session = start();
  for (const text of demonstrationAnswers) session = answer(session, text);
  const offer = session.offers.find(item => item.investor === "adrian" && item.status === "active")!;
  session = applyFounderAction(session, { kind: "counter", sessionId: session.id, expectedRevision: session.revision, offerId: offer.id, terms: { amount: offer.amount, equity: offer.equity } });
  assert.ok(scriptedReply(session, "adrian", "counter-explanation").dialogue.startsWith(counterCopy["within-limits"]));
  const finished = applyFounderAction(session, { kind: "walk-away", sessionId: session.id, expectedRevision: session.revision });
  assert.equal(scriptedReply(finished, "adrian", "outcome").dialogue, outcomeCopy["founder-walk-away"]);
});

test("#62: coaching suggestions come from the scorecard evidence and outcome, never grades", () => {
  let session = start();
  session = answer(session, "We are excited about our product and the market.");
  session = answer(session, "We are excited about our product and the market.");
  session = answer(session, "Customers like it and we will keep working on it.");
  assert.equal(session.outcome?.kind, "no-offers");
  const suggestions = coachingSuggestions(session);
  assert.ok(suggestions.length >= 3 && suggestions.length <= 4);
  assert.ok(suggestions.some(item => /repeating an earlier answer/.test(item)));
  assert.ok(suggestions.some(item => /No investor made an opening offer/.test(item)));
  for (const item of suggestions) assert.doesNotMatch(item, /score|grade|\/10|viable|will succeed|verified/i);
});
