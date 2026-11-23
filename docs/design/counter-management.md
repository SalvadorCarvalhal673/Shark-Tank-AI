# Counteroffer management in the studio

Issue #28. PR #132 (Member 3) addressed this issue in the practice room (`/simulate`). This change complements it **only in the 3D studio prototype**, and the practice room is unchanged.

## What the founder sees

- **Shared counters.** Three slots marked *used*, *this one* or *left*. Every valid counter uses one, whatever the investor replies.
- **Binding.** Before sending, a line names exactly what the counter is bound to, for example: "Bound to Maya Chen's current offer at revision 3. Sending uses shared counter 1 of 3, whatever the reply. If the session moves on first, the engine rejects it and nothing is recorded."
- **Why a counter is unavailable.** One of: answers not finished, session finished, allowance used up, or this investor has no active offer.

## Rules

- `counterBinding` (`src/features/studio/counter-binding.ts`) is pure and only reads the session. The submitted action uses the session id, expected revision and offer id from that same binding, so what is shown is what is sent.
- The engine stays the only authority. `advanceRun` rejects any action that is repeated, stale (old revision), for the wrong session or for a superseded offer. A rejected action leaves the session and the saved journal unchanged. A double click therefore commits one counter.

## Tests

- `tests/studio-counter-binding.test.ts`:
  - the binding names the active offer, revision, session and round;
  - repeated, stale, wrong-session and superseded actions return the same run, with no journal entry;
  - the binding follows the revised offer;
  - nothing is bound once the allowance is used.
- `tests/prototype/prototype.spec.ts`: the binding text and slots are shown, and a double click on "Send counter" commits exactly one counter and one saved action.
