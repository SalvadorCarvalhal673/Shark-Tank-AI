import { panel } from "./panel.ts";
import { validPitch, validTerms, type Pitch, type Terms } from "./pitch.ts";

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

// Invalid runtime inputs return null; callers must handle the failure before use.
export function startPractice(value: unknown): Practice | null {
  if (!validPitch(value)) return null;
  const pitch: Pitch = {
    startup: value.startup.trim(),
    pitch: value.pitch.trim(),
    currency: value.currency,
    amount: value.amount,
    equity: value.equity,
  };
  return { pitch, stage: "questions", answers: [], offers: [], counters: [] };
}

export function answerQuestion(session: Practice, text: string, expectedTurn: number): Practice {
  if (session.stage !== "questions" || expectedTurn !== session.answers.length ||
      !Number.isInteger(expectedTurn) || expectedTurn < 0 || expectedTurn >= panel.length ||
      typeof text !== "string") return session;
  const answer = text.trim();
  if (answer.length < 10 || answer.length > 1500) return session;
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

// Valuations are rounded to the nearest minor unit; invalid terms return null.
export function postMoneyValue(terms: unknown): number | null {
  if (!validTerms(terms)) return null;
  return Math.round(terms.amount * 10000 / terms.equity);
}

export function counterOffer(session: Practice, offerId: string, terms: Terms): Practice {
  const offer = session.offers.find((item) => item.id === offerId && item.status === "active");
  if (session.stage !== "negotiation" || !offer || offer.id.startsWith("counter-") || !validTerms(terms)) return session;
  const acceptable = terms.amount <= offer.amount && terms.equity >= Math.max(1, offer.equity - 200);
  const updated = session.offers.map((item): Offer => ({
    id: item.id,
    investor: item.investor,
    amount: item.amount,
    equity: item.equity,
    status: item.id === offerId ? (acceptable ? "superseded" : "withdrawn") : item.status,
  }));
  if (acceptable) updated.push({
    id: `counter-${offer.investor}`,
    investor: offer.investor,
    amount: terms.amount,
    equity: terms.equity,
    status: "active",
  });

  const counter: Counter = {
    offerId,
    amount: terms.amount,
    equity: terms.equity,
    outcome: acceptable ? "accepted" : "declined",
  };
  return {
    ...session,
    offers: updated,
    counters: [...session.counters, counter],
    stage: updated.some((item) => item.status === "active") ? "negotiation" : "finished",
  };
}

export function finishPractice(session: Practice, offerId?: string): Practice {
  if (session.stage !== "negotiation") return session;
  if (offerId !== undefined && !session.offers.some((item) => item.id === offerId && item.status === "active")) return session;
  return {
    ...session,
    stage: "finished",
    offers: session.offers.map((item): Offer => ({
      id: item.id,
      investor: item.investor,
      amount: item.amount,
      equity: item.equity,
      status: item.status === "active"
        ? (item.id === offerId ? "accepted" : "closed")
        : item.status,
    })),
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
