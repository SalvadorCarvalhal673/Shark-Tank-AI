import { useEffect, useId, useRef, useState, type FormEvent, type Ref } from "react";
import { readTerms } from "../pitch";
import { valuations } from "./financials";
import { NegotiationHistory } from "./history";
import { NEGOTIATION_RULES, type InvestorId } from "./investor-policy";
import { acceptanceAction, counterCopy, investorActivity, openingCopy, signalCopy, specialties, type PendingOffer } from "./presentation";
import type { FounderAction, NegotiationOffer, NegotiationSession } from "./session";
import { TermsDisplay } from "./terms-display";

type Mode = PendingOffer["kind"];

function OfferPanel({ pending, session, offer, onCancel, onAction }: {
  pending: PendingOffer;
  session: NegotiationSession;
  offer: NegotiationOffer;
  onCancel: () => void;
  onAction: (action: FounderAction) => void;
}) {
  const [error, setError] = useState("");
  const firstField = useRef<HTMLInputElement>(null);
  const confirmButton = useRef<HTMLButtonElement>(null);
  const label = useId();
  const name = NEGOTIATION_RULES.investors[offer.investor].name;
  const currency = session.pitch.currency;
  const { sessionId, expectedRevision, offerId } = pending;

  useEffect(() => {
    if (pending.kind === "counter") firstField.current?.focus();
    else confirmButton.current?.focus();
  }, [pending.kind]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const terms = readTerms(new FormData(event.currentTarget));
    if (typeof terms === "string") {
      setError(terms);
      return;
    }
    onAction({ kind: "counter", sessionId, expectedRevision, offerId, terms });
  }

  if (pending.kind === "confirm") {
    return <div className="inline-offer-panel" role="group" aria-labelledby={label}>
      <h4 id={label}>Confirm deal with {name}</h4>
      <TermsDisplay terms={offer} currency={currency} />
      <p className="muted">Confirming closes all other offers.</p>
      <div className="preview-actions">
        <button ref={confirmButton} className="button" type="button"
          onClick={() => {
            const action = acceptanceAction(session, pending);
            if (action) onAction(action);
          }}>Confirm deal</button>
        <button className="button secondary" type="button" onClick={onCancel}>Cancel confirmation</button>
      </div>
    </div>;
  }

  return <form className="inline-offer-panel counter-form" onSubmit={submit} aria-label={`Counteroffer to ${name}`}>
    <p id={label} className="muted">Use plain decimals with up to two decimal places. Every valid counter uses one shared round, even if terms stay the same.</p>
    <label>Investment ({currency})
      <input ref={firstField} name="amount" aria-describedby={label} type="number" step=".01" min=".01" max="999999999.99" required defaultValue={offer.amount / 100} />
    </label>
    <label>Equity (%)
      <input name="equity" aria-describedby={label} type="number" step=".01" min=".01" max="100" required defaultValue={offer.equity / 100} />
    </label>
    {error && <p className="error" role="alert">{error}</p>}
    <div className="preview-actions">
      <button className="button" type="submit">Send counteroffer</button>
      <button className="button secondary" type="button" onClick={onCancel}>Cancel counteroffer</button>
    </div>
  </form>;
}

export function OfferCard({ session, investor, pending, headingRef, onOpen, onClose, onAction }: {
  session: NegotiationSession;
  investor: InvestorId;
  pending: PendingOffer | null;
  headingRef: Ref<HTMLHeadingElement>;
  onOpen: (kind: Mode, offerId: string) => void;
  onClose: () => void;
  onAction: (action: FounderAction) => void;
}) {
  const counterButton = useRef<HTMLButtonElement>(null);
  const acceptButton = useRef<HTMLButtonElement>(null);
  const activity = investorActivity(session, investor);
  const opening = activity.find((event) => event.kind === "opening");
  const latest = activity.at(-1);
  const openingOffer = session.offers.find(({ id }) => id === opening?.offerId);
  const offer = session.offers.find((item) => item.investor === investor && item.status === "active");
  const current = offer && valuations(offer);
  const hasCounters = activity.some((event) => event.kind === "counter");
  const name = NEGOTIATION_RULES.investors[investor].name;
  const status = offer ? "Active offer" : openingOffer ? "Withdrawn" : "Passed";
  const response = latest?.kind === "counter" ? counterCopy[latest.reason] : opening ? openingCopy[opening.reason] : "";
  const panel = offer && pending?.offerId === offer.id ? pending : null;

  function cancel() {
    onClose();
    (panel?.kind === "counter" ? counterButton.current : acceptButton.current)?.focus();
  }

  return <article className="offer-card negotiation-card">
    <div className="investor-card-heading">
      <h3 ref={headingRef} tabIndex={-1}>{name}</h3>
      <p className="muted">{specialties[investor]} · {status}</p>
    </div>
    {offer && <div className="current-terms">
      {current
        ? <TermsDisplay terms={offer} currency={session.pitch.currency} />
        : <p role="alert" className="error">These terms are unavailable. This offer cannot be confirmed.</p>}
    </div>}
    <p className="offer-response">{response}</p>
    {offer && current && <div className="preview-actions offer-actions">
      <button ref={acceptButton} type="button" className="button" aria-expanded={panel?.kind === "confirm"}
        onClick={() => onOpen("confirm", offer.id)}>Accept offer</button>
      {session.stage === "negotiation" && <button ref={counterButton} type="button" className="button secondary"
        aria-expanded={panel?.kind === "counter"} onClick={() => onOpen("counter", offer.id)}>Make a counteroffer</button>}
    </div>}
    {current && offer && panel && <OfferPanel key={panel.kind + panel.offerId} pending={panel} offer={offer} session={session} onCancel={cancel} onAction={onAction} />}
    <details className="negotiation-details">
      <summary>Pitch signals</summary>
      <p className="muted">These are detected text patterns, not independently verified facts.</p>
      <ul className="evidence-list">
        {session.answers.find((answer) => answer.investor === investor)?.evidence.signals.map(({ signal, status }) => (
          <li key={signal}><strong>{status === "supplied" ? "Signal detected" : "Signal not identified"}</strong> · {signalCopy[signal]}</li>
        ))}
      </ul>
    </details>
    {openingOffer && <details className="negotiation-details">
      <summary>Opening terms and exchanges</summary>
      <TermsDisplay terms={openingOffer} currency={session.pitch.currency} />
      {hasCounters && <NegotiationHistory session={session} investor={investor} />}
    </details>}
  </article>;
}
