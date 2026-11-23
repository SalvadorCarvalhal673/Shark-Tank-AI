"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useState, type ReactNode } from "react";
import { INVESTOR_ORDER, NEGOTIATION_RULES } from "../simulation/negotiation/investor-policy";
import type { NegotiationSession } from "../simulation/negotiation/session";
import { activeSpeaker, sceneCue, type CameraView } from "./model";
import styles from "./practice-studio.module.css";

const Scene = dynamic(() => import("./scene").then(module => module.StudioScene), {
  ssr: false,
  loading: () => <p role="status">Loading the 3D studio…</p>,
});

class StudioBoundary extends Component<{ children: ReactNode; onFailure: (reason: string) => void }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onFailure("The 3D studio could not load. Continue with the existing practice controls.");
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function PracticeStudio({ session, view, onViewChange }: {
  session: NegotiationSession;
  view: CameraView;
  onViewChange: (view: CameraView) => void;
}) {
  const [enabled, setEnabled] = useState(false);
  const [failure, setFailure] = useState("");
  const [retrying, setRetrying] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const speaker = activeSpeaker(session).view;

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(preference.matches);
    preference.addEventListener("change", update);
    update();
    return () => preference.removeEventListener("change", update);
  }, []);

  const failed = useCallback((reason: string) => {
    setFailure(reason);
    setEnabled(false);
  }, []);

  async function toggleStudio() {
    if (enabled) {
      setEnabled(false);
      return;
    }
    if (failure) {
      setRetrying(true);
      try {
        const { clearFailedAsset } = await import("./scene");
        clearFailedAsset();
      } catch {
        failed("The 3D studio could not load. Continue with the existing practice controls.");
        return;
      } finally {
        setRetrying(false);
      }
    }
    setFailure("");
    setEnabled(true);
  }

  return (
    <section className={styles.studio} aria-label="Investment studio">
      <div className={styles.toolbar}>
        <button type="button" className="button secondary" onClick={toggleStudio} disabled={retrying}>
          {enabled ? "Use simplified view" : failure ? "Retry 3D studio" : "Enter 3D studio"}
        </button>
        {enabled && (
          <label>
            <input type="checkbox" checked={prefersReducedMotion || reduceMotion} disabled={prefersReducedMotion}
              onChange={event => setReduceMotion(event.target.checked)} /> Reduce studio motion
          </label>
        )}
      </div>
      {failure && <p role="status">{failure}</p>}
      {enabled && (
        <>
          <div className={styles.viewport} data-testid="practice-studio" data-view={view} data-revision={session.revision}
            data-speaker={speaker}>
            <StudioBoundary onFailure={failed}>
              <Scene view={view} selected={view === "panel" ? null : view} session={session}
                reducedMotion={prefersReducedMotion || reduceMotion} fault=""
                onSelect={onViewChange} onFailure={failed} />
            </StudioBoundary>
          </div>
          <div className={styles.toolbar} role="group" aria-label="Studio camera">
            <button type="button" className="button secondary" aria-pressed={view === "panel"}
              onClick={() => onViewChange("panel")}>Full panel</button>
            {INVESTOR_ORDER.map(id => {
              const cue = sceneCue(session, id);
              return <button key={id} type="button" className="button secondary" aria-pressed={view === id}
                data-clip={cue.clip} onClick={() => onViewChange(id)}>Frame {NEGOTIATION_RULES.investors[id].name}</button>;
            })}
          </div>
        </>
      )}
    </section>
  );
}
