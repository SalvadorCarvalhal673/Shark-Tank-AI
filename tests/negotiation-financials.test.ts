import assert from "node:assert/strict";
import test from "node:test";
import { investmentAtShare, ownershipAfterInvestment, valuations } from "../src/features/simulation/negotiation/financials.ts";

const maxAmount = 99_999_999_999;
const total = 10_000;
const scale = BigInt(total);

function oracle(numerator: bigint, denominator: bigint): number {
  // Add one half before truncating, expressed as a single exact fraction.
  return Number((numerator + numerator + denominator) / (denominator + denominator));
}

test("valuation reconciles to invested cash at the boundaries and rounds half-up ties", () => {
  assert.deepEqual(valuations({ amount: 1, equity: 32 }), { preMoney: 312, postMoney: 313 });
  assert.deepEqual(valuations({ amount: maxAmount, equity: 1 }), {
    preMoney: maxAmount * 9999, postMoney: maxAmount * 10_000,
  });
  assert.deepEqual(valuations({ amount: maxAmount, equity: total }), { preMoney: 0, postMoney: maxAmount });
  assert.deepEqual(valuations({ amount: 10_000_000, equity: 1250 }), { preMoney: 70_000_000, postMoney: 80_000_000 });
});

test("policy cash uses the same half-up rounding and clamps small offers to one minor unit", () => {
  for (const share of [8000, 9000, total]) {
    for (const amount of [1, 2, 5, 9, maxAmount]) {
      const expected = Math.max(1, oracle(BigInt(amount) * BigInt(share), scale));
      assert.equal(investmentAtShare(amount, share), expected);
    }
  }
  assert.equal(investmentAtShare(5, 9000), 5);
  assert.equal(investmentAtShare(1, 1), 1);
});

test("financial functions explicitly reject malformed terms and ownership", () => {
  for (const input of [null, {}, [], "100", { amount: "10", equity: 500 }]) {
    assert.equal(valuations(input), null);
  }
  for (const amount of [0, -1, NaN, Infinity, 1.1, maxAmount + 1, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(valuations({ amount, equity: 100 }), null);
    assert.equal(investmentAtShare(amount, 9000), null);
  }
  for (const equity of [0, -1, NaN, Infinity, 2.5, total + 1]) {
    assert.equal(valuations({ amount: 1, equity }), null);
    assert.equal(investmentAtShare(1, equity), null);
    assert.equal(ownershipAfterInvestment(total, equity), null);
  }
  for (const ownership of [null, undefined, "0", -1, NaN, Infinity, 1.1, total + 1]) {
    assert.equal(ownershipAfterInvestment(ownership, 1), null);
  }
});

test("cap table distinguishes percentage-point and relative founder dilution", () => {
  assert.deepEqual(ownershipAfterInvestment(6000, 1250), {
    founderBeforeBps: 6000, founderAfterBps: 5250, investorBps: 1250,
    otherExistingAfterBps: 3500, founderDilutionBps: 750, founderRelativeDilutionBps: 1250,
  });
  assert.equal(ownershipAfterInvestment(500, 10)?.founderAfterBps, 500);
  assert.equal(ownershipAfterInvestment(500, 10)?.founderRelativeDilutionBps, 10);
  assert.deepEqual(ownershipAfterInvestment(0, 2000), {
    founderBeforeBps: 0, founderAfterBps: 0, investorBps: 2000,
    otherExistingAfterBps: 8000, founderDilutionBps: 0, founderRelativeDilutionBps: null,
  });
});

test("generated valuations and cap tables match an independent BigInt oracle", () => {
  let seed = 424242;
  for (let index = 0; index < total; index++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const investor = index + 1;
    const amount = index % 2 ? maxAmount - (seed % 100_000) : 1 + seed * 23;
    const expectedPost = oracle(BigInt(amount) * scale, BigInt(investor));
    assert.deepEqual(valuations({ amount, equity: investor }), {
      preMoney: expectedPost - amount, postMoney: expectedPost,
    });
    for (const before of [0, 1, seed % (total + 1), total - 1, total]) {
      const result = ownershipAfterInvestment(before, investor);
      assert.ok(result);
      const expectedFounder = oracle(BigInt(before) * BigInt(total - investor), scale);
      assert.equal(result.founderAfterBps, expectedFounder);
      assert.equal(result.founderDilutionBps, before - expectedFounder);
      assert.equal(result.founderRelativeDilutionBps, before === 0 ? null : investor);
      assert.equal(result.founderAfterBps + result.investorBps + result.otherExistingAfterBps, total);
      assert.ok(result.otherExistingAfterBps >= 0 && result.founderAfterBps >= 0);
    }
  }
});


test("valuation reads each input field once and calculates from the validated copy", () => {
  let reads = 0;
  const terms = { amount: 1, get equity() { return ++reads === 1 ? 32 : 0; } };
  assert.deepEqual(valuations(terms), { preMoney: 312, postMoney: 313 });
  assert.equal(reads, 1);
});
