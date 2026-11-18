import { expect, test, type Page } from "@playwright/test";
import { investorAnswers } from "./browser-fixtures";

const key = "shark-tank-ai.session";
async function prepare(page: Page, save = true, startNow = true) {
  await page.goto("/simulate");
  await expect(page.getByText("Checking saved progress…", { exact: true })).toHaveCount(0);
  const fresh = page.getByRole("button", { name: "Start a new session", exact: true });
  if (await fresh.count()) await fresh.first().click();
  await page.getByLabel("Startup name").fill("Saved Atlas");
  await page.getByLabel("Your pitch").fill("We sell energy monitoring subscriptions to local retail shops.");
  await page.getByLabel("Investment", { exact: true }).fill("100000");
  await page.getByLabel("Equity (%)").fill("10");
  await page.getByRole("button", { name: "Review pitch" }).click();
  if (save) await page.getByLabel("Save this session in this browser").check();
  if (startNow) await page.getByRole("button", { name: "Start practice", exact: true }).click();
}
async function saved(page: Page) {
  await expect(page.getByLabel("Save status", { exact: true })).toHaveText("Save status · Saved");
}
async function resume(page: Page) {
  await page.reload();
  await page.getByRole("button", { name: "Resume saved session", exact: true }).click();
}
async function journalLength(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).actions.length, key);
}
async function answerAll(page: Page) {
  for (const answer of investorAnswers) {
    await page.getByLabel("Your answer").fill(answer);
    await page.getByRole("button", { name: "Submit answer" }).click();
  }
}
function card(page: Page, name = "Maya Chen") {
  return page.getByRole("article").filter({ has: page.getByRole("heading", { name, exact: true }) });
}

test("saves initial state, every answer, final offers, and the accepted debrief", async ({ page }) => {
  await prepare(page);
  await saved(page);
  expect(await journalLength(page)).toBe(0);
  const id = await page.locator(".practice-room").getAttribute("data-session-id");
  await resume(page);
  await expect(page.getByRole("heading", { name: "Maya Chen", exact: true })).toBeFocused();
  for (const [turn, answer] of investorAnswers.entries()) {
    await page.getByLabel("Your answer").fill(answer);
    await page.getByRole("button", { name: "Submit answer" }).click();
    await saved(page);
    expect(await journalLength(page)).toBe(turn + 1);
    await resume(page);
    expect(await page.locator(".practice-room").getAttribute("data-session-id")).toBe(id);
  }
  for (let round = 0; round < 3; round++) {
    const maya = card(page);
    await maya.getByRole("button", { name: "Make a counteroffer" }).click();
    await maya.getByLabel("Equity (%)").fill("10");
    await maya.getByRole("button", { name: "Send counteroffer" }).click();
    await saved(page);
    expect(await journalLength(page)).toBe(4 + round);
    await resume(page);
  }
  await expect(page.getByRole("heading", { name: "Final offers." })).toBeFocused();
  await card(page).getByRole("button", { name: "Accept offer", exact: true }).click();
  expect(await journalLength(page)).toBe(6);
  await card(page).getByRole("button", { name: "Confirm deal" }).click();
  await saved(page);
  expect(await journalLength(page)).toBe(7);
  await resume(page);
  await expect(page.getByRole("heading", { name: "Your debrief." })).toBeFocused();
  await expect(page.getByRole("heading", { name: "Deal with Maya Chen" })).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();
});

test("closing the page restores the save and transient controls stay closed", async ({ page, context }) => {
  await prepare(page);
  await answerAll(page);
  await saved(page);
  await card(page).getByRole("button", { name: "Accept offer", exact: true }).click();
  const raw = await page.evaluate((key) => localStorage.getItem(key), key);
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto("/simulate");
  await reopened.getByRole("button", { name: "Resume saved session", exact: true }).click();
  await expect(reopened.getByRole("heading", { name: "Negotiate your terms." })).toBeFocused();
  await expect(reopened.getByRole("button", { name: "Confirm deal" })).toHaveCount(0);
  expect(await reopened.evaluate((key) => localStorage.getItem(key), key)).toBe(raw);
});

test("memory-only practice performs no writes and refresh shows a clean intake", async ({ page }) => {
  await prepare(page, false);
  await answerAll(page);
  await page.getByRole("button", { name: "Walk away" }).click();
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBeNull();
  await page.reload();
  await expect(page.getByLabel("Startup name")).toHaveValue("");
});

