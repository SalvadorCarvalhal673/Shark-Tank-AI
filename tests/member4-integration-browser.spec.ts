import { expect, test, type Page } from "@playwright/test";
import { investorAnswers } from "./browser-fixtures";

async function negotiate(page: Page) {
  await page.goto("/simulate");
  await page.getByLabel("Startup name").fill("Atlas Energy");
  await page.getByLabel("Your pitch").fill("We sell energy monitoring subscriptions.");
  await page.getByLabel("Investment", { exact: true }).fill("100000");
  await page.getByLabel("Equity (%)").fill("10");
  await page.getByRole("button", { name: "Review pitch" }).click();
  await page.getByRole("button", { name: "Start practice" }).click();
  const room = page.getByRole("region", { name: "Practice simulation" });
  const id = await room.getAttribute("data-session-id");
  for (const text of investorAnswers) {
    await page.getByLabel("Your answer").fill(text);
    await page.getByRole("button", { name: "Submit answer" }).click();
  }
  return id;
}

function card(page: Page, name: string) {
  return page.getByRole("article").filter({ has: page.getByRole("heading", { name, exact: true }) });
}

test("the accepted deal and educational review use committed terms under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await negotiate(page);
  const maya = card(page, "Maya Chen");
  await maya.getByRole("button", { name: "Make a counteroffer" }).click();
  await maya.getByLabel("Equity (%)").fill("11");
  await maya.getByRole("button", { name: "Send counteroffer" }).click();
  await maya.getByRole("button", { name: "Accept offer", exact: true }).click();
  const deal = page.getByRole("region", { name: "Accepted deal" });
  await expect(deal).toHaveCount(0);
  await maya.getByRole("button", { name: "Confirm deal" }).click();
  await expect(deal).toContainText("€100,000.00 for 11%");
  await expect(deal).toHaveCSS("animation-name", "none");
  await page.getByText("How to read your deal", { exact: true }).press("Enter");
  await expect(page.getByText(/percentage-point dilution subtracts/i)).toBeVisible();
  const analysis = page.getByRole("region", { name: "Negotiation decision analysis" });
  await expect(analysis).toContainText("Requested €100,000.00 for 11%.");
  const history = page.getByRole("list", { name: "Negotiation history" });
  const proposal = history.getByText(/Founder proposed/);
  await expect(proposal).toBeHidden();
  await history.getByText("Counter 1 · Maya Chen", { exact: true }).press("Enter");
  await expect(proposal).toBeVisible();
});

test("withdrawal reasons guide a fresh optional replay", async ({ page }) => {
  const priorId = await negotiate(page);
  for (const investor of ["Maya Chen", "Adrian Vale", "Sofia Mendes"]) {
    const offer = card(page, investor);
    await offer.getByRole("button", { name: "Make a counteroffer" }).click();
    await offer.getByLabel("Investment (EUR)").fill("999999999.99");
    await offer.getByRole("button", { name: "Send counteroffer" }).click();
  }
  const reasons = page.getByRole("region", { name: "Why investors withdrew" });
  await expect(reasons.getByRole("listitem")).toHaveCount(3);
  await expect(reasons.getByRole("listitem").first()).toContainText("Maya Chen");
  await page.getByText("Try a replay challenge", { exact: true }).press("Enter");
  await expect(page.getByText(/Decide the minimum funding/)).toBeVisible();
  await page.getByRole("button", { name: "Start challenge" }).click();
  await expect(page.getByLabel("Save this session in this browser")).not.toBeChecked();
  await page.getByRole("button", { name: "Start practice" }).click();
  const room = page.getByRole("region", { name: "Practice simulation" });
  await expect(room).toBeVisible();
  expect(await room.getAttribute("data-session-id")).not.toBe(priorId);
});
