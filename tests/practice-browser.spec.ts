import { investorAnswers } from "./browser-fixtures";
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

  for (const answer of investorAnswers) {
    await page.getByLabel("Your answer").fill(answer);
    await page.getByRole("button", { name: "Submit answer" }).click();
  }

  const maya = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Maya Chen" }) });
  await maya.getByText("Make a counteroffer").click();
  await maya.getByLabel("Equity (%)").fill("12");
  await maya.getByRole("button", { name: "Send counteroffer" }).click();
  await expect(maya.locator(".offer-response")).toContainText("I agreed");
  await maya.getByRole("button", { name: "Accept offer" }).click();
  await maya.getByRole("button", { name: "Confirm deal" }).click();
  await expect(page.getByRole("heading", { name: "Your debrief." })).toBeFocused();
  await expect(page.getByRole("heading", { name: "Deal with Maya Chen" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Negotiation performance" })).toBeVisible();
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

test("landing introduces the episode without loading the 3D studio", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Take your seat\.\s*Make your case/);
  await expect(page.getByRole("heading", { name: "Pitch. Defend. Negotiate." })).toBeVisible();
  await expect(page.getByText("Bring your business")).toBeVisible();
  await expect(page.getByText("Answer the panel")).toBeVisible();
  await expect(page.getByText("Choose your terms")).toBeVisible();
  await expect(page.getByRole("link", { name: "Enter the pitch room" })).toHaveAttribute("href", "/simulate");
  await expect(page.locator("script[src*='three']")).toHaveCount(0);
});