test("rejected duplicate answer events produce only one saved action", async ({ page }) => {
  await prepare(page);
  await page.getByLabel("Your answer").fill(investorAnswers[0]);
  await page.locator(".practice-room form").evaluate((form) => {
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  await saved(page);
  expect(await journalLength(page)).toBe(1);
  await resume(page);
  await expect(page.getByRole("heading", { name: "Adrian Vale", exact: true })).toBeFocused();
});

test("replacement cancellation retains the old save and practice-again requires explicit replacement", async ({ page }) => {
  await prepare(page);
  await answerAll(page);
  await page.getByRole("button", { name: "Walk away" }).click();
  await saved(page);
  const old = await page.evaluate((key) => localStorage.getItem(key), key);
  await page.getByRole("button", { name: "Practice again" }).click();
  await page.getByLabel("Save this session in this browser").check();
  await page.getByRole("button", { name: "Start practice", exact: true }).click();
  await page.getByRole("button", { name: "Cancel replacement" }).click();
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(old);
  await page.getByRole("button", { name: "Start practice", exact: true }).click();
  await page.getByRole("button", { name: "Confirm replacement" }).click();
  await saved(page);
  const replacement = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key);
  expect(replacement.saveId).not.toBe(JSON.parse(old!).saveId);
  expect(replacement.sessionId).not.toBe(JSON.parse(old!).sessionId);
  expect(replacement.generation).toBe(1);
});

for (const raw of ["{", JSON.stringify({ schemaVersion: 2, rulesVersion: 1 }), "x".repeat(65537)]) {
  test(`invalid record stays intact until confirmed removal (${raw.length})`, async ({ page }) => {
    await page.goto("/simulate");
    await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), { key, raw });
    await page.reload();
    await expect(page.getByRole("heading", { name: "Saved progress needs attention." })).toBeFocused();
    expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(raw);
    await page.getByRole("button", { name: "Remove saved information" }).click();
    await page.getByRole("button", { name: "Confirm removal" }).click();
    await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), key)).toBeNull();
    await expect(page.getByLabel("Startup name")).toBeVisible();
  });
}

test("active removal stops saving without destroying the current session", async ({ page }) => {
  await prepare(page);
  await page.getByRole("button", { name: "Remove saved information" }).click();
  await page.getByRole("button", { name: "Confirm removal" }).click();
  await page.getByLabel("Your answer").fill(investorAnswers[0]);
  await page.getByRole("button", { name: "Submit answer" }).click();
  await expect(page.getByRole("heading", { name: "Adrian Vale", exact: true })).toBeFocused();
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBeNull();
});

test("quota failure preserves memory and deliberate retry succeeds", async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Object.defineProperty(window, "qaAllowSave", { value: false, writable: true });
    Storage.prototype.setItem = function(key, value) {
      if (key === "shark-tank-ai.session" && !(window as unknown as { qaAllowSave: boolean }).qaAllowSave) throw new DOMException("quota", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  await prepare(page);
  await expect(page.getByLabel("Save status")).toContainText("Saving unavailable");
  await page.getByLabel("Your answer").fill(investorAnswers[0]);
  await page.getByRole("button", { name: "Submit answer" }).click();
  await page.evaluate(() => { (window as unknown as { qaAllowSave: boolean }).qaAllowSave = true; });
  await page.getByRole("button", { name: "Retry saving" }).click();
  await saved(page);
  expect(await journalLength(page)).toBe(1);
});

test("missing locks never permit an unlocked write or removal", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "locks", { value: undefined, configurable: true }));
  await prepare(page);
  await expect(page.getByLabel("Save status")).toContainText("Saving unavailable");
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBeNull();
  await page.getByRole("button", { name: "Continue without saving" }).click();
  await answerAll(page);
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBeNull();
});

async function holdWrites(page: Page) {
  await page.evaluate(() => new Promise<void>((ready) => {
    void navigator.locks.request("shark-tank-ai.session.write", async () => {
      await new Promise<void>((release) => {
        (window as unknown as { qaRelease: () => void }).qaRelease = release;
        ready();
      });
    });
  }));
}
async function releaseWrites(page: Page) {
  await page.evaluate(() => (window as unknown as { qaRelease: () => void }).qaRelease());
}

