import { BASIS_POINTS, investmentAtShare } from "./financials.ts";
import type { Terms } from "../pitch.ts";

export const NEGOTIATION_RULES = Object.freeze({
  version: 1,
  counterBudget: 3,
  maximumRevisionStepBps: 100,
  investors: Object.freeze({
    maya: Object.freeze({
      name: "Maya Chen",
      question: "What named financial figure can you share (for example, Revenue: €9,000)? If available, give your Runway: number of months and Use of funds: how the investment would be spent.",
      openingCashBps: 10_000, cashCeilingBps: 10_000,
      equityPremiumBps: 300, concessionBps: 200, withdrawalBandBps: 300,
    } as const),
    adrian: Object.freeze({
      name: "Adrian Vale",
      question: "Give your Target segment: who buys first and Acquisition channel: how you reach them. If measured, add an acquisition figure such as Conversion rate: 5%, CAC: €30 or Leads: 120.",
      openingCashBps: 9_000, cashCeilingBps: 9_000, measuredCashCeilingBps: 10_000,
      equityPremiumBps: 500, concessionBps: 300, withdrawalBandBps: 400,
    } as const),
    sofia: Object.freeze({
      name: "Sofia Mendes",
      question: "Give your Customer evidence: what you observed from customers, and Milestone: the specific next result your team will deliver.",
      openingCashBps: 8_000, cashCeilingBps: 8_000,
      equityPremiumBps: 200, concessionBps: 100, withdrawalBandBps: 200,
    } as const),
  } as const),
} as const);

export const INVESTOR_ORDER = Object.freeze(["maya", "adrian", "sofia"] as const);
export type InvestorId = typeof INVESTOR_ORDER[number];

const FIGURE = String.raw`\s*(?::|=|\bis\b|\bwas\b)?\s*[+-]?\s*[$€£]?\s*(?:\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?|\.\d+)(?![\w./-]|,\d)`;
const namedFinance = new RegExp(String.raw`\b(?:revenue|(?:monthly )?costs|gross margin|profit|(?:monthly )?burn(?: rate)?|cash balance)\b` + FIGURE, "i");
const runway = new RegExp(String.raw`\brunway\b` + FIGURE + String.raw`\s*months?\b`, "i");
const acquisition = new RegExp(String.raw`\b(?:conversion rate|customer acquisition cost|cac|leads)\b` + FIGURE, "i");
const negation = /\b(?:no|not|never|without|unknown|none|unavailable|missing|unmeasured|hypothetical|example only)\b|n['’]t\b|\bn\/?a\b/i;
const labels = /\b(?:use of funds|target segment|acquisition channel|customer evidence|milestone)\s*[:=]/gi;
const filler = new Set("a an and as at be by channel customer customers evidence figure for funds in is it measure measured milestone of on or our rate revenue segment target the to use via we with".split(" "));

function hasDescription(clauses: string[], label: string): boolean {
  const field = new RegExp(String.raw`\b${label}\s*[:=]\s*(.+)`, "i");
  return clauses.some((clause) => {
    const value = field.exec(clause)?.[1];
    if (!value) return false;
    // Another label cannot make an empty field look populated.
    const words = (value.split(labels)[0].toLowerCase().match(/[a-z]{2,}/g) ?? [])
      .filter((word) => !filler.has(word));
    return new Set(words).size >= 2;
  });
}

const rubric = {
  maya: { required: ["named-financial-figure"], optional: ["runway-duration", "use-of-funds"] },
  adrian: { required: ["target-segment", "acquisition-channel"], optional: ["acquisition-measure"] },
  sofia: { required: ["customer-observation", "delivery-milestone"], optional: [] },
} as const;

type Signal = typeof rubric[InvestorId]["required"][number] | typeof rubric[InvestorId]["optional"][number];
export type Evidence = {
  readonly investor: InvestorId;
  readonly signals: readonly { readonly signal: Signal; readonly status: "supplied" | "missing" }[];
  readonly repeated: boolean;
  readonly quality: "not-independently-verified";
};

function normalize(text: string): string {
  return text.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " ");
}

