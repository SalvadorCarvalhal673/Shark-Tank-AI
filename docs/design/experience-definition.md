> Archived original planning document. The final 2D visual recommendation is superseded by the stylized 3D direction documented in ../DESIGN-GUIDELINES.md. These scenes are design references, not completed application features.

# Shark Tank AI — Phase 4A experience definition

Review date: 18 November 2026. Status: proposal awaiting independent review. Application baseline: `41d9b8dd74fe551c3007a70f6163193e3adb3dc1`, branch `codex/shark-tank-session-persistence`.

This document and the companion labelled storyboard are planning deliverables outside the repository. They do not implement a redesigned application. No live AI, paid API call, package installation, repository modification, commit or deployment is part of Phase 4A. SE-001 remains open and public deployment remains prohibited.

## 1. Experience promise and scope

An episode puts the player in a founder's seat: explain a business, defend its assumptions, explore offers, negotiate, make a deliberate decision, and understand what changed. Meaningful decisions and visible consequences are the source of engagement. A deal is not an automatic measure of good judgment; a justified walk-away is a valid conclusion.

The professor demonstration uses a fictional example venture with prepared, editable answers. Players still submit each answer, select investors, compare offers, send counters and confirm their final decision. Nothing auto-plays a transaction. Target approximately five minutes without mandatory clarification exchanges or tutorials. There is no countdown or time-based penalty.

Phase 4B should deliver this experience in clearly labelled Scripted practice using approved rules version 1. Live AI belongs to a later, separately approved phase. Original financial formulas, policies, three binding answers, three shared counters, explicit acceptance and all four terminal outcomes remain intact.

## 2. Visual direction

- Environment: an illustrated dark-green studio with a curved three-seat investor table, a clear central founder position, flat architectural planes and restrained overhead light shapes. No stock photos, glass cards, video backdrops or 3D engine.
- Palette: retain background `#101512`, text `#F2F1E9`, muted text `#B2BAAA`, structure `#303A30`, primary action `#D5F27D`. Proposed portrait accents: Maya brass `#C5AB6B`, Adrian cobalt `#86A9E8`, Sofia teal `#80C7B4`. Accents mark identity; action lime and explicit text identify what the player can do. Verify contrast before production use.
- Typography: retain Instrument Serif for scene headlines, Inter for dialogue and controls, IBM Plex Mono for small stage/round labels. Use large editorial type on landing and outcome scenes; prioritize readable body text during decisions. The wireframes use system fallbacks and are not final font proofs.
- Table: one consistent shallow curved silhouette across introductions, conversation, offers and conclusions. Place investor nameplates outside portrait art so identities remain readable at small sizes.
- Lighting: the active speaker receives a brighter background plane and small spotlight shape. Other investors stay visible. A withdrawal changes pose and status, never erases the character from the table.
- Composition: stable stage header; investor rail/table; one dominant interaction; compact financial comparison when needed. Saving is a compact accessible control during normal play and expands when an error or conflict needs attention.
- Dialogue: named speaker, readable complete text, optional progressive reveal and Show full text. A short reply composer remains adjacent. No endless full-screen bubble feed. Transcript and guidance open on demand.
- Offers: flat readable term sheets visually associated with investors. Lead with cash and equity, then founder ownership. Put implied valuations and detailed cap tables behind an accessible disclosure.
- Outcome: restrained handshake/composed portrait staging and explicit Deal confirmed, No opening offers, All investors withdrew, or You chose to walk away. No humiliating failure scene.
- Scorecard: a short episode summary, four factual result areas, and selectable decision moments. No invented confidence meter, success probability or unvalidated overall grade.

## 3. Original investor character specifications

These are original fictional character concepts; likenesses must not be copied from television investors. The same face, hair, outfit and nameplate persist across every scene. Expressions change within that fixed design.

| Character | Recognizable silhouette and outfit | Voice and focus | Pose vocabulary |
| --- | --- | --- | --- |
| Maya Chen, Finance | Straight chin-length dark hair, small brass hair clip, angular dark jacket and cream high collar. Brass nameplate detail. | Composed and precise. Asks what a figure means and what funding changes. Never claims to verify a founder's data. | Neutral: hands together. Listening: slight forward lean. Questioning: one raised brow/open palm. Offer: small term-sheet gesture. Agreement: restrained nod. Withdrawal: lean back, hands closed. |
| Adrian Vale, Growth | Rounded copper curls, round glasses, open cobalt overshirt. Rounded shoulder silhouette. | Curious and energetic about repeatable customer acquisition. Challenges channels and measures, without inventing traction. | Neutral: open posture. Listening: head tilt. Questioning: hand forward. Offer: forward lean. Agreement: open-handed nod. Withdrawal: settle back with a clear declined status. |
| Sofia Mendes, Operations | Low dark bun, distinctive cream hoop earrings, teal collared shirt, rolled-sleeve silhouette. | Practical and direct about customer observations and delivery. Calm rejection with a specific reason. | Neutral: upright. Listening: attentive lean. Questioning: two measured hands. Offer: term sheet toward founder. Agreement: small smile. Withdrawal: closed posture with the budget explanation. |

