import assert from "node:assert/strict";
import test from "node:test";
import { readPitch, type Pitch } from "../src/features/simulation/pitch.ts";
import { answerQuestion, assessment, counterOffer, finishPractice, postMoneyValue, startPractice } from "../src/features/simulation/practice.ts";

const pitch: Pitch = {
  startup: "Atlas Energy",
  pitch: "We sell energy monitoring subscriptions to small local shops.",
  currency: "EUR",
  amount: 10_000_000,
  equity: 1000,
};
const goodAnswer = "Revenue is 9000 each month and the investment funds another four months.";
const shortAnswer = "Not sure yet";

function form(changes: Record<string, string> = {}): FormData {
  const data = new FormData();
  const values = { ...pitch, amount: "100000", equity: "10", ...changes };
  for (const [key, value] of Object.entries(values)) data.set(key, String(value));
  return data;
}

function initialSession() {
  const session = startPractice(pitch);
  assert.ok(session);
  return session;
}

function negotiation(mask = 7) {
  return [0, 1, 2].reduce(
    (session, turn) => answerQuestion(session, mask & (1 << turn) ? goodAnswer : shortAnswer, turn),
    initialSession(),
  );
}

// These cases preserve all 251 assertions from the read-only domain audit.
for (const currency of ["EUR", "USD", "GBP"]) {
  test(`accept supported currency ${currency}`, () => {
    const result = readPitch(form({ currency }));
    assert.notEqual(typeof result, "string");
    assert.equal((result as Pitch).currency, currency);
  });
}

const invalidFields = {
  startup: ["", " ", "X", "x".repeat(81)],
  pitch: ["", " ".repeat(40), "x".repeat(29), "x".repeat(3001)],
  currency: ["JPY", "eur", ""],
  amount: ["0", "-1", "0.001", "1000000000", "NaN", "Infinity", "1,000", ""],
  equity: ["0", "-1", "100.01", "0.001", ""],
};
for (const [field, values] of Object.entries(invalidFields)) {
  for (const [index, value] of values.entries()) {
    test(`reject invalid ${field} case ${index}`, () => {
      assert.equal(typeof readPitch(form({ [field]: value })), "string");
    });
  }
}

for (const amount of ["0.01", "999999999.99", "100.17"]) {
  for (const equity of ["0.01", "100", "7.25"]) {
    test(`accept boundary amount ${amount} and equity ${equity}`, () => {
      assert.equal(typeof readPitch(form({ amount, equity })), "object");
    });
  }
}

for (let mask = 0; mask < 8; mask++) {
  test(`offer combination ${mask} preserves every acceptance, counter and terminal path`, () => {
    const session = negotiation(mask);
    const investors = [0, 1, 2].filter((index) => mask & (1 << index));
    assert.equal(session.offers.length, investors.length);
    assert.deepEqual(session.offers.map((offer) => offer.investor), investors);
    if (session.offers.length === 0) {
      assert.equal(session.stage, "finished");
      assert.equal(assessment(session).at(-1)?.result, "No deal");
      return;
    }

    const walkedAway = finishPractice(session);
    assert.equal(walkedAway.offers.filter((offer) => offer.status === "active").length, 0);
    assert.equal(walkedAway.stage, "finished");
    for (const offer of session.offers) {
      const finished = finishPractice(session, offer.id);
      assert.equal(finished.offers.filter((item) => item.status === "accepted").length, 1);
      assert.equal(finishPractice(finished, offer.id), finished);
      for (const other of session.offers) assert.equal(finishPractice(finished, other.id), finished);

      const countered = counterOffer(session, offer.id, { amount: offer.amount, equity: offer.equity - 200 });
      assert.equal(countered.counters.at(-1)?.outcome, "accepted");
      assert.equal(finishPractice(countered, offer.id), countered);
      assert.equal(counterOffer(countered, `counter-${offer.investor}`, { amount: 1, equity: 1 }), countered);
      const counterDeal = finishPractice(countered, `counter-${offer.investor}`);
      assert.equal(counterDeal.offers.filter((item) => item.status === "accepted").length, 1);

      const invalidTerms = [
        { amount: 0, equity: 100 }, { amount: NaN, equity: 100 },
        { amount: Infinity, equity: 100 }, { amount: 1.1, equity: 100 },
        { amount: 100_000_000_000, equity: 100 }, { amount: 1, equity: 10001 },
        { amount: 1, equity: 0 },
      ];
      for (const terms of invalidTerms) assert.equal(counterOffer(session, offer.id, terms), session);

      const declinedEquity = counterOffer(session, offer.id, { amount: offer.amount, equity: offer.equity - 201 });
      assert.equal(declinedEquity.counters.at(-1)?.outcome, "declined");
      assert.equal(finishPractice(declinedEquity, offer.id), declinedEquity);
    }

    let withdrawn = session;
    for (const offer of session.offers) {
      withdrawn = counterOffer(withdrawn, offer.id, { amount: offer.amount + 1, equity: offer.equity });
    }
    assert.equal(withdrawn.stage, "finished");
    assert.equal(assessment(withdrawn).at(-1)?.result, "No deal");
  });
}

