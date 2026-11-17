import { money, type Currency, type Terms } from "../pitch";
import { valuations } from "./financials";

export function percent(bps: number): string {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(bps / 100) + "%";
}

export function ValuationDetails({ terms, currency }: { terms: Terms; currency: Currency }) {
  const value = valuations(terms);
  if (value === null) return <p className="error" role="alert">Valuation unavailable for these terms.</p>;
  return (
    <dl className="valuation-details">
      <div><dt>Pre-money valuation</dt><dd>{money(value.preMoney, currency)}</dd></div>
      <div><dt>Post-money valuation</dt><dd>{money(value.postMoney, currency)}</dd></div>
    </dl>
  );
}

export function TermsDisplay({ terms, currency }: { terms: Terms; currency: Currency }) {
  return <>
    <p className="ask-line">{money(terms.amount, currency)} for {percent(terms.equity)}</p>
    <ValuationDetails terms={terms} currency={currency} />
  </>;
}
