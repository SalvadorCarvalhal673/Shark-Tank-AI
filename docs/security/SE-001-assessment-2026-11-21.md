# SE-001 — formal retirement recommendation

Review date: 21 November 2026. Reviewed develop: `d6042e1e85dbf78e707c3517f814b5e8d805a647` (PR #108 integrated). Scope: Issue #79 and the original picomatch exception; no application, dependency, lockfile, workflow, deployment or contributor-workstream changes.

## Decision for independent approval

**Recommend retiring SE-001 for the reviewed application/configuration because its original advisory-based security basis is no longer substantiated.** GitHub withdrew the specific advisory as not a security issue, and the current application does not expose a path for a requester to supply the glob/regular-expression pattern to the reviewed matchers. Merely finding slow behavior when deliberately supplying a complex pattern is insufficient to establish an exploitable application vulnerability.

This is a recommendation, not a closure or release approval. **SE-001 and Issue #79 remain open until separately approved. Public deployment remains prohibited.** Approval would retire this particular exception, not certify every dependency or future configuration. No project code fix, package patch or upgrade was performed. Reassess if pattern trust, framework/configuration, artifact contents or threat model changes.

## Authoritative advisory status and limits

- [GitHub advisory](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) explicitly records withdrawal on18 November2026. The [official API record](https://api.github.com/advisories/GHSA-fc5q-39xc-vjpf) reports `withdrawn_at=2026-11-18T15:38:56Z`, `updated_at=2026-11-19T16:07:41Z` and explains the report is not considered a security issue. Historical affected ranges/CVSS/no-patch fields remain visible; they are not a new active advisory or a patched-version claim.
- The advisory links to the [upstream maintainer's explanation](https://github.com/micromatch/picomatch/pull/235#issuecomment-6315749381). The maintainer treats glob patterns as regex-like trusted program/configuration input: applications must not allow untrusted users to define arbitrary patterns. This does not promise inexpensive execution of every possible pattern.
- **Important registry discrepancy:** the [official CVE record](https://cveawg.mitre.org/api/cve/CVE-2026-112366) still reports `PUBLISHED`, last updated19 October2026, when fetched for this review. Do not describe the CVE itself as rejected or claim all vulnerability databases agree. The conclusion is a scoped applicability/risk assessment supported by GitHub's explicit withdrawal and application reachability evidence. If a release policy requires CNA/CVE rejection, that policy remains a separate unresolved approval condition.
- The CVE website required JavaScript and NVD did not provide readable content through the browser tool. Public GitHub/CVE JSON was retrieved directly over HTTPS; these limitations were not interpreted as evidence of withdrawal or clearance.

## Installed and vendored inventory

`npm ls picomatch micromatch next --all` and lockfile inspection show:

| Location | Version / role |
| --- | --- |
| node_modules/picomatch |2.3.2, development dependency; eslint-config-next16.4.6 → @next/eslint-plugin-next → fast-glob3.3.1 → micromatch4.0.8 |
| node_modules/tinyglobby/node_modules/picomatch |4.0.7, development dependency; eslint-import-resolver-typescript3.10.1 → tinyglobby0.2.17, also reused by fdir6.5.0 |
| node_modules/next/dist/compiled/picomatch/index.js |Next16.4.6 vendored implementation; package metadata has **no upstream version**. No version is inferred from the surrounding Next version. |

Fresh full `npm audit --json` and production-only `npm audit --omit=dev --json` each exited0 with zero informational/low/moderate/high/critical findings. Audits were not filtered, waived or suppressed. No `audit fix`, override, upgrade or downgrade was used. The reduction from historical14 propagated records is an upstream advisory classification change, not a project remediation. Zero registry findings cannot independently attest to all vendored code or supply-chain integrity.

Independent behavior checks used disposable Node24.22.0 subprocesses with a1000ms external deadline, testing `+(*a)` against repeated `a` characters followed by `!`. At length18, all three entry points returned false in approximately14–15ms of in-process matching; at length26, all three subprocesses reached the deadline and were terminated. That deadline includes process startup and does not measure exact matching duration. These bounded observations preserve the original slow-pattern evidence. They are **not** an application-route exploit, patched/unpatched-version determination, hardware benchmark or contradiction of the pattern-trust rationale.

## Application and framework reachability

Source inspection found no application import of picomatch, micromatch, fast-glob or tinyglobby and no user-configurable glob surface. Founder pitch, committed answers, counterterms, browser saves and AI request data are validated domain data, not matcher configuration. Existing pitch/answer/journal bounds and canonical replay remain unchanged. The simulation's `new RegExp` calls use fixed financial templates or internal labels; studio review scripts use developer-controlled names. No application `next/image` import was found, but this **does not** imply the framework image endpoint is absent.

Reviewed Next call paths:

- `next/dist/shared/lib/match-remote-pattern.js:38,48`: compiles configured hostname/pathname; request URL fields are subjects. Remote domains/patterns are empty in the inspected build.
- `next/dist/shared/lib/match-local-pattern.js:30`: compiles configured pathname; URL pathname is the subject. The actual default local pattern in the fresh artifact is `**` with empty search, not an arbitrary request value.
- `next/dist/server/image-optimizer.js:235,259`: checks local/remote policy during parameter validation before the separate image fetch routines.
- `next/dist/build/collect-build-traces.js` and trace-entrypoint tooling: compile framework/repository ignore/include/exclude globs at build time. Fresh artifact include/exclude maps are empty.
- Middleware glob validation/dynamic-import allowances in `build/segment-config/middleware/middleware-config.js` and `build/webpack/plugins/middleware-plugin.js` consume repository configuration at build time. No application middleware/proxy or custom Next config was found. The emitted configuration identifies `configOrigin: default`.

A malicious repository contributor can introduce expensive configuration or arbitrary build code; that is a trusted-code/CI boundary, not an untrusted founder-input route. Continue reviewing configuration/dependency changes and running untrusted checks in isolated runners with bounded resources, read-only token permissions and no secrets. Current CI preserves its25-minute limit, pinned actions, read-only contents permission, no persisted checkout credentials and blocking full/production audits.

## Fresh production artifact and dynamic checks

`npm run build` passed on the unchanged reviewed source. No deployment configuration, container image or hosted target was supplied; the inspected artifact is the **default Node production build**, not a certification of an unspecified future deployment.

`.next/next-server.js.nft.json` contains exactly two picomatch-named entries: the vendored implementation and its metadata. That is one identified matcher implementation plus its package file, not two independently versioned copies. A trace-based/standalone package or a full node_modules deployment can therefore carry this code. Omitting development dependencies does not remove the vendored implementation inside Next. Fresh image configuration has empty remote domains/patterns, a fixed local `**` pattern, and local-IP/SVG danger flags false. Targeted source/marker searches found no matcher references in application/browser output; this is not a comprehensive binary-absence proof.

A separate loopback-only production process was instrumented in memory with a temporary preload outside the repository. It recorded `makeRe` arguments, without editing any Next/application file. Synthetic requests established:

| Probe | Result |
| --- | --- |
| Landing / practice |200 /200 |
| Development-only studio |404 |
| Investor API GET / POST |405 /503 disabled |
| Remote image URL on example.invalid |400 rejected by remote policy |
| Local image URL containing extglob-looking text |404 missing resource; matcher argument was fixed `**` |
| Local favicon through image optimizer |200; matcher argument was fixed `**` |

The two observed runtime patterns were both `**`. This positive-control observation shows user URL text was treated as a subject in those requests, not compiled as a pattern. It does not prove every possible framework execution path safe. The expected missing-resource log was retained; it is not an application crash. No long/hostile pattern was executed inside the server process, and the review-owned server was stopped afterward.

## Separate issues and pre-deployment work

No separate exploitable application vulnerability was confirmed by this focused assessment; no active npm advisory was reported. This is not a complete penetration test or blanket security clearance. The following independent gaps remain actionable and must not be hidden by retirement of SE-001:

1. **Paid-AI activation blockers:** reviewed server-side access control, trusted principal/session ownership, durable distributed budget/rate/deduplication enforcement, consent/revocation integration and provider-retention/cost review are still required. The current literal live gate is false, production API disabled, and no default external exchange is wired. These are known unavailable protections for a future live service, not a claim that the disabled route currently permits paid abuse. Smallest compatible action now is preserve disabled operation; implementing controls requires separate approval.
2. **Actual release artifact and hosting review:** pin the approved develop SHA, rebuild in a clean isolated environment, inspect the exact Node/container/standalone file set and SBOM including vendored code; re-audit production/transitive dependencies and current official framework advisories. Review TLS, proxy/body/rate/time limits, security headers/CSP, logging, secrets and network egress for the real target. None was deployed or configured here.
3. **Pattern trust:** keep image/build/middleware globs under trusted review; do not expose pattern-authoring, external config or upload-derived globs without a new security assessment. A new untrusted-pattern feature would recreate a concrete exposure decision regardless of the withdrawn advisory.
4. **Local storage/privacy:** saved founder text is same-origin readable and not authenticated or encrypted by the application. Use fictional data; do not reinterpret saved records as verified business facts. An account-backed/confidential-data release needs a separately approved privacy/security design; no storage migration is proposed here.

None of these gaps is resolved by a Next version change, the advisory's withdrawal or the registry audit result. No new dependency recommendation is justified solely to address this withdrawn report. If future review discovers an actual untrusted-pattern path, the smallest remedy is remove that pattern control or use an explicitly constrained grammar/isolated bounded matcher, coordinated with its owner; do not blindly downgrade Next or suppress warnings.

## Evidence, preservation and approval boundary

Machine-readable sanitized evidence: [SE-001-evidence-2026-11-21.json](SE-001-evidence-2026-11-21.json). It records the reviewed SHA, authoritative status timestamps, original exception and lockfile hashes, installed dev flags, vendored entry hash, fresh artifact configuration/trace entries, audits, bounded-probe observations and production responses. The complete original exception text is preserved in security-exceptions.md, with a clearly separated new recommendation; prior17/18 November history is not rewritten. Existing historical QA evidence and Git history remain untouched.

Raw official JSON, full audit reports, inventory, production logs, bounded-probe script/results and build log are retained outside the repository in the review's temporary evidence directory. No private founder input, credentials, raw machine paths or generated application artifacts are added to this PR. This report adds no automated application feature/tests; existing unmodified PR CI remains the regression gate.

Approval requested: accept this scoped retirement recommendation and then explicitly decide whether to close Issue #79/update the exception's administrative status. **This PR does not merge itself, close the issue, authorize live inference or permit deployment.** A subsequent deployment still requires the separate release verification and owner authorization above.