Produce one approved character sheet per investor: front/three-quarter pose, silhouette, palette, fixed accessories and six expression/gesture states. Reuse face geometry and body proportions between poses. The companion wireframes contain simple original concept portraits, not final production art. Name, role, selection state and offer status remain available as text; no reaction depends on recognizing facial expressions.

## 4. Storyboard — all eleven scenes

The companion visual shows all scene landmarks and a selectable desktop/mobile wireframe for each. Product controls inside those drawings are static labels; only storyboard-review navigation operates.

### 01 — Landing: Take your seat

- Screen composition: editorial invitation beside the complete illustrated investor table; fictional-simulation label and compact header.
- Visual hierarchy: invitation, one-line activity promise, Take your seat, then secondary example/help links.
- Primary action: Take your seat.
- Secondary actions: Try LunchLoop example, How to play, Resume saved episode when available.
- Investor reactions: neutral character poses; selecting a profile preview emphasizes that investor without suggesting an offer.
- Transition in: immediate readable page; optional short light-plane reveal.
- Transition out: short fade into introductions; player can skip motion.
- Desktop: two columns with generous stage art and the primary action visible without scrolling.
- Mobile: title, compact full-panel art, primary action, example action; no oversized illustration pushing the action away.
- Accessibility: semantic heading and named actions; complete information without hover; no automatic sound or mandatory animation.

### 02 — Introductions: Meet the panel

- Screen composition: all three portraits at the table; selected investor's introduction beside/below the table.
- Visual hierarchy: selected name and focus, one character line, Continue.
- Primary action: Continue to pitch preparation.
- Secondary actions: explore any investor, Skip introductions, Back.
- Investor reactions: selected investor uses the introduction pose; others remain neutral. Exploring profiles does not change the approved Maya–Adrian–Sofia question order.
- Transition in: table carries over from landing; selected portrait gains emphasis.
- Transition out: studio recedes to a compact investor rail as backstage preparation opens.
- Desktop: equal portrait positions with one focused biography area.
- Mobile: three identifiable portrait buttons, one selected introduction; no horizontal-only discovery.
- Accessibility: selection exposed with text/pressed state; keyboard selection; Skip always visible; names never baked solely into artwork.

### 03 — Guided preparation: Your business, your ask

- Screen composition: progressive Idea and Funding areas, plus a compact evolving pitch summary. Optional guidance does not create more compulsory questions.
- Visual hierarchy: current field/task, plain-language help, preview consequence, Continue.
- Primary action: Review pitch after valid input.
- Secondary actions: Use LunchLoop example, edit the idea/ask, expand ownership details, read a financial explanation.
- Investor reactions: compact neutral portraits; no fabricated interest response to unfinished typing.
- Transition in: backstage layout appears with focus on the current input.
- Transition out: assemble the validated pitch into its review card.
- Desktop: form on the left, ownership/value preview on the right.
- Mobile: current inputs above the preview; precise inputs remain usable when the keyboard opens.
- Accessibility: labelled inputs, inline errors, error focus, keyboard-operable sliders and exact numeric alternatives; no drag-only interaction. Reject invalid drafts without changing game state.

### 04 — Pitch review: Ready to enter?

- Screen composition: startup description, cash/equity ask, founder ownership and compact valuation/ownership preview; local-saving choice below the pitch.
- Visual hierarchy: startup, money requested/share offered, ownership consequence, Enter the room.
- Primary action: Enter the room.
- Secondary actions: Edit pitch, inspect calculation details, opt into local saving, manage an existing save.
- Investor reactions: full table waiting, not judging. The founder has not submitted a binding answer yet.
- Transition in: pitch card settles from preparation.
- Transition out: initialize one session, save if authorized, and bring Maya forward. Replacement confirmation occurs only if a previous save would actually be replaced.
- Desktop: pitch and ownership comparison side by side above the action.
- Mobile: one ordered stack; save disclosure and choice remain visible before starting.
- Accessibility: headline receives focus; checkbox is explicit and defaults off; replacement cancellation returns to this pitch without losing it. Do not add a redundant Are you ready? confirmation.

### 05 — Conversation: Defend your business

- Screen composition: investor rail, active portrait, current challenge, answer composer; optional explanation and transcript areas.
- Visual hierarchy: active name/question, response field, Send answer. Show current topic rather than a large questionnaire progress panel.
- Primary action: Send answer in 4B; Confirm & send this answer in a later AI-summary flow. These are one binding submission, not two consecutive confirmations.
- Secondary actions: explain a term, view the original pitch, inspect history, use/edit an example answer; later, one optional clarification exchange for this investor.
- Investor reactions: listening while composing; scripted response pose after a committed answer. Thinking is shown only while a real future AI request is pending.
- Transition in: emphasize the next investor while preserving the room.
- Transition out: after an accepted answer move to the next investor; after the third, present all opening decisions. No opening offers before the engine produces them.
- Desktop: active exchange central with compact portraits and optional transcript alongside.
- Mobile: compact investor rail, active dialogue and composer; resize for the keyboard and keep Send reachable.
- Accessibility: labelled composer, actual-request status, full-text reveal, polite announcements after complete responses; no token-by-token screen-reader output. Distinguish Scripted practice from illustrative/future AI text.

