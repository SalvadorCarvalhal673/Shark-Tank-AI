// Studio dialogue projection (Issue #18): turns the committed session into the transcript the
// studio shows (named speaker, complete text, scripted label). Pure: it reads the session and never
// changes it, so the transcript can only show what the engine already recorded.
import type { Terms } from "../simulation/pitch.ts";
import { INVESTOR_ORDER, NEGOTIATION_RULES, type InvestorId } from "../simulation/negotiation/investor-policy.ts";
import { counterCopy, openingCopy, outcomeCopy, specialties } from "../simulation/negotiation/presentation.ts";
import type { NegotiationSession } from "../simulation/negotiation/session.ts";

export type Speaker = InvestorId | "founder" | "panel";

export type DialogueLine = {
  /** Stable key: session id + position in the committed journal. */
  readonly id: string;
  /** Session revision at which this line was committed (0 for the first question). */
  readonly revision: number;
  readonly speaker: Speaker;
  readonly text: string;
  /** Terms named in the line, formatted by the view with the shared money/percent helpers. */
  readonly terms?: Readonly<Terms>;
  readonly termsLabel?: string;
};

export const speakerName = (speaker: Speaker) =>
  speaker === "founder" ? "You · Founder" : speaker === "panel" ? "The panel" : `${NEGOTIATION_RULES.investors[speaker].name} · ${specialties[speaker]}`;

/**
 * DECISION: every line is labelled "Scripted". Responses come from the deterministic rules, not a
 * live model, so the studio never implies an AI is thinking or typing (AGENTS.md: honest fallback).
 */
export const DIALOGUE_SOURCE = "Scripted · rules-based replies, no live AI";

/** The complete committed transcript, oldest first. */
export function dialogueLines(session: NegotiationSession): DialogueLine[] {
  const lines: DialogueLine[] = [];
  const offer = (id: string | null) => session.offers.find(item => item.id === id);
  let answered = 0;
  session.history.forEach((event, index) => {
    const id = `${session.id}:${index}`;
    switch (event.kind) {
      case "answer":
        lines.push({ id: id + ":q", revision: event.revision - 1, speaker: event.investor, text: NEGOTIATION_RULES.investors[event.investor].question });
        lines.push({ id: id + ":a", revision: event.revision, speaker: "founder", text: session.answers[answered++]?.text ?? "" });
        break;
      case "opening": {
        const opened = offer(event.offerId);
        lines.push({ id, revision: event.revision, speaker: event.investor, text: openingCopy[event.reason],
          ...(opened && { terms: { amount: opened.amount, equity: opened.equity }, termsLabel: "Opening offer" }) });
        break;
      }
      case "counter": {
        lines.push({ id: id + ":f", revision: event.revision, speaker: "founder",
          text: `Counter ${event.round} to ${NEGOTIATION_RULES.investors[event.investor].name}.`, terms: event.proposed, termsLabel: "Proposed" });
        const resulting = offer(event.resultingOfferId);
        lines.push({ id, revision: event.revision, speaker: event.investor, text: counterCopy[event.reason],
          ...(resulting && { terms: { amount: resulting.amount, equity: resulting.equity }, termsLabel: "Current offer" }) });
        break;
      }
      case "finished":
        lines.push({ id, revision: event.revision, speaker: "panel", text: outcomeCopy[event.outcome.kind] });
        break;
    }
  });
  // The open question is part of the conversation even though nothing has been committed for it yet.
  const asking = session.stage === "questions" ? INVESTOR_ORDER[session.answers.length] : undefined;
  if (asking) lines.push({ id: `${session.id}:open:${session.answers.length}`, revision: session.revision, speaker: asking, text: NEGOTIATION_RULES.investors[asking].question });
  return lines;
}

/**
 * Honest processing state. The scripted engine commits replies synchronously, so there is never a
 * "thinking" state: the studio is either waiting for the founder or showing a recorded reply.
 */
export function dialogueStatus(session: NegotiationSession | null): string {
  if (!session) return "No session yet. Start an episode to hear the first question.";
  if (session.stage === "questions") {
    const asking = INVESTOR_ORDER[session.answers.length];
    return `Waiting for your answer to ${NEGOTIATION_RULES.investors[asking].name}. Nothing is sent until you submit.`;
  }
  if (session.stage === "finished") return `Session finished at revision ${session.revision}. The transcript is complete.`;
  return `Replies recorded instantly by the scripted rules at revision ${session.revision}. Your move.`;
}
