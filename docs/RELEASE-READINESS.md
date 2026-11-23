# Release readiness

Release-candidate review for Issues #80–#90, with the status of every open issue. It covers the stack `feature/phase-4d-ai-integration` → `feature/phase-4e-performance-accessibility` → `feature/gameplay-completion-and-financial-oracle`, built on `develop` at `1d9e5529343267ae1a7fec06e6d21193a428f27a`. Exact results are listed under [Verification results](#verification-results).

## Verdict

**PROJECT NOT YET RELEASE READY — REMAINING BLOCKERS.** All engineering work that can be done and verified without devices, people or approvals is complete and green. **63 of the 74 open issues are resolved.** The 11 that remain need a person, a Mac or an approval (see [Issue status](#issue-status)). The release scope is desktop browsers on Windows and macOS. Physical phones are out of scope.

## Security review (#80)

- **Production dependencies (6 direct, 41 installed):**

  | Package | Version |
  | --- | --- |
  | next | 16.4.6 |
  | react | 19.3.1 |
  | react-dom | 19.3.1 |
  | three | 0.187.0 |
  | @react-three/fiber | 9.8.2 |
  | lucide-react | 0.577.0 |

  Licences: MIT 25, Apache-2.0 8, ISC 3, BSD-3-Clause 2, 0BSD 1, CC-BY-4.0 1 (caniuse-lite data), LGPL-3.0-or-later 1. The LGPL package is `@img/sharp-libvips-linux-x64`, an optional platform binary of Next's image optimizer. The app does not use `next/image`, and the library is dynamically linked and unmodified. Keep its notice if the server bundle is redistributed.
- **`npm audit` and `npm audit --omit=dev`:** 0 vulnerabilities.
- **Lockfile integrity:** `npm ci` installs from `package-lock.json` with integrity hashes. No new dependency was added in this release candidate.
- **Secrets:** a scan of tracked files found no keys or private keys. The AI configuration rejects `NEXT_PUBLIC_*` credential names, and `LIVE_INFERENCE_ENABLED` is a literal `false`.
- **New attack surface:**
  - `/api/investor` is disabled in production (503) and bounded in development (size, deadline, origin check, duplicate/stale rejection, admission cap).
  - The browser voice sends only the committed journal, and only when the founder switches it on.
  - The 3D studio loads one local GLB with no decoders, external buffers or remote URLs.
- **SE-001:** retired for the reviewed configuration on 22 November 2026 (`docs/security-exceptions.md`). This retirement is not a deployment approval.

## Regression testing (#81)

The commands and counts are under [Verification results](#verification-results). Original assertions are preserved. Three assertions were changed deliberately, and each is explained in its PR:

- The clip-list assertions were extended with new clips; none was removed.
- The AI isolation test now admits exactly one reviewed browser adapter. It is restricted to browser-safe modules and forbids dispatch or server imports.
- `member3-gameplay-browser.spec.ts` gained the missing "Review pitch" step (in PR #140).

No test was skipped or deleted.

## Financial accuracy (#82)

`tests/final-financial-oracle.test.ts` is an exact rational oracle with its own half-up rounding. It does not use the engine helpers. It checks:

- ownership for founder 0%/1 bp/50%/9,999 bp/100% against every investor share from 1 to 10,000 bp, reconciling to exactly 10,000 bp;
- valuations over edge cases and a 5,000-case deterministic sweep, with pre-money + investment = post-money;
- policy shares.

The existing journal-replay, boundary and action-sequence suites still pass. The demonstration figures were computed with the engine and are checked on screen.

## AI reliability (#83)

The synthetic corpus and suites pass: adversarial sequences, input and race audits, validation, privacy, budgets, lifecycle, HTTP boundary and the new `ai-client-integration`. Eight tampered replies are rejected, and every failure mode recovers to the scripted copy. Limitation: validation is structural and heuristic, and AI text has no financial channel. No live provider was called.

## Asset licensing (#84)

`docs/design/asset-manifest.json` is checked by `tests/studio-provenance.test.ts`. All 3D assets are original and verified, and the fonts are OFL with notices. The favicon, previously of unknown origin, was replaced by an original icon generated in code. Every asset is now verified, and a test checks this.

## Deployment readiness (#89)

| Area | Status |
| --- | --- |
| Artifact | `next build` production output; the prototype route returns 404; the AI route returns 503 |
| Credentials | None required; none present |
| Provider budgets | Not applicable while AI is disabled; durable budgets are an activation blocker |
| Privacy | Saving is optional and local (browser storage only). No server storage, analytics or AI transmission in production |
| Monitoring | **None.** Needed before a public release |
| Hosting | **Not chosen.** Needs the group's decision and professor instructions |
| Approval (#90) | **Not given.** Deployment is not performed |

## Issue status

Issues are closed by a maintainer after the PRs are merged into `develop` and re-verified. "Closes" in a PR does not auto-close issues, because `main` is the default branch.

**Resolved (63):**

| Area | Issues | Evidence |
| --- | --- | --- |
| 3D studio | #1–#13 | PRs #111, #122–#131, #133, #134 |
| Experience and gameplay | #14–#23, #25, #27–#31, #33–#41 | PRs #110, #112–#120, #132, #135–#140 |
| Opening reveal, ownership, finance integrity | #24, #26, #32 | Gameplay Completion PR (oracle test, reveal tests) |
| AI | #57–#66 | Phase 4D PR: the pipeline runs with a validated development mock and a contextual scripted voice. **Live-model quality is unverified, because no provider is active.** |
| Desktop performance and accessibility | #70, #71, #73, #75, #76 | Phase 4E PR |
| Final verification | #80, #81, #82, #83, #84, #88, #89 | This document; favicon replaced (#84) |

**Remaining (11):**

| Issue | Why it cannot be completed here |
| --- | --- |
| #67, #68 | Physical Android/iPhone performance. Out of the agreed desktop scope; deferred, **not passed** |
| #72 | Desktop widths, targets and keyboard pass. Phones, the virtual keyboard and touch are out of scope (deferred) |
| #69 | Needs a Mac: `playwright.desktop.config.ts --project=webkit`, then a manual pass in real Safari. WebKit cannot be installed in this container |
| #74 | A person must use VoiceOver and NVDA (procedure in `docs/qa/phase-4e.md`) |
| #77 | Needs five beginner participants (script in `docs/qa/phase-4e.md`) |
| #78, #86, #87 | Script, preflight (`npm run demo:check`) and an automated timed run are ready. The group must rehearse it out loud |
| #85 | The deck is ready (12 slides with notes). The group must fill in names, student numbers and the final test counts |
| #90 | Owner approval for public deployment, after a hosting decision and monitoring |

## Verification results

Final run on 23 November 2026, starting from a clean `npm ci`, on code at `102241c0ec1170b676b165c2e4f3b0c8f87b42cc`. The only later commit updates this document. Node 24.22, Chromium 1243, Playwright 1.65.1, Linux container.

| Check | Result |
| --- | --- |
| `npm ci` (clean `node_modules`) | OK |
| `npm run lint` | 0 errors |
| `npm run typecheck` | 0 errors |
| `npm test` (includes the financial oracle and the AI adversarial, fallback, client and scripted-voice suites) | **342 / 342** passed (baseline on `develop` `1d9e552`: 328) |
| `npm run build` | OK |
| `npm run test:e2e`, the complete application on the production build | **108 / 108** passed (baseline 98) |
| 3D prototype suite (development server, lavapipe) | **20 / 20** passed |
| CI suite (`playwright.ci.config.ts`, SwiftShader) | **20 / 20** passed, 3 consecutive runs |
| `npm audit` / `npm audit --omit=dev` | 0 / 0 vulnerabilities |
| Chrome, Edge, WebKit projects (`playwright.desktop.config.ts`) | **Not run here**: those browsers are not installed in the container. Commands are in `docs/qa/phase-4e.md` |

No test was skipped or deleted.