### 06 — Offer reveal: Your options are on the table

- Screen composition: all investor positions plus three decision/offer surfaces, including pass states.
- Visual hierarchy: available cash/equity offers, investor identity, Compare offers. Explanations remain adjacent.
- Primary action: Compare offers.
- Secondary actions: Show all now, inspect an investor's reason, inspect implied valuations/history.
- Investor reactions: offer gesture or pass pose derived from committed opening decisions.
- Transition in: short staggered emphasis, with all committed terms available immediately through Show all. Do not gate access behind the animation or hide competing terms during a decision.
- Transition out: select an active investor and open the shared negotiation surface. If no offers exist, go directly to the correct no-deal conclusion.
- Desktop: three aligned offer surfaces with comparable cash/equity/ownership rows.
- Mobile: short comparison rows for all investors before opening one detailed offer; avoid three long cards in sequence.
- Accessibility: readable offer list/table, explicit Active/Passed text, one concise announcement of offer availability, no color-only states.

### 07 — Negotiation: Choose your trade-off

- Screen composition: persistent comparison strip, selected investor, one counter workbench, live ownership/value preview, three shared-counter markers, expandable history.
- Visual hierarchy: selected current offer, draft cash/equity, ownership consequence, Send counteroffer.
- Primary action: Send counteroffer while editing a draft; Review deal when inspecting a selected offer without a draft. Avoid two equally emphasized primary actions.
- Secondary actions: select/compare another investor, cancel draft, inspect history, review current offer, walk away.
- Investor reactions: no binding reaction during preview. After submission show the engine's agree/revise/unchanged/withdraw result with a matching pose and reason.
- Transition in: selected investor and offer become central; other active offers stay accessible.
- Transition out: update canonical offer/history immediately; highlight changed terms. After three applied counters show Final offers and remove counter submission. If all withdraw, go to the correct conclusion.
- Desktop: counter controls and exact financial preview side by side, with comparison strip above.
- Mobile: selected investor, controls, preview, Send; compact comparison switcher remains accessible. Preserve unsent draft clearly or warn before discarding it when changing investor.
- Accessibility: exact numbers accompany sliders; previews never consume counters or write game actions. State counter cost before submission, including unchanged terms and withdrawals. No unsupported acceptance probability, hidden-limit oracle or artificial deadline.

### 08 — Deal confirmation: Check the agreement

- Screen composition: selected investor, exact cash/equity, founder before/after ownership and clear notice that other active offers close.
- Visual hierarchy: agreement terms, financial consequence, Confirm deal; return action remains visible.
- Primary action: Confirm deal.
- Secondary actions: Back to offers, inspect ownership/calculation details.
- Investor reactions: ready-to-agree pose; no celebration before accepted state is committed.
- Transition in: focused confirmation surface anchored to the selected current offer ID and revision.
- Transition out: explicit acceptance commits once, closes other offers and opens the deal conclusion. If terms are stale, close the confirmation and request review of current terms.
- Desktop: focused inline surface or properly implemented modal with the table visible behind it.
- Mobile: full-width focused sheet/page; terms above the confirmation control without requiring side-scrolling.
- Accessibility: correct focus entry/return, keyboard cancellation, clear money/share labels. The existing explicit confirmation is the final confirmation; do not add a second one.

### 09 — Conclusion: Deal or deliberate no deal

- Screen composition: outcome-specific table/portrait arrangement, explicit result and a compact consequence summary.
- Visual hierarchy: outcome, accepted terms or no-deal reason, See my scorecard.
- Primary action: See my scorecard.
- Secondary actions: inspect the final offer/history, Show scorecard now to skip nonessential motion.
- Investor reactions: accepted investor nod/handshake-style gesture; closed competing investors neutral. No-deal scenes stay respectful and distinct.
- Transition in: derive from the actual terminal outcome, never from dialogue or an animation callback.
- Transition out: settle the room and expose the personalized review.
- Desktop: large outcome composition with a concise financial strip.
- Mobile: outcome first, relevant portrait, result and action. No oversized celebration displaces the result.
- Accessibility: announce the completed result once; no flashing/confetti requirement. No opening offers, All investors withdrew and Founder walked away receive different explanations. No-deal means original ownership remains unchanged; never display a fabricated accepted valuation.

### 10 — Personalized scorecard: Learn from this episode

