"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { useSavedSession } from "./use-saved-session";

export function RecoveryPanel({ controller, onNew, active, preview = false }: {
  controller: ReturnType<typeof useSavedSession>;
  onNew: () => void;
  active: boolean;
  preview?: boolean;
}) {
  const [confirmation, setConfirmation] = useState<{ kind: "remove" | "load"; raw: string } | null>(null);
  const panel = useRef<HTMLElement>(null);
  const focusFrame = useRef<number | null>(null);
  const focusEpoch = useRef(0);
  const confirming = useRef(false);
  const mounted = useRef(false);
  const cancelFocus = useCallback(() => {
    focusEpoch.current++;
    if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
    focusFrame.current = null;
  }, []);
  // A new view, unmount or confirmation invalidates obsolete recovery focus.
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      cancelFocus();
      confirming.current = false;
    };
  }, [controller.viewKey, controller.run?.session.id, cancelFocus]);
  const heading = useRef<HTMLHeadingElement>(null);
  const confirmHeading = useRef<HTMLHeadingElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const { slot, checking, status, message, busy } = controller;

  useEffect(() => { if (confirmation) confirmHeading.current?.focus(); }, [confirmation]);
  useEffect(() => {
    if (!active && !preview && !checking && (slot.kind === "valid" || slot.kind === "invalid")) heading.current?.focus();
  }, [active, preview, checking, slot.kind]);

  if (checking) return <section className="form-card" aria-busy="true"><p role="status">Checking saved progress…</p></section>;

  function ask(kind: "remove" | "load", button: HTMLButtonElement) {
    const latest = controller.refresh();
    if (latest.kind !== "valid" && latest.kind !== "invalid") return;
    if (kind === "load" && latest.kind !== "valid") return;
    cancelFocus();
    trigger.current = button;
    setConfirmation({ kind, raw: latest.raw });
  }

  async function confirm() {
    if (!confirmation || confirming.current) return;
    confirming.current = true;
    const epoch = ++focusEpoch.current;
    if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
    if (confirmation.kind === "remove") await controller.discard(confirmation.raw);
    else controller.resume(confirmation.raw);
    if (!mounted.current || epoch !== focusEpoch.current) return;
    setConfirmation(null);
    confirming.current = false;
    focusFrame.current = requestAnimationFrame(() => {
      if (!mounted.current || epoch !== focusEpoch.current) return;
      focusFrame.current = null;
      const focused = document.activeElement;
      if (focused !== document.body && focused && !panel.current?.contains(focused)) return;
      const target = document.querySelector<HTMLElement>(".practice-room h2") ??
        document.querySelector<HTMLElement>('input[name="startup"]') ??
        document.querySelector<HTMLElement>('[aria-label="Pitch preview"] h2') ?? heading.current;
      target?.focus();
    });
  }

  const problem = slot.kind === "invalid" ? {
    malformed: "The saved information is not valid JSON.",
    oversized: "The saved record exceeds this version’s size limit.",
    incompatible: "This save uses an unsupported storage or negotiation version.",
    schema: "The saved record has missing, unexpected, or invalid fields.",
    "invalid-replay": "The saved actions could not be replayed safely.",
  }[slot.reason] : null;

  return <section ref={panel} className="form-card recovery-panel" aria-label="Saved progress">
    <p aria-label="Save status" aria-live="polite">Save status · {status}</p>
    {message && <p className="storage-message" aria-live="polite">{message}</p>}
    {!active && !preview && slot.kind === "valid" && <>
      <h2 ref={heading} tabIndex={-1}>Return to your pitch.</h2>
      <p className="startup-name">{slot.run.session.pitch.startup}</p>
      <p>{slot.run.session.stage === "finished" ? "Completed debrief" :
        slot.run.session.stage === "questions" ? "Questions answered · " + slot.run.session.answers.length + " of 3" :
          "Negotiation · " + slot.run.session.roundsUsed + " of 3 counters used"}</p>
      <p>Saved {new Date(slot.envelope.savedAt).toLocaleString()}</p>
      <p className="muted">Resuming enables saving here when coordinated storage is available. Another tab may have this session open.</p>
      <div className="preview-actions">
        <button className="button" disabled={busy} type="button" onClick={() => controller.resume(slot.raw)}>Resume saved session</button>
        <button className="button secondary" disabled={busy} type="button" onClick={onNew}>Start a new session</button>
      </div>
    </>}
    {problem && <>
      <h2 ref={heading} tabIndex={-1}>Saved progress needs attention.</h2>
      <p>{problem} It will be retained until you explicitly remove or replace it.</p>
      {!active && <button className="button" disabled={busy} type="button" onClick={onNew}>Start a new session</button>}
    </>}
    {slot.kind === "unavailable" && <p>Storage could not be read. You can practice without saving. If removal is unavailable here, use your browser’s site-data settings to remove saved information.</p>}
    {active && <p className="muted">An action may be lost if the browser closes before it is saved. Other tabs can change the single saved slot.</p>}
    {status === "Conflict detected" && active && <>
      <p>Automatic saving has stopped. Your current progress is still available here.</p>
      <div className="preview-actions">
        {slot.kind === "valid" && <button type="button" className="button" disabled={busy}
          onClick={(event) => ask("load", event.currentTarget)}>Load saved progress</button>}
        <button type="button" className="button secondary" disabled={busy} onClick={controller.memoryOnly}>Continue without saving</button>
      </div>
    </>}
    {status === "Saving unavailable" && active && <div className="preview-actions">
      {controller.canRetrySave && <button className="button" disabled={busy} type="button" onClick={controller.retry}>Retry saving</button>}
      <button className="button secondary" disabled={busy} type="button" onClick={controller.memoryOnly}>Continue without saving</button>
    </div>}
    <div className="preview-actions">
      {(slot.kind === "valid" || slot.kind === "invalid") && <button type="button" disabled={busy}
        className="button secondary" onClick={(event) => ask("remove", event.currentTarget)}>Remove saved information</button>}
      <button type="button" disabled={busy} className="button secondary" onClick={controller.refresh}>Check saved information</button>
    </div>
    {confirmation && <div className="inline-offer-panel" role="group" aria-label="Saved information confirmation">
      <h3 ref={confirmHeading} tabIndex={-1}>{confirmation.kind === "remove" ? "Remove saved information?" : "Load saved progress?"}</h3>
      <p>{confirmation.kind === "remove"
        ? "This permanently removes the saved pitch and answers. Your current in-memory run will stop saving."
        : "Loading will replace this tab’s current in-memory progress. Unsaved changes in this tab will be lost."}</p>
      <div className="preview-actions">
        <button className="button" disabled={busy} type="button" onClick={confirm}>
          {confirmation.kind === "remove" ? "Confirm removal" : "Confirm load"}
        </button>
        <button className="button secondary" disabled={busy} type="button" onClick={() => {
          setConfirmation(null);
          trigger.current?.focus();
        }}>Cancel</button>
      </div>
    </div>}
  </section>;
}
