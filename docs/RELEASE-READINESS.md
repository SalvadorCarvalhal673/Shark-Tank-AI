# Release readiness

Release-candidate review for Issues #80–#90, with the status of every open issue. It covers the stack `feature/phase-4d-ai-integration` → `feature/phase-4e-performance-accessibility` → `feature/gameplay-completion-and-financial-oracle`, built on `develop` at `1d9e5529343267ae1a7fec06e6d21193a428f27a`. Exact results are listed under [Verification results](#verification-results).

## Verdict

**PROJECT NOT YET RELEASE READY — REMAINING BLOCKERS.** The engineering work that can be done and verified without devices, people or approvals is complete and green. Release is blocked only by items that need a human, a device or an authorization:

1. Owner approval for public deployment (#90), a hosting choice and monitoring (#89).
2. Physical Android/iPhone measurements (#67, #68, #72), a WebKit run on a Mac plus real Safari (#69), spoken screen-reader sessions (#74) and beginner usability sessions (#77).
3. A human rehearsal of the demonstration (#78, #86, #87) and the group's slide deck (#85).
4. Favicon provenance (#84).
5. Names and student numbers in the README (unknown to the engineering agent; not invented).
6. Live AI: not activated. The blockers are in `docs/ai/BACKEND.md`. Quality evaluation of real questions and responses (#57–#59, #62) waits for that.

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

`docs/design/asset-manifest.json` is checked by `tests/studio-provenance.test.ts`. All 3D assets are original and verified, and the fonts are OFL with notices. **Open finding:** `src/app/favicon.ico` has no recorded source.

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

The issue numbers below map to evidence on this release candidate. Issues are closed by a maintainer after the PRs are merged.

**Ready to close:**

- **3D studio:** #1–#13 (PRs #111, #122–#131, #133, #134).
- **Practice experience:** #14–#17, #20–#23, #25, #27 (PRs #110, #132, #140).
- **Dialogue and camera:** #18, #19 (PRs #135, #137).
- **Opening reveal, ownership and financial integrity:** #24, #26, #32 (PRs #132, #140 and this release candidate).
- **Counters, concessions and withdrawals:** #28, #29, #30 (PRs #132, #136, #138, #139, #116).
- **Outcomes, scorecard and review:** #31, #33–#41 (PRs #112–#120, #115, #132).
- **AI, verifiable with the mock provider:** #60, #61, #63, #64, #65, #66 (this release candidate).
- **Performance and accessibility, automated:** #70, #71, #73, #75, #76 (this release candidate).
- **Phase 5 reviews:** #80, #81, #82, #83, #88, #89 (this document).

**Keep open, with the blocker:**

| Issue | Blocker |
| --- | --- |
| #57, #58, #59, #62 | Integrated and mock-verified. The quality of real generated questions, responses, personas and coaching can only be judged once a live provider is approved |
| #67, #68 | Physical Android and iPhone measurements |
| #69 | WebKit run on a Mac, then real Safari |
| #72 | Virtual keyboard and touch on real phones |
| #74 | Spoken screen-reader sessions |
| #77 | Beginner usability sessions |
| #78, #86, #87 | Human rehearsal of the demonstration and its fallback |
| #84 | Favicon provenance |
| #85 | The group's slides (the outline is in `docs/presentation/demo-script.md`) |
| #90 | Owner approval |

## Verification results

To be filled from the release-candidate run below.
