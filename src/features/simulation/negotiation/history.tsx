import { money, type Currency, type Terms } from "../pitch";
import { NEGOTIATION_RULES, type InvestorId } from "./investor-policy";
import { historicalCounterCopy, openingCopy, outcomeCopy, ownershipPresentation } from "./presentation";
import type { NegotiationSession } from "./session";
import { percent } from "./terms-display";

function summary(terms: Terms, currency: Currency) {
  return money(terms.amount, currency) + " for " + percent(terms.equity);
}

function ownershipSummary(terms: Terms, founderBeforeBps: number) {
  const cap = ownershipPresentation(founderBeforeBps, terms.equity);
  return cap ? `Founder ${percent(cap.founderBeforeBps)} → ${percent(cap.founderAfterBps)} · other holders ${percent(cap.otherExistingAfterBps)} · investor ${percent(cap.investorBps)}` : "Ownership unavailable";
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
            {offer && <p>Opening offer · {summary(offer, session.pitch.currency)} · {offer.status} · {ownershipSummary(offer, session.pitch.founderOwnershipBps)}</p>}
          </li>;
        }
        case "counter": {
          const previous = session.offers.find(({ id }) => id === event.previousOfferId);
          const resulting = session.offers.find(({ id }) => id === event.resultingOfferId);
          const heading = <>Counter {event.round} · {NEGOTIATION_RULES.investors[event.investor].name}</>;
          const terms = <>
            {previous && <p>Previous terms · {summary(previous, session.pitch.currency)} · {previous.status} · {ownershipSummary(previous, session.pitch.founderOwnershipBps)}</p>}
            <p>Founder proposed · {summary(event.proposed, session.pitch.currency)} · {ownershipSummary(event.proposed, session.pitch.founderOwnershipBps)}</p>
            <p>{historicalCounterCopy[event.reason]}</p>
            {resulting && <p>Resulting offer · {summary(resulting, session.pitch.currency)} · {resulting.status} · {ownershipSummary(resulting, session.pitch.founderOwnershipBps)}</p>}
          </>;
          return <li key={key}>{session.stage === "finished" && !investor
            ? <details className="negotiation-details"><summary>{heading}</summary>{terms}</details>
            : <><strong>{heading}</strong>{terms}</>}
          </li>;
        }
        case "finished":
          return <li key={key}><strong>Session ended.</strong> {outcomeCopy[event.outcome.kind]}</li>;
      }
    })}
  </ol>;
}
