# Session persistence

Authority: src/features/simulation/negotiation/use-saved-session.ts and session-storage.ts; UI recovery-panel.tsx. Tests: session-storage.test.ts and session-recovery-browser.spec.ts.
Opt-in localStorage is browser/profile/origin-specific, not encrypted/authenticated cloud storage.

Key shark-tank-ai.session; Web Lock shark-tank-ai.session.write. Schema1/rules 1 envelope has exactly: schemaVersion,rulesVersion,sessionId,pitch,actions,saveId,generation,writerId,savedAt.
Check65536 UTF-16 code units before parsing. Validate exact keys, safe integers, currencies, ownership, IDs and maximum seven-action journal(three answers,three counters,one explicit terminal action). Rejected actions do not append. Replay every canonical action through the same reducer; reject the whole invalid history. Retain corrupt/incompatible records until explicit removal/replacement.

Web Locks serialize cooperating writers. Whole-record comparison and identity/revision/generation checks prevent silent overwrite. Acknowledgment applies to the matching run/revision. Queued writes recheck authorization/cancellation so removal/replacement/unmount cannot permit late recreation.
Conflicts stop automatic saving but retain memory. Missing locks, quota and blocked storage allow conservative memory-only continuation and explicit recovery/retry. Browser cleanup can still erase records.
Render stored founder text as React text, never executable markup; do not log it in CI or commit private examples.

AI transcript/new-stage storage requires reviewed schema/version compatibility and consent. Never append unknown fields to version1 or persist GPU objects/camera state/credentials.
Mode changes preserve the same controller, input drafts, journal, counter allowance and saved record. Drafts are not promised to survive reload.
