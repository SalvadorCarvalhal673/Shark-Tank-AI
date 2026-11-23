import { expect, test, type Locator, type Page } from "@playwright/test";
import { investorAnswers } from "./browser-fixtures";

// Phase 4E (#22, #72, #73, #75): the whole practice can be completed with the keyboard alone, every
// stage fits narrow screens without horizontal scrolling, and controls meet the WCAG 2.2 AA minimum
// target size. Automated widths are not physical-device evidence (see docs/qa/phase-4e.md).

/** Move focus with Tab only until the target is focused; fails if it is not reachable. */
async function tabTo(page: Page, target: Locator, limit = 80) {
  for (let i = 0; i < limit; i++) {
    if (await target.evaluate(element => element === document.activeElement).catch(() => false)) return;
    await page.keyboard.press("Tab");
  }
  throw new Error("Not reachable by keyboard: " + target.toString());
}
async function press(page: Page, target: Locator) { await tabTo(page, target); await page.keyboard.press("Enter"); }

test("the complete practice can be finished without a pointer", async ({ page }) => {
  await page.goto("/simulate");
  await press(page, page.getByRole("button", { name: "Use LunchLoop · reusable containers" }));
  await press(page, page.getByRole("button", { name: "Review pitch" }));
  await press(page, page.getByRole("button", { name: "Skip introductions" }));
  await press(page, page.getByRole("button", { name: "Start practice" }));
  for (const text of investorAnswers) {
    await tabTo(page, page.getByLabel("Your answer"));
    await page.keyboard.type(text);
    await press(page, page.getByRole("button", { name: "Submit answer" }));
  }
  await expect(page.getByRole("heading", { name: "Negotiate your terms." })).toBeFocused();
  const maya = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Maya Chen", exact: true }) });
  await press(page, maya.getByRole("button", { name: "Make a counteroffer" }));
  await expect(maya.getByLabel("Investment (EUR)")).toBeFocused();
  await tabTo(page, maya.getByLabel("Equity (%)"));
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("11");
  await press(page, maya.getByRole("button", { name: "Send counteroffer" }));
  await expect(page.getByText("2 shared counters remaining")).toBeVisible();
  await press(page, maya.getByRole("button", { name: "Accept offer", exact: true }));
  await expect(maya.getByRole("button", { name: "Confirm deal" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Your debrief." })).toBeFocused();
  await press(page, page.getByRole("button", { name: "Practice again" }));
});

async function noOverflow(page: Page, label: string) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), label).toBe(true);
}
async function targetSizes(page: Page) {
  return page.evaluate(() => [...document.querySelectorAll<HTMLElement>("button, a[href], input, select, textarea, summary")]
    .filter(element => element.offsetParent !== null && !element.closest(".sr-only"))
    // A control wrapped in its label is activated by the whole label, which is its target.
    .map(element => { const box = (element.matches("input") && element.closest("label") || element).getBoundingClientRect(); return { name: (element.innerText || element.getAttribute("aria-label") || element.tagName).slice(0, 40), width: box.width, height: box.height }; })
    .filter(({ width, height }) => width < 24 || height < 24));
}

for (const width of [320, 375]) {
  test(`every practice stage fits ${width}px with WCAG-size targets under reduced motion`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/simulate");
    await page.getByRole("button", { name: "Use LunchLoop · reusable containers" }).click();
    await noOverflow(page, "pitch");
    await page.getByRole("button", { name: "Review pitch" }).click();
    await noOverflow(page, "review");
    await page.getByRole("button", { name: "Skip introductions" }).click();
    await page.getByRole("button", { name: "Start practice" }).click();
    await noOverflow(page, "questions");
    expect(await targetSizes(page), "question stage targets").toEqual([]);
    for (const text of investorAnswers) {
      await page.getByLabel("Your answer").fill(text);
      await page.getByRole("button", { name: "Submit answer" }).click();
    }
    await noOverflow(page, "negotiation");
    expect(await targetSizes(page), "negotiation targets").toEqual([]);
    await page.getByRole("button", { name: "Walk away" }).click();
    await expect(page.getByRole("heading", { name: "Your debrief." })).toBeVisible();
    await noOverflow(page, "debrief");
    expect(await targetSizes(page), "debrief targets").toEqual([]);
  });
}
