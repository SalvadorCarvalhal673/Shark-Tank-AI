// Contextual scripted voice (Issues #57–#60, #62). Deterministic, rules-based text built from the
// founder's own committed answers and the engine's committed decisions, in each investor's reviewed
// persona. It needs no provider, so it is the voice the founder gets whenever AI is unavailable.
// It only reads: it never calculates terms, changes state or claims that anything was verified.
import { INVESTOR_ORDER, NEGOTIATION_RULES, assessEvidence, type Evidence, type InvestorId } from "../simulation/negotiation/investor-policy.ts";
import { counterCopy, openingCopy, outcomeCopy, signalCopy } from "../simulation/negotiation/presentation.ts";
import type { NegotiationSession } from "../simulation/negotiation/session.ts";
import type { Purpose } from "./contracts.ts";

type Signal = Evidence["signals"][number]["signal"];

/** What each investor asks about a missing signal, in their own voice (persona prompts #44). */
const ASK: Record<Signal, string> = {
  "named-financial-figure": "Which financial measure can you put a figure on — revenue, monthly costs, margin or burn — and for what period?",
  "runway-duration": "How many months of runway do you have at today's spending?",
  "use-of-funds": "What exactly would this investment pay for first?",
  "target-segment": "Who are the very first customers you will sell to?",
  "acquisition-channel": "How will you reach those first customers, concretely?",
  "acquisition-measure": "What have you measured about acquiring customers so far, such as conversion or cost per customer?",
  "customer-observation": "What did customers actually do or ask for when you spoke with them?",
  "delivery-milestone": "What is the next concrete result your team will deliver, and when?",
};
const OPENER: Record<InvestorId, string> = {
  maya: "Let's be precise about the numbers.",
  adrian: "I want to see how this grows.",
  sofia: "Help me see what your team can actually deliver.",
};
const PRAISE: Record<InvestorId, string> = {
  maya: "You named a measurable financial point, which helps.",
  adrian: "You described who buys first and how you reach them.",
  sofia: "You connected what customers did to what you will deliver.",
};

const missing = (evidence: Evidence) => evidence.signals.filter(item => item.status === "missing").map(item => item.signal);

/**
 * One clarification question for the open investor, based on the founder's current draft, which
 * stays on the page. It asks about the first required signal the rules cannot yet detect; if all are
 * present it asks about an optional one; if nothing is missing it says so and asks nothing.
 */
export function clarificationQuestion(session: NegotiationSession, draft: string): { investorId: InvestorId; question: string | null; note: string } | null {
  if (session.stage !== "questions") return null;
  const investorId = INVESTOR_ORDER[session.answers.length];
  const evidence = assessEvidence(investorId, draft, session.answers.map(answer => answer.text));
  if (evidence.repeated) return { investorId, question: "This repeats an earlier answer. What is new for this question?", note: "Your draft repeats an earlier answer, which the rules treat as no new evidence." };
  const gaps = missing(evidence);
  const first = gaps[0];
  if (!first) return { investorId, question: null, note: "Your draft already contains every signal this investor's rules look for. No clarification is needed." };
  return { investorId, question: `${OPENER[investorId]} ${ASK[first]}`, note: `The rules cannot yet find: ${signalCopy[first]}` };
}

/** Persona-specific scripted reply for a committed moment. */
export function scriptedReply(session: NegotiationSession, investorId: InvestorId, purpose: Purpose): { dialogue: string; suggestions: readonly string[] } {
  const name = NEGOTIATION_RULES.investors[investorId].name;
  if (purpose === "question") return { dialogue: `${OPENER[investorId]} ${NEGOTIATION_RULES.investors[investorId].question}`, suggestions: [] };
  if (purpose === "answer-feedback") {
    const answer = session.answers.find(item => item.investor === investorId);
    if (!answer) return { dialogue: `${name} is waiting for your answer.`, suggestions: [] };
    if (answer.evidence.repeated) return { dialogue: `${OPENER[investorId]} That answer repeats an earlier one, so I have nothing new to assess.`, suggestions: ["Give each investor an answer that addresses their own question."] };
    const gaps = missing(answer.evidence);
    const found = answer.evidence.signals.length - gaps.length;
    const dialogue = gaps.length === 0
      ? `${PRAISE[investorId]} I could find everything I look for — though your answer is your own report, not verified fact.`
      : `${found > 0 ? PRAISE[investorId] + " " : ""}${ASK[gaps[0]]}`;
    return { dialogue, suggestions: gaps.map(gap => signalCopy[gap]) };
  }
  if (purpose === "counter-explanation") {
    const counter = session.history.findLast(event => event.kind === "counter" && event.investor === investorId);
    const opening = session.history.find(event => event.kind === "opening" && event.investor === investorId);
    const reason = counter?.kind === "counter" ? counterCopy[counter.reason] : opening?.kind === "opening" ? openingCopy[opening.reason] : "";
    const voice = { maya: "My limits come from the numbers, not from how the pitch feels.", adrian: "I move when the growth case supports it.", sofia: "I stay where I can see the team delivering." }[investorId];
    return { dialogue: `${reason} ${voice}`.trim(), suggestions: [] };
  }
  return { dialogue: session.outcome ? outcomeCopy[session.outcome.kind] : `${name} is still negotiating.`, suggestions: coachingSuggestions(session) };
}

/**
 * Coaching suggestions from the committed session (Issue #62), using the same evidence rubric as the
 * performance scorecard. These are suggestions for the next practice, not facts or grades.
 */
export function coachingSuggestions(session: NegotiationSession): string[] {
  const suggestions: string[] = [];
  for (const answer of session.answers) {
    const gaps = missing(answer.evidence);
    if (answer.evidence.repeated) suggestions.push(`${NEGOTIATION_RULES.investors[answer.investor].name}: answer this question with new information rather than repeating an earlier answer.`);
    else if (gaps.length) suggestions.push(`${NEGOTIATION_RULES.investors[answer.investor].name}: ${signalCopy[gaps[0]]}`);
  }
  const outcome = session.outcome?.kind;
  if (outcome === "accepted-deal" && session.roundsUsed === 0) suggestions.push("You accepted without countering. Next time, try one counter to see how far an investor can move.");
  if (outcome === "all-withdrawn") suggestions.push("Every investor withdrew. Compare each counter with the investor's previous offer before sending the next one.");
  if (outcome === "founder-walk-away" && session.offers.some(offer => offer.status !== "withdrawn")) suggestions.push("You walked away from available offers. That can be right; compare the dilution of each offer before deciding.");
  if (outcome === "no-offers") suggestions.push("No investor made an opening offer. Answer each question with the specific information it asks for.");
  return suggestions.slice(0, 4);
}
