# Conversation contracts — #43
Version1 contracts.ts separates BrowserRequest, ProviderOutput and AppResponse. schemas.ts rejects unknown fields at every request object; context.ts replays existing canonical actions using createRun/advanceRun and rejects any failed step or revision/purpose mismatch. No new authoritative controller. Pitch/answers remain founder-reported, not verified facts. Financial facts are read-only engine results.

Money uses integer minor units; equity integer basis points. No authoritative financial fields exist in ProviderOutput. AI cannot dispatch FounderAction. Three binding answers, three shared counters, explicit acceptance and exact storage-v1 remain unchanged.

Binding includes sessionId, revision, investorId, purpose, requestId and conversation epoch. Cancel/restart/recovery/investor or presentation-mode changes invalidate pending requests even at the same revision. Lifecycle enforcement is #50.

Bounds:128KiB UTF8 wire request BEFORE parsing, pitch3000/startup80 raw UTF16 units, three answers1500 each via canonical actions, <=7 actions, <=6 unique recent dialogue entries600 units each. 128KiB deliberately accommodates JSON-escaped maximum valid content; bytes are not storage-v1's65536 UTF16 units. Returned copies are deeply frozen. Existing whitespace/range/ownership validation remains authoritative.

History is untrusted narrative, never evidence. Evidence sources are original pitch and committed answers. Provider refusal/incomplete/malformed output is not repaired into a trusted response. Response validation is #45. No live route or UI integration. SE-001 remains open; no public deployment.
