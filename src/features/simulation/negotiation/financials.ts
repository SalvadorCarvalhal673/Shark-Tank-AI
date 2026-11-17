import { validTerms, type Terms } from "../pitch.ts";

export const BASIS_POINTS = 10_000;
const BASIS_POINTS_BIGINT = BigInt(BASIS_POINTS);

function roundHalfUp(numerator: bigint, denominator: bigint): number {
  const quotient = numerator / denominator;
  const remainder = numerator % denominator;
  return Number(quotient + (remainder * BigInt(2) >= denominator ? BigInt(1) : BigInt(0)));
}

export function validOwnership(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= BASIS_POINTS;
}

// Policy percentages can never reduce a positive offer below one minor unit.
export function investmentAtShare(amount: number, shareBps: number): number | null {
  if (!validTerms({ amount, equity: shareBps })) return null;
  return Math.max(1, roundHalfUp(BigInt(amount) * BigInt(shareBps), BASIS_POINTS_BIGINT));
}

export function snapshotTerms(input: unknown): Terms | null {
  if (typeof input !== "object" || input === null) return null;
  const { amount, equity } = input as Partial<Terms>;
  const terms = { amount, equity };
  return validTerms(terms) ? terms : null;
}

export function valuations(input: unknown): { preMoney: number; postMoney: number } | null {
  const terms = snapshotTerms(input);
  if (!terms) return null;
  const postMoney = roundHalfUp(BigInt(terms.amount) * BASIS_POINTS_BIGINT, BigInt(terms.equity));
  return { preMoney: postMoney - terms.amount, postMoney };
}

// Primary issuance only. The investor gets exact agreed equity and any rounding
// residual goes to the other existing holders. Relative dilution is rounded to 1 bp.
export function ownershipAfterInvestment(founderBeforeBps: unknown, investorBps: unknown) {
  if (!validOwnership(founderBeforeBps) || !validOwnership(investorBps) || investorBps === 0) return null;
  const retainedBps = BASIS_POINTS - investorBps;
  const exactFounderNumerator = BigInt(founderBeforeBps) * BigInt(retainedBps);
  const founderAfterBps = roundHalfUp(exactFounderNumerator, BASIS_POINTS_BIGINT);
  return {
    founderBeforeBps,
    founderAfterBps,
    investorBps,
    otherExistingAfterBps: retainedBps - founderAfterBps,
    founderDilutionBps: founderBeforeBps - founderAfterBps,
    // Derived from the exact proportional change, before cap-table display rounding.
    founderRelativeDilutionBps: founderBeforeBps === 0 ? null : investorBps,
  };
}
