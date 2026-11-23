// Explanatory copy for a committed concession (Issue #29). Every figure comes from the committed
// offers via latestConcession, formatted with the shared money/percent helpers.
import { money, type Currency, type Terms } from "../simulation/pitch";
import { percent } from "../simulation/negotiation/terms-display";
import type { Concession } from "./concession";
import type { Withdrawal } from "./withdrawal";

const show = (terms: Terms, currency: Currency) => `${money(terms.amount, currency)} for ${percent(terms.equity)}`;

export function concessionText(concession: Concession, currency: Currency): string {
  const proposed = show(concession.proposed, currency), after = show(concession.after, currency);
  switch (concession.kind) {
    case "agree":
      return `Counter ${concession.round}: agreed to your terms, ${after}. Nothing is final until you accept.`;
    case "revise":
      return `Counter ${concession.round}: revised from ${show(concession.before, currency)} to ${after}. You proposed ${proposed}; this is the most this round allows.`;
    case "unchanged":
      return `Counter ${concession.round}: held at ${after}. You proposed ${proposed}, which is past this investor's last concession.`;
  }
}

export function ConcessionNote({ concession, currency }: { concession: Concession | null; currency: Currency }) {
  if (!concession) return null;
  return <p className="studio-concession" data-testid="concession-note" data-kind={concession.kind}>{concessionText(concession, currency)}</p>;
}

/** Explanatory copy for a policy-specific withdrawal (Issue #30); the last offer stays in the history. */
export function withdrawalText(withdrawal: Withdrawal, currency: Currency): string {
  if (withdrawal.kind === "opening") return withdrawal.reason === "repeated-answer"
    ? "Passed at the opening: your answer repeated an earlier one, so there was nothing new to assess. Your answer stays in the transcript."
    : "Passed at the opening: the signals this investor asked for were not in your answer. Your answer stays in the transcript.";
  const kept = `Their last offer, ${show(withdrawal.lastOffer, currency)}, stays in the history.`;
  return withdrawal.reason === "above-cash-ceiling"
    ? `Counter ${withdrawal.round}: withdrew because you asked for ${money(withdrawal.proposed.amount, currency)}, more than this investor can invest. ${kept}`
    : `Counter ${withdrawal.round}: withdrew because you offered ${percent(withdrawal.proposed.equity)} equity, below the range this investor can negotiate. ${kept}`;
}

export function WithdrawalNote({ withdrawal, currency }: { withdrawal: Withdrawal | null; currency: Currency }) {
  if (!withdrawal) return null;
  return <p className="studio-concession studio-withdrawal" data-testid="withdrawal-note" data-reason={withdrawal.reason} data-clip={withdrawal.clip}>{withdrawalText(withdrawal, currency)}</p>;
}
