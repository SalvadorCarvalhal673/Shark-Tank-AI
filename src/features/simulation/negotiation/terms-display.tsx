import { money, type Currency, type Terms } from "../pitch";
import { valuations } from "./financials";
import { ownershipPresentation } from "./presentation";

export function percent(bps: number): string {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(bps / 100) + "%";
}

export function ValuationDetails({ terms, currency, founderOwnershipBps }: { terms: Terms; currency: Currency; founderOwnershipBps?: number }) {
  const value = valuations(terms);
  if (value === null) return <p className="error" role="alert">Valuation unavailable for these terms.</p>;
  const ownership = founderOwnershipBps === undefined ? null : ownershipPresentation(founderOwnershipBps, terms.equity);
  return (
    <>
      <dl className="valuation-details">
        <div><dt>Pre-money valuation</dt><dd>{money(value.preMoney, currency)}</dd></div>
        <div><dt>Post-money valuation</dt><dd>{money(value.postMoney, currency)}</dd></div>
      </dl>
      {ownership && <section className="financial-ownership-preview" aria-label="Illustrative ownership if these terms were accepted">
        <p><strong>If accepted · new shares issued</strong></p>
        <dl className="offer-ownership">
          <div><dt>Founder</dt><dd>{percent(ownership.founderBeforeBps)} → {percent(ownership.founderAfterBps)}</dd></div>
          <div><dt>Other holders after</dt><dd>{percent(ownership.otherExistingAfterBps)}</dd></div>
          <div><dt>Investor</dt><dd>{percent(ownership.investorBps)}</dd></div>
        </dl>
        <p className="muted">A preview from the simulator's primary-share calculation, not an accepted deal.</p>
      </section>}
    </>
  );
}

export function TermsDisplay({ terms, currency }: { terms: Terms; currency: Currency }) {
  return <>
    <p className="ask-line">{money(terms.amount, currency)} for {percent(terms.equity)}</p>
    <ValuationDetails terms={terms} currency={currency} />
  </>;
}