test("divergent resumed tabs stop the losing writer and load the latest saved record", async ({ page, context }) => {
  await prepare(page);
  await saved(page);
  const second = await context.newPage();
  await second.goto("/simulate");
  await second.getByRole("button", { name: "Resume saved session", exact: true }).click();
  const holder = await context.newPage();
  await holder.goto("/simulate");
  await holdWrites(holder);
  // Submit without pointer-stability waits in background tabs, so the race is
  // released deliberately before the separate lock-timeout fallback applies.
  await page.getByLabel("Your answer").evaluate((field, text) => {
    (field as HTMLTextAreaElement).value = text;
    (field as HTMLTextAreaElement).form!.requestSubmit();
  }, investorAnswers[0]);
  await second.getByLabel("Your answer").evaluate((field) => {
    (field as HTMLTextAreaElement).value = "Revenue: 5000 from a different tab";
    (field as HTMLTextAreaElement).form!.requestSubmit();
  });
  await releaseWrites(holder);
  await expect.poll(() => journalLength(page)).toBe(1);
  const storedAnswer = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).actions[0].text, key);
  // Browser scheduling decides which effect requests the lock first.
  const [winner, loser] = storedAnswer === investorAnswers[0] ? [page, second] : [second, page];
  await saved(winner);
  await expect(loser.getByLabel("Save status")).toContainText("Conflict detected");
  await loser.getByRole("button", { name: "Load saved progress" }).click();
  await loser.getByRole("button", { name: "Confirm load" }).click();
  await expect(loser.getByRole("heading", { name: "Adrian Vale", exact: true })).toBeFocused();
  await expect(loser.getByLabel("Save status")).toHaveText("Save status · Saved");
});

test("removal cancels a queued save before releasing the lock", async ({ page, context }) => {
  await prepare(page);
  await saved(page);
  const holder = await context.newPage();
  await holder.goto("/simulate");
  await holdWrites(holder);
  await page.getByLabel("Your answer").fill(investorAnswers[0]);
  await page.getByRole("button", { name: "Submit answer" }).click();
  await expect(page.getByLabel("Save status")).toHaveText("Save status · Saving");
  await page.getByRole("button", { name: "Remove saved information" }).click();
  await page.getByRole("button", { name: "Confirm removal" }).click();
  await releaseWrites(holder);
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), key)).toBeNull();
  await page.getByLabel("Your answer").fill(investorAnswers[1]);
  await page.getByRole("button", { name: "Submit answer" }).click();
  await expect(page.getByRole("heading", { name: "Sofia Mendes", exact: true })).toBeFocused();
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBeNull();
});

test("simultaneous initial saves cannot overwrite each other", async ({ page, context }) => {
  await page.goto("/simulate");
  const holder = await context.newPage();
  await holder.goto("/simulate");
  const other = await context.newPage();
  await prepare(page, true, false);
  await prepare(other, true, false);
  await holdWrites(holder);
  await page.getByRole("button", { name: "Start practice", exact: true }).evaluate((button) => (button as HTMLButtonElement).click());
  await other.getByRole("button", { name: "Start practice", exact: true }).evaluate((button) => (button as HTMLButtonElement).click());
  await releaseWrites(holder);
  await expect.poll(async () => (await Promise.all([page, other].map((tab) => tab.getByLabel("Save status").textContent())))
    .filter((status) => status === "Save status · Saved").length).toBe(1);
  const [winner, loser] = await page.getByLabel("Save status").textContent() === "Save status · Saved" ? [page, other] : [other, page];
  await saved(winner);
  // A storage notification can cancel the losing request before its lock is
  // granted. Both cancellation and a locked mismatch must preserve the winner.
  await expect(loser.getByLabel("Save status")).toContainText("Conflict detected");
  expect(await winner.evaluate((key) => JSON.parse(localStorage.getItem(key)!).sessionId, key))
    .toBe(await winner.locator(".practice-room").getAttribute("data-session-id"));
  const raw = await winner.evaluate((key) => localStorage.getItem(key), key);
  // A slow tab may already have entered the documented memory-only timeout
  // fallback. Its in-memory run is allowed to remain usable after the conflict.
  if (await loser.getByLabel("Your answer").count()) {
    await loser.getByLabel("Your answer").fill(investorAnswers[0]);
    await loser.getByRole("button", { name: "Submit answer" }).click();
  }
  expect(await winner.evaluate((key) => localStorage.getItem(key), key)).toBe(raw);
});

