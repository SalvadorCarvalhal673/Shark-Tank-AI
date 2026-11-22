import { expect, test } from "@playwright/test";
import { investorAnswers } from "./browser-fixtures";

test("fictional pitch examples are editable and introduction selection can be skipped", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/simulate");
  await page.getByRole("button", { name: "Use LunchLoop · reusable containers" }).click();
  await expect(page.getByLabel("Startup name")).toHaveValue("LunchLoop");
  await expect(page.getByLabel("Equity (%)")).toHaveValue("10");
  await expect(page.getByLabel("Founder ownership (%)")).toHaveValue("60");
  await page.getByLabel("Startup name").fill("EditedLoop");
  await page.getByRole("button", { name: "Use LunchLoop · campus meal orders" }).click();
  await expect(page.getByLabel("Equity (%)")).toHaveValue("20");
  await expect(page.getByText(/separate fictional campus meal-ordering/)).toBeVisible();
  await page.getByLabel("Startup name").fill("CustomLoop");
  await page.getByRole("button", { name: "Review pitch" }).click();
  await expect(page.getByRole("region", { name: "Illustrative ownership if these terms were accepted" })).toContainText("80% → 64%");
  await page.getByRole("button", { name: "Edit pitch" }).click();
  await expect(page.getByLabel("Startup name")).toHaveValue("CustomLoop");
  await page.getByRole("button", { name: "Review pitch" }).click();
  await page.getByRole("button", { name: "Adrian Vale · Growth" }).click();
  await expect(page.getByRole("heading", { name: "Three investors, three points of view." })).toBeFocused();
  await expect(page.getByText(/repeatable acquisition/)).toBeVisible();
  await page.getByRole("button", { name: "Skip introductions" }).click();
  await page.getByRole("button", { name: "Meet the investors" }).click();
  await page.getByRole("button", { name: "Start practice" }).click();
  await expect(page.getByRole("heading", { name: "Maya Chen" })).toBeFocused();
  await expect(page.getByText("Scripted engine · no live AI")).toBeVisible();
  const answer = "Revenue: 9000; Runway: 8 months; Use of funds: equipment and launch.";
  await page.getByLabel("Your answer").fill(answer);
  await page.getByRole("button", { name: "Submit answer" }).click();
  await expect(page.getByText(answer)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Adrian Vale" })).toBeFocused();
  const noHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
  expect(noHorizontalOverflow).toBe(true);
});

test("offer cards compare ownership and retain historical state", async ({ page }) => {
  await page.goto("/simulate");
  await page.getByLabel("Startup name").fill("Atlas Energy");
  await page.getByLabel("Your pitch").fill("We sell energy monitoring subscriptions to local retail shops.");
  await page.getByLabel("Investment", { exact: true }).fill("100000");
  await page.getByLabel("Equity (%)").fill("10");
  await page.getByRole("button", { name: "Review pitch" }).click();
  await page.getByRole("button", { name: "Skip introductions" }).click();
  await page.getByRole("button", { name: "Start practice" }).click();
  for (const answer of investorAnswers) {
    await page.getByLabel("Your answer").fill(answer);
    await page.getByRole("button", { name: "Submit answer" }).click();
  }
  const maya = page.locator("article.negotiation-card").filter({ has: page.getByRole("heading", { name: "Maya Chen" }) });
  await expect(maya.getByText("Current comparable terms")).toBeVisible();
  await expect(maya.getByText("Founder before → after")).toBeVisible();
  await expect(maya.getByText("Other holders after")).toBeVisible();
  await expect(page.getByText("Pre-money valuation").first()).toBeVisible();
});
