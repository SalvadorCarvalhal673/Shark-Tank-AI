/** USD nanounits per token; standard uncached short-context text, checked 2026-11-20. */
export const MODEL_RATES = Object.freeze({
  "gpt-6.2-sol": Object.freeze({ input: 2000, output: 10000 }),
  "gpt-6-luna": Object.freeze({ input: 100, output: 500 }),
  "claude-sonnet-5-5": Object.freeze({ input: 2000, output: 10000 }),
  "claude-haiku-5-5": Object.freeze({ input: 100, output: 500 }),
  "gemini-3.8-flash": Object.freeze({ input: 750, output: 3750 }),
});
export type Model = keyof typeof MODEL_RATES;
export function estimateCostNano(input: number, output: number, model: Model): bigint {
  if (![input, output].every(n => Number.isSafeInteger(n) && n >= 0) || !Object.hasOwn(MODEL_RATES, model))
    throw new RangeError("Invalid token count or model");
  const rate = MODEL_RATES[model];
  return BigInt(input) * BigInt(rate.input) + BigInt(output) * BigInt(rate.output);
}