test("stale removal and replacement confirmations preserve the newer record", async ({ page, context }) => {
  await prepare(page);
  await saved(page);
  const other = await context.newPage();
  await other.goto("/simulate");
  await page.getByRole("button", { name: "Remove saved information" }).click();
  const changed = await other.evaluate((key) => {
    const item = JSON.parse(localStorage.getItem(key)!);
    item.generation++;
    const raw = JSON.stringify(item);
    localStorage.setItem(key, raw);
    return raw;
  }, key);
  await page.getByRole("button", { name: "Confirm removal" }).click();
  await expect(page.getByText("The record changed. The newer saved information was not removed.")).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(changed);
  await prepare(page);
  // prepare opens the saved-session replacement prompt.
  await expect(page.getByRole("button", { name: "Confirm replacement" })).toBeVisible();
  const newer = await other.evaluate((key) => {
    const item = JSON.parse(localStorage.getItem(key)!);
    item.generation++;
    const raw = JSON.stringify(item);
    localStorage.setItem(key, raw);
    return raw;
  }, key);
  await page.getByRole("button", { name: "Confirm replacement" }).click();
  await expect(page.getByText("The saved record changed before replacement. Review the latest saved progress and confirm again.")).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(newer);
});

test("external same-generation changes and origin clearing stop automatic writes", async ({ page, context }) => {
  await prepare(page);
  await saved(page);
  const other = await context.newPage();
  await other.goto("/simulate");
  await other.evaluate((key) => localStorage.setItem(key, localStorage.getItem(key)! + " "), key);
  await expect(page.getByLabel("Save status")).toContainText("Conflict detected");
  await page.getByRole("button", { name: "Continue without saving" }).click();
  await page.getByLabel("Your answer").fill(investorAnswers[0]);
  await page.getByRole("button", { name: "Submit answer" }).click();
  expect(await journalLength(page)).toBe(0);
  await page.reload();
  await page.getByRole("button", { name: "Resume saved session", exact: true }).click();
  // Test external clearing only. Application code must never clear origin data.
  await other.evaluate(() => localStorage.clear());
  await expect(page.getByLabel("Save status")).toContainText("Conflict detected");
  await page.getByLabel("Your answer").fill(investorAnswers[0]);
  await page.getByRole("button", { name: "Submit answer" }).click();
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBeNull();
});

test("long-held locks time out into usable memory-only practice", async ({ page, context }) => {
  const holder = await context.newPage();
  await holder.goto("/simulate");
  await holdWrites(holder);
  await prepare(page);
  await expect(page.getByLabel("Save status")).toContainText("Saving unavailable", { timeout: 7000 });
  await expect(page.getByLabel("Your answer")).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBeNull();
  await releaseWrites(holder);
  await page.getByRole("button", { name: "Retry saving" }).click();
  await saved(page);
});

