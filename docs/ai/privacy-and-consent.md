# AI privacy and consent — #53
privacy.ts provides explicit versioned provider/run-scoped consent validation and plain-language disclosure strings for gameplay's future interface. No visual consent screen is implemented here. Local save permission never implies external transmission permission. Decline/revoke -> cancel pending requests, increment lifecycle epoch and continue scripted. Consent must be checked immediately before each transmission, not only at onboarding. Changing provider/run/disclosure version requires renewed consent.

prepareTransmission is an allowlist DTO, not a raw state dump: startup, founder-reported sources, bounded recent narrative, stage, required question, engine-recorded negotiation decisions and request binding. It excludes save metadata, ownership, credentials and arbitrary browser fields. Best-effort email/international-phone/credential redaction operates on copies. It cannot detect all PII, contextual identifiers or confidential ideas. Founder warnings and explicit fictional-only development remain necessary. No external requests exist in Phase4C.

Sources remain original internally for attribution, but only redacted context may leave the server later. A model quote that no longer matches original text must fail validation/fall back; never restore private material merely to satisfy citations. History is untrusted narrative and cannot establish evidence.

Provider disclosures checked20Nov2026:
- https://developers.openai.com/api/docs/guides/your-data — no API training by default; store:false does not remove abuse monitoring/caching exceptions.
- https://privacy.claude.com/en/articles/7996868-is-my-data-used-for-model-training — commercial API no training by default, stated exceptions.
- https://aistudio.google.com/docs/terms — paid processing does not improve products; limited abuse retention applies; EEA paid-services rule and region-specific data terms apply.
Do not promise zero retention or EU-only hosting without account-specific verification. Browser consent is a user preference, not authentication or authorization for public paid access.

Memory-only default. Clearing/revoking in-memory dialogue requires discarding the controller/context; it cannot delete already transmitted provider logs. Future persistence/deletion controls require #52 approval. Logs record only sanitized operational metadata, never raw pitch/provider response/keys. SE-001 open; no public deployment.

minimizeContext is a pure formatter, not transmission authorization. Future live code must use prepareTransmission immediately before network egress; mock-runner alone uses the formatter offline. The consent disclosure includes engine-recorded negotiation decisions. ProviderInput contains only binding, minimized prompt and output allowance, never the full internal context or credential.
