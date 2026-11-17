import { panel } from "./panel.ts";
import type { Pitch } from "./pitch.ts";

type Terms = { amount: number; equity: number };
export type Offer = Terms & { id: string; investor: number; status: "active" | "withdrawn" | "superseded" | "accepted" | "closed" };
type Counter = Terms & { offerId: string; outcome: "accepted" | "declined" };
type Stage = "questions" | "negotiation" | "finished";
export type Practice = {
  pitch: Pitch;
  stage: Stage;
  answers: string[];
  offers: Offer[];
  counters: Counter[];
};

function words(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function meetsPracticeThreshold(answer: string, investor: number): boolean {
  return words(answer) >= 12 && (investor !== 0 || /\d/.test(answer));
}

export function startPractice(pitch: Pitch): Practice {
  return { pitch, stage: "questions", answers: [], offers: [], counters: [] };
}

export function answerQuestion(session: Practice, text: string): Practice {
  const answer = text.trim();
  if (session.stage !== "questions" || answer.length < 10 || answer.length > 1500) return session;
  const answers = [...session.answers, answer];
  if (answers.length < panel.length) return { ...session, answers };

  const offers = answers.flatMap((response, investor): Offer[] => {
    if (!meetsPracticeThreshold(response, investor)) return [];
    return [{
      id: `initial-${investor}`,
      investor,
      amount: session.pitch.amount,
      equity: Math.min(10000, session.pitch.equity + [300, 500, 200][investor]),
      status: "active",
    }];
  });
  return { ...session, answers, offers, stage: offers.length > 0 ? "negotiation" : "finished" };
}

export function postMoneyValue(terms: Terms): number {
  return Math.round(terms.amount * 10000 / terms.equity);
}

function validTerms({ amount, equity }: Terms): boolean {
  return Number.isSafeInteger(amount) && amount > 0 && amount <= 99_999_999_999 &&
    Number.isInteger(equity) && equity > 0 && equity <= 10000;
}

export function counterOffer(session: Practice, offerId: string, terms: Terms): Practice {
  const offer = session.offers.find((item) => item.id === offerId && item.status === "active");
  if (session.stage !== "negotiation" || !offer || offer.id.startsWith("counter-") || !validTerms(terms)) return session;
  const acceptable = terms.amount <= offer.amount && terms.equity >= Math.max(1, offer.equity - 200);
  const updated = session.offers.map((item): Offer => item.id === offerId
    ? { ...item, status: acceptable ? "superseded" : "withdrawn" }
    : item);
  if (acceptable) updated.push({ id: `counter-${offer.investor}`, investor: offer.investor, ...terms, status: "active" });

  return {
    ...session,
    offers: updated,
    counters: [...session.counters, { offerId, ...terms, outcome: acceptable ? "accepted" : "declined" }],
    stage: updated.some((item) => item.status === "active") ? "negotiation" : "finished",
  };
}

export function finishPractice(session: Practice, offerId?: string): Practice {
  if (session.stage !== "negotiation") return session;
  if (offerId && !session.offers.some((item) => item.id === offerId && item.status === "active")) return session;
  return {
    ...session,
    stage: "finished",
    offers: session.offers.map((item) => item.status === "active"
      ? { ...item, status: item.id === offerId ? "accepted" : "closed" }
      : item),
  };
}

export function assessment(session: Practice) {
  const pitchDetail = words(session.pitch.pitch) >= 40;
  return [
    {
      title: "Pitch detail",
      result: pitchDetail ? "Detailed draft" : "Expand the draft",
      excerpt: session.pitch.pitch,
      feedback: "Check that the pitch explains the problem, who pays, and how the business earns revenue.",
    },
    ...panel.map((investor, index) => ({
      title: investor.role,
      result: meetsPracticeThreshold(session.answers[index] ?? "", index) ? "Practice threshold met" : "Needs more detail",
      excerpt: session.answers[index] ?? "",
      feedback: investor.feedback,
    })),
    {
      title: "Negotiation",
      result: session.offers.some((offer) => offer.status === "accepted") ? "Deal accepted" : "No deal",
      excerpt: "",
      feedback: session.counters.length > 0
        ? "Compare your counteroffer’s valuation with the opening terms. Explain what evidence supports the change."
        : "Decide your minimum funding and maximum dilution before entering the room. Compare those limits with the terms you were offered.",
    },
  ];
}
