"use client";
// Studio dialogue layout (Issue #18): named speaker, complete transcript and the founder's composer.
import { useEffect, useRef, type ReactNode } from "react";
import { money } from "../simulation/pitch";
import { percent } from "../simulation/negotiation/terms-display";
import type { NegotiationSession } from "../simulation/negotiation/session";
import { DIALOGUE_SOURCE, dialogueLines, dialogueStatus, speakerName } from "./dialogue";

export function DialoguePanel({ session, children }: { session: NegotiationSession | null; children?: ReactNode }) {
  const lines = session ? dialogueLines(session) : [];
  const current = lines.at(-1);
  const transcript = useRef<HTMLOListElement>(null);
  // Keep the newest line in view. Only the transcript box scrolls; the page and focus stay put.
  useEffect(() => {
    const list = transcript.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [lines.length]);
  return <section className="studio-conversation" aria-label="Dialogue">
    <header className="studio-conversation-head">
      <div>
        <p className="kicker">Now speaking</p>
        <p className="studio-speaker" data-testid="active-speaker">{current ? speakerName(current.speaker) : "The panel"}</p>
      </div>
      <p className="studio-source-label">{DIALOGUE_SOURCE}</p>
    </header>
    <p className="studio-dialogue-status" role="status" aria-live="polite">{dialogueStatus(session)}</p>
    {lines.length > 0 && <ol className="studio-transcript" aria-label="Dialogue history" ref={transcript} tabIndex={0}>
      {lines.map(line => <li key={line.id} className={"studio-line studio-line-" + (line.speaker === "founder" ? "founder" : "investor")}>
        <p className="studio-line-speaker"><strong>{speakerName(line.speaker)}</strong> <span>Revision {line.revision}</span></p>
        <p>{line.text}</p>
        {line.terms && session && <p className="studio-line-terms">{line.termsLabel}: <strong>{money(line.terms.amount, session.pitch.currency)} for {percent(line.terms.equity)}</strong></p>}
      </li>)}
    </ol>}
    {children}
  </section>;
}
