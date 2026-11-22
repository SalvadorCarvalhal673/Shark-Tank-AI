import { expect, test, type Page } from "@playwright/test";
import { investorAnswers } from "./browser-fixtures";

async function prepare(page: Page, settings: { amount?: string; equity?: string; ownership?: string; long?: boolean } = {}) {
  await page.goto("/simulate");
  await page.getByLabel("Startup name").fill(settings.long ? "W".repeat(80) : "Atlas Energy");
  await page.getByLabel("Your pitch").fill(settings.long ? "A".repeat(3000) : "We sell energy monitoring subscriptions to local retail shops.");
  await page.getByLabel("Investment", { exact: true }).fill(settings.amount ?? "100000");
  await page.getByLabel("Equity (%)").fill(settings.equity ?? "10");
  if (settings.ownership !== undefined) {
    await page.getByText("Ownership details").click();
    await page.getByLabel("Founder ownership (%)").fill(settings.ownership);
  }
  await page.getByRole("button", { name: "Review pitch" }).click();
  await page.getByRole("button", { name: "Start practice" }).click();
}
async function answer(page: Page, mask = 7, long = false) {
  for (let turn = 0; turn < 3; turn++) {
    const text = mask & (1 << turn) ? investorAnswers[turn] : "I cannot provide those details for question " + turn + " today.";
    await page.getByLabel("Your answer").fill(long ? text + " " + "x".repeat(1499 - text.length) : text);
    await page.getByRole("button", { name: "Submit answer" }).click();
  }
}
function card(page: Page, name: string) {
  return page.getByRole("article").filter({ has: page.getByRole("heading", { name, exact: true }) });
}
for (let mask = 0; mask < 8; mask++) {
  test(`participation combination ${mask} renders correct offers and pass explanations`, async ({ page }) => {
    await prepare(page);
    await answer(page, mask);
    if (mask === 0) {
      await expect(page.getByText("The investors passed during the opening decisions. There were no offers to negotiate.").first()).toBeVisible();
      return;
    }
    for (const [index, name] of ["Maya Chen", "Adrian Vale", "Sofia Mendes"].entries()) {
      const investor = card(page, name);
      if (mask & (1 << index)) await expect(investor.getByRole("button", { name: "Accept offer", exact: true })).toBeVisible();
      else {
        await expect(investor.getByText(/could not identify all the signals/)).toBeVisible();
        await expect(investor.getByRole("button")).toHaveCount(0);
      }
    }
    await page.getByRole("button", { name: "Walk away" }).click();
    await expect(page.getByText("You chose to walk away. The remaining offers closed.").first()).toBeVisible();
  });
}
test("accepted financial output reconciles and ordered history retains original offer terms", async ({ page }) => {
  await prepare(page, { ownership: "60", equity: "10.5" });
  await answer(page);
  const maya = card(page, "Maya Chen");
  await maya.getByRole("button", { name: "Make a counteroffer" }).click();
  await maya.getByLabel("Equity (%)").fill("12.5");
  await maya.getByRole("button", { name: "Send counteroffer" }).click();
  await maya.getByRole("button", { name: "Accept offer", exact: true }).click();
  await maya.getByRole("button", { name: "Confirm deal" }).click();
  const scorecard = page.getByRole("region", { name: "Performance scorecard" });
  await expect(scorecard).toContainText("You confirmed one offer. All other active offers closed.");
  await expect(scorecard).toContainText("Shared counters used · 1 of 3");
  const deal = page.getByRole("region", { name: "Accepted deal" });
  await expect(deal.getByText("€700,000.00", { exact: true })).toBeVisible();
  await expect(deal.getByText("€800,000.00", { exact: true })).toBeVisible();
  const table = page.getByRole("table");
  await expect(table.getByRole("row", { name: "Founder 60% 52.5%", exact: true })).toBeVisible();
  await expect(table.getByRole("row", { name: "Other existing shareholders 40% 35%", exact: true })).toBeVisible();
  await expect(table.getByRole("row", { name: "New investor 0% 12.5%", exact: true })).toBeVisible();
  await expect(table.getByRole("row", { name: "Total 100% 100%", exact: true })).toBeVisible();
  await expect(page.getByText("Founder ownership change · 7.5 percentage points")).toBeVisible();
  await expect(page.getByText("Founder relative dilution · 12.5%")).toBeVisible();
  const history = page.getByLabel("Negotiation history");
  const entries = await history.locator("li").allTextContents();
  expect(entries[0]).toContain("Maya Chen");
  expect(entries[1]).toContain("Adrian Vale");
  expect(entries[2]).toContain("Sofia Mendes");
  expect(entries[6]).toContain("Previous terms · €100,000.00 for 13.5%");
  expect(entries[6]).toContain("Founder proposed · €100,000.00 for 12.5%");
  expect(entries.at(-1)).toContain("Session ended.");
});
for (const settings of [
  { amount: "0.01", equity: "0.01", ownership: "0" },
  { amount: "999999999.99", equity: "100", ownership: "100" },
]) {
  test(`extreme terms ${settings.amount} and ${settings.equity} stay legible at 320px`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await prepare(page, { ...settings, long: true });
    await answer(page, 7, true);
    const maya = card(page, "Maya Chen");
    await maya.getByRole("button", { name: "Accept offer", exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    await maya.getByRole("button", { name: "Confirm deal" }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    if (settings.ownership === "0") await expect(page.getByText("Founder relative dilution · Not applicable")).toBeVisible();
    else await expect(page.getByRole("region", { name: "Accepted deal" }).getByText("€0.00", { exact: true }).first()).toBeVisible();
  });
}
test("keyboard completion, restart and counter announcements follow applied actions", async ({ page }) => {
  await prepare(page);
  for (const text of investorAnswers) {
    await page.keyboard.press("Tab");
    await page.keyboard.type(text);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
  }
  const maya = card(page, "Maya Chen");
  await maya.getByRole("button", { name: "Make a counteroffer" }).focus();
  await page.keyboard.press("Enter");
  await expect(maya.getByLabel("Investment (EUR)")).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("11");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText("Counter 1 of 3");
  await expect(maya.getByRole("heading")).toBeFocused();
  await maya.getByRole("button", { name: "Accept offer", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(maya.getByRole("button", { name: "Confirm deal" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Your debrief." })).toBeFocused();
  await page.getByRole("button", { name: "Practice again" }).press("Enter");
  await expect(page.getByRole("heading", { name: "Atlas Energy", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Start practice" }).press("Enter");
  await expect(page.getByRole("heading", { name: "Maya Chen", exact: true })).toBeFocused();
  await answer(page);
  await expect(page.getByText("3 shared counters remaining")).toBeVisible();
});



test("conflicting walk-away and confirmation cannot accept a stale deal", async ({ page }) => {
  await prepare(page);
  await answer(page);
  const maya = card(page, "Maya Chen");
  await maya.getByRole("button", { name: "Accept offer", exact: true }).click();
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const confirm = buttons.find((button) => button.textContent === "Confirm deal")!;
    const walk = buttons.find((button) => button.textContent === "Walk away")!;
    walk.click();
    confirm.click();
    confirm.click();
  });
  await expect(page.getByText("You chose to walk away. The remaining offers closed.").first()).toBeVisible();
  await expect(page.getByRole("region", { name: "Accepted deal" })).toHaveCount(0);
});

test("restart uses a fresh ID, and duplicate counters produce one round and one status update", async ({ page }) => {
  await prepare(page);
  const firstId = await page.getByRole("region", { name: "Practice simulation" }).getAttribute("data-session-id");
  await answer(page);
  const maya = card(page, "Maya Chen");
  await maya.getByRole("button", { name: "Make a counteroffer" }).click();
  await maya.getByLabel("Equity (%)").fill("11");
  await maya.getByRole("form").evaluate((form) => {
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  await expect(page.getByRole("status")).toContainText("Counter 1 of 3");
  await expect(page.getByText("2 shared counters remaining")).toBeVisible();
  await page.getByRole("button", { name: "Walk away" }).click();
  await page.getByRole("button", { name: "Practice again" }).click();
  await page.getByRole("button", { name: "Start practice" }).click();
  const secondId = await page.getByRole("region", { name: "Practice simulation" }).getAttribute("data-session-id");
  expect(secondId).not.toBe(firstId);
  await answer(page);
  await expect(page.getByText("3 shared counters remaining")).toBeVisible();
});

test("counters across three investors preserve order and final-offer focus", async ({ page }) => {
  await prepare(page);
  await answer(page);
  const requests = [
    ["Maya Chen", "11"],
    ["Adrian Vale", "12"],
    ["Sofia Mendes", "11"],
  ];
  for (const [name, equity] of requests) {
    const investor = card(page, name);
    await investor.getByRole("button", { name: "Make a counteroffer" }).click();
    await investor.getByLabel("Equity (%)").fill(equity);
    await investor.getByRole("button", { name: "Send counteroffer" }).click();
  }
  await expect(page.getByRole("heading", { name: "Final offers." })).toBeFocused();
  await expect(page.getByText("0 shared counters remaining")).toBeVisible();
  await page.getByText("Negotiation history", { exact: true }).click();
  const counters = await page.getByLabel("Negotiation history", { exact: true }).locator("li").filter({ hasText: "Founder proposed" }).allTextContents();
  expect(counters).toHaveLength(3);
  for (const [index, [name]] of requests.entries()) expect(counters[index]).toContain(name);
  const sofia = card(page, "Sofia Mendes");
  await sofia.getByRole("button", { name: "Accept offer", exact: true }).click();
  await sofia.getByRole("button", { name: "Confirm deal" }).click();
  await expect(page.getByRole("heading", { name: "Deal with Sofia Mendes" })).toBeVisible();
});

test("scorecard disclosures support keyboard and narrow reduced-motion layouts", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await prepare(page, { long: true });
  await page.getByLabel("Your answer").fill(investorAnswers[0]);
  await page.getByRole("button", { name: "Submit answer" }).click();
  await page.getByLabel("Your answer").fill(investorAnswers[0]);
  await page.getByRole("button", { name: "Submit answer" }).click();
  await page.getByLabel("Your answer").fill(investorAnswers[2]);
  await page.getByRole("button", { name: "Submit answer" }).click();
  await page.getByRole("button", { name: "Walk away" }).click();

  const scorecard = page.getByRole("region", { name: "Performance scorecard" });
  const maya = scorecard.locator("summary").filter({ hasText: "Maya Chen" });
  const adrian = scorecard.locator("summary").filter({ hasText: "Adrian Vale" });
  const repeated = scorecard.getByText("This response repeats an earlier answer.");
  await expect(maya).toContainText("3 of 3 signals detected");
  await expect(adrian).toContainText("0 of 3 signals detected");
  await expect(repeated).toBeHidden();
  await expect(scorecard).toContainText("cannot verify claims or assess startup viability");

  await maya.focus();
  await page.keyboard.press("Tab");
  await expect(adrian).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(repeated).toBeVisible();
  await expect(adrian.locator("..").getByText("Signal not identified", { exact: true })).toHaveCount(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.keyboard.press("Space");
  await expect(repeated).toBeHidden();
});
