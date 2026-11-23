# Phase4C AI architecture — isolated, offline
Implemented contracts/runtime validation, canonical replay, personas/prompts, mock evidence and confirmation, clarification transitions, provider/mock services, server config, lifecycle/deadline, scripted fallback, consent/redaction, budget reservations, future transcript compatibility and evaluation.

There is NO live AI, HTTP route, UI integration, extra binding turn, persistence migration, numerical scorecard or provider SDK. Existing application stays scripted and imports none of these modules.

## Integration for the group
- Graphics: contracts.ts PresentationEvent has full binding + request-started/dialogue-ready/presentation-finished/request-cancelled. Use only presentation gestures; offering/withdrawal remain committed engine cues. No animation callback dispatches.
- Gameplay: BrowserRequest/ProviderOutput/AppResponse are separate. Runtime validate, use lifecycle.setContext on every run/revision/investor/mode/recovery change; cancel on consent revoke/unmount. runMockConversation is an offline harness for development, not a route. Preserve original requiredQuestion from prompts and three binding answers. Evidence/clarification never submit actions.
- Scorecard: Observation category/text/references are qualitative, attributed and unverified; AppResponse provenance/limitations must survive display. No numerical grading or inferred business verification.
- Finance: context.financialFacts and committedExplanation use original helpers/reasons. Never parse dialogue into terms or status.
- Persistence: memory-only. transcript.ts is a read-only future format evaluator; current save schema1 unchanged.

## Review order and prerequisites
Stack order: #42 -> #43 -> #44 -> #45 -> #46 -> #47 -> #48 -> #49 -> #50 -> #51 -> #53 -> #52 -> #54 -> #55.
These historical stack dependencies were integrated once through cumulative PR #106 into develop (merge27043d4). All14heads are ancestors and post-merge CI passed. Do not merge PRs #91–#104 or #107 again. See [group handover](../PHASE-4C-HANDOVER.md).

## Guides
provider-evaluation, conversation-contracts, investor-personalities, response-validation, evidence-confirmation, clarifications, server-architecture, credentials, request-lifecycle, scripted-fallback, privacy-and-consent, transcript-persistence, budgets, evaluation and verification (all .md in this directory). environment.example.txt is documentation only.

Future approvals: live endpoint/provider implementation is Phase4D; confirmed natural evidence affecting policies needs a separate authority adapter proposal; actual optional clarification UI and transcript storage require integration/schema review. No public deployment. SE-001 remains open. No other member's feature is implemented here.
