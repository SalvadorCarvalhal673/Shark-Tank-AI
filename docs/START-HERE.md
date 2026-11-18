# Start here

Requirements: Git, Node.js 24.x and bundled npm(npm 10+), npm registry access and a modern browser. Node 24 supports the native TypeScript unit-test runner used here.
Windows: install Git for Windows and Node 24 from [Git](https://git-scm.com/downloads) and [Node](https://nodejs.org/en/download), reopen PowerShell and check git --version, node --version, npm --version.
macOS: official installers or an existing version manager are suitable. Linux: use official binaries or an existing Node version manager; distribution Node packages may be too old. With an existing nvm installation, use nvm install 24. Availability of portable instructions does not prove testing on every OS.

```sh
git clone --branch develop https://github.com/SalvadorCarvalhal673/Shark-Tank-AI.git
cd Shark-Tank-AI
npm ci
npm run dev -- --hostname 127.0.0.1 --port 3000
```
Open http://127.0.0.1:3000, /simulate or /prototype/studio. Windows blocking npm.ps1: substitute npm.cmd and npx.cmd; do not change system execution policy.
No API key, authentication, database or .env is needed. .env.example is comments-only guidance for future server-only credentials; live AI is not implemented.

Practice: fill a pitch and funding/equity/previous founder ownership; review; opt into saving or stay in memory; answer three questions; compare offers/counter at most three times; explicitly accept or walk away; inspect debrief.
Prototype: Enter 3D, start LunchLoop, use sample/custom answer and explicitly submit each of three answers; select investors, explore previews and submit counters. It stops at investor responses, not full deal-confirmation UI. Graphics are temporary.
Saving is browser/profile/origin-local. Keep the same hostname/port between practice/prototype to test their shared slot. Existing records are retained until explicit removal/replacement.

## Troubleshooting

- Missing npm/node: reopen terminal and check PATH/Node 24.
- npm ci error: preserve output and check supported runtime/registry; do not delete the lockfile.
- Port busy: change both dev-command port and browser address.
- Prototype404 under npm start: expected development-only restriction.
- GPU/WebGL2 failure: use simplified view.
- Browser missing: npx playwright install chromium; Linux CI may need --with-deps.
- Prototype defaults to Edge: choose PLAYWRIGHT_CHANNEL=chromium; see TESTING.md for shell syntax.
- Storage quota/lock failure: continue in memory, recover deliberately and retain old data.
- Cloud-synchronized folders/antivirus may lock generated files: stop only your own server and retry or clone into a regular local folder. Check resolved paths before generated-directory cleanup.
- Nonzero full audit: inspect SE-001 and all extra findings; never assume forced downgrade is a fix.

Use AGENTS.md and CONTRIBUTING.md with the selected GitHub Issue. Actual clean-checkout results and untested environments are in HANDOVER-VERIFICATION.md.
