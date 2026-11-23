# Transcript persistence proposal — #52
DEFAULT AND IMPLEMENTED RUNTIME: memory-only dialogue. transcript.ts is a pure read-only compatibility evaluator for a PROPOSED future separate envelope. It never touches localStorage, Web Locks or existing save schema1; it is not a persistence feature.

Proposed transcriptVersion1/contractVersion1/rulesVersion1/storageConsentVersion1; exact checkpoint(sessionId,revision,SHA256 canonical-journal digest), <=24 ordered unique-request dialogue entries, <=65536UTF8 bytes. Preserve provider/model/prompt provenance and fallback status; never store keys or GPU objects. The digest's canonicalization/production computation must be independently specified/tested during future integration; a client digest is consistency metadata, not authentication.

AI consent and local save consent do not imply transcript-storage consent. Use a distinct opt-in. Memory-only reload restores engine state, not generated dialogue. If consent later approved, minimize/redact stored text, explain same-origin/shared-profile exposure and offer explicit transcript deletion independently of game deletion.

Compatibility evaluator rejects malformed/oversized/unknown fields, unsupported versions, mismatched checkpoints and duplicate/out-of-order/future revisions. Never partially recover or auto-migrate. Retain corrupt/incompatible data for explicit discard/export decisions; never evaluate stored text. Compatible only means structural compatibility, NOT verified dialogue truth or permission to render/restore automatically. Display historical provenance and limitations.

Future implementation needs a separate approved key/format, explicit deletion, reviewed bounded migration policy (currently NONE), and the same conservative multi-tab write authorization, locking and compare-before-replace controls as game saves. Bind transcript and game checkpoints; conflicting tabs must not silently overwrite. Avoid a cross-key transaction claim: localStorage has no atomic multi-key commit. Reconcile checkpoint mismatches by leaving game intact and discarding/retaining transcript only by explicit choice.

No actual migration, key selection, saving or deletion is authorized in Phase4C. Existing game saves remain byte-for-byte unchanged. SE-001 open; no public deployment.