for (const width of [320, 375, 681, 768, 1440]) {
  test(`recovery is keyboard accessible and fits ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await prepare(page);
    await saved(page);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Return to your pitch." })).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.getByRole("button", { name: "Resume saved session", exact: true }).press("Enter");
    await expect(page.getByRole("heading", { name: "Maya Chen", exact: true })).toBeFocused();
    await page.getByRole("button", { name: "Remove saved information" }).press("Enter");
    await expect(page.getByRole("heading", { name: "Remove saved information?" })).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.getByRole("button", { name: "Cancel", exact: true }).press("Enter");
    await expect(page.getByRole("button", { name: "Remove saved information" })).toBeFocused();
  });
}

test("blocked localStorage and rejected locks preserve an in-memory journey", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", { get() { throw new DOMException("blocked", "SecurityError"); } });
  });
  await prepare(page);
  await expect(page.getByLabel("Save status")).toContainText("Saving unavailable");
  await answerAll(page);
  await page.getByRole("button", { name: "Walk away" }).click();
  await expect(page.getByRole("heading", { name: "Your debrief." })).toBeFocused();
});

test("a rejected lock request is recoverable without unsafe writes", async ({ page }) => {
  await page.addInitScript(() => {
    const real = navigator.locks.request.bind(navigator.locks);
    Object.defineProperty(window, "qaRejectLock", { value: true, writable: true });
    navigator.locks.request = ((...args: unknown[]) => {
      if ((window as unknown as { qaRejectLock: boolean }).qaRejectLock) return Promise.reject(new Error("unavailable"));
      return (real as (...args: unknown[]) => Promise<unknown>)(...args);
    }) as typeof navigator.locks.request;
  });
  await prepare(page);
  await expect(page.getByLabel("Save status")).toContainText("Saving unavailable");
  await page.evaluate(() => { (window as unknown as { qaRejectLock: boolean }).qaRejectLock = false; });
  await page.getByRole("button", { name: "Retry saving" }).click();
  await saved(page);
});

for (const outcome of ["no-offers", "founder-walk-away", "all-withdrawn"] as const) {
  test(`restores the ${outcome} terminal debrief`, async ({ page }) => {
    await prepare(page);
    if (outcome === "no-offers") {
      for (let turn = 0; turn < 3; turn++) {
        await page.getByLabel("Your answer").fill("I cannot provide those details for question " + turn + " today.");
        await page.getByRole("button", { name: "Submit answer" }).click();
      }
    } else {
      await answerAll(page);
      if (outcome === "founder-walk-away") await page.getByRole("button", { name: "Walk away" }).click();
      else for (const name of ["Maya Chen", "Adrian Vale", "Sofia Mendes"]) {
        const investor = card(page, name);
        await investor.getByRole("button", { name: "Make a counteroffer" }).click();
        await investor.getByLabel("Investment (EUR)").fill("999999999.99");
        await investor.getByRole("button", { name: "Send counteroffer" }).click();
      }
    }
    await saved(page);
    const before = await page.locator(".debrief").textContent();
    const raw = await page.evaluate((key) => localStorage.getItem(key), key);
    await resume(page);
    await expect(page.getByRole("heading", { name: "Your debrief." })).toBeFocused();
    expect(await page.locator(".debrief").textContent()).toBe(before);
    expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(raw);
  });
}

test("failed removal reports retained data and never resumes automatic writes", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.removeItem = () => { throw new DOMException("blocked", "SecurityError"); };
  });
  await prepare(page);
  await saved(page);
  const raw = await page.evaluate((key) => localStorage.getItem(key), key);
  await page.getByRole("button", { name: "Remove saved information" }).click();
  await page.getByRole("button", { name: "Confirm removal" }).click();
  await expect(page.getByText(/Removal failed. Saved information may remain/)).toBeVisible();
  await page.getByLabel("Your answer").fill(investorAnswers[0]);
  await page.getByRole("button", { name: "Submit answer" }).click();
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(raw);
});

test("retrying an unchanged resumed journal checks lock access before reporting Saved", async ({ page }) => {
  await prepare(page);
  await saved(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "locks", { value: undefined });
  });
  await resume(page);
  await expect(page.getByLabel("Save status")).toContainText("Saving unavailable");
  const raw = await page.evaluate((key) => localStorage.getItem(key), key);
  await page.getByRole("button", { name: "Retry saving" }).click();
  await expect(page.getByLabel("Save status")).toContainText("Saving unavailable");
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(raw);
});

test("queued checkpoints cannot acknowledge unsaved newer progress", async ({ page, context }) => {
  await prepare(page);
  await saved(page);
  const holder = await context.newPage();
  await holder.goto("/simulate");
  await holdWrites(holder);
  for (const answer of investorAnswers.slice(0, 2)) {
    await page.getByLabel("Your answer").evaluate((field, text) => {
      (field as HTMLTextAreaElement).value = text;
      (field as HTMLTextAreaElement).form!.requestSubmit();
    }, answer);
    await expect(page.getByLabel("Save status")).toHaveText("Save status · Saving");
  }
  expect(await journalLength(page)).toBe(0);
  await releaseWrites(holder);
  await saved(page);
  expect(await journalLength(page)).toBe(2);
  await resume(page);
  await expect(page.getByRole("heading", { name: "Sofia Mendes", exact: true })).toBeFocused();
});

test("manual checks detect same-page edits even when metadata and generation stay unchanged", async ({ page }) => {
  await prepare(page);
  await saved(page);
  const raw = await page.evaluate((key) => {
    const changed = localStorage.getItem(key)! + " ";
    localStorage.setItem(key, changed);
    return changed;
  }, key);
  await page.getByRole("button", { name: "Check saved information" }).click();
  await expect(page.getByLabel("Save status")).toContainText("Conflict detected");
  await page.getByLabel("Your answer").fill(investorAnswers[0]);
  await page.getByRole("button", { name: "Submit answer" }).click();
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(raw);
});

test("failed removal on the recovery gate returns focus to its heading", async ({ page }) => {
  await prepare(page);
  await saved(page);
  await page.reload();
  await page.evaluate(() => { Storage.prototype.removeItem = () => { throw new Error("blocked"); }; });
  await page.getByRole("button", { name: "Remove saved information" }).click();
  await page.getByRole("button", { name: "Confirm removal" }).click();
  await expect(page.getByText(/Removal failed. Saved information may remain/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Return to your pitch." })).toBeFocused();
});

test("removing the previous save from preview returns focus to the preview heading", async ({ page }) => {
  await prepare(page);
  await saved(page);
  await prepare(page, true, false);
  await page.getByRole("button", { name: "Remove saved information" }).click();
  await page.getByRole("button", { name: "Confirm removal" }).click();
  await expect(page.getByRole("heading", { name: "Saved Atlas", exact: true })).toBeFocused();
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBeNull();
});

for (const race of ["counter", "terminal"] as const) {
  test(`review: competing ${race} actions persist exactly one branch of history`, async ({ page, context }) => {
    await prepare(page);
    await answerAll(page);
    await saved(page);
    const other = await context.newPage();
    await other.goto("/simulate");
    await other.getByRole("button", { name: "Resume saved session", exact: true }).click();
    if (race === "counter") {
      for (const [tab, equity] of [[page, "11"], [other, "12"]] as const) {
        await card(tab).getByRole("button", { name: "Make a counteroffer" }).click();
        await card(tab).getByLabel("Equity (%)").fill(equity);
      }
    } else await card(page).getByRole("button", { name: "Accept offer", exact: true }).click();
    const holder = await context.newPage();
    await holder.goto("/simulate");
    await holdWrites(holder);
    await Promise.all([
      (race === "counter" ? card(page).getByRole("button", { name: "Send counteroffer" }) : card(page).getByRole("button", { name: "Confirm deal" }))
        .evaluate((button) => (button as HTMLButtonElement).click()),
      (race === "counter" ? card(other).getByRole("button", { name: "Send counteroffer" }) : other.getByRole("button", { name: "Walk away" }))
        .evaluate((button) => (button as HTMLButtonElement).click()),
    ]);
    await releaseWrites(holder);
    await expect.poll(() => journalLength(page)).toBe(4);
    const record = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key);
    if (race === "counter") expect(record.actions[3].kind).toBe("counter");
    else expect(["accept", "walk-away"]).toContain(record.actions[3].kind);
    await expect.poll(async () => (await Promise.all([page, other].map((tab) => tab.getByLabel("Save status").textContent())))
      .filter((status) => status === "Save status · Saved").length).toBe(1);
    const loser = await page.getByLabel("Save status").textContent() === "Save status · Saved" ? other : page;
    await expect(loser.getByLabel("Save status")).toContainText("Conflict detected");
    await loser.getByRole("button", { name: "Load saved progress" }).click();
    await loser.getByRole("button", { name: "Confirm load" }).click();
    await saved(loser);
    if (race === "terminal") {
      await expect(loser.getByRole("heading", { name: "Your debrief." })).toBeFocused();
      await expect(loser.getByRole("region", { name: "Accepted deal" })).toHaveCount(record.actions[3].kind === "accept" ? 1 : 0);
    }
    expect(await loser.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key)).toEqual(record);
  });
}

async function pauseReviewRequests(page: Page) {
  await page.evaluate(() => {
    const host = window as unknown as { qaResumeWrites: () => void; qaWaiting: number; qaSettled: number };
    host.qaWaiting = 0;
    host.qaSettled = 0;
    const gate = new Promise<void>((resolve) => { host.qaResumeWrites = resolve; });
    const real = navigator.locks.request.bind(navigator.locks);
    navigator.locks.request = (async (...args: unknown[]) => {
      host.qaWaiting++;
      await gate;
      try { return await (real as (...args: unknown[]) => Promise<unknown>)(...args); }
      finally { host.qaSettled++; }
    }) as typeof navigator.locks.request;
  });
}
async function releaseReviewRequests(page: Page) {
  await page.evaluate(() => (window as unknown as { qaResumeWrites: () => void }).qaResumeWrites());
  await expect.poll(() => page.evaluate(() => (window as unknown as { qaSettled: number }).qaSettled)).toBeGreaterThan(0);
}
async function submitReviewAnswer(page: Page, text = investorAnswers[0]) {
  await page.getByLabel("Your answer").evaluate((field, answer) => {
    (field as HTMLTextAreaElement).value = answer;
    (field as HTMLTextAreaElement).form!.requestSubmit();
  }, text);
  await expect.poll(() => page.evaluate(() => (window as unknown as { qaWaiting: number }).qaWaiting)).toBeGreaterThan(0);
}

test("review: replacement invalidates an older tab's delayed write", async ({ page, context }) => {
  await prepare(page);
  await saved(page);
  const old = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key);
  const replacement = await context.newPage();
  await prepare(replacement, true, false);
  await replacement.getByRole("button", { name: "Start practice", exact: true }).click();
  await pauseReviewRequests(page);
  await submitReviewAnswer(page);
  await replacement.getByRole("button", { name: "Confirm replacement" }).click();
  await saved(replacement);
  const raw = await replacement.evaluate((key) => localStorage.getItem(key), key);
  expect(JSON.parse(raw!).saveId).not.toBe(old.saveId);
  await releaseReviewRequests(page);
  await expect(page.getByLabel("Save status")).toContainText("Conflict detected");
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(raw);
});

test("review: route unmount cancels a pending write without changing the stored checkpoint", async ({ page }) => {
  await prepare(page);
  await saved(page);
  const raw = await page.evaluate((key) => localStorage.getItem(key), key);
  await pauseReviewRequests(page);
  await submitReviewAnswer(page);
  await page.getByRole("link", { name: "Shark Tank AI", exact: true }).click();
  await expect(page).toHaveURL("/");
  await releaseReviewRequests(page);
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(raw);
  await page.goto("/simulate");
  await page.getByRole("button", { name: "Resume saved session", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Maya Chen", exact: true })).toBeFocused();
});

test("review: refresh before acknowledgement restores only the last saved checkpoint", async ({ page, context }) => {
  await prepare(page);
  await saved(page);
  const raw = await page.evaluate((key) => localStorage.getItem(key), key);
  const holder = await context.newPage();
  await holder.goto("/simulate");
  await holdWrites(holder);
  await page.getByLabel("Your answer").evaluate((field, answer) => {
    (field as HTMLTextAreaElement).value = answer;
    (field as HTMLTextAreaElement).form!.requestSubmit();
  }, investorAnswers[0]);
  await expect(page.getByLabel("Save status")).toHaveText("Save status · Saving");
  await page.reload();
  await releaseWrites(holder);
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(raw);
  await page.getByRole("button", { name: "Resume saved session", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Maya Chen", exact: true })).toBeFocused();
});

test("review: confirming load during a pending newer write never rolls progress back", async ({ page, context }) => {
  await prepare(page);
  await saved(page);
  const writer = await context.newPage();
  await writer.goto("/simulate");
  await writer.getByRole("button", { name: "Resume saved session", exact: true }).click();
  await writer.getByLabel("Your answer").fill(investorAnswers[0]);
  await writer.getByRole("button", { name: "Submit answer" }).click();
  await saved(writer);
  await expect(page.getByLabel("Save status")).toContainText("Conflict detected");
  await page.getByRole("button", { name: "Load saved progress" }).click();
  await pauseReviewRequests(writer);
  await submitReviewAnswer(writer, investorAnswers[1]);
  await page.getByRole("button", { name: "Confirm load" }).click();
  await expect(page.getByRole("heading", { name: "Adrian Vale", exact: true })).toBeFocused();
  await releaseReviewRequests(writer);
  await saved(writer);
  await expect.poll(() => journalLength(page)).toBe(2);
  await expect(page.getByLabel("Save status")).toContainText("Conflict detected");
  await page.getByRole("button", { name: "Load saved progress" }).click();
  await page.getByRole("button", { name: "Confirm load" }).click();
  await expect(page.getByRole("heading", { name: "Sofia Mendes", exact: true })).toBeFocused();
});

for (const blocked of ["locks", "storage"] as const) {
  test(`review: unavailable ${blocked} cannot falsely report successful removal`, async ({ page }) => {
    await prepare(page);
    await saved(page);
    const raw = await page.evaluate((key) => localStorage.getItem(key), key);
    await page.getByRole("button", { name: "Remove saved information" }).click();
    await page.evaluate((blocked) => {
      if (blocked === "locks") Object.defineProperty(navigator, "locks", { configurable: true, value: undefined });
      else {
        const real = window.localStorage;
        Object.defineProperty(window, "qaRestoreStorage", { value: () => Object.defineProperty(window, "localStorage", { configurable: true, value: real }) });
        Object.defineProperty(window, "localStorage", { configurable: true, get() { throw new DOMException("blocked", "SecurityError"); } });
      }
    }, blocked);
    await page.getByRole("button", { name: "Confirm removal" }).click();
    await expect(page.getByText(/Removal failed. Saved information may remain/)).toBeVisible();
    await expect(page.getByText("Saved information removed. This run will not be saved again.")).toHaveCount(0);
    if (blocked === "storage") await page.evaluate(() => (window as unknown as { qaRestoreStorage: () => void }).qaRestoreStorage());
    expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(raw);
    await expect(page.getByLabel("Your answer")).toBeVisible();
  });
}

test("review: saved markup stays literal and removal preserves other application keys", async ({ page }) => {
  await prepare(page);
  await saved(page);
  const record = await page.evaluate((key) => {
    const record = JSON.parse(localStorage.getItem(key)!);
    record.pitch.startup = '<img src=x onerror=alert(1)>';
    record.pitch.pitch = 'A literal startup description with <script>alert(1)</script> markup.';
    localStorage.setItem(key, JSON.stringify(record));
    localStorage.setItem('unrelated-review-key', 'keep');
    return record;
  }, key);
  const dialogs: string[] = [];
  page.on("dialog", (dialog) => { dialogs.push(dialog.type()); void dialog.dismiss(); });
  await page.reload();
  await expect(page.getByText(record.pitch.startup, { exact: true })).toBeVisible();
  await expect(page.locator(".recovery-panel img")).toHaveCount(0);
  await page.getByRole("button", { name: "Resume saved session", exact: true }).click();
  await page.getByRole("button", { name: "Remove saved information" }).click();
  await page.getByRole("button", { name: "Confirm removal" }).click();
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), key)).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('unrelated-review-key'))).toBe('keep');
  expect(dialogs).toEqual([]);
});

test("review: a delayed older acknowledgement cannot label a newer revision Saved", async ({ page }) => {
  await prepare(page);
  await saved(page);
  await page.evaluate(() => {
    const state = window as unknown as { qaReleaseAck: () => void; qaCommitted: boolean; qaFalseSaved: number };
    state.qaCommitted = false;
    state.qaFalseSaved = 0;
    const gate = new Promise<void>((resolve) => { state.qaReleaseAck = resolve; });
    const real = navigator.locks.request.bind(navigator.locks);
    let first = true;
    navigator.locks.request = (async (...args: unknown[]) => {
      const result = await (real as (...args: unknown[]) => Promise<unknown>)(...args);
      if (first) { first = false; state.qaCommitted = true; await gate; }
      return result;
    }) as typeof navigator.locks.request;
    new MutationObserver(() => {
      const heading = document.querySelector(".practice-room h2")?.textContent;
      const expected = heading === "Sofia Mendes" ? 2 : heading === "Adrian Vale" ? 1 : 0;
      const status = document.querySelector('[aria-label="Save status"]')?.textContent;
      const count = JSON.parse(localStorage.getItem("shark-tank-ai.session")!).actions.length;
      if (status === "Save status · Saved" && count < expected) state.qaFalseSaved++;
    }).observe(document.body, { subtree: true, childList: true, characterData: true });
  });
  await page.getByLabel("Your answer").fill(investorAnswers[0]);
  await page.getByRole("button", { name: "Submit answer" }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { qaCommitted: boolean }).qaCommitted)).toBe(true);
  await page.getByLabel("Your answer").fill(investorAnswers[1]);
  await page.getByRole("button", { name: "Submit answer" }).click();
  await expect(page.getByRole("heading", { name: "Sofia Mendes", exact: true })).toBeFocused();
  await expect(page.getByLabel("Save status")).toHaveText("Save status · Saving");
  expect(await journalLength(page)).toBe(1);
  await page.evaluate(() => (window as unknown as { qaReleaseAck: () => void }).qaReleaseAck());
  await saved(page);
  expect(await journalLength(page)).toBe(2);
  expect(await page.evaluate(() => (window as unknown as { qaFalseSaved: number }).qaFalseSaved)).toBe(0);
});
