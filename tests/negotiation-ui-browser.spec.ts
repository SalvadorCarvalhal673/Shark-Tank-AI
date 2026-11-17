import { expect, test, type Page } from "@playwright/test";

const answers = [
  "Revenue: €9000; Runway: 8 months; Use of funds: install monitoring hardware",
  "Target segment: local retail shops; Acquisition channel: regional hardware distributors; CAC: €30",
  "Customer evidence: buyers requested weekly reporting; Milestone: deliver automated dashboards",
];
async function start(page: Page) {
  await page.goto("/simulate");
  await page.getByLabel("Startup name").fill("Atlas Energy");
  await page.getByLabel("Your pitch").fill("We sell energy monitoring subscriptions to local retail shops.");
  await page.getByLabel("Investment", { exact: true }).fill("100000");
  await page.getByLabel("Equity (%)").fill("10");
  await page.getByRole("button", { name: "Review pitch" }).click();
  await page.getByRole("button", { name: "Start practice" }).click();
  for (const answer of answers) {
    await page.getByLabel("Your answer").fill(answer);
    await page.getByRole("button", { name: "Submit answer" }).click();
  }
}
function card(page: Page, name: string) {
  return page.getByRole("article").filter({ has: page.getByRole("heading", { name, exact: true }) });
}
test("competing offers, single inline panel, cancellation and confirmed deal", async ({ page }) => {
  await start(page);
  await expect(page.getByText("3 shared counters remaining")).toBeVisible();
  const maya = card(page, "Maya Chen");
  await expect(maya.locator(".ask-line").first()).toHaveText("€100,000.00 for 13%");
  await expect(card(page, "Adrian Vale").locator(".ask-line").first()).toHaveText("€90,000.00 for 15%");
  await expect(card(page, "Sofia Mendes").locator(".ask-line").first()).toHaveText("€80,000.00 for 12%");
  await maya.getByRole("button", { name: "Accept offer", exact: true }).click();
  await expect(maya.getByRole("button", { name: "Confirm deal" })).toBeFocused();
  await expect(page.getByText("3 shared counters remaining")).toBeVisible();
  await maya.getByRole("button", { name: "Cancel confirmation" }).click();
  await expect(maya.getByRole("button", { name: "Accept offer", exact: true })).toBeFocused();
  await maya.getByRole("button", { name: "Make a counteroffer" }).click();
  await card(page, "Adrian Vale").getByRole("button", { name: "Accept offer", exact: true }).click();
  await expect(page.getByRole("button", { name: "Send counteroffer" })).toHaveCount(0);
  await card(page, "Adrian Vale").getByRole("button", { name: "Cancel confirmation" }).click();
  await maya.getByRole("button", { name: "Make a counteroffer" }).click();
  await maya.getByLabel("Equity (%)").fill("11");
  await maya.getByRole("button", { name: "Send counteroffer" }).click();
  await expect(page.getByRole("status")).toContainText("I agreed");
  await expect(maya.getByRole("heading")).toBeFocused();
  await expect(page.getByText("2 shared counters remaining")).toBeVisible();
  await expect(maya.locator(".offer-response")).toBeVisible();
  await maya.getByRole("button", { name: "Accept offer", exact: true }).click();
  await maya.getByRole("button", { name: "Confirm deal" }).evaluate((button) => { (button as HTMLButtonElement).click(); (button as HTMLButtonElement).click(); });
  await expect(page.getByRole("heading", { name: "Your debrief." })).toBeFocused();
});

test("revised and unchanged responses consume exactly three rounds and final offers remove counters", async ({ page }) => {
  await start(page);
  const maya = card(page, "Maya Chen");
  for (const [round, remaining] of [[1, 2], [2, 1], [3, 0]]) {
    await maya.getByRole("button", { name: "Make a counteroffer" }).click();
    await maya.getByLabel("Equity (%)").fill("10");
    await maya.getByRole("button", { name: "Send counteroffer" }).click();
    await expect(page.getByText(`${remaining} shared counters remaining`)).toBeVisible();
    await expect(page.getByRole("status")).toContainText(`Counter ${round} of 3`);
  }
  await expect(page.getByRole("heading", { name: "Final offers." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Make a counteroffer" })).toHaveCount(0);
  await expect(maya.locator(".offer-response")).toContainText("unchanged");
  await page.getByRole("button", { name: "Walk away" }).click();
  await expect(page.getByRole("heading", { name: "Your debrief." })).toBeFocused();
});
