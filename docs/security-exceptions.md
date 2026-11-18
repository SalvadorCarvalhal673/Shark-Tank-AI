# Temporary security exceptions

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