- Screen composition: short personalized episode summary; pitch coverage, funding result, ownership impact and negotiation choices; a selectable list of significant moments.
- Visual hierarchy: what happened, one useful learning point, key metrics/moments, Try another strategy.
- Primary action: Try another strategy.
- Secondary actions: inspect any moment, expand exact cap table/history, review detected evidence and original answers.
- Investor reactions: calm review poses; optional later AI coaching is labelled interpretation and tied to quotations.
- Transition in: outcome composition becomes a quiet review scene; no waiting for score animations.
- Transition out: reuse the pitch in review with a fresh session identity when restarted. Preserve the completed save until explicit replacement; saving remains off by default for the new run.
- Desktop: concise four-area summary and decision replay beside it; details collapsed.
- Mobile: summary, selected moment, result areas and next challenge in one stack, without wide chart dependencies.
- Accessibility: ownership bar has exact text/table equivalent; no inferred personality or financial-literacy grade. A numerical overall score requires a separately approved, versioned rubric.

### 11 — Recovery: Return to your seat

- Screen composition: startup name, saved stage/time, clear Resume and secondary new/remove options. During active play, use a compact save indicator that expands when action is required.
- Visual hierarchy: which episode is saved, where it resumes, Resume episode.
- Primary action: Resume episode; on a conflict, Load saved progress after reviewing its consequences.
- Secondary actions: start a new pitch, remove saved information with confirmation, continue without saving, retry where safe.
- Investor reactions: restore the committed current scene; no re-evaluation, new random response or repeat introduction.
- Transition in: returning to the simulator or an active storage conflict/failure.
- Transition out: resume the exact question/negotiation/final-offer/scorecard state. Stale load/replacement/removal confirmations must refuse the changed record.
- Desktop: short centered recovery choice, then direct return to the room.
- Mobile: concise readable choices without exposing technical schema/revision/Web Lock vocabulary.
- Accessibility: preserve existing focus/error behavior, plain-language failure copy and manual browser-data removal guidance. Never report deletion when it failed. A conflict may interrupt the normal layout because protecting progress takes priority over cinematic continuity.

## 5. Interaction inventory and state boundaries

| Interaction | Meaningful response | Authoritative game effect |
| --- | --- | --- |
| Explore a personality | Show character focus/introduction | None |
| Use LunchLoop example | Fill an editable, explicitly fictional draft | None until Start/Enter |
| Drag funding/equity or type exact values | Update implied valuations and ownership using approved arithmetic | None; no counter consumed |
| Select/compare offers | Show the selected active offer and differences | None |
| Submit a binding answer | Commit exactly one validated answer and progress | One accepted answer action |
| Ask for guidance/optional future clarification | Explain or clarify, within the per-investor allowance | None; no counter and no extra binding answer |
| Send a counter | Apply agree/revise/unchanged/withdraw result; update terms, history and allowance | One accepted counter; three shared maximum |
| Review a deal | Show confirmation bound to current terms | None |
| Confirm a deal | Accept one current active offer and close others | One accepted terminal action |
| Walk away | One understandable confirmation, then finish with no deal | One terminal action after confirmation |
| Inspect history/scorecard moment | Show original proposal, decision, resulting terms and reason | None; never replay mutations |
| Try another strategy | Return to editable pitch review | Fresh run only when deliberately started; preserve previous save until replacement consent |
| Resume/remove/resolve conflict | Restore or remove through approved controller and lock protocol | Storage operation only, with current accepted game state preserved as appropriate |

Sliders are coarse convenience controls with precise numeric inputs as the source of editable values. Use the existing valid ranges: positive cash through 99,999,999,999 minor units, equity 1–10,000 basis points, founder ownership 0–10,000 basis points. A range control must not clamp an exact valid typed value to its coarse step. Blank/invalid drafts produce an unavailable preview and disable submission; they never substitute zero or silently rewrite terms. Financial displays are implications of proposed terms, not independently established business worth.

## 6. Animation and transition specification

All durations below are design targets for user testing, not measured application performance. Animation is a presentation layer. Engine state commits, save scheduling and cancellation checks do not wait for visual completion.

| Event | Standard behavior | Reduced motion / interruption behavior | Source of truth |
| --- | --- | --- | --- |
| Scene entry/exit | 160–240 ms short fade/position settle; preserve shared table where useful | Instant replacement or short opacity-only change | Current scene derived from committed game stage plus temporary view selection |
| Investor selection | 120–180 ms portrait emphasis; keep identities stable | Immediate emphasis and selected text | User view selection; no domain mutation |
| Active speaker | Static light/nameplate emphasis, optional one-time small pose change | Static selected name and pose | Current investor/turn or validated dialogue speaker |
| Thinking | Small restrained activity indicator only while an actual AI request is pending | Static Working on a response status; cancellation/retry available | Actual request ID/status bound to session and turn |
| Progressive dialogue | Optional short text reveal; full text available through Show full text | Entire text immediate; screen readers receive complete messages once | Validated completed message; streaming fragments are provisional |
| Opening offers | Approximately 120 ms offset between emphases, total under 600 ms | All offers immediate; Show all now available from start | All engine opening decisions already committed |
| Revised terms | Brief 200–300 ms background/underline emphasis on changed fields; exact final numbers appear immediately | Static Changed labels and previous values | Previous and resulting offer IDs/terms in history |
| Withdrawal | 200–300 ms pose settle and status change; retain history | Immediate Withdrawn text and reason | Engine counter reason and offer status |
| Ownership preview | 120–180 ms bar-width transition, with exact labels immediate | Exact bar and text immediate | Approved financial functions applied to the local draft |
| Deal conclusion | Optional 400–600 ms gesture/composition change | Immediate result and scorecard action | Accepted deal outcome only |
| No-deal conclusion | 200–300 ms calm room settle | Immediate reason and next action | Specific terminal outcome |
| Resume | Direct stage restoration; short optional fade | Immediate stage and focus | Validated deterministic replay |