for (const amount of [1, 10017, 10_000_000, 99_999_999_999]) {
  for (const equity of [1, 3, 3333, 9999, 10000]) {
    test(`valuation matches integer arithmetic oracle for ${amount}/${equity}`, () => {
      const numerator = BigInt(amount) * BigInt(10000);
      const denominator = BigInt(equity);
      const rounded = Number((BigInt(2) * numerator + denominator) / (BigInt(2) * denominator));
      assert.equal(postMoneyValue({ amount, equity }), rounded);
    });
  }
}

for (const [index, answer] of ["", " ".repeat(20), "a".repeat(9), "a".repeat(1501)].entries()) {
  test(`reject invalid answer boundary ${index}`, () => {
    const session = initialSession();
    assert.equal(answerQuestion(session, answer, 0), session);
  });
}

test("leading decimals and leading zeros preserve exact minor units", () => {
  for (const [text, units] of [[".5", 50], ["0000000001", 100], ["000.01", 1], ["1.", 100]] as const) {
    const result = readPitch(form({ amount: text, equity: text }));
    assert.notEqual(typeof result, "string");
    assert.equal((result as Pitch).amount, units);
    assert.equal((result as Pitch).equity, units);
  }
});

test("number failures explain syntax, precision and range for each field", () => {
  for (const field of ["amount", "equity"]) {
    assert.match(String(readPitch(form({ [field]: "1e3" }))), /plain decimal/);
    assert.match(String(readPitch(form({ [field]: "1.000" }))), /at most two decimal/);
    assert.match(String(readPitch(form({ [field]: "-.5" }))), /greater than zero/);
    assert.match(String(readPitch(form({ [field]: "0" }))), /greater than zero/);
  }
});

test("duplicate, stale, future and malformed turn submissions do not advance", () => {
  const initial = initialSession();
  for (const turn of [-1, 1, 0.5, NaN, Infinity]) assert.equal(answerQuestion(initial, goodAnswer, turn), initial);
  const next = answerQuestion(initial, goodAnswer, 0);
  assert.equal(answerQuestion(next, goodAnswer, 0), next);
  const third = answerQuestion(next, goodAnswer, 1);
  assert.equal(answerQuestion(third, goodAnswer, 0), third);
  assert.equal(answerQuestion(third, goodAnswer, 1), third);
  assert.equal(answerQuestion(third, goodAnswer, 2).stage, "negotiation");
});

test("invalid initialization and valuation return null without throwing", () => {
  for (const value of [null, undefined, {}, "invalid", NaN]) {
    assert.equal(startPractice(value), null);
    assert.equal(postMoneyValue(value), null);
  }
  for (const amount of [0, -1, NaN, Infinity, 1.5, 100_000_000_000, Number.MAX_SAFE_INTEGER]) {
    assert.equal(startPractice({ ...pitch, amount }), null);
    assert.equal(postMoneyValue({ amount, equity: 1000 }), null);
  }
  for (const equity of [0, -1, NaN, Infinity, 1.5, 10001]) {
    assert.equal(startPractice({ ...pitch, equity }), null);
    assert.equal(postMoneyValue({ amount: 100, equity }), null);
  }
  for (const fields of [{ startup: " " }, { pitch: "short" }, { currency: "JPY" }]) {
    assert.equal(startPractice({ ...pitch, ...fields }), null);
  }
});

test("session initialization copies valid data without unexpected properties or aliases", () => {
  const input = { ...pitch, startup: " Atlas Energy ", extra: "discard" };
  const session = startPractice(input);
  assert.ok(session);
  assert.deepEqual(session.pitch, pitch);
  input.amount = 1;
  assert.equal(session.pitch.amount, pitch.amount);
});

test("accepted and declined counters store exact fields for each investor", () => {
  for (const offer of negotiation().offers) {
    for (const accepted of [true, false]) {
      const terms = {
        ...pitch,
        amount: accepted ? offer.amount : offer.amount + 1,
        equity: offer.equity - 200,
        id: "injected", investor: 99, status: "accepted", offerId: "injected", outcome: "injected",
      };
      const session = counterOffer(negotiation(), offer.id, terms);
      assert.deepEqual(session.counters.at(-1), {
        offerId: offer.id, amount: terms.amount, equity: terms.equity,
        outcome: accepted ? "accepted" : "declined",
      });
      for (const item of session.offers) {
        assert.deepEqual(Object.keys(item).sort(), ["amount", "equity", "id", "investor", "status"]);
      }
      if (accepted) {
        assert.deepEqual(session.offers.at(-1), {
          id: `counter-${offer.investor}`, investor: offer.investor,
          amount: terms.amount, equity: terms.equity, status: "active",
        });
      } else {
        assert.equal(session.offers.length, 3);
        assert.equal(session.offers.find((item) => item.id === offer.id)?.status, "withdrawn");
      }
    }
  }
});

test("invalid actions preserve state and empty offer IDs cannot walk away", () => {
  const initial = initialSession();
  assert.equal(finishPractice(initial), initial);
  assert.equal(counterOffer(initial, "initial-0", pitch), initial);
  const session = negotiation();
  assert.equal(finishPractice(session, ""), session);
  assert.equal(finishPractice(session, "missing"), session);
  assert.equal(counterOffer(session, "missing", pitch), session);
  const finished = finishPractice(session);
  assert.equal(answerQuestion(finished, goodAnswer, 3), finished);
  assert.equal(counterOffer(finished, "initial-0", pitch), finished);
  assert.equal(finishPractice(finished), finished);
});
