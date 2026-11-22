# Temporary security exceptions

> Administrative status: **Retired — scoped security assessment approved, 22 November 2026.** This current status supersedes the open/pending wording in the dated records retained below. Retirement concerns only the reviewed configuration; public deployment still requires separate release verification and explicit project-owner authorization. Issue #79 tracking closes only after integration and successful post-merge verification.

> Current review (21 November 2026): SE-001 remains OPEN pending independent approval. A formal retirement recommendation is available in [the scoped assessment](security/SE-001-assessment-2026-11-21.md). Advisory withdrawal is not a project code fix; the CVE registry still says PUBLISHED. Public deployment remains prohibited. Entries below are preserved historical investigation records; the latest recommendation is appended at the end.

## SE-001 — picomatch denial of service

Status accepted by the project owner on 17 November 2026 for controlled development, testing and repository publication. The vulnerability remains unresolved. Public deployment is prohibited until a separate security sign-off. The project maintainer is responsible for reviewing and renewing or closing this exception at every subsequent phase.

### Advisory and affected dependencies

[GHSA-fc5q-39xc-vjpf / CVE-2026-112366](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) reports High severity, CVSS 8.7, affecting picomatch through 4.0.7. On 17 November 2026 the official advisory lists no patched version, and the npm registry returns picomatch 4.0.7 and eslint-config-next 16.4.6 as latest.

The installed affected copies are picomatch 2.3.2 and 4.0.7. Both are marked development dependencies in the lockfile.

- eslint-config-next 16.4.6 → @next/eslint-plugin-next → fast-glob 3.3.1 → micromatch 4.0.8 → picomatch 2.3.2.
- eslint-config-next → eslint-import-resolver-typescript 3.10.1 → tinyglobby 0.2.17 → picomatch 4.0.7.
- tinyglobby → fdir 6.5.0 → the same picomatch 4.0.7.
- eslint-config-next → typescript-eslint and its parser, plugin, utilities and typescript-estree packages → tinyglobby → picomatch 4.0.7.

The full audit reports 14 propagated package records from one distinct advisory. The records are picomatch, micromatch, fast-glob, fdir, tinyglobby, eslint-import-resolver-typescript, eslint-config-next, @next/eslint-plugin-next, typescript-eslint, @typescript-eslint/eslint-plugin, @typescript-eslint/parser, @typescript-eslint/type-utils, @typescript-eslint/typescript-estree and @typescript-eslint/utils.

### Runtime and artifact evidence

The Phase 3B review reproduced slow matching in both installed copies and in Next.js's vendored matcher at node_modules/next/dist/compiled/picomatch/index.js using bounded disposable subprocesses. The vendored package metadata omits an upstream version. This evidence establishes affected behavior without establishing the version of the bundled source.

The production server trace .next/next-server.js.nft.json includes the vendored matcher and its package metadata. The inspected application browser output had no identified matcher imports. A production deployment must be inspected directly because a deployment copying the server trace or a full node_modules directory can carry affected code.

npm audit --omit=dev reports zero findings for the installed production dependency graph. This does not account for all vendored framework code and does not prove production non-exploitability.

### Exposure and remaining uncertainty

No path from founder pitch, answer or negotiation inputs to a glob-pattern argument was found in the current application source. Next's inspected local and remote image-pattern matchers read patterns from configuration. The reviewed build has no remote image patterns and application source does not use next/image.

Development, lint and CI workflows process repository and tool configuration. Untrusted patterns or changes to such configuration could expose the affected behavior. The bounded matcher reproduction is not a demonstrated exploit through an application route. Additional framework call paths and future deployment configurations require review.

### Remediation and controls

No established compatible full remediation was identified at this checkpoint. npm's suggested eslint-config-next 14.2.35 replacement changes the current 16.4.6 toolchain and does not establish a fix for Next's vendored matcher. Dependency replacement requires a separately reviewed compatibility and security assessment.

The maintainer must apply these controls while this exception is open.

- Use trusted glob, image and tooling configuration.
- Isolate untrusted pull-request checks with resource limits, timeouts and no secrets.
- Avoid externally supplied glob patterns.
- Keep full and production-only audit results visible. Report the accepted finding explicitly when checks return a failure status.
- Reassess the advisory and supported remediation at every subsequent phase.
- Reassess immediately when a patched release appears, dependencies or image configuration change, new matcher use is introduced, or uploads or externally controlled configuration are proposed.
- Require security sign-off covering the vendored matcher, current reachability and the actual deployment file set before public deployment.

Do not suppress the advisory or present this exception as remediation. This exception authorizes controlled development, testing and repository publication only.

### Phase 3C reassessment — 17 November 2026

Rechecked the official advisory, current npm registry versions, installed dependency paths and the Phase 3C production server trace. The advisory still lists no patched version; latest picomatch remains 4.0.7 and eslint-config-next remains 16.4.6. Full npm audit still reports 14 High propagated package findings from this advisory; the production-only audit reports zero. No dependency or lockfile changes were introduced. The server trace still includes Next's vendored picomatch implementation and metadata; its metadata still does not identify an upstream version. The earlier bounded behavior reproduction remains relevant; no remediation is claimed.