Skip controls never change financial state. If a new action, navigation, conflict or restored session supersedes an animation/request, cancel the obsolete presentation and show the latest state. Never animate transaction values through false amounts. No decision is timed; no offer expires because an animation, request or player takes longer. Existing saved sessions resume with settled visuals and closed transient confirmation/counter panels.

## 7. Complete five-minute example episode — LunchLoop

All business facts below are fictional teaching inputs. Questions and dialogue marked Illustrative are proposed character wording, not currently implemented AI output. The binding questions/actions and every financial result were evaluated through the approved version-1 engine in a read-only Node process. No model or paid service was called.

### Business and ask

LunchLoop supplies reusable lunch containers to campus cafés. Students borrow a box with a meal and return it to any partner café. LunchLoop collects, washes and redistributes the containers; cafés pay a service fee.

- Request: **€100,000 for 10% equity**.
- Founder ownership before investment: **60%**; other existing holders: **40%**.
- Original ask implies pre-money **€900,000.00**, post-money **€1,000,000.00**.
- If accepted at the ask: founder **54%**, other existing holders **36%**, investor **10%**.
- Fictional current business facts: five pilot cafés, monthly revenue €9,000, monthly costs €12,000, cash €24,000. At the stated current €3,000 monthly shortfall, current cash lasts eight months; this is not a promise about post-funding runway.
- Illustrative use of €100,000: washing equipment €40,000; containers €35,000; café launches €15,000; working capital €10,000. Total €100,000.

### Introductions, questions and confirmed answers

Maya introduction — Illustrative: “I look at the cash, the assumptions and what this money will change.”

Approved version-1 question, retained in 4B:

> What named financial figure can you share (for example, Revenue: €9,000)? If available, give your Runway: number of months and Use of funds: how the investment would be spent.

Any later contextual wording must preserve the required information and the reviewed evidence-confirmation contract.

Binding answer, plain figures in the selected EUR currency:

> Revenue: 9000 per month; Monthly costs: 12000; Cash balance: 24000; Runway: 8 months; Use of funds: washing equipment, reusable containers and partner cafe launches.

Optional future clarification — Illustrative: Maya asks, “Is eight months your runway before this investment?” Founder replies, “Yes, it describes our current cash and costs. Expansion costs would change that.” One exchange, no extra binding answer. The founder confirms any corrected final summary before it is submitted.

Adrian introduction — Illustrative: “Tell me how the next café finds you, and whether that route can keep working.”

Approved version-1 question, retained in 4B:

> Give your Target segment: who buys first and Acquisition channel: how you reach them. If measured, add an acquisition figure such as Conversion rate: 5%, CAC: €30 or Leads: 120.

Binding answer:

> Target segment: university campus cafes; Acquisition channel: campus partnerships and cafe demonstrations; CAC: 300 per cafe.

Optional future clarification — Illustrative: “What does the €300 measure?” Founder: “Our stated acquisition cost per pilot café; it is an early pilot figure, not proof that scaling will cost the same.” No invented benchmark or claim of independent verification.

Sofia introduction — Illustrative: “Show me what customers have done, and what you can actually deliver next.”

Approved version-1 question, retained in 4B:

> Give your Customer evidence: what you observed from customers, and Milestone: the specific next result your team will deliver.

Binding answer:

> Customer evidence: five pilot cafes renewed after students requested more return points; Milestone: add two return stations and sign five more cafes within three months.

Optional future clarification — Illustrative: “What is the next concrete delivery?” Founder: “Two additional return stations within three months.” Do not turn the question into an unlimited conversation or silently revise the recorded milestone.

### Opening decisions — exact engine output

| Investor | Cash | Investor equity | Pre-money | Post-money | Founder after | Other holders after |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Maya | €100,000.00 | 13% | €669,230.77 | €769,230.77 | 52.2% | 34.8% |
| Adrian | €90,000.00 | 15% | €510,000.00 | €600,000.00 | 51% | 34% |
| Sofia | €80,000.00 | 12% | €586,666.67 | €666,666.67 | 52.8% | 35.2% |

All three supply their required written signals. The CAC figure also qualifies Adrian for the approved €100,000 cash ceiling, although his opening remains €90,000. That ceiling is not an extra opening offer. These are simulation policy results; text signals are not independently verified evidence.

### Three negotiation decisions — exact engine output

