import type { InvestorId } from "../simulation/negotiation/investor-policy.ts";
import type { FounderAction, NegotiationPitch } from "../simulation/negotiation/session.ts";
export const CONTRACT_VERSION = 1;
export const MAX_REQUEST_BYTES = 131072;
export const MAX_OUTPUT_BYTES = 16384;
export const PURPOSES = ["question","answer-feedback","counter-explanation","outcome"] as const;
export type Purpose = typeof PURPOSES[number];
export type Binding = Readonly<{
  sessionId: string; revision: number; requestId: string; epoch: number;
  investorId: InvestorId; purpose: Purpose;
}>;
export type Consent = Readonly<{
  version: 1; accepted: true; sessionId: string;
  provider: "openai" | "anthropic" | "google"; scope: "investor-dialogue";
}>;
export type DialogueEntry = Readonly<{ id: string; investorId: InvestorId; text: string }>;
export type BrowserRequest = Readonly<{
  contractVersion: 1; rulesVersion: 1; binding: Binding; pitch: NegotiationPitch;
  actions: readonly FounderAction[]; history: readonly DialogueEntry[]; consent: Consent | null;
}>;
export type Source = Readonly<{ id: string; text: string; provenance: "founder-reported" }>;
export type Reference = Readonly<{ sourceId: string; quote: string }>;
export type Observation = Readonly<{
  category: "finance" | "growth" | "execution"; text: string; references: readonly Reference[];
}>;
export type ProviderOutput = Readonly<{
  contractVersion: 1; binding: Binding; dialogue: string; question: string | null;
  observations: readonly Observation[];
}>;
export type Failure = "missing-credentials" | "timeout" | "refusal" | "network" |
  "invalid-output" | "budget" | "no-consent" | "cancelled";
export type AppResponse = Readonly<{
  contractVersion: 1; binding: Binding; dialogue: string; question: string | null;
  observations: readonly Observation[]; provenance: "mock" | "ai" | "scripted";
  fallback: Failure | null; limitations: readonly string[];
}>;
export type PresentationEvent = Readonly<{
  kind: "request-started" | "dialogue-ready" | "presentation-finished" | "request-cancelled";
  binding: Binding;
}>;