The new persistence boundary accepts only a bounded record (65,536 UTF-16 code units before parsing), exact schema fields and a maximum seven-action journal. It replays through deterministic domain validation, rejects the whole invalid history, renders stored text using React text nodes, and never evaluates saved text or forwards it to a glob matcher. Source inspection found no new path from saved pitch/action text to matcher configuration. The reviewed image manifest still has no remote patterns, and the application still does not import next/image.

All persistence operations stay local. No founder contents are logged by the persistence layer, and no new network integration, credential storage or dependency was added. Storage is not an encrypted or authenticated boundary: same-origin scripts and browser tools can read or replace records, including synthesizing a valid history. Web Locks prevent races only among cooperating contexts. The privacy notice discloses profile sharing, scripts, lack of app encryption and browser cleanup risks before saving. Conservative memory-only fallback is used if coordinated access fails.

This phase does not close SE-001. The maintainer must renew the review at the next phase and obtain separate security sign-off before any public deployment, including review of the actual artifact and vendored matcher reachability.


### Handover reassessment — 18 November 2026

The official GitHub advisory GHSA-fc5q-39xc-vjpf is now marked withdrawn on18 November2026: https://github.com/advisories/GHSA-fc5q-39xc-vjpf . Fresh clean-checkout full and production-only audits report zero findings, unlike the earlier14 propagated records. This is an upstream advisory-status change, not a remediation implemented by this project. No dependency or lockfile change was made during handover. The earlier runtime/artifact observations remain historical evidence; a zero registry audit does not independently establish closure of vendored-code exposure.

SE-001 remains open under the project owner’s explicit instruction. Public deployment remains prohibited until separate formal reassessment, security sign-off and deployment approval. The corresponding security backlog issue must review this status change rather than treating it as automatic clearance. CI runs both audits without suppressing new findings.

### Formal reassessment and proposed retirement — 21 November 2026

Reviewed develop `d6042e1e85dbf78e707c3517f814b5e8d805a647`. **Recommendation only: retire this specific exception after independent approval. SE-001/Issue #79 remain open and public deployment remains prohibited.** See [formal assessment](security/SE-001-assessment-2026-11-21.md) and [sanitized evidence](security/SE-001-evidence-2026-11-21.json).

The official GitHub advisory confirms withdrawal at2026-11-18T15:38:56Z because the report is not considered a security issue. The maintainer's rationale is that arbitrary glob/regex patterns are trusted configuration. The official CVE record nevertheless still reports PUBLISHED; no universal CVE rejection is claimed. Installed picomatch2.3.2/4.0.7 and Next16.4.6 vendored code remain unchanged, and bounded slow-pattern behavior is still observable. There was no project remediation or version upgrade/downgrade.

Fresh full and production-only audits each exited0 with zero findings. The fresh production server trace still includes the vendored matcher and metadata. Reviewed application/Next paths use trusted configuration as patterns; synthetic production image requests logged only fixed `**` patterns while treating request URL text as subjects. No current untrusted pattern-authoring path was found. This combination, rather than withdrawal or a zero audit alone, supports the scoped retirement recommendation.

No separate exploitable application vulnerability was confirmed in this focused review. Paid-AI access control/trusted ownership/durable budgets and consent integration, actual release-artifact/hosting verification, ongoing pattern trust and privacy review remain independent requirements. Live inference stays disabled. Closing this exception would not satisfy these requirements or authorize deployment. All original investigation and prior phase evidence above remain historical records, not rewritten claims of a code fix.

### Administrative retirement — 22 November 2026

**Retired — scoped security assessment approved, 22 November 2026.** The project owner explicitly approved the independently reviewed recommendation and authorized integration through PR #109. The 21 November assessment and JSON evidence remain historical review records; their then-open status is not the current administrative decision.

Decision and scope:

- GitHub advisory GHSA-fc5q-39xc-vjpf was withdrawn because the report was not considered a security issue.
- The official CVE record was still PUBLISHED during the 21 November assessment. This retirement does not assert CVE rejection or agreement among all registries.
- No application or dependency remediation occurred. No package was patched, upgraded or downgraded; existing installed and vendored matcher behavior was not changed.
- No requester-controlled pattern path was identified in the reviewed application/configuration at develop `d6042e1e85dbf78e707c3517f814b5e8d805a647`. Trusted configuration supplied the observed matcher patterns. This is a scoped applicability decision, not a guarantee that all security issues have been eliminated.
- Retirement applies to that reviewed configuration and its documentation-only integration. It does not automatically extend to future versions, new pattern inputs, artifact contents or hosting environments. Reassess those changes independently.

This removes only the original exception-based restriction. **Public deployment remains unauthorized.** Before deployment, independently complete final release-artifact security assessment, approved deployment configuration, current dependency/framework advisory checks, production secrets/network review, appropriate privacy safeguards, final QA/accessibility review and explicit project-owner deployment authorization.

Live AI separately requires trusted user/session ownership, access control, consent integration and durable distributed cost enforcement. Live inference remains disabled; no API credentials, paid calls or deployment are authorized by this decision.

Original investigation, dates, behavior observations and prior assessments are retained. Historical phase records or unchanged CI labels referring to an open exception do not override this administrative retirement or grant deployment permission. Issue #79 may close only after the standard merge and complete post-merge verification; final commit and results are recorded in the issue and PR.
