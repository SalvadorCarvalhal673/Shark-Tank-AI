# Release readiness

Release-candidate review for Issues #80–#90, with the status of every open issue. It covers the stack `feature/phase-4d-ai-integration` → `feature/phase-4e-performance-accessibility` → `feature/gameplay-completion-and-financial-oracle`, built on `develop` at `1d9e5529343267ae1a7fec06e6d21193a428f27a`. Exact results are listed under [Verification results](#verification-results).

## Verdict

**PROJECT NOT YET RELEASE READY — REMAINING BLOCKERS.** The offline development candidate has passed the recorded checks, with requirements still open below. The issue list below records the remaining engineering, external verification and approval requirements. The release scope is desktop browsers on Windows and macOS. Physical phones are out of scope.

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
| Privacy | Saving is optional and local (browser storage only). No server storage, analytics or external AI transmission in production. Enabling the optional voice attempts a same-origin request for the committed journal; the production route returns 503. |
| Monitoring | **None.** Needed before a public release |
| Hosting | **Not chosen.** Needs the group's decision and professor instructions |
| Approval (#90) | **Not given.** Deployment is not performed |

## Issue status

The [GitHub issues](https://github.com/SalvadorCarvalhal673/Shark-Tank-AI/issues) are the status record. The review used [CI for the integrated application](https://github.com/SalvadorCarvalhal673/Shark-Tank-AI/actions/runs/45281883311) and the issue-specific tests and implementation history. Issues #80 and #88 have separate verification and documentation evidence.

| Issue | Remaining requirement |
| --- | --- |
| [#57](https://github.com/SalvadorCarvalhal673/Shark-Tank-AI/issues/57) | The production opening questions are fixed. Clarifications use local draft signals. Implement and test questions based on confirmed pitch context with the same answer budget. |
| [#61](https://github.com/SalvadorCarvalhal673/Shark-Tank-AI/issues/61) | Exact values are displayed separately from the voice. Add and verify narration tied to engine cents, basis points and relative dilution before closing. |
| [#65](https://github.com/SalvadorCarvalhal673/Shark-Tank-AI/issues/65) | Validation rejects malformed and misbound responses, but the optional voice can still display prior-revision text while a new answer is pending. Verify the render and cancellation behavior under delayed replies before closure. |
| [#67](https://github.com/SalvadorCarvalhal673/Shark-Tank-AI/issues/67) | Deferred for the desktop demonstration. Physical Android performance has not been measured. |
| [#68](https://github.com/SalvadorCarvalhal673/Shark-Tank-AI/issues/68) | Deferred for the desktop demonstration. Physical iPhone and iOS Safari performance has not been measured. |
| [#69](https://github.com/SalvadorCarvalhal673/Shark-Tank-AI/issues/69) | Windows Playwright WebKit passed 106/108 in the last full run. Quota recovery and blocked-storage practice failed. Diagnose the intermittent input issue and verify macOS Safari before claiming support. |
| [#70](https://github.com/SalvadorCarvalhal673/Shark-Tank-AI/issues/70) | Transfer sizes, CPU decoding and time to ready are recorded. Capture distinct cold network transfer and GPU compile stages to meet the full acceptance criteria. |
| [#72](https://github.com/SalvadorCarvalhal673/Shark-Tank-AI/issues/72) | Automated narrow-width and target-size checks passed. Real-phone touch and virtual-keyboard tests are deferred for the desktop demonstration. |
| [#74](https://github.com/SalvadorCarvalhal673/Shark-Tank-AI/issues/74) | Automated roles and focus passed. Record spoken VoiceOver and NVDA/browser journeys with human testers. |
| [#77](https://github.com/SalvadorCarvalhal673/Shark-Tank-AI/issues/77) | Run the prepared tasks with five consenting beginners and record anonymized usability findings. |
| [#78](https://github.com/SalvadorCarvalhal673/Shark-Tank-AI/issues/78) | The scripted demo path is covered by automation. Record a timed team presentation with a tested fallback before closure. |
| [#85](https://github.com/SalvadorCarvalhal673/Shark-Tank-AI/issues/85) | The presentation deck and script are referenced. The group needs to verify the deck, complete member names and IDs, and confirm the final test counts. |
| [#86](https://github.com/SalvadorCarvalhal673/Shark-Tank-AI/issues/86) | The automated LunchLoop sequence checks exact figures. Rehearse the live sequence and verify the counter, acceptance and debrief shown to the class. |
| [#87](https://github.com/SalvadorCarvalhal673/Shark-Tank-AI/issues/87) | The local scripted and simplified paths exist. Rehearse the fallback on the presentation machine with provider/network and GPU failure scenarios. |
| [#89](https://github.com/SalvadorCarvalhal673/Shark-Tank-AI/issues/89) | The local production build is verified. Select hosting and review the exact hosted artifact, HTTPS exposure, privacy and monitoring plan before deployment. |
| [#90](https://github.com/SalvadorCarvalhal673/Shark-Tank-AI/issues/90) | Public deployment requires a separate owner decision after the hosting, security and readiness review. |

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

### Integration verification

On Windows, a fresh install, lint, TypeScript, the production build, both dependency audits, and all 342 unit tests passed. Chrome passed all 108 application scenarios. Each of the two full Edge application runs passed 106 scenarios, with different interaction timeouts. Each of the four scenarios passed all three isolated repeats.

The initial Windows WebKit run passed 106 of 108 scenarios. One browser launch failed, and a native Web Locks object replaced the lock rejection override during the test. The keyboard case passed in isolation, and the stable lock fixture passed three repeats. A subsequent full WebKit run passed 106 of 108, with failures in quota recovery and the blocked-storage journey. A follow-up probe observed an empty answer field after Playwright filled it in four of eight attempts. The cause of those intermittent input failures remains unverified. Real Safari remains unverified.

In the isolated software WebGL suite, 19 of 20 scenarios passed initially. The GPU comparison read an empty geometry count during the final remount. The test now waits for the cast and geometry before comparing the same resource counts. Its focused software WebGL rerun passed all 18 switches.
