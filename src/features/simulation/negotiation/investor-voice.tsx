"use client";
// Optional investor voice for the practice room (Phase 4D, Issues #57–#65). Off by default. It
// narrates committed moments through the server route, shows engine-owned figures beside the text,
// and falls back to the scripted copy whenever the route is disabled, slow, failing or contradictory.
// Nothing here dispatches a founder action; the founder's answer draft changes only by explicit click.
import { useEffect, useRef, useState } from "react";
import type { AppResponse } from "../../ai/contracts";
import { buildContext, type ConversationContext } from "../../ai/context";
import { scriptedFallback } from "../../ai/fallback";
import { RequestLifecycle } from "../../ai/lifecycle";
import { clarify, startClarifications, type ClarificationState } from "../../ai/clarification";
import { buildVoiceRequest, clarificationTarget, engineFacts, narrationTarget, recoveryNote, requestInvestorVoice, type VoiceTarget } from "../../ai/client";
import { money } from "../pitch";
import { NEGOTIATION_RULES } from "./investor-policy";
import type { SessionRun } from "./session-storage";
import { percent } from "./terms-display";

type Shown = Readonly<{ target: VoiceTarget; revision: number; response: AppResponse; context: ConversationContext; note: string | null }>;
type VoiceState = Readonly<{ waiting: VoiceTarget | null; shown: Shown | null }>;

const PURPOSE_LABEL: Record<VoiceTarget["purpose"], string> = {
  question: "Question", "answer-feedback": "On your answer", "counter-explanation": "On your counter", outcome: "Coaching on the outcome",
};

let sequence = 0;
const nextRequestId = (revision: number) => `voice-${revision}-${++sequence}`;

function useInvestorVoice(run: SessionRun, enabled: boolean) {
  const [state, setState] = useState<VoiceState>({ waiting: null, shown: null });
  const lifecycle = useRef<RequestLifecycle | null>(null);
  const { id: sessionId, revision } = run.session;

  async function ask(target: VoiceTarget) {
    const current = lifecycle.current ??= new RequestLifecycle();
    // A new view context cancels any older request; stale replies can never be consumed.
    current.setContext({ sessionId, revision, investorId: target.investorId, mode: "html", recoveryId: "live" });
    const request = buildVoiceRequest(run, target, nextRequestId(revision), current.epoch);
    const signal = current.begin(request.binding);
    if (!signal) return null;
    setState(previous => ({ ...previous, waiting: target }));
    const result = await requestInvestorVoice(request, signal);
    if (!current.consume(request.binding)) return null;
    current.presentationFinished(request.binding);
    if (result.kind === "reply") {
      const shown: Shown = { target, revision, response: result.response, context: result.context, note: result.response.provenance === "scripted" ? "The server used the scripted continuation." : null };
      setState({ waiting: null, shown });
      return shown;
    }
    const recovery = recoveryNote(result);
    const context = buildContext(request);
    if (!recovery || !context) { setState(previous => ({ ...previous, waiting: null })); return null; }
    const shown: Shown = { target, revision, response: scriptedFallback(context, recovery.reason), context, note: recovery.note };
    setState({ waiting: null, shown });
    return shown;
  }

  useEffect(() => {
    if (!enabled) { lifecycle.current?.cancel(); return; }
    const target = narrationTarget(run);
    // Deferred so the request starts after this commit; the effect itself never sets state.
    if (target) Promise.resolve().then(() => ask(target));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one request per committed revision
  }, [enabled, sessionId, revision]);

  useEffect(() => () => lifecycle.current?.dispose(), []);
  return { state: enabled ? state : { waiting: null, shown: null }, ask };
}

