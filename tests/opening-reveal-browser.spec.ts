import { expect, test, type Page } from "@playwright/test";
import { investorAnswers } from "./browser-fixtures";

// Issue #24: committed opening decisions are revealed in recorded order, can be skipped, do not
// animate under reduced motion, and never hold back the actual offer cards.

async function reachOffers(page: Page) {
  await page.goto("/simulate");
  await page.getByRole("button", { name: "Use LunchLoop · reusable containers" }).click();
  await page.getByRole("button", { name: "Review pitch" }).click();
  await page.getByRole("button", { name: "Skip introductions" }).click();
  await page.getByRole("button", { name: "Start practice" }).click();
  for (const text of investorAnswers) {
    await page.getByLabel("Your answer").fill(text);
    await page.getByRole("button", { name: "Submit answer" }).click();
  }
}

test("opening decisions appear in recorded order without delaying the offer cards", async ({ page }) => {
  await reachOffers(page);
  const reveal = page.getByRole("region", { name: "Opening decisions" });
  await expect(reveal.locator("li strong")).toHaveText(["Maya Chen", "Adrian Vale", "Sofia Mendes"]);
  const maya = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Maya Chen", exact: true }) });
  await maya.getByRole("button", { name: "Make a counteroffer" }).click();
  await expect(maya.getByLabel("Investment (EUR)")).toBeFocused();
  const terms = await reveal.locator("li").first().locator("span").textContent();
  const [amount, equity] = terms!.split(" for ");
  await expect(maya).toContainText(amount);
  await expect(maya).toContainText(equity);
  await reveal.getByRole("button", { name: "Skip reveal" }).click();
  await expect(reveal.getByRole("button", { name: "Skip reveal" })).toHaveCount(0);
  await expect(reveal.locator("li").last()).toHaveCSS("opacity", /^(1|0\.75)$/);
});

test("reduced motion shows every opening decision at once", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await reachOffers(page);
  const items = page.getByRole("region", { name: "Opening decisions" }).locator("li");
  await expect(items).toHaveCount(3);
  for (const item of await items.all()) expect(await item.evaluate(element => getComputedStyle(element).animationName)).toBe("none");
});
