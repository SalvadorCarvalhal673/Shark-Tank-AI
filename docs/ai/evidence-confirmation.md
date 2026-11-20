# Evidence extraction and founder confirmation — #46
evidence.ts implements a bounded MOCK extractor, proposal validator and explicit confirmation/correction/rejection contract. It never submits an answer or changes policy. Original text and exact source offsets survive; proposals are founder-reported, confirmations founder-confirmed-unverified. Inferred metric mapping is identified, not silently treated as supplied evidence.

Natural example: "We currently generate around €9,000 every month and spend approximately €12,000 on operations." Mock identifies revenue900000 and operating expenses1200000 minor units. Approximation is retained; missing/ambiguous period or currency requires correction. No burn/runway/profit is inferred. Dollar symbol alone is ambiguous; explicit USD resolves it. Supports bounded common EUR/USD/GBP grouped/plain formats. Dates or unrelated counts without currency/financial context do not become evidence.

Negation prevents confirmation; conflicting same-metric claims become ambiguous; corrections preserve original testimony and require a fresh proposal. This conservative mock is not general multilingual extraction or a robust negation/contradiction parser. Quotes establish attribution, not semantic truth. Source identity includes exact original text and full request binding; edited drafts invalidate earlier proposals.

## Integration gate
Future natural-language extractor feeds the same proposal contract. Founder can confirm, reject or supply correction text. Confirming an inferred item is explicit acknowledgement, never business verification. Corrections are not automatically parsed/submitted. Only the existing explicit founder submission may produce the single binding answer.

Current policy still requires its existing recognized text patterns. Making confirmed structured evidence influence decisions requires a SEPARATE architecture proposal, independent regression coverage and approval; this module does not secretly serialize labelled testimony or override assessEvidence. Current game/storage schema unchanged. No transcript saving. SE-001 open; no public deployment.
