import { expect, test } from "@playwright/test";
import { investorAnswers } from "./browser-fixtures";

test.use({ launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });

test("the production studio follows the actual practice and survives an asset failure", async ({ page }) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const model = "**/studio/investor-v1.glb";
  await page.route(model, route => route.abort());
  await page.goto("/simulate");
  await page.getByRole("button", { name: "Use LunchLoop · reusable containers" }).click();
  await page.getByRole("button", { name: "Review pitch" }).click();
  await page.getByRole("button", { name: "Start practice", exact: true }).click();

  const room = page.getByRole("region", { name: "Investment studio" });
  const scene = room.getByTestId("practice-studio");
  const answer = page.getByRole("textbox", { name: "Your answer", exact: true });
  await answer.fill(investorAnswers[0]);
  await room.getByRole("button", { name: "Enter 3D studio" }).click();
  await expect(room.getByRole("button", { name: "Retry 3D studio" })).toBeVisible({ timeout: 30_000 });
  await expect(answer).toHaveValue(investorAnswers[0]);

  await page.unroute(model);
  const asset = page.waitForResponse(response => response.url().endsWith("/studio/investor-v1.glb") && response.ok());
  await room.getByRole("button", { name: "Retry 3D studio" }).click();
  await asset;
  await expect(scene.locator("canvas")).toBeVisible();
  await expect(scene.getByText("Loading and preparing the local character model…")).toHaveCount(0, { timeout: 30_000 });
  await expect(scene).toHaveAttribute("data-view", "maya");
  await expect(room.getByRole("button", { name: "Frame Maya Chen" })).toHaveAttribute("data-clip", "Explaining");

  await room.getByRole("button", { name: "Full panel" }).click();
  await expect(scene).toHaveAttribute("data-view", "panel");
  await expect(answer).toHaveValue(investorAnswers[0]);
  await page.getByRole("button", { name: "Submit answer" }).click();
  await expect(scene).toHaveAttribute("data-view", "adrian");
  await answer.fill(investorAnswers[1]);
  await page.getByRole("button", { name: "Submit answer" }).click();
  await expect(scene).toHaveAttribute("data-view", "sofia");
  await answer.fill(investorAnswers[2]);
  await page.getByRole("button", { name: "Submit answer" }).click();
  await expect(scene).toHaveAttribute("data-view", "panel");
  await expect(room.getByRole("button", { name: "Frame Maya Chen" })).toHaveAttribute("data-clip", "Offering");

  const maya = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Maya Chen", exact: true }) });
  await page.getByRole("tab", { name: /Sofia Mendes/ }).click();
  await expect(scene).toHaveAttribute("data-view", "sofia");
  await maya.getByRole("button", { name: "Make a counteroffer" }).click();
  await maya.getByLabel("Equity (%)").fill("11");
  await room.getByRole("button", { name: "Use simplified view" }).click();
  await expect(scene).toHaveCount(0);
  await expect(maya.getByLabel("Equity (%)")).toHaveValue("11");
  await room.getByRole("button", { name: "Enter 3D studio" }).click();
  await expect(maya.getByLabel("Equity (%)")).toHaveValue("11");
  await maya.getByRole("button", { name: "Send counteroffer" }).click();
  await expect(scene).toHaveAttribute("data-view", "maya");
  await expect(scene).toHaveAttribute("data-revision", "4");
  await expect(page.getByText("2 shared counters remaining")).toBeVisible();

  await maya.getByRole("button", { name: "Accept offer", exact: true }).click();
  await maya.getByRole("button", { name: "Confirm deal" }).click();
  await expect(page.getByRole("heading", { name: "Your debrief." })).toBeVisible();
  await expect(room.getByRole("button", { name: "Frame Maya Chen" })).toHaveAttribute("data-clip", "Agreeing");
  await expect(page.locator("main")).toContainText("53.4%");
  await expect(page.locator("main")).toContainText("€909,090.91");
});
