# Expressive investor reactions

Issue #10. Each investor reacts to their own **committed** decision with a recognisable face and body movement. A reaction never anticipates an outcome, never implies confidence the engine did not record, and never changes the session.

## Mapping

The map is `REACTIONS` in `src/features/studio/model.ts`. It is typed as `Record<reason, Pose>`, so a new engine reason fails to compile until it gets a reaction.

| Committed reason (engine) | Reaction clip | What the viewer sees |
| --- | --- | --- |
| `required-signals-supplied` (opening offer) | Offering | Leans in with an open hand and raised brows |
| `repeated-answer` (pass) | Skeptical | Quizzical head tilt, one brow cocked, slight lean back |
| `missing-required-signals` (pass) | Withdrawal | Sits back, frowns and turns slightly away |
| `within-limits` (agrees to the counter) | Agreeing | Two warm nods, lifted brows, parted smile |
| `limited-concession` (revises the offer) | Considering | Thoughtful tilt, hand rising toward the chin |
| `at-concession-limit` (holds the offer) | Firm | One short head shake, level lowered brows |
| `above-cash-ceiling` (withdraws) | Withdrawal | As above |
| `below-withdrawal-band` (withdraws) | Withdrawal | As above |
| Deal accepted with this investor (`outcome`) | Agreeing | Replays the nod and smile as the deal closes |

Other terminal outcomes (walk-away, all withdrawn, no offers) add no new reaction: each investor keeps the reaction to their last decision.

**DECISION (for review):** both withdrawal reasons and a missing-signals pass share the Withdrawal clip. They mean the same thing to the founder (this investor is out), and reusing one clip keeps the file small. The reason is still shown in the HTML history, so the reaction does not need to distinguish them.

**DECISION (for review):** a repeated answer gets its own Skeptical reaction instead of Withdrawal, because the founder can fix it by answering differently next time, so it should read as doubt rather than rejection.

## Rules

- Reactions are derived only from `session.history` and `session.outcome` (`sceneCue`). Deriving them is pure and is tested to leave the session unchanged.
- Each new decision changes the cue key, so the reaction plays once per decision; a decision that does not involve this investor leaves their key alone.
- All four new clips are rotation-only and stay inside the seated envelope (`tests/studio-room-fit.test.ts` checks every frame).
- Reduced motion shows each clip's most readable frame as a held pose (`REDUCED_MOTION_POSE` in `rig.ts`).
- No new meshes or materials: draw calls and triangles are unchanged.

## Enforcement

`tests/studio-reactions.test.ts` drives real sessions through every reason and checks:

- Every reaction clip exists with a held pose inside its duration.
- No two reactions animate the same set of bones, so they read differently. Agreeing moves the jaw, Skeptical one brow, Considering the forearm and Firm the head.
- Opening reasons (offer, repeated answer, missing signals) and every counter reason (agree, revise, hold, both withdrawals) show the mapped reaction without changing the session.
- Accepting a deal makes only the chosen investor show Agreeing; walking away invents no reaction.

## Measured impact

| Measure | Before | After |
| --- | --- | --- |
| Cast file | 665,128 bytes | 672,472 bytes (four reaction clips) |
| Clips | 4 | 8 |
| Meshes / draw calls | unchanged | unchanged |
