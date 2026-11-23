# Phase 4E — performance, accessibility and usability evidence

Issues #67–#78. The table separates what was verified automatically in a Linux container from what needs a physical device or a human tester. **Automated widths and emulated devices are not physical-device evidence.**

**Release scope (agreed 23 November 2026):** desktop browsers on Windows and macOS, namely Chrome, Edge and Safari. Physical Android and iPhone testing is **out of scope** for this release. Issues #67 and #68, and the real-phone part of #72, are deferred. They have **not** passed.

**Desktop browser matrix:** `playwright.desktop.config.ts` runs the full browser suite (108 tests) per browser against the production build:

| Machine | Command (after `npm ci` and `npm run build`) |
| --- | --- |
| Windows | `npx playwright test --config playwright.desktop.config.ts --project=chrome --project=msedge` |
| macOS | `npx playwright install webkit` then `npx playwright test --config playwright.desktop.config.ts --project=chrome --project=webkit` |

Minimum browser versions, from the features the app uses (CSS `:has()`, `Array.prototype.findLast`, Web Locks, WebGL2): Chrome/Edge 105+, Safari 16.4+. Playwright WebKit is close to Safari but is not Safari, so do one manual pass in real Safari as well.

| Issue | Status | Evidence | What is still needed |
| --- | --- | --- | --- |
| #67 Android performance | **Out of scope (deferred)** | Software-renderer measurements only (`docs/design/performance.md`) | A run on a real Android phone using the procedure below |
| #68 iPhone performance | **Out of scope (deferred)** | As above | A run on a real iPhone using the procedure below |
| #69 Safari/WebKit | **Incomplete** | Windows Playwright WebKit passed 106/108 in the latest full run. Quota recovery and blocked-storage practice still failed. See [integration evidence](../RELEASE-READINESS.md#integration-verification). | Diagnose intermittent input and verify real macOS Safari. |
| #70 3D loading | Verified (automated) | The scene loads only on "Enter 3D studio" (dynamic import), so the HTML controls work before and without it. The cast is the only 3D download: 743 KB, 171 KB gzip. There are no external decoders, buffers or remote URLs (`tests/studio-provenance.test.ts`). Decode and time-to-ready figures are in `scripts/measure-studio.mjs` / `docs/design/performance.md` | Cold-load timings on real phones |
| #71 GPU resources | Verified (automated) | `prototype.spec.ts` "repeated 3D and simplified switches…": 18 mounts with no "too many WebGL contexts" warning, and identical geometry/texture/skeleton/mixer/draw-call counts before and after; stable over 30 view changes plus a hidden/visible cycle (`measure-studio.mjs`) | Long sessions on real devices |
| #72 Mobile responsive | Verified at automated widths | `accessibility-browser.spec.ts`: every practice stage at 320 and 375 px has no horizontal scroll, and all targets are at least 24×24 px (WCAG 2.2 AA 2.5.8; header links and checkboxes were enlarged for this). The studio fits 320–1440 px (`prototype.spec.ts`) | Virtual keyboard and touch on real phones |
| #73 Keyboard | Verified (automated) | `accessibility-browser.spec.ts`: a complete keyboard-only run from scenario choice to debrief, reaching every control with Tab and activating it with Enter. Recovery, focus and announcement tests in `session-recovery-browser`, `qa-browser` and `issue105-browser`. The canvas has HTML equivalents (investor buttons, simplified view) | — |
| #74 Spoken screen reader | **Blocked: needs a human** | Roles, names and live regions are tested automatically | VoiceOver (macOS/iOS) and NVDA or TalkBack sessions, recorded below |
| #75 Reduced motion | Verified (automated) | Global CSS removes transitions. The studio holds a still pose for every clip and cuts the camera instead of moving it (`prototype.spec.ts` reduced-motion cases, `REDUCED_MOTION_POSE`). The debrief has its own reduced-motion test | — |
| #76 Renderer failure | Verified (automated) | `prototype.spec.ts`: WebGL2 unavailable, real context loss, asset 404 and abort, and retry each keep the session, journal, drafts and saves, with truthful messages | — |
| #77 Beginner usability | **Blocked: needs participants** | Script below | Five sessions with beginners |
| #78 Five-minute demo | Script ready; rehearsal needed | `docs/presentation/demo-script.md` | A timed human rehearsal |

## Hidden-tab renderer issue

Reported as intermittent. PR #121 guards pending animation frames while hidden, and the camera now keeps rendering until it actually arrives (Issue #11 fix and the camera-timing fix in PR #136). The visibility test was run 4 times under a single CPU core with the CI SwiftShader configuration, and passed each time. The last failures seen on CI were a slow-motion camera on slow renderers, not rendering while hidden. Those were fixed at the cause (`cameraEase`), not by loosening the test.

## Physical-device procedure (#67, #68, #72)

1. On a laptop on the same Wi-Fi, run `npm run build && npm start -- --hostname 0.0.0.0`.
2. On the phone, open `http://<laptop-ip>:3000/simulate` and complete one practice. Then open `/prototype/studio` (development server only) and enter the 3D studio.
3. Record the following:
   - device model, OS and browser;
   - time to the first question;
   - time for "Enter 3D studio" until all investors are visible;
   - the `fps` and `frameP95Ms` diagnostics in the panel view and in one selected investor;
   - whether the virtual keyboard covers the answer box;
   - any touch target that is hard to hit;
   - battery temperature after 5 minutes.

| Device | Browser | Practice OK | 3D ready (s) | Panel fps / p95 | Selected fps / p95 | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| — | — | not yet run | | | | |

## Screen-reader procedure (#74)

Complete one practice with VoiceOver (Safari) and NVDA (Firefox or Chrome). Check that each of these is announced:

- each investor question;
- "Listening" and "Reply recorded";
- the counter result ("Counter n of 3");
- the deal confirmation;
- the debrief heading.

Also check that the investor voice panel announces its status, and that the 3D view can be skipped.

| Screen reader | Browser | Result | Notes |
| --- | --- | --- | --- |
| — | — | not yet run | |

## Beginner usability script (#77)

Run five participants with no finance background, 10 minutes each. Ask each participant to start the LunchLoop example, answer the three investors, make one counter and decide. Note where they hesitate. Afterwards, ask them:

1. What does "20% equity" mean for you?
2. Why did the investor reply the way they did?
3. Would you accept the deal, and why?

Record each answer as understood / partly / not understood. Do not collect names or personal data.