1. **Ask Sofia for €100,000 for 10%.** Preview shows the original ask's ownership/valuation without consuming a round. Send consumes counter 1. Sofia withdraws because €100,000 exceeds her €80,000 ceiling (`above-cash-ceiling`). No offer is created at the previewed terms. Two shared counters remain.
   - Illustrative grounded response: “That asks for more cash than my budget allows. I’m stepping out.”
2. **Ask Maya for €100,000 for 10%.** Send consumes counter 2. Maya revises her offer from 13% to **12%** (`limited-concession`), at the same €100,000. Pre-money **€733,333.33**, post-money **€833,333.33**; founder **52.8%**, other holders **35.2%**, investor **12%**. One counter remains.
   - Illustrative grounded response: “I can improve my offer to the terms shown here.” The binding amount/equity must be rendered by the engine-owned term display.
3. **Ask Maya for €100,000 for 11%.** Send consumes counter 3. Maya agrees to those exact terms (`within-limits`). The stage becomes **Final offers**; agreement is still not an accepted deal. Adrian's €90,000 for 15% remains active, Sofia is withdrawn, and no further counters are allowed.
   - Illustrative grounded response: “Those terms work for me. Review them and decide whether you want to proceed.”

The player reviews Maya's current offer and explicitly confirms it. The engine finishes with one accepted Maya offer and closes Adrian's active offer. Superseded Maya offers remain in history. Seven accepted game actions: three answers + three counters + one acceptance. Clarifications, previews, comparisons and reveals consume none of that journal budget.

### Final financial consequences

| Item | Exact result |
| --- | ---: |
| Investment | €100,000.00 |
| Investor equity | 11% |
| Pre-money valuation | €809,090.91 |
| Post-money valuation | €909,090.91 |
| Reconciliation | €809,090.91 + €100,000.00 = €909,090.91 |
| Founder before → after | 60% → 53.4% |
| Other existing holders before → after | 40% → 35.6% |
| New investor before → after | 0% → 11% |
| Final ownership total | 53.4% + 35.6% + 11% = 100% |
| Founder ownership decrease | 6.6 percentage points |
| Founder relative dilution | 11% of the founder's original holding |
| Founder gain versus Maya's opening offer | 1.2 percentage points (53.4% versus 52.2%) |

Valuations use the approved half-up minor-unit rounding. This is primary issuance: existing holders dilute proportionally, with any approved rounding residual assigned to other existing holders. The displayed implied valuation is not a claim of actual company worth.

### Personalized scorecard

- Pitch coverage: requested written information was supplied across finance, growth and delivery. Show source excerpts; do not award a credibility or business-success grade for matching patterns.
- Funding result: €100,000 secured against a €100,000 ask: 100% of the amount requested.
- Ownership impact: founder 53.4%, down 6.6 percentage points; 1.2 percentage points more than Maya's opening offer would have retained.
- Negotiation choices: three counters used; one withdrawal; two Maya responses. Highlight the Sofia counter as a request above that investor's cash ceiling, with the before/proposal/result visible.
- Coaching: “You improved Maya's terms. Your first counter also removed an alternative because it exceeded Sofia's budget.” This follows recorded decisions; optional AI prose must remain separately labelled.
- Next practice challenge: **Reach Maya's €100,000 for 11% using one counter, while keeping Sofia available until the final choice.** This is possible under the existing Maya floor; do not penalize using fewer than all three counters. Restart returns to pitch review with a fresh session and retains the previous save until explicit replacement.

Alternative endings retain exact semantics: no opening offers, all investors withdrawn, or deliberate walk-away. No completed investment means founder 60%, other existing holders 40%, no new investor, and no accepted-deal valuation. The storyboard provides all conclusion variants for review; the main demonstration follows the accepted deal above.

### Five-minute demonstration target

| Elapsed target | Activity |
| --- | --- |
| 0:00–0:20 | Landing and choose the clearly fictional example |
| 0:20–0:40 | Explore/skip introductions |
| 0:40–1:05 | Inspect the ask/ownership preview and enter |
| 1:05–2:30 | Submit three prepared, editable answers |
| 2:30–2:50 | Reveal and compare all offers |
| 2:50–4:00 | Explore previews and submit three counters |
| 4:00–4:20 | Review, confirm and conclude |
| 4:20–5:00 | Inspect a key decision and next challenge |

This is a usability target to measure with beginners, not a deadline enforced on players. The scripted path needs no network/model latency. Optional clarification exchanges can extend the episode.

## 8. Later AI conversation and versioning contract

Not part of 4B implementation. Propose at most **one optional clarification exchange per investor**: one follow-up question and one founder reply before that investor's single binding answer is confirmed. At most three clarification exchanges per episode. Explanations of finance terms may use deterministic help and do not open additional evidence exchanges.

The AI may propose a short What I heard summary using only statements attributed to the founder. Show it inline as editable key points beside the answer. One **Confirm & send** action approves the evidence summary and commits the validated answer; correction remains in place, rather than opening a compulsory modal for every statement. Unknown/unprovided information stays missing. Do not invent a financial figure, promote hypothetical evidence into actual traction, or treat the summary as independently verified. Preserve original founder text for inspection.

