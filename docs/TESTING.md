# Testing

Node 24 and npm ci; no key required.
```sh
npm run lint
npm test
npm run build
npm run typecheck
npx playwright install chromium firefox
```
Linux may need npx playwright install --with-deps chromium firefox. Windows can use npm.cmd/npx.cmd.

## Browser suites

82 original scenarios use playwright.config.ts and a production server on3192.12 prototype cases use playwright.prototype.config.ts and a development server on3193. The prototype returns404 in production.
Portable bundled Chromium on macOS/Linux:
```sh
npm run test:e2e -- --workers=2
PLAYWRIGHT_CHANNEL=chromium npx playwright test --config playwright.prototype.config.ts
```
Windows PowerShell:
```powershell
npm.cmd run test:e2e -- --workers=2
$env:PLAYWRIGHT_CHANNEL="chromium"
npx.cmd playwright test --config playwright.prototype.config.ts
Remove-Item Env:PLAYWRIGHT_CHANNEL
```
Installed Edge/Chrome: set PLAYWRIGHT_CHANNEL=msedge/chrome for both suites. Original Firefox: clear that variable; npm run test:e2e -- --browser=firefox --workers=2. Prototype Firefox: set PLAYWRIGHT_BROWSER=firefox and run its config. Restore environment afterwards. Do not run conflicting server ports/output paths concurrently.
Use file/grep batches and persist logs/exit status outside source when hosts suspend. Sharding distributes files, so one12-test file can all land in one shard. Never silently skip/alter assertions.

## Coverage/evidence

136 unit tests: parsing/ranges, independent BigInt oracles, cap tables, investor boundaries, generated action sequences, mutation/stale protection, schema/replay/storage races and studio cloning/cues/previews.
82 browser cases: intake, offers/confirmation/debrief, keyboard/responsiveness, saving/conflicts/quota/cancellation/removal and stored-text security.
12 prototype cases: exact previews, mode/draft/save preservation, engine cues, rig/mixer independence, picking/selection, reduced motion, model/WebGL/context failures/retry and visibility/resizing.
Checkpoint21745d6 had136 unit and94 scenarios per desktop browser(Edge,Chrome,Firefox). Publication recovery reran one timed-out original case and12 prototype cases. Preserve this distinction; recovery was not a new uninterrupted full run.
Current clean-clone results: HANDOVER-VERIFICATION.md. Sanitized historical evidence: design/QA-SUMMARY.md.

## Limits/security

Full and production-only audits both matter; SE-001 remains visible and unresolved. Zero production findings do not account for all vendored framework code.
Renderer performance samples use desktop GPU even at phone dimensions. Active-frame statistics exclude intervals>=250ms. Input latency was input-event to DOM update, not physical-display latency. Real phone/thermal/battery/total GPU-memory and spoken screen-reader testing remain open.
CI cannot claim real-device performance. Driver-dependent 3D cases may require hardware; any CI exclusions must be explicit and never counted as full94-pass certification. No deployment occurs in CI.

## CI details
.github/workflows/ci.yml uses pinned official checkout/setup-node action commits, Node24, npm ci, lint/unit/build/type checks, both audits and Chromium browser suites. Full audit is a visibly nonblocking step for the accepted SE-001 finding; all extra findings still require human review. Production audit remains blocking but does not clear vendored code. playwright.ci.config.ts runs all12 prototype assertions with software SwiftShader, not physical-device certification. The workflow has read-only repository permissions, no secrets, no pull_request_target and no deployment step.
