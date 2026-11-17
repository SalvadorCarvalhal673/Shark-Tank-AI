import { expect, test } from "@playwright/test";

test("founder completes a pitch and accepts a negotiated deal", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Make your\s*case/);
  await page.getByRole("link", { name: "Enter the pitch room" }).focus();
  await page.keyboard.press("Enter");
  await page.getByLabel("Startup name").fill("Atlas Energy");
  await page.getByLabel("Your pitch").fill("We help small shops cut their energy costs with a monthly monitoring service.");
  await page.getByLabel("Investment", { exact: true }).fill("100000");
  await page.getByLabel("Equity (%)").fill("10");
  await page.getByRole("button", { name: "Review pitch" }).click();
  await page.getByRole("button", { name: "Edit pitch" }).click();
  await expect(page.getByLabel("Startup name")).toHaveValue("Atlas Energy");
  await page.getByRole("button", { name: "Review pitch" }).click();
  await page.getByRole("button", { name: "Start practice" }).click();
  await expect(page.getByRole("heading", { name: "Maya Chen" })).toBeFocused();

  for (const answer of [
    "Revenue is 9000 each month and the investment funds another four months.",
    "Independent stores buy through local partners that already run their retail operations.",
    "Five shop owners completed our pilot and requested weekly energy reports for staff.",
  ]) {
    await page.getByLabel("Your answer").fill(answer);
    await page.getByRole("button", { name: "Submit answer" }).click();
  }

  const maya = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Maya Chen" }) });
  await maya.getByText("Make a counteroffer").click();
  await maya.getByLabel("Equity (%)").fill("12");
  await maya.getByRole("button", { name: "Send counteroffer" }).click();
  await expect(maya.getByText("Accepted your counter terms.")).toBeVisible();
  await maya.getByRole("button", { name: "Accept offer" }).click();
  await expect(page.getByRole("heading", { name: "Your debrief." })).toBeFocused();
  await expect(page.getByRole("heading", { name: "Deal with Maya Chen" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Counteroffer history" })).toBeVisible();
});

test("landing and pitch form fit a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Enter the pitch room" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await page.getByRole("link", { name: "Enter the pitch room" }).click();
  await expect(page.getByRole("button", { name: "Review pitch" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
