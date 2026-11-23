import { expect, test } from "@playwright/test";
import { investorAnswers } from "./browser-fixtures";

// Issues #78, #86, #87: the rehearsed university demonstration, run end to end and timed. The figures
// it shows were computed with the engine helpers and are listed in docs/presentation/demo-script.md.
// An automated run is not a human rehearsal; it proves the path and the values are deterministic.

test("the five-minute demonstration path shows the verified figures", async ({ page }) => {
  const started = Date.now();
  await page.goto("/");
  await page.getByRole("link", { name: /Pitch room/ }).first().click();
  await page.getByRole("button", { name: "Use LunchLoop · reusable containers" }).click();
  await page.getByRole("button", { name: "Review pitch" }).click();
  await page.getByRole("button", { name: "Skip introductions" }).click();
  await page.getByRole("button", { name: "Start practice" }).click();
  for (const text of investorAnswers) {
    await page.getByLabel("Your answer").fill(text);
    await page.getByRole("button", { name: "Submit answer" }).click();
  }
  const reveal = page.getByRole("region", { name: "Opening decisions" });
  await expect(reveal.locator("li span")).toHaveText(["€100,000.00 for 13%", "€90,000.00 for 15%", "€80,000.00 for 12%"]);
  const maya = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Maya Chen", exact: true }) });
  await maya.getByRole("button", { name: "Make a counteroffer" }).click();
  await maya.getByLabel("Equity (%)").fill("11");
  await maya.getByRole("button", { name: "Send counteroffer" }).click();
  await expect(page.getByText("2 shared counters remaining")).toBeVisible();
  await expect(maya).toContainText("€100,000.00");
  await expect(maya).toContainText("11%");
  await maya.getByRole("button", { name: "Accept offer", exact: true }).click();
  await maya.getByRole("button", { name: "Confirm deal" }).click();
  const debrief = page.locator("main");
  await expect(page.getByRole("heading", { name: "Your debrief." })).toBeVisible();
  await expect(debrief).toContainText("€100,000.00");
  await expect(debrief).toContainText("53.4%");
  await expect(debrief).toContainText("€909,090.91");
  expect(Date.now() - started, "automated path well inside five minutes").toBeLessThan(60_000);
});
