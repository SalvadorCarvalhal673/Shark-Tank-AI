import test from "node:test";
import assert from "node:assert/strict";
import { ownershipAfterInvestment, valuations, investmentAtShare } from "../src/features/simulation/negotiation/financials.ts";
import { ownershipPresentation } from "../src/features/simulation/negotiation/presentation.ts";
import { validTerms } from "../src/features/simulation/pitch.ts";

// Issues #26, #32 and #82: an independent oracle written from the definitions, not from the engine's
// helpers. It uses exact rational arithmetic (numerator/denominator BigInt pairs) and its own
// half-up rounding, then compares the engine over exhaustive edges and a deterministic random sweep.

const BP = BigInt(10000);
const TWO = BigInt(2);
function halfUp(numerator: bigint, denominator: bigint) {
  // round(n/d) with ties away from zero for non-negative values: floor((2n + d) / 2d)
  return (TWO * numerator + denominator) / (TWO * denominator);
}
function oracleValuation(amount: number, equityBps: number) {
  // post-money = investment / equity share = amount * 10000 / bps (rounded half up to one minor unit)
  const post = halfUp(BigInt(amount) * BP, BigInt(equityBps));
  return { preMoney: Number(post) - amount, postMoney: Number(post) };
}
function oracleOwnership(founderBefore: number, investor: number) {
  const founderAfter = Number(halfUp(BigInt(founderBefore) * (BP - BigInt(investor)), BP));
  return { founderAfterBps: founderAfter, otherExistingAfterBps: 10000 - investor - founderAfter, investorBps: investor };
}
let seed = 0x5eed;
const random = (max: number) => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % max; };

test("ownership edges: founder 0%, 100% and every investor share reconcile to exactly 100%", () => {
  for (const founder of [0, 1, 5000, 9999, 10000]) {
    for (let investor = 1; investor <= 10000; investor++) {
      const engine = ownershipAfterInvestment(founder, investor)!;
      const oracle = oracleOwnership(founder, investor);
      assert.equal(engine.founderAfterBps, oracle.founderAfterBps, `founder ${founder} investor ${investor}`);
      assert.equal(engine.otherExistingAfterBps, oracle.otherExistingAfterBps);
      assert.equal(engine.founderAfterBps + engine.otherExistingAfterBps + engine.investorBps, 10000);
      assert.ok(engine.otherExistingAfterBps >= 0 && engine.founderAfterBps >= 0);
    }
  }
  assert.equal(ownershipAfterInvestment(6000, 0), null, "a 0% investor share is not an investment");
  const presented = ownershipPresentation(10000, 2000)!;
  assert.deepEqual([presented.founderAfterBps, presented.otherExistingAfterBps, presented.otherExistingBeforeBps], [8000, 0, 0], "100% founder");
  const none = ownershipPresentation(0, 2000)!;
  assert.deepEqual([none.founderAfterBps, none.otherExistingAfterBps, none.founderRelativeDilutionBps], [0, 8000, null], "0% founder");
});

test("valuations match the oracle and pre-money plus investment equals post-money", () => {
  const cases: [number, number][] = [[1, 1], [1, 10000], [99999999, 1], [10000000, 1000], [10000001, 3333], [12345, 6667], [Number.MAX_SAFE_INTEGER, 10000]];
  for (let i = 0; i < 5000; i++) cases.push([1 + random(1_000_000_000), 1 + random(10000)]);
  for (const [amount, equity] of cases) {
    if (!validTerms({ amount, equity })) continue;
    const engine = valuations({ amount, equity })!;
    assert.deepEqual(engine, oracleValuation(amount, equity), `${amount} @ ${equity}`);
    assert.equal(engine.preMoney + amount, engine.postMoney);
    assert.ok(Number.isSafeInteger(engine.postMoney));
  }
});

test("policy shares of an investment round half up and never fall below one minor unit", () => {
  for (let i = 0; i < 5000; i++) {
    const amount = 1 + random(1_000_000_000), share = 1 + random(10000);
    if (!validTerms({ amount, equity: share })) continue;
    const expected = Math.max(1, Number(halfUp(BigInt(amount) * BigInt(share), BP)));
    assert.equal(investmentAtShare(amount, share), expected);
  }
  assert.equal(investmentAtShare(1, 1), 1);
});
