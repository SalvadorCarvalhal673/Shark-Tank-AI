# Phase 4D — investor voice integration

Issues #57–#66. Built on `develop` at `1d9e552`. The existing Phase 4C/#56 modules (contracts, validation, lifecycle, fallback, privacy, budgets and the `/api/investor` route) are reused unchanged. This phase connects them to the actual application.

## What the founder sees

The practice room (`/simulate`) has an **Investor voice** panel. **It is off by default.**

When the founder switches it on:

1. **Narration.** Each committed moment produces one request:
   - the opening question;
   - feedback on the founder's latest answer;
   - an explanation of the latest counter;
   - coaching on the outcome.

   The request is bound to the session, revision, investor, request ID and lifecycle epoch (`narrationTarget`, `buildVoiceRequest` in `src/features/ai/client.ts`).
2. **Validation.** The browser rebuilds the conversation context from the same committed journal. It accepts a reply only if it passes the same `parseAppResponse` / `validateProvider` checks the server uses:
   - the reply must carry the same binding;
   - it must contain no figures, commitments ("I invest", "deal accepted") or instruction-injection phrases;
   - any observation must quote the founder's own words.

   Anything else is discarded (#65).
3. **Engine figures.** Figures shown beside the voice come from the engine's committed offers (`engineFacts`) and never from AI text (#61). Cash stays in integer minor units and equity in basis points, and the cap table reconciles to 10,000 bp.
4. **Personas.** Maya, Adrian and Sofia use the reviewed personas (`personas.ts`). The mock replies differ by investor, while the policies stay identical (#59).
5. **Clarification (#60).** The founder may ask the investor whose question is open for **one** clarification. The flow uses the approved `clarification.ts` state machine:
   - the reply stays on the page;
   - it is copied into the answer draft only when the founder clicks "Add to my answer draft";
   - it is never submitted automatically;
   - it is not saved, so save schema 1 is unchanged.

   The founder can skip. A clarification is not a fourth binding answer.
6. **Coaching (#62).** The `outcome` purpose narrates the committed outcome. The provenance label and limitations are always displayed, and observations are labelled as unverified quotes of the founder's own words.
7. **Recovery (#64).** A disabled route (503), rate limit (429), server error, network failure, 15-second timeout or invalid reply shows the reviewed scripted continuation (`scriptedFallback`). It comes with a truthful note saying what happened and that answers, drafts and saves are unchanged. A stale result (409) or a cancelled one (newer revision, unmount, switch off) is discarded silently.
8. **Lifecycle.** `RequestLifecycle` gates every request: a new revision, investor or switch-off cancels the older request, and only the current request can be consumed (#63).

**No action is ever dispatched by the voice.** It receives only a callback that appends confirmed clarification text to the local draft.

## Scripted voice: no provider needed

`src/features/ai/scripted-voice.ts` is used whenever no validated AI reply is shown, including in the production build. It is deterministic, rules-based and labelled "Scripted voice (rules-based)". It provides:

- **#57, #60:** a draft-aware clarification question. It asks about the first signal the rules cannot yet detect in the founder's current draft, and the draft never leaves the page. It asks nothing when nothing is missing, and it names repeated answers.
- **#58, #59:** feedback on committed answers in each investor's persona. Counter and outcome text restate committed engine reasons only.
- **#62:** coaching suggestions drawn from the same evidence rubric as the scorecard and from the outcome. They are suggestions for the next practice, never grades.

Tests: `tests/ai-scripted-voice.test.ts`, plus an offline case in `tests/ai-voice-browser.spec.ts`.

## What is sent

Only the committed pitch and action journal, with no drafts. Consent is `null`, because no external provider is wired. The server already refuses to send founder text to a named provider without matching consent.

## Activation status

| Environment | Route | What the founder gets |
| --- | --- | --- |
| Production build (`npm start`) | Disabled (503); `LIVE_INFERENCE_ENABLED` is literally `false` | Scripted continuation with an honest "not available in this build" note |
| Development with `SHARK_AI_BACKEND_MODE=mock` | Mock provider, no network | Validated mock voice labelled "Development mock voice" |
| Live provider | **Not activated** | Blocked: see below |

**Live AI is not active, and no Live AI result is claimed anywhere.** The activation blockers in [BACKEND.md](BACKEND.md) still apply:

- trusted session ownership;
- durable distributed rate and cost limits;
- an approved provider account, transport and fresh pricing/retention review;
- consent UI bound to a named provider;
- SE-001 and explicit deployment approval.

## Evidence (#66)

**`tests/ai-client-integration.test.ts`** drives the real route in mock mode through the browser client. It checks:

- one narration target per committed moment;
- per-investor replies;
- no figures in AI text;
- engine figures and cap-table reconciliation;
- eight tampered replies rejected: figures, "deal accepted", injection, wrong revision, wrong investor, false provenance, invented quote, extra fields;
- disabled, network, timeout and cancellation recovery;
- a stale binding rejected;
- the run unchanged by every failure.

**`tests/ai-voice-browser.spec.ts`** runs on the production build. It checks:

- the voice is off by default and makes no request;
- the disabled-route fallback;
- drafts are kept;
- one clarification per investor, copied only on click and never submitted;
- a contradictory reply is discarded without showing its figures;
- a rate limit gives an honest note while the practice continues.

The existing adversarial suites (`ai-adversarial-sequences`, `audit-ai-inputs`, `audit-ai-races`, `ai-validation`, `ai-privacy`, `ai-budgets`) continue to pass.

**Limitation:** validation is structural and heuristic. It cannot prove semantic truth or catch every linguistic injection. This is why AI text has no financial channel and the engine figures are shown separately.
