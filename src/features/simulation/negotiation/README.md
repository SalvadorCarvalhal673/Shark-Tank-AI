# Negotiation rules v1

This engine runs alongside Phase 2 practice. The app continues to call the existing practice engine until Phase 3B. The new engine uses no clock, random source, storage or AI.

Use the questions in investor-policy.ts in order. Call startNegotiation with a fresh opaque session ID and a validated pitch object. founderOwnershipBps is optional and defaults to 10,000. Invalid initialization returns null. Start a new session with a different ID. Use the original ID only when replaying an existing run.

Submit actions through applyFounderAction with the session ID and expected revision. Rejected actions return the same session object. Engine snapshots and rule definitions are frozen at runtime. Treat input as plain data. The reducer copies validated pitch fields and counter terms into engine-owned records. An applied action increases the revision once and can append several ordered history entries at that revision. The array order resolves ties. Lookup opening and counter terms in the retained offer records by ID. The originating founder counter is stored explicitly in the history. After three applied counters, countering stops and any remaining offers are available for acceptance. Agreement alone leaves an active offer. Explicit acceptance ends the session with one accepted deal.

## Fictional investor policy

| Investor | Opening cash as share of ask | Opening equity premium | Maximum equity concession from opening terms | Cash ceiling as share of ask | Withdrawal band below floor |
| --- | ---: | ---: | ---: | ---: | ---: |
| Maya | 10,000 bp | 300 bp | 200 bp | 10,000 bp | 300 bp |
| Adrian | 9,000 bp | 500 bp | 300 bp | 9,000 bp, or 10,000 bp with an observed acquisition measure | 400 bp |
| Sofia | 8,000 bp | 200 bp | 100 bp | 8,000 bp | 200 bp |

The opening equity caps at 10,000 bp. Each investor keeps the floor established by its opening equity minus its maximum concession, with a minimum of one bp. Opening amounts and ceilings round half up and have a minimum of one minor unit. A counter above the cash ceiling or strictly below floor minus withdrawal band triggers withdrawal. At or above the floor and at or below the cash ceiling, the investor agrees to the exact requested terms. Otherwise the investor can reduce the current equity ask by up to 100 bp without crossing the floor, and offers the lesser of current cash and requested cash. If neither value changes, the offer remains active under its original ID. At the floor, they can still agree to a later in-range counter. All applied counters consume a round.

## Evidence

Maya requires a number attached to a recognized financial metric. Runway in months and a description under Use of funds are optional observations. Adrian requires descriptions under Target segment and Acquisition channel. A number attached to a recognized measure such as CAC, leads or conversion rate qualifies for the higher cash ceiling. Sofia requires descriptions under Customer evidence and Milestone. Descriptive fields require at least two distinct non-filler words. A normalized duplicate of an earlier answer gets no signals. Detected negation excludes the affected clause.

Supplied means a written pattern was observed. Missing means it was not detected. The quality marker is always not-independently-verified. These rules can miss valid answers that use other labels, languages, number formats or negation in unrelated context. They can accept fabricated figures, label-stuffing with distinctive words, or an affirmative clause in an answer that contradicts itself elsewhere. They do not establish traction, financial credibility or viability.

## Arithmetic

All cash values are integer minor units in the pitch currency. Equity and ownership are integer basis points. Intermediate products and divisions use BigInt. Valuation and founder ownership round half up to the nearest unit. Pre-money is rounded post-money minus the investment. Invalid valuations and ownership inputs return null.

The cap table models primary equity issuance with no secondary sales, convertible securities or option-pool changes. The investor receives exact agreed basis points. The founder retains their prior proportional share of the remainder, rounded to the nearest basis point. The other existing holders receive the residual. Founder dilution in basis points is the difference of the displayed ownership amounts, whereas relative founder dilution before display rounding equals the issued equity percentage for a nonzero founder ownership. Relative dilution is undefined and represented by null when the founder previously owned zero.
