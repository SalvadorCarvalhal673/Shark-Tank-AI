import { money, type Currency, type Terms } from "../pitch";
import { NEGOTIATION_RULES, type InvestorId } from "./investor-policy";
import { historicalCounterCopy, openingCopy, outcomeCopy } from "./presentation";
import type { NegotiationSession } from "./session";
import { percent } from "./terms-display";

function summary(terms: Terms, currency: Currency) {
  return money(terms.amount, currency) + " for " + percent(terms.equity);
}

export function NegotiationHistory({ session, investor }: { session: NegotiationSession; investor?: InvestorId }) {
  return <ol className="negotiation-timeline" aria-label={investor ? "Investor exchanges" : "Negotiation history"}>
    {session.history.map((event, index) => {
      if (investor && (event.kind !== "counter" || event.investor !== investor)) return null;
      const key = session.id + "-" + index;
      switch (event.kind) {
        case "answer":
          return <li key={key}><strong>{NEGOTIATION_RULES.investors[event.investor].name}</strong> · Founder answered.</li>;
        case "opening": {
          const offer = session.offers.find(({ id }) => id === event.offerId);
          return <li key={key}><strong>{NEGOTIATION_RULES.investors[event.investor].name}</strong> · {openingCopy[event.reason]}
            {offer && <p>Opening offer · {summary(offer, session.pitch.currency)}</p>}
          </li>;
        }
        case "counter": {
          const previous = session.offers.find(({ id }) => id === event.previousOfferId);
          const resulting = session.offers.find(({ id }) => id === event.resultingOfferId);
          return <li key={key}>
            <strong>Counter {event.round} · {NEGOTIATION_RULES.investors[event.investor].name}</strong>
            {previous && <p>Previous terms · {summary(previous, session.pitch.currency)}</p>}
            <p>Founder proposed · {summary(event.proposed, session.pitch.currency)}</p>
            <p>{historicalCounterCopy[event.reason]}</p>
            {resulting && <p>Resulting offer · {summary(resulting, session.pitch.currency)}</p>}
          </li>;
        }
        case "finished":
          return <li key={key}><strong>Session ended.</strong> {outcomeCopy[event.outcome.kind]}</li>;
      }
    })}
  </ol>;
}
