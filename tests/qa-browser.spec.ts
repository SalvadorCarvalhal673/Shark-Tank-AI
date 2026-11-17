import { expect, test, type Page } from "@playwright/test";

const answer = "Revenue is 9000 each month and the investment funds another four months.";

async function createPitch(page: Page, startup = "Atlas Energy") {
  await page.goto("/simulate");
  await page.getByLabel("Startup name").fill(startup);
  await page.getByLabel("Your pitch").fill("We sell energy monitoring subscriptions that help small local shops lower costs.");
  await page.getByLabel("Investment", { exact: true }).fill("100000");
  await page.getByLabel("Equity (%)").fill("10");
  await page.getByRole("button", { name: "Review pitch" }).click();
}

async function start(page: Page, startup = "Atlas Energy") {
  await createPitch(page, startup);
  await page.getByRole("button", { name: "Start practice" }).click();
}

async function negotiate(page: Page, response = answer) {
  for (let turn = 0; turn < 3; turn++) {
    await page.getByLabel("Your answer").fill(response);
    await page.getByRole("button", { name: "Submit answer" }).click();
  }
}

function investorCard(page: Page, name: string) {
  return page.getByRole("article").filter({ has: page.getByRole("heading", { name, exact: true }) });
}

async function expectFits(page: Page) {
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth, viewport: window.innerWidth,
  }));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport);
}

