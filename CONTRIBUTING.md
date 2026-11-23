# Contributing

1. Clone develop; read AGENTS.md, architecture and task backlog.
2. Select an available GitHub Issue and inspect prerequisites. Assign yourself where permitted.
3. Create isolated work:
```sh
git switch develop
git pull --ff-only origin develop
git switch -c feature/issue-N-short-description
```
4. Open this folder in your own Codex environment. Ask: “Read AGENTS.md and issue #N, inspect/reuse existing architecture, implement only this scope, preserve financial/session contracts and show test evidence.”
5. Implement acceptance criteria and meaningful tests; run relevant checks. Review diff/status, excluding secrets/caches/private data.
6. Commit/push feature branch; open PR into develop with Closes #N. Resolve feedback and merge only after approval.
Main remains the historical default: explicitly select develop as PR base. This handover does not establish enforced branch protection; contributors must follow review discipline.

Synchronize without rewriting shared history:
```sh
git fetch origin
git switch feature/issue-N-short-description
git merge origin/develop
```
Coordinate conflicts and rerun checks. Never independently replace finance/session/persistence authority.

Use npm ci from the lockfile. Deliberate dependency additions require compatibility, license and audit review. SE-001 remains open; audit fix --force is not assumed remediation. Future credentials stay server-only in ignored files. No real secrets or confidential logs in issues/PRs.
External assets require exact source, creator, license, modifications and redistribution rights; free download alone is insufficient. Preserve notices.

A owns visual studio/cast/cameras; B future AI/contracts; C gameplay/HTML interactions; D scorecard/QA/accessibility/presentation. These are responsibility areas, not named assignments. Coordinate scene.tsx(A/C), prototype.tsx and practice-room.tsx(C/D), debrief.tsx(B/D), session-storage.ts(B/C/D). Asset exploration, UX specs, provider evaluation and device/accessibility audits can start in parallel; integrations wait for actual prerequisites.


## Default-branch limitations
GitHub opens main by default, so share the explicit /tree/develop URL and clone --branch develop. Issue/PR template discovery may use the default branch; templates are published under develop/.github and can be copied manually until a separately approved main/default-branch change. No such change is authorized here. CI runs on pushes/PRs to develop; manual workflow discovery may also depend on the default branch.
