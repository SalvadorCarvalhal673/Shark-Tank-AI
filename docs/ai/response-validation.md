# Untrusted response validation — #45
validation.ts enforces exact JSON shape/versions/identity, output bytes and per-field lengths, purpose-appropriate questions, investor category and exact quotations from allowlisted original founder sources. Provider refusal/incomplete output fails closed. Unknown financial fields cannot reach application contracts. No repair loop or provider-switch retry.

Structured schema cannot establish business truth. Exact source quotation proves attribution only, not the truth of the founder statement or semantic entailment of commentary. Prior AI history is never an evidence source. Known money/numeric/commitment/injection/markup patterns trigger rejection, but paraphrased falsehoods can evade them and benign text can be rejected. This is documented semantic uncertainty, not claimed protection against every hallucination.

Financial terms, accepted status and withdrawal reasons must be rendered separately from existing engine data. Provider speech has no dispatch capability; model text never becomes financial authority. Stale/duplicate protection belongs to lifecycle #50, layered after this validator.

Run node --test tests/ai-validation.test.ts using synthetic valid/refusal/incomplete/wrong-identity and adversarial fixtures. No inference. Source text is React text only at future UI integration; do not render model HTML/Markdown links as executable content. SE-001 open; no deployment.