for (const width of [320, 375, 768, 1440]) {
  test(`long startup names fit every stage at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await createPitch(page, "W".repeat(80));
    await expectFits(page);
    await page.getByRole("button", { name: "Start practice" }).click();
    await expectFits(page);
    await negotiate(page);
    await expectFits(page);
    await investorCard(page, "Maya Chen").getByRole("button", { name: "Accept offer" }).click();
    await expect(page.getByRole("heading", { name: "Your debrief." })).toBeVisible();
    await expectFits(page);
  });
}

test("preview, edit, counter results and restart preserve meaningful focus", async ({ page }) => {
  await createPitch(page);
  await expect(page.getByRole("heading", { name: "Atlas Energy", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Edit pitch" }).click();
  await expect(page.getByLabel("Startup name")).toBeFocused();
  await page.getByRole("button", { name: "Review pitch" }).click();
  await page.getByRole("button", { name: "Start practice" }).click();
  await expect(page.getByRole("heading", { name: "Maya Chen", exact: true })).toBeFocused();
  await negotiate(page);

  const maya = investorCard(page, "Maya Chen");
  await maya.getByText("Make a counteroffer").click();
  await maya.getByLabel("Equity (%)").fill("12");
  await maya.getByRole("button", { name: "Send counteroffer" }).click();
  await expect(maya.getByRole("heading")).toBeFocused();
  await expect(page.getByRole("status")).toContainText("Maya Chen accepted your counter terms");

  const adrian = investorCard(page, "Adrian Vale");
  await adrian.getByText("Make a counteroffer").click();
  await adrian.getByLabel("Investment (EUR)").fill("100001");
  await adrian.getByRole("button", { name: "Send counteroffer" }).click();
  await expect(adrian.getByRole("heading")).toBeFocused();
  await expect(page.getByRole("status")).toContainText("Adrian Vale declined");

  await maya.getByRole("button", { name: "Accept offer" }).click();
  await expect(page.getByRole("heading", { name: "Your debrief." })).toBeFocused();
  await page.getByRole("button", { name: "Practice again" }).click();
  await expect(page.getByRole("heading", { name: "Atlas Energy", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Start practice" }).click();
  await expect(page.getByRole("heading", { name: "Maya Chen", exact: true })).toBeFocused();
});

test("duplicate same-turn events and ordinary double clicks advance only once", async ({ page }) => {
  await start(page);
  await page.getByLabel("Your answer").fill(answer);
  await page.locator("form").evaluate((form) => {
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  await expect(page.getByRole("heading", { name: "Adrian Vale", exact: true })).toBeFocused();
  await page.getByLabel("Your answer").fill(answer);
  await page.getByRole("button", { name: "Submit answer" }).dblclick();
  await expect(page.getByRole("heading", { name: "Sofia Mendes", exact: true })).toBeVisible();
  await expect(page.getByLabel("Your answer")).toHaveValue("");
  await expect(page.getByRole("heading", { name: "Negotiate your terms." })).toHaveCount(0);
});

test("leading decimals and precise syntax errors work in intake and counters", async ({ page }) => {
  await createPitch(page);
  await page.getByRole("button", { name: "Edit pitch" }).click();
  await page.getByLabel("Investment", { exact: true }).fill("1e3");
  await page.getByRole("button", { name: "Review pitch" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "plain decimal" })).toBeVisible();
  await page.getByLabel("Investment", { exact: true }).fill("0000000001");
  await page.getByLabel("Equity (%)").fill(".5");
  await page.getByRole("button", { name: "Review pitch" }).click();
  await expect(page.locator(".ask-line")).toHaveText("€1.00 for 0.5% equity");
  await page.getByRole("button", { name: "Start practice" }).click();
  await negotiate(page);
  const maya = investorCard(page, "Maya Chen");
  await maya.getByText("Make a counteroffer").click();
  await maya.getByLabel("Investment (EUR)").fill("1e0");
  await maya.getByRole("button", { name: "Send counteroffer" }).click();
  await expect(maya.getByRole("alert")).toContainText("plain decimal");
  await maya.getByLabel("Investment (EUR)").fill(".5");
  await maya.getByRole("button", { name: "Send counteroffer" }).click();
  await expect(maya.locator(".ask-line")).toHaveText("€0.50 for 3.5%");
});

test("no offers, walk away and all withdrawn end with the correct debrief", async ({ page }) => {
  await start(page);
  await negotiate(page, "Not sure yet");
  await expect(page.getByRole("heading", { name: "Your debrief." })).toBeFocused();
  await expect(page.locator(".ask-line")).toHaveText("No deal");
  await start(page);
  await negotiate(page);
  await page.getByRole("button", { name: "Walk away" }).click();
  await expect(page.locator(".ask-line")).toHaveText("No deal");

  await start(page);
  await negotiate(page);
  for (const name of ["Maya Chen", "Adrian Vale", "Sofia Mendes"]) {
    const card = investorCard(page, name);
    await card.getByText("Make a counteroffer").click();
    await card.getByLabel("Investment (EUR)").fill("100001");
    await card.getByRole("button", { name: "Send counteroffer" }).click();
  }
  await expect(page.getByRole("heading", { name: "Your debrief." })).toBeFocused();
  await expect(page.locator(".ask-line")).toHaveText("No deal");
  await expect(page.locator(".practice-room li")).toHaveCount(3);
  for (const item of await page.locator(".practice-room li").allTextContents()) expect(item).toContain("declined");
});

for (const name of ["Maya Chen", "Adrian Vale", "Sofia Mendes"]) {
  test(`direct acceptance for ${name} ends with exactly one deal`, async ({ page }) => {
    await start(page);
    await negotiate(page);
    await investorCard(page, name).getByRole("button", { name: "Accept offer" }).dblclick();
    await expect(page.getByRole("heading", { name: `Deal with ${name}` })).toBeVisible();
    await expect(page.getByRole("button", { name: "Accept offer", exact: true })).toHaveCount(0);
  });
}

test("input border contrast meets 3:1 against both adjacent surfaces", async ({ page }) => {
  await page.goto("/simulate");
  const colors = await page.getByLabel("Startup name").evaluate((element) => ({
    border: getComputedStyle(element).borderTopColor,
    fill: getComputedStyle(element).backgroundColor,
    card: getComputedStyle(element.closest(".form-card")!).backgroundColor,
  }));
  function luminance(rgb: string) {
    const components = rgb.match(/[\d.]+/g)!.slice(0, 3).map(Number).map((channel) => {
      const normalized = channel / 255;
      return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    });
    return components[0] * 0.2126 + components[1] * 0.7152 + components[2] * 0.0722;
  }
  for (const adjacent of [colors.fill, colors.card]) {
    const [lighter, darker] = [luminance(colors.border), luminance(adjacent)].sort((a, b) => b - a);
    expect((lighter + 0.05) / (darker + 0.05)).toBeGreaterThanOrEqual(3);
  }
});


test("local fonts and favicon load without external services", async ({ page, request }) => {
  const failures: string[] = [];
  const fontResponses: string[] = [];
  page.on("pageerror", (error) => failures.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(message.text());
  });
  page.on("response", (response) => {
    if (response.request().resourceType() === "font") {
      expect(response.ok()).toBeTruthy();
      fontResponses.push(response.url());
    }
  });
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    return url.hostname === "127.0.0.1" ? route.continue() : route.abort();
  });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const fonts = await page.evaluate(() => Array.from(document.fonts).filter((font) => font.status === "loaded").map((font) => font.family));
  expect(fonts.length).toBeGreaterThanOrEqual(3);
  expect(fontResponses.length).toBeGreaterThanOrEqual(3);
  for (const url of fontResponses) expect(new URL(url).hostname).toBe("127.0.0.1");
  const icon = await request.get("/favicon.ico");
  expect(icon.status()).toBe(200);
  expect(icon.headers()["content-type"]).toMatch(/image/);
  expect((await icon.body()).length).toBeGreaterThan(22);
  expect(failures).toEqual([]);
});

test("stage guidance stays accurate from intake through debrief", async ({ page }) => {
  await page.goto("/simulate");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("The pitch room.");
  await expect(page.getByText(/Tell the panel what you are building/)).toBeVisible();
  await createPitch(page);
  await expect(page.getByText(/Tell the panel what you are building/)).toHaveCount(0);
  await page.getByRole("button", { name: "Start practice" }).click();
  await expect(page.getByRole("heading", { name: "Maya Chen", exact: true })).toBeVisible();
  await negotiate(page);
  await expect(page.getByRole("heading", { name: "Negotiate your terms." })).toBeVisible();
  await expect(page.getByText(/Tell the panel what you are building/)).toHaveCount(0);
  await page.getByRole("button", { name: "Walk away" }).click();
  await expect(page.getByRole("heading", { name: "Your debrief." })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByText(/Tell the panel what you are building/)).toHaveCount(0);
});