export function InvestorVoice({ run, onUseInAnswer }: { run: SessionRun; onUseInAnswer: (text: string) => void }) {
  const [enabled, setEnabled] = useState(false);
  const { state, ask } = useInvestorVoice(run, enabled);
  const [clarifications, setClarifications] = useState<ClarificationState>(() => startClarifications(run.session.id));
  const [reply, setReply] = useState("");
  const shown = state.shown;
  const asking = clarificationTarget(run);
  const entry = asking ? clarifications.entries[asking.investorId] : undefined;

  async function requestClarification() {
    if (!asking) return;
    const result = await ask(asking);
    if (!result || !result.response.question || result.response.provenance === "scripted") return;
    setClarifications(previous => clarify(previous, { kind: "ask", binding: result.response.binding, text: result.response.question }, result.response.binding, true));
  }
  function finishClarification(kind: "answer" | "skip") {
    if (!entry) return;
    const text = kind === "answer" ? reply.trim() : null;
    const next = clarify(clarifications, { kind, binding: entry.binding, text }, entry.binding, true);
    if (next === clarifications) return;
    setClarifications(next);
    // Explicit founder confirmation: the reply is copied into the draft only on this click, and the
    // draft is still not submitted. Nothing is stored beyond this page.
    if (kind === "answer" && text) onUseInAnswer(text);
    setReply("");
  }

  const name = (target: VoiceTarget) => NEGOTIATION_RULES.investors[target.investorId].name;
  return <section className="investor-voice" aria-label="Investor voice">
    <div className="investor-voice-head">
      <p className="kicker">Optional · experimental</p>
      <label className="save-choice"><input type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)} /> AI investor voice</label>
    </div>
    {!enabled && <p className="muted">Off. The scripted investors work without it. When on, only your committed answers and actions are sent to this app&apos;s server; drafts stay on the page, nothing is sent to an outside AI provider, and the AI cannot change any offer, counter or outcome.</p>}
    {enabled && <>
      <p className="interaction-state" role="status" aria-live="polite">
        {state.waiting ? `Requesting ${name(state.waiting)}'s voice for revision ${run.session.revision}…` : shown ? `${name(shown.target)} · ${PURPOSE_LABEL[shown.target.purpose]} · revision ${shown.revision}` : "Waiting for the next committed moment."}
      </p>
      {shown && <article className="investor-voice-reply" data-provenance={shown.response.provenance} data-revision={shown.revision}>
        <p className="dialogue-speaker">{name(shown.target)} · {shown.response.provenance === "scripted" ? "Scripted continuation" : shown.response.provenance === "mock" ? "Development mock voice" : "AI voice"}</p>
        <p>{shown.response.dialogue}</p>
        {shown.response.question && <p><strong>Question:</strong> {shown.response.question}</p>}
        {shown.response.observations.length > 0 && <ul className="investor-voice-observations" aria-label="Unverified observations">
          {shown.response.observations.map((observation, index) => <li key={index}>
            <strong>{observation.category}</strong> · {observation.text} <span className="muted">(unverified; quotes your own words: {observation.references.map(reference => `“${reference.quote}”`).join(", ")})</span>
          </li>)}
        </ul>}
        {engineFacts(shown.context).map(fact => <p key={fact.offerId} className="investor-voice-facts">Engine figures: {money(fact.amountMinor, shown.context.session.pitch.currency)} for {percent(fact.equityBps)}{fact.ownership && <> · founder after {percent(fact.ownership.founderAfterBps)}</>}</p>)}
        {shown.note && <p className="muted" role="note">{shown.note}</p>}
        <ul className="investor-voice-limits">{shown.response.limitations.map(limit => <li key={limit}>{limit}</li>)}</ul>
      </article>}
      {asking && !entry && <button className="button secondary" type="button" disabled={Boolean(state.waiting)} onClick={requestClarification}>
        Ask {name(asking)} for one clarification</button>}
      {asking && entry?.status === "asked" && <div className="investor-voice-clarify">
        <p><strong>{name(asking)} asks:</strong> {entry.question}</p>
        <label>Your clarification (stays on this page)<textarea rows={3} maxLength={1500} value={reply} onChange={event => setReply(event.target.value)} /></label>
        <div className="studio-actions">
          <button className="button" type="button" disabled={reply.trim().length < 1} onClick={() => finishClarification("answer")}>Add to my answer draft</button>
          <button className="button secondary" type="button" onClick={() => finishClarification("skip")}>Skip</button>
        </div>
      </div>}
      {asking && entry && entry.status !== "asked" && <p className="muted">Clarification for {name(asking)} {entry.status === "answered" ? "added to your draft. Review it, then submit your answer as usual." : entry.status}. One clarification per investor.</p>}
    </>}
  </section>;
}
