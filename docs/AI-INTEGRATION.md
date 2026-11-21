# Phase 4C architecture — integrated offline

No provider SDK, operational endpoint, actual credential, streaming or transcript persistence is implemented. Existing investor responses and evidence patterns are scripted/deterministic.

## Boundary

A future server-only route validates bounded request size, consent, session/revision/request identity and cost/rate/time limits. Provider output is untrusted structured data requiring runtime validation. It may supply narration or nonbinding evidence proposals for founder confirmation.
Confirmed answers/actions still go through the current controller/reducer. Engine-owned finance, cash ceilings, concession floors, offers and accepted/terminal status remain authoritative. AI must not independently calculate values, accept/reject binding offers or mutate counters.
Personality differs from policy: Maya challenges finance, Adrian growth, Sofia delivery; tone cannot change investment rules.

## Required decisions

Phase 4C issues cover provider evaluation, schemas, personality prompts, output validation, evidence confirmation, bounded clarifications, server API, server-only credentials, cancellation/stale replies, scripted fallback, versioned transcripts, privacy/consent, cost/request limits and evaluations. Review those before Phase 4D implementation. Never silently expand three binding answers/seven saved actions into unlimited chat.

## Privacy and failures

Keys never use NEXT_PUBLIC, localStorage, fixtures or logs. Use ignored local configuration or approved secret stores only after integration approval. External founder-data transmission needs explicit consent, retention limits and deletion policy.
Ignore/cancel responses after run/revision/context changes. Do not inject model HTML or dispatch model-suggested actions directly. Timeouts, invalid JSON, contradictions and rate limits preserve progress and offer honest scripted continuation. Thinking indicators correspond to actual processing.
No paid/live provider request is required by setup, normal tests or this handover.

## Isolated Phase4C architecture

[Phase4C modules and integration contracts](ai/README.md) now provide executable offline contracts, mock services, validation, evidence/clarification models, safe configuration, lifecycle, fallback, consent, budgets and evaluation. These modules are not connected to gameplay or rendering. The existing application remains scripted. All 14 contributions and audit corrections are integrated through PR #106, merge 27043d4d8f3da4ecfe701e95975a27fdd51b6e90. Post-merge CI passed. No live AI or storage migration is implied. See [group handover](PHASE-4C-HANDOVER.md).