Any normalization to the existing labelled answer format is explicit, reviewed and deterministic after the founder confirms it. The sample canonical inputs above use plain figures within the selected currency. The v1 matcher does not reliably recognize every natural phrase or currency-code format; Phase 4A does not modify or conceal that limitation. The exact later evidence-confirmation contract needs review before live AI. Keeping three binding answers does not grant permission to add unjournaled financial decisions.

Separate authoritative game state, conversation records and transient presentation. Proposed transcript records need bounded lengths/counts, speaker identity, message ID, request ID, session/turn/revision binding, original text, proposed/confirmed summary status and a clear distinction between provisional and completed messages. Persist completed validated dialogue only if separately authorized; never persist credentials or pending-request internals. Resume must not regenerate wording and present it as the original historical exchange.

Exact transcript restoration requires a new strict storage-envelope version, with an explicit validated v1 reader retained and no silent migration. Preserve the single local slot, exact-record conflict checks, generation/identity protection, size-before-parse limits, Web Locks and memory-only fallback. Define and approve any new total/transcript size budget; the current 65,536-unit v1 limit and seven-action journal cannot simply be ignored. Conversation records must not become the source of accepted deals or valuation arithmetic.

Before live AI, replace the current no-external-transmission claim for that mode with accurate disclosure of which pitch/answer content is sent and to whom. Consent to AI processing and consent to browser saving are separate choices. Keep API keys server-side, minimal context, no founder-content logging, bounded requests, safe output rendering, timeouts, cancellation, stale-response checks and spend/rate controls. Model output cannot directly determine commitments. Invalid output or unavailable service receives an honest retry/Scripted practice option without duplicate game actions. SE-001 and the deployment block remain independent approval gates.

## 9. Reuse, proposed components and assets

Preserve financials.ts, investor policies, session.ts action/revision checks, pitch.ts validation, the shared useSavedSession controller and session-storage.ts protocol. Reuse TermsDisplay/ValuationDetails calculations and NegotiationHistory data, while changing their presentation. Redesign PitchForm, PracticeRoom, OfferCard, Debrief and RecoveryPanel as presentation layers around those contracts. Retain the legacy practice engine and its tests.

Proposed presentation components (names are suggestions, not files created): StudioShell, InvestorPortrait, InvestorRail, InvestorIntroduction, PitchPreparation, PitchReview, DialogueStage, ExampleAnswerPicker, OfferComparison, CounterWorkbench, OwnershipPreview, OfferReveal, DecisionConfirmation, OutcomeScene, EpisodeScorecard, DecisionMoment, SaveStatusControl. A separate ScenePresentation controller may track view/animation state, never duplicate authoritative game state. A future ConversationCoordinator manages bounded requests and dialogue; it cannot mutate engine snapshots.

Assets: one shared studio/table illustration with desktop/mobile crops; three approved character sheets with reusable six-pose sets; expression/accessory consistency guide; nameplate and spotlight treatments; ownership/term visual tokens; reduced-motion settled states. Use compact local vector/2D assets with accessible text equivalents. No stock-photo feed, external image generation, 3D runtime, voice pipeline, cloud database, account system or new animation dependency is needed for 4B by default.

## 10. Recommended Phase 4B implementation sequence

All future implementation requires explicit authorization, a feature branch and a phase-ending regression/critical review before publication.

1. **Scene shell and asset contract.** Approve the three original character sheets; implement shared room/portrait composition and settled/reduced-motion states. Validate every approved width and keyboard order. No engine changes.
2. **Landing, introductions and backstage.** Add explicit fictional-example drafting, guided preparation and live previews through existing validation/calculation functions. Retain saving disclosure and replacement consent.
3. **Complete scripted conversation.** Move three existing investor questions and single binding answers into the room. Keep clear Scripted practice labelling, editable example answers, deterministic help and current evidence transparency. Do not introduce pretend AI loading or an AI-summary workflow before its separate approval.
4. **Offers and negotiation.** Implement comparison, draft-only sliders/exact inputs, ownership previews, guarded confirmation, counter markers and history inspection. Cover unchanged/revised/withdrawn results and final offers.
5. **Conclusions, scorecard and replay.** Implement all four endings, factual personalized metrics and selectable recorded decisions. Retain previous-save protection and fresh-session identity on replay.
6. **Recovery integration and final hardening.** Make normal save status compact while keeping conflicts/errors prominent and controls accessible. Exercise multi-tab/unmount races, visual/motion/focus behavior and the five-minute demonstration. End with full independent review.

Deliver a complete vertical slice early, then refine it; do not spend most of the course schedule on landing animation before negotiation is playable. Future live AI and transcript versioning remain a distinct approval after 4B.

## 11. Usability acceptance criteria

