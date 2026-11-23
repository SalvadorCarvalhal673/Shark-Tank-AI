# Studio dialogue presentation

Issue #18. The 3D studio prototype (`/prototype/studio`) shows the conversation as a dialogue. The practice room (`/simulate`) keeps its own dialogue history, which was improved separately in PR #132 and is not changed here.

## Layout

The **Dialogue** region sits under the investor buttons, beside the 3D or simplified view:

1. **Now speaking.** The name and specialty of whoever spoke last ("Maya Chen · Finance", "You · Founder" or "The panel").
2. **Source label.** "Scripted · rules-based replies, no live AI" is always visible.
3. **Status.** An honest processing state, announced politely to screen readers:
   - "Waiting for your answer to …. Nothing is sent until you submit."
   - "Replies recorded instantly by the scripted rules at revision N. Your move."
   - "Session finished at revision N. The transcript is complete."

   There is never a "thinking" or "typing" state, because the scripted engine replies synchronously.
4. **Transcript.** Every committed line, oldest first:
   - each investor's full question;
   - the founder's full answer;
   - opening decisions with their exact offer terms;
   - each counter, with the founder's exact proposal and the investor's reply, plus resulting terms when there are any;
   - the outcome.

   Each line names its speaker and the revision it was committed at. The list scrolls inside its box, keeps the newest line in view and can be focused with the keyboard.
5. **Composer.** The answer form moved here from the side panel, with the same labels and buttons. It says who you are replying to instead of repeating the question.

## Rules

- `dialogueLines` and `dialogueStatus` (`src/features/studio/dialogue.ts`) are pure. They read the committed session and never change it. Stale or repeated actions are rejected by the engine, so they add no line.
- Copy reuses `openingCopy`, `counterCopy` and `outcomeCopy` from `presentation.ts`, so the studio and the practice room say the same thing. Money and percentages use the shared `money` and `percent` helpers.
- **DECISION:** every reply is labelled "Scripted" (`DIALOGUE_SOURCE`), so nobody mistakes the rules for a live AI.

## Tests

- `tests/studio-dialogue.test.ts`: speaker order, complete text, exact terms, stale actions adding nothing, an honest status and the scripted label.
- `tests/prototype/prototype.spec.ts`: the speaker name changes after an answer, the transcript keeps the full answer, the status names the next investor, the list is keyboard-focusable and the revision only changes on submit.
