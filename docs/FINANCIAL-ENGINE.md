# Financial engine

Authority: src/features/simulation/pitch.ts and negotiation/financials.ts. Independent-oracle coverage: tests/negotiation-financials.test.ts and domain-regression.test.ts.

## Units

Investment is new cash paid into the company. EUR100,000 is stored as10000000 cents. EUR/USD/GBP use minor units; no exchange conversion.
Ownership uses basis points:100bp=1%,10000bp=100%. Allowed investment1–99999999999 minor units; investor equity1–10000bp; previous founder ownership0–10000bp. Parsers require plain decimals with at most two places, not exponent notation/grouping commas.

## Valuations and dilution

Post-money=investment / investor fraction. Pre-money=post-money-investment. These are implied negotiated values, not independently verified market prices.
Intermediate arithmetic uses BigInt and exact half-up rounding. Round post-money to a minor unit, derive pre-money by subtraction, and reconcile exactly. At100% investor equity pre-money is0.
Primary issuance: the investor receives newly issued ownership; existing holders keep their proportional shares of the remaining company. Founder ownership rounds half up to1bp; other existing holders receive the residual, so all allocations total10000bp.
Founder percentage-point dilution is before minus after. Relative dilution before display rounding equals issued investor equity for a nonzero previous stake; at0% prior ownership it is null/undefined. No secondary sales, options, convertibles or multiple instrument types are modeled.

## Verified LunchLoop examples

Storyboard: reusable-container business in design/lunchloop-verified-episode.json. Ask EUR100000 for10%, founder previously60%.
| Terms | Post-money | Pre-money | Founder after | Other existing | Investor |
| --- | ---: | ---: | ---: | ---: | ---: |
| Ask:100000/10% |1000000.00 |900000.00 |54% |36% |10% |
| Maya opening:100000/13% |769230.77 |669230.77 |52.2% |34.8% |13% |
At the initial ask founder loses6 percentage points; relative dilution is10%, not6%.

Prototype: separate lunch-order fixture in src/features/studio/model.ts. Ask100000/20%, founder80% before. Post-money500000, pre-money400000; founder64%, other holders16%, investor20%. Do not mix fixtures or describe their fictional figures as business facts.
Future AI can explain engine-returned values. It never replaces authoritative calculations, terms or accepted status.
