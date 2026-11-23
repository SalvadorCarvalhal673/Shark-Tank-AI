// Explanatory copy for a committed concession (Issue #29). Every figure comes from the committed
// offers via latestConcession, formatted with the shared money/percent helpers.
import { money, type Currency, type Terms } from "../simulation/pitch";
import { percent } from "../simulation/negotiation/terms-display";
import type { Concession } from "./concession";

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
