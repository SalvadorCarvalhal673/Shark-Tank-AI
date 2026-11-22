"use client";

import { NEGOTIATION_RULES, INVESTOR_ORDER, type InvestorId } from "./negotiation/investor-policy";
import { specialties } from "./negotiation/presentation";
import { useEffect, useRef } from "react";

const focus: Record<InvestorId, string> = {
  maya: "How the numbers work, what the funding pays for, and how much runway it creates.",
  adrian: "Who will buy first, how you will reach them, and whether that channel can grow.",
  sofia: "What customers have shown you and what your team can deliver next.",
};

const style: Record<InvestorId, string> = {
  maya: "Precise and financially minded. She asks for specific figures and a clear use of funds.",
  adrian: "Energetic and growth focused. He looks for a reachable first market and repeatable acquisition.",
  sofia: "Practical and operations focused. She connects customer observations to delivery plans.",
};

export function InvestorIntroductions({ selected, onSelect, onContinue, onSkip, onBack }: {
  selected: InvestorId;
  onSelect: (investor: InvestorId) => void;
  onContinue: () => void;
  onSkip: () => void;
}) {
  const investor = NEGOTIATION_RULES.investors[selected];
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), [selected]);
  return <section className="form-card investor-introductions" aria-labelledby="introductions-title">
    <p className="kicker">Meet the panel · scripted introductions</p>
    <h2 id="introductions-title" ref={heading} tabIndex={-1}>Three investors, three points of view.</h2>
    <p>Choose an investor to learn what they focus on. This preview does not start a negotiation or change the order of questions.</p>
    <div className="introduction-picker" role="group" aria-label="Choose an investor introduction">
      {INVESTOR_ORDER.map((id) => <button key={id} className="button secondary" type="button" aria-pressed={selected === id} onClick={() => onSelect(id)}>
        {NEGOTIATION_RULES.investors[id].name} · {specialties[id]}
      </button>)}
    </div>
    <article className="introduction-profile" aria-live="polite">
      <p className="kicker">{specialties[selected]}</p>
      <h3>{investor.name}</h3>
      <p>{style[selected]}</p>
      <p><strong>Investment focus:</strong> {focus[selected]}</p>
      <p><strong>First question:</strong> {investor.question}</p>
    </article>
    <div className="preview-actions">
      <button className="button secondary" type="button" onClick={onSkip}>Skip introductions</button>
      <button className="button secondary" type="button" onClick={onContinue}>Return to pitch review</button>
    </div>
  </section>;
}