export function assessEvidence(investor: InvestorId, answer: string, earlierAnswers: readonly string[]): Evidence {
  const repeated = earlierAnswers.some((earlier) => normalize(earlier) === normalize(answer));
  const clauses = repeated ? [] : answer.split(/[;!?\n]|\.(?!\d)/).filter((clause) => !negation.test(clause));
  const observed: Record<Signal, boolean> = {
    "named-financial-figure": clauses.some((clause) => namedFinance.test(clause)),
    "runway-duration": clauses.some((clause) => runway.test(clause)),
    "use-of-funds": hasDescription(clauses, "use of funds"),
    "target-segment": hasDescription(clauses, "target segment"),
    "acquisition-channel": hasDescription(clauses, "acquisition channel"),
    "acquisition-measure": clauses.some((clause) => acquisition.test(clause)),
    "customer-observation": hasDescription(clauses, "customer evidence"),
    "delivery-milestone": hasDescription(clauses, "milestone"),
  };
  return {
    investor, repeated,
    signals: [...rubric[investor].required, ...rubric[investor].optional].map((signal) => ({
      signal, status: observed[signal] ? "supplied" : "missing",
    })),
    quality: "not-independently-verified",
  };
}

export type InvestorLimits = {
  readonly cashCeiling: number;
  readonly equityFloor: number;
  readonly withdrawalBandBps: number;
};

export function openingDecision(ask: Terms, evidence: Evidence):
  | { kind: "pass"; reason: "repeated-answer" | "missing-required-signals" }
  | { kind: "offer"; terms: Terms; limits: InvestorLimits; reason: "required-signals-supplied" } {
  const { investor } = evidence;
  if (evidence.repeated) return { kind: "pass", reason: "repeated-answer" };
  const supplied = new Set(evidence.signals.filter(({ status }) => status === "supplied").map(({ signal }) => signal));
  if (!rubric[investor].required.every((signal) => supplied.has(signal))) {
    return { kind: "pass", reason: "missing-required-signals" };
  }

  const profile = NEGOTIATION_RULES.investors[investor];
  const ceilingBps = investor === "adrian" && supplied.has("acquisition-measure")
    ? NEGOTIATION_RULES.investors.adrian.measuredCashCeilingBps
    : profile.cashCeilingBps;
  const amount = investmentAtShare(ask.amount, profile.openingCashBps);
  const cashCeiling = investmentAtShare(ask.amount, ceilingBps);
  if (amount === null || cashCeiling === null) throw new RangeError("Opening decisions require a validated pitch amount.");
  const equity = Math.min(BASIS_POINTS, ask.equity + profile.equityPremiumBps);
  return {
    kind: "offer", reason: "required-signals-supplied", terms: { amount, equity },
    limits: {
      cashCeiling, equityFloor: Math.max(1, equity - profile.concessionBps),
      withdrawalBandBps: profile.withdrawalBandBps,
    },
  };
}

export type CounterDecision =
  | { kind: "withdraw"; reason: "above-cash-ceiling" | "below-withdrawal-band" }
  | { kind: "agree"; reason: "within-limits"; terms: Terms }
  | { kind: "revise"; reason: "limited-concession"; terms: Terms }
  | { kind: "unchanged"; reason: "at-concession-limit" };

export function decideCounter(current: Terms, proposed: Terms, limits: InvestorLimits): CounterDecision {
  if (proposed.amount > limits.cashCeiling) return { kind: "withdraw", reason: "above-cash-ceiling" };
  if (proposed.equity < limits.equityFloor - limits.withdrawalBandBps) {
    return { kind: "withdraw", reason: "below-withdrawal-band" };
  }
  if (proposed.equity >= limits.equityFloor) {
    return { kind: "agree", reason: "within-limits", terms: { amount: proposed.amount, equity: proposed.equity } };
  }

  const amount = Math.min(current.amount, proposed.amount);
  const equity = Math.max(limits.equityFloor, current.equity - NEGOTIATION_RULES.maximumRevisionStepBps);
  if (amount === current.amount && equity === current.equity) {
    return { kind: "unchanged", reason: "at-concession-limit" };
  }
  return { kind: "revise", reason: "limited-concession", terms: { amount, equity } };
}
