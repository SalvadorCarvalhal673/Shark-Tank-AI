"use client";
// Opening-offer reveal (Issue #24). Shows the committed opening decisions in their recorded order with
// a short staggered entrance. It is decoration over committed data: every offer card below stays in
// the HTML and fully usable from the first frame, the reveal can be skipped, and reduced motion shows
// everything at once (CSS). Nothing here dispatches an action.
import { useState } from "react";
import { money } from "../pitch";
import { NEGOTIATION_RULES } from "./investor-policy";
import { openingCopy } from "./presentation";
import type { NegotiationSession } from "./session";
import { percent } from "./terms-display";

export function OpeningReveal({ session }: { session: NegotiationSession }) {
  const [skipped, setSkipped] = useState(false);
  const openings = session.history.filter(event => event.kind === "opening");
  if (openings.length === 0 || session.roundsUsed > 0) return null;
  return <section className={"opening-reveal" + (skipped ? " skipped" : "")} aria-label="Opening decisions">
    <div className="opening-reveal-head">
      <p className="kicker">Opening decisions · in the order recorded</p>
      {!skipped && <button className="button secondary" type="button" onClick={() => setSkipped(true)}>Skip reveal</button>}
    </div>
    <ol>
      {openings.map((event, index) => {
        if (event.kind !== "opening") return null;
        const offer = session.offers.find(item => item.id === event.offerId);
        return <li key={event.investor} style={{ animationDelay: `${index * 0.6}s` }} data-decision={event.decision}>
          <strong>{NEGOTIATION_RULES.investors[event.investor].name}</strong>
          <span>{event.decision === "offer" && offer ? `${money(offer.amount, session.pitch.currency)} for ${percent(offer.equity)}` : "No offer"}</span>
          <small>{openingCopy[event.reason]}</small>
        </li>;
      })}
    </ol>
  </section>;
}
