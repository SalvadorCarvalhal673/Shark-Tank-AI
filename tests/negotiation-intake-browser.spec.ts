import { expect, test } from "@playwright/test";

for (const [input, ownership] of [["", "100%"], ["0", "0%"], ["62.25", "62.25%"], ["100", "100%"]]) {
  test(`ownership preview preserves ${input || "blank"} as ${ownership}`, async ({ page }) => {
    await page.goto("/simulate");
    await page.getByLabel("Startup name").fill("Atlas Energy");
    await page.getByLabel("Your pitch").fill("We sell energy monitoring subscriptions to local retail shops.");
    await page.getByLabel("Investment", { exact: true }).fill("100000");
    await page.getByLabel("Equity (%)").fill("12.5");
    await expect(page.getByLabel("Founder ownership (%)")).toBeHidden();
    await page.getByText("Ownership details").click();
    await page.getByLabel("Founder ownership (%)").fill(input);
    await page.getByRole("button", { name: "Review pitch" }).click();
    await expect(page.getByText(`Founder ownership before investment · ${ownership}`)).toBeVisible();
    await expect(page.getByText("€700,000.00", { exact: true })).toBeVisible();
    await expect(page.getByText("€800,000.00", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Edit pitch" }).click();
    await expect(page.getByLabel("Startup name")).toBeFocused();
    await expect(page.getByLabel("Founder ownership (%)")).toHaveValue(input || "100");
    await page.getByRole("button", { name: "Review pitch" }).click();
    await page.getByRole("button", { name: "Start practice" }).click();
    await expect(page.getByRole("heading", { name: "Maya Chen" })).toBeFocused();
    await expect(page.getByText(/What named financial figure/)).toBeVisible();
  });
}

test("native badInput cannot be treated as blank and malformed decimals recover", async ({ page }) => {
  await page.goto("/simulate");
  await page.getByLabel("Startup name").fill("Atlas Energy");
  await page.getByLabel("Your pitch").fill("We sell energy monitoring subscriptions to local retail shops.");
  await page.getByLabel("Investment", { exact: true }).fill("100000");
  await page.getByLabel("Equity (%)").fill("10");
  await page.getByText("Ownership details").click();
  const ownership = page.getByLabel("Founder ownership (%)");
  await ownership.pressSequentially("1e");
  expect(await ownership.evaluate((field: HTMLInputElement) => ({ empty: field.value === "", badInput: field.validity.badInput })))
    .toEqual({ empty: true, badInput: true });
  await page.getByRole("button", { name: "Review pitch" }).click();
  await expect(ownership).toBeFocused();
  await expect(page.getByRole("button", { name: "Start practice" })).toHaveCount(0);
  await ownership.fill("1e1");
  await page.getByRole("button", { name: "Review pitch" }).click();
  await expect(page.locator(".error")).toContainText("plain decimal");
  await ownership.fill(".5");
  await page.getByRole("button", { name: "Review pitch" }).click();
  await expect(page.getByText("Founder ownership before investment · 0.5%")).toBeVisible();
});