- A first-time player can identify the primary action on each scene without finance/programming knowledge.
- The example venture is available immediately, explicitly fictional and editable; using it never auto-submits an answer/counter or auto-consents to saving.
- In a moderated test, at least four of five representative beginners complete the prepared scripted episode within approximately five minutes without moderator intervention; record misunderstandings, time and abandoned actions. This is a proposed release target to approve, not a claim of tested performance.
- A player can explain, in their own words, money received, ownership given up and ownership retained after using the preview. If they cannot, revise the explanation before adding decorative motion.
- Opening offers are comparable on mobile without scrolling past three expanded investor reports. No offer is hidden by a reveal sequence during decision-making.
- Every preview is visibly a draft; ten slider/input edits consume zero counters and leave the authoritative revision/journal unchanged.
- Each accepted counter consumes exactly one shared round, including unchanged/withdrawn outcomes. Rejected actions consume none.
- Agreement cannot finish a game without explicit current-offer confirmation. All four endings remain distinct and restore correctly.
- Every essential action works by keyboard, without hover or drag. All scenes fit 320, 375, 681, 768 and 1440 px, including long names and open mobile keyboards.
- Reduced-motion and Show full text/Show all now reach the same information/actions without delay or a changed financial outcome.
- Recovery accurately states saved, pending, memory-only, failed and conflict states. Failed removal never claims data was deleted.
- A scorecard supports every factual claim with journal/pitch data; it never treats detected language as verified traction or a deal as proof of pitch quality.

## 12. Testing and regression strategy

Preserve the approved 128 unit tests and 82 browser scenarios. Presentation-based selectors/expectations may need reviewed updates; retain their behavioral assertions rather than deleting scenarios to fit the new UI.

- Unit: draft-to-preview boundaries; exact numeric parsing; ownership displays including zero founder ownership and 100% investment; scene/event mapping; previous/resulting offer comparison; factual scorecard derivation; invalid draft handling; no mutation from selection/history/animation callbacks.
- Browser: every storyboard transition and all four endings; use/edit example content; exact input plus slider; zero-cost previews; counter exhaustion; stale and duplicate actions; explicit confirmation; reduced motion, immediate reveal, skip, focus and live-region behavior; all requested viewports and long content.
- Persistence/concurrency: retain schema/replay/limit tests and real-page lock-controlled races. Exercise scene unmount during pending writes, replacement/deletion, corrupted saves, retry, origin-wide clearing, competing terminal actions and older acknowledgements. New presentation must not relax any invariant.
- Financial oracle: replay the verified LunchLoop episode and independently assert every amount, valuation and cap-table row in this document. Assert no-deal ownership remains original and no accepted-deal terms are fabricated.
- Visual review: desktop/mobile crops, recognizable characters across poses, contrast, no overlapping text, keyboard viewport behavior, focus visibility and complete information when animation is skipped.
- Accessibility: automated semantics plus actual keyboard and spoken screen-reader journeys; real mobile device review when available. Do not claim those checks complete from wireframes alone.
- Release checks per implementation group/phase: lint, unit tests, build, typecheck, browser suite in Edge/Chrome/Firefox, both npm audits and git diff --check. Keep SE-001 visible and no public deployment without separate sign-off.
- Later AI: independently test false/invented evidence, contradictory numbers, prompt injection, malformed output, interrupted streams, retries, duplicate requests, late callbacks, transcript restoration, privacy and rate/spend limits before enabling a live mode.

## 13. Risks and decisions for independent review

1. **Character art effort:** approve concept sheets before producing all poses. Four reusable core poses may ship first; additional poses cannot delay a complete playable episode.
2. **Natural language versus the v1 matcher:** do not disguise the existing labelled-evidence limitation. 4B remains scripted and transparent; the later confirmed-summary adapter/versioning needs separate review.
3. **Persistence growth:** transcript storage changes the contract; retain v1 restoration and approve explicit new limits. Do not put more data into the current envelope as an undocumented extra property.
4. **Cinematic pacing:** animation must remain short, skippable and independent of domain transitions. Beginner tests decide whether motion helps understanding.
5. **Scoring fairness:** recommend factual result cards first. Numerical quality/skill grading is deferred until an evidence-based rubric is independently approved.
6. **Five-minute target:** approve the prepared-answer scripted demonstration as the baseline; optional guidance/clarifications can take longer and never penalize the player.
7. **Default direction to approve:** original stylized 2D portraits; dark-green/lime identity; typed conversation; one optional future clarification per investor; three binding answers and three shared counters; one local save; no accounts, voice, multiplayer, public deployment or live AI in 4B.
8. **Security:** SE-001 remains unresolved under the existing controlled-development/publication exception. The redesign is not remediation and does not authorize deployment.

Phase 4A verification: the main accepted-deal episode, the one-counter replay challenge, and all three no-deal terminal paths were exercised through the approved engine without modifying it. The companion wireframes were checked across 11 scenes at 320, 375, 681, 768, 1024 and 1440 px, with four conclusion variants, six concept poses and working review-navigation controls. These checks validate planning illustrations, not a new application implementation or completed accessibility certification. The five-minute beginner target remains to be measured in Phase 4B.

Recommended gate: review the labelled desktop/mobile storyboard, character concepts, exact example episode and Phase 4B sequence together. Resolve comments before authorizing any repository implementation.
