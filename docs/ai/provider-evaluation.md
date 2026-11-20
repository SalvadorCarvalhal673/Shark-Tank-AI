# Provider decision record — #42
Checked 20 November 2026. Provisional primary: GPT-6.2 Sol. Runtime fallback: existing deterministic script, never automatic cross-provider transmission. No inference performed; contextual reasoning, personality quality and latency remain UNMEASURED. Prioritize relevance and natural dialogue over small dollar differences.

| Candidate / official source | Standard USD / million input / output | Documented fit / uncertainty |
| --- | --- | --- |
| [GPT-6.2 Sol](https://developers.openai.com/api/docs/models/gpt-6.2-sol) | 2 / 10 | Responses API, structured outputs, reasoning. Cannot use reasoning effort none. Primary benchmark candidate, not a proven quality winner. |
| [GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna) | .10 / .50 | Focused high-volume model; structured outputs. Cheap challenger; contextual nuance unmeasured. |
| [Claude Sonnet 5.5](https://platform.claude.com/docs/en/about-claude/pricing) | 2 / 10 | Quality challenger; [structured JSON](https://platform.claude.com/docs/en/build-with-claude/structured-outputs). |
| Claude Haiku 5.5, same official pricing | .10 / .50 | Latency-sensitive challenger, short prompts below 100k tokens. Quality unmeasured. |
| [Gemini 3.8 Flash](https://aistudio.google.com/docs/pricing#gemini-3.8-flash) | .75 / 3.75 | [Structured outputs](https://aistudio.google.com/docs/structured-output); promotional rates through Dec31, then 1.50 / 7.50. |

Availability means listed in current official documentation, not successful access from this group's account. Recheck model IDs, permissions, quotas, deprecations and rates before live integration. All support a small server TypeScript/HTTP adapter; no agents framework required. Use one model with three persona prompts, one active speaker at a time. No quality or speed ranking is established by vendor marketing.

[OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data): API inputs not used for training by default; store:false does not mean zero retention (abuse monitoring/caching exceptions). [Anthropic commercial policy](https://privacy.claude.com/en/articles/7996868-is-my-data-used-for-model-training): no training by default, exceptions apply. [Google terms](https://aistudio.google.com/docs/terms): EEA clients require paid services; EEA unpaid data also receives the paid-data terms. Do not generalize global free-tier training language to Portugal.

No universal university credits verified. [Eligible existing OpenAI Pro/Business subscriptions](https://developers.openai.com/api/docs/guides/chatgpt-api-credits) may claim API credits; check actual eligibility without buying or activating. Google lists limited free quota, but EEA app distribution terms matter. [Anthropic subscriber benefits](https://platform.claude.com/docs/en/about-claude/api-credits-for-subscribers) are eligibility-dependent. The project must run offline without subscriptions.

## Reproducible cost scenario
Ten requests: three questions, three answer responses, three counter explanations, one outcome. Mean 3000 input + 800 billed output (including reasoning where applicable) each. Sol/Sonnet .14 USD; Luna/Haiku .007; Flash .0525 per episode. 100 episodes: 14 / .70 / 5.25 USD respectively. Cost = (input * rate + output * rate)/1e6. Unit tests independently assert integer nanodollar arithmetic. A larger 80k/20k episode costs Sol .36 USD. Excludes tax, hosting, tools, retries and cache writes; different tokenizers produce different actual counts. Flash estimates expire Dec31. No caching discounts assumed.

## Controlled future benchmark
After explicit live approval, run identical fictional LunchLoop reusable-container, GridWise retail-energy and CycleAgain bike-subscription cases across all three personas, including negation, contradictory corrections and prompt injection. Record exact model/prompt/schema versions, token usage and cost; randomized blind human ratings for relevance, personality and naturalness. Measure completed valid-response p50/p95 and fallback rate, not only first token. Aim p50 2–4s, p95 <=8s, absolute deadline15s; targets, not observed performance. Run 30 matched cases/model initially with a pre-approved spend cap. No real founder data, tools or paid calls in normal CI.

SE-001 remains open. Public deployment prohibited. Review required; this branch does not close #42 until integrated.
