"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FounderAction, NegotiationPitch } from "./session";
import {
  advanceRun, browserStorageHost, createRun, readSlot, removeSave, STORAGE_KEY, writeSave,
  type SessionRun, type StoredSlot,
} from "./session-storage";

export type SaveStatus = "Saving" | "Saved" | "Saving unavailable" | "Conflict detected" | "Not saving";
type Binding = {
  saveId: string;
  raw: string | null;
  savedRevision: number;
  enabled: boolean;
  initial: boolean;
};

export function useSavedSession() {
  const [host] = useState(browserStorageHost);
  const [viewKey, setViewKey] = useState("");
  const [run, setRun] = useState<SessionRun | null>(null);
  const [slot, setSlot] = useState<StoredSlot>({ kind: "empty", raw: null });
  const [checking, setChecking] = useState(true);
  const [canRetrySave, setCanRetrySave] = useState(false);
  const [acknowledged, setAcknowledged] = useState<{ sessionId: string; revision: number } | null>(null);
  const [status, setStatus] = useState<SaveStatus>("Not saving");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const mounted = useRef(false);
  const currentRun = useRef(run);
  const binding = useRef<Binding | null>(null);
  const writer = useRef<string | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const operating = useRef(false);
  const operation = useRef(0);

  const refresh = useCallback(() => {
    const next = readSlot(host);
    setSlot(next);
    const token = binding.current;
    if (token && (next.kind === "unavailable" || next.raw !== token.raw)) {
      token.enabled = false;
      setStatus(next.kind === "unavailable" ? "Saving unavailable" : "Conflict detected");
      setMessage(next.kind === "unavailable"
        ? "Storage could not be read. Your current progress remains in memory."
        : "Saved progress changed in another context. Automatic saving has stopped.");
    }
    return next;
  }, [host]);

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    // Hydration reads the external store after the initial client commit.
    Promise.resolve().then(() => {
      if (!cancelled) {
        refresh();
        setChecking(false);
      }
    });
    function changed(event: StorageEvent) {
      if (event.key !== null && event.key !== STORAGE_KEY) return;
      refresh();
    }
    window.addEventListener("storage", changed);
    return () => {
      cancelled = true;
      mounted.current = false;
      window.removeEventListener("storage", changed);
    };
  }, [host, refresh]);

  function writerId() {
    if (writer.current === null) writer.current = crypto.randomUUID();
    return writer.current;
  }

  const persist = useCallback((snapshot: SessionRun, token: Binding) => {
    queue.current = queue.current.catch(() => {}).then(async () => {
      const authorized = () => mounted.current && binding.current === token && token.enabled;
      if (!authorized()) return;
      // Older queued snapshots are obsolete; equal revisions still verify access and identity.
      if (token.savedRevision > snapshot.session.revision) return;
      const result = await writeSave(host, {
        run: snapshot, expectedRaw: token.raw, saveId: token.saveId,
        writerId: writerId(), savedAt: Date.now(), replacement: token.initial, authorized,
      });
      if (!authorized()) return;
      if (result.kind === "saved") {
        token.raw = result.slot.raw;
        token.savedRevision = snapshot.session.revision;
        token.initial = false;
        setSlot(result.slot);
        setAcknowledged({ sessionId: snapshot.session.id, revision: snapshot.session.revision });
        setStatus(currentRun.current?.session.revision === token.savedRevision ? "Saved" : "Saving");
        setMessage("");
      } else if (result.kind === "conflict") {
        token.enabled = false;
        setSlot(result.slot);
        setStatus("Conflict detected");
        setMessage("Saved progress changed. Your current progress remains in memory.");
      } else if (result.kind === "unavailable") {
        token.enabled = false;
        setStatus("Saving unavailable");
        setMessage("Your progress remains in memory. Saving may be blocked, full, or unavailable. You can retry.");
      }
    });
  }, [host]);

  useEffect(() => {
    currentRun.current = run;
    const token = binding.current;
    if (run && token?.enabled) {
      persist(run, token);
    }
  }, [run, persist]);

  function memoryOnly() {
    operation.current++;
    if (binding.current) binding.current.enabled = false;
    binding.current = null;
    setCanRetrySave(false);
    setAcknowledged(null);
    setStatus("Not saving");
    setMessage("This run will continue in memory. Existing saved information is retained until you explicitly remove or replace it.");
  }

  async function begin(pitch: NegotiationPitch, save: boolean, expectedRaw: string | null): Promise<boolean> {
    if (operating.current) return false;
    const next = createRun(crypto.randomUUID(), pitch);
    if (!next) return false;
    memoryOnly();
    setMessage("");
    if (!save) {
      setViewKey(crypto.randomUUID());
      setRun(next);
      return true;
    }
    operating.current = true;
    setBusy(true);
    setStatus("Saving");
    const epoch = ++operation.current;
    const token: Binding = { saveId: crypto.randomUUID(), raw: expectedRaw, savedRevision: -1, enabled: true, initial: true };
    binding.current = token;
    setCanRetrySave(true);
    try {
      const authorized = () => mounted.current && binding.current === token && token.enabled && epoch === operation.current;
      const result = await writeSave(host, {
        run: next, expectedRaw, saveId: token.saveId, writerId: writerId(),
        savedAt: Date.now(), replacement: true, authorized,
      });
      if (!authorized()) return false;
      if (result.kind === "conflict") {
        binding.current = null;
        setSlot(result.slot);
        setStatus("Conflict detected");
        setMessage("The saved record changed before replacement. Review the latest saved progress and confirm again.");
        return false;
      }
      if (result.kind === "saved") {
        token.raw = result.slot.raw;
        token.savedRevision = 0;
        token.initial = false;
        setSlot(result.slot);
        setAcknowledged({ sessionId: next.session.id, revision: 0 });
        setStatus("Saved");
      } else {
        token.enabled = false;
        setStatus("Saving unavailable");
        setMessage("Saving is unavailable. This run is in memory. Use Retry saving if you want to try again.");
      }
      setViewKey(crypto.randomUUID());
      setRun(next);
      return true;
    } finally {
      operating.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  function resume(expectedRaw: string): boolean {
    if (operating.current) return false;
    const latest = refresh();
    if (latest.kind !== "valid" || latest.raw !== expectedRaw) {
      setMessage("Saved progress changed. Review the current record before loading it.");
      return false;
    }
    memoryOnly();
    let coordinated = false;
    try { coordinated = Boolean(navigator.locks?.request); } catch { /* Memory-only fallback. */ }
    binding.current = {
      saveId: latest.envelope.saveId, raw: latest.raw, savedRevision: latest.run.session.revision,
      enabled: coordinated, initial: false,
    };
    setCanRetrySave(true);
    setAcknowledged({ sessionId: latest.run.session.id, revision: latest.run.session.revision });
    setStatus(coordinated ? "Saved" : "Saving unavailable");
    setMessage(coordinated
      ? "Resumed. If another tab saves a change first, this tab will stop saving."
      : "Coordinated writes are unavailable. You can continue in memory or retry saving.");
    setViewKey(crypto.randomUUID());
    setRun(latest.run);
    return true;
  }

  function dispatch(action: FounderAction) {
    setRun((current) => current ? advanceRun(current, action) : current);
  }

  function retry() {
    const token = binding.current;
    if (!run || !token || status === "Conflict detected") {
      refresh();
      return;
    }
    token.enabled = true;
    setStatus("Saving");
    setMessage("");
    persist(run, token);
  }

  async function discard(expectedRaw: string | null) {
    if (operating.current) return;
    operating.current = true;
    setBusy(true);
    memoryOnly();
    const epoch = operation.current;
    try {
      const result = await removeSave(host, expectedRaw, () => mounted.current && epoch === operation.current);
      if (!mounted.current || epoch !== operation.current) return;
      if (result.kind === "removed") {
        setSlot({ kind: "empty", raw: null });
        setMessage("Saved information removed. This run will not be saved again.");
      } else if (result.kind === "conflict") {
        setSlot(result.slot);
        setStatus("Conflict detected");
        setMessage("The record changed. The newer saved information was not removed.");
      } else if (result.kind === "unavailable") {
        refresh();
        setStatus("Saving unavailable");
        setMessage("Removal failed. Saved information may remain. If coordinated access is unavailable, remove this site's data using browser settings.");
      }
    } finally {
      operating.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  async function leave(): Promise<NegotiationPitch | null> {
    if (operating.current || !run) return null;
    operating.current = true;
    setBusy(true);
    try {
      const token = binding.current;
      if (token?.enabled) persist(run, token);
      await queue.current;
      const pitch = run.session.pitch;
      memoryOnly();
      setRun(null);
      refresh();
      return pitch;
    } finally {
      operating.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  const displayedStatus = status === "Saved" && run &&
    (acknowledged?.sessionId !== run.session.id || acknowledged.revision < run.session.revision) ? "Saving" : status;

  return { run, viewKey, canRetrySave, slot, checking, status: displayedStatus, message, busy, begin, resume,
    dispatch, discard, retry, refresh, memoryOnly, leave };
}
