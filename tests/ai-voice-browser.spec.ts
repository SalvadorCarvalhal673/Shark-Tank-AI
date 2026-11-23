import { test, expect, type Page, type Route } from "@playwright/test";

// Phase 4D: the optional investor voice in the practice room. The production build keeps the AI
// route disabled, so these tests prove the honest fallback, then use an intercepted route to check
// the clarification flow and that nothing the voice does changes the session.

async function startPractice(page: Page) {
  await page.goto("/simulate");
  await page.getByRole("button", { name: "Use LunchLoop · reusable containers" }).click();
  await page.getByRole("button", { name: "Review pitch" }).click();
  await page.getByRole("button", { name: "Skip introductions" }).click();
  await page.getByRole("button", { name: "Start practice" }).click();
  await expect(page.getByLabel("Your answer")).toBeVisible();
}
const voice = (page: Page) => page.getByRole("region", { name: "Investor voice" });
const revision = (page: Page) => page.locator("[data-session-revision], .practice-room").first();

test("the investor voice is off by default and the disabled route falls back honestly", async ({ page }) => {
  let calls = 0;
  page.on("request", request => { if (request.url().endsWith("/api/investor")) calls++; });
  await startPractice(page);
  await expect(voice(page).getByLabel("AI investor voice")).not.toBeChecked();
  await expect(voice(page)).toContainText("drafts stay on the page");
  expect(calls).toBe(0);
  await page.getByLabel("Your answer").fill("My unfinished draft answer about costs");
  await voice(page).getByLabel("AI investor voice").check();
  await expect(voice(page).getByRole("note")).toContainText("not available in this build");
  await expect(voice(page).locator("article")).toHaveAttribute("data-provenance", "scripted");
  await expect(page.getByLabel("Your answer")).toHaveValue("My unfinished draft answer about costs");
  expect(calls).toBe(1);
  const body = await page.evaluate(() => document.body.innerText);
  expect(body).not.toContain("undefined");
});

async function mockVoice(route: Route) {
  const request = JSON.parse(route.request().postData() || "{}");
  await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
    contractVersion: 1, binding: request.binding, dialogue: "Tell me which costs you control directly.",
    question: request.binding.purpose === "question" ? "Which costs does the café pay, and which do you pay?" : null,
    observations: [], provenance: "mock", fallback: null, limitations: ["Development mock voice."] }) });
}

test("one explicit clarification per investor, copied to the draft only on click and never submitted", async ({ page }) => {
  await page.route("**/api/investor", mockVoice);
  await startPractice(page);
  const id = await revision(page).getAttribute("data-session-id");
  await voice(page).getByLabel("AI investor voice").check();
  await expect(voice(page).locator("article")).toHaveAttribute("data-provenance", "mock");
  await expect(voice(page)).toContainText("Development mock voice");
  await voice(page).getByRole("button", { name: "Ask Maya Chen for one clarification" }).click();
  await expect(voice(page)).toContainText("Which costs does the café pay");
  await voice(page).getByLabel("Your clarification (stays on this page)").fill("The café pays washing; we pay containers.");
  await expect(page.getByLabel("Your answer")).toHaveValue("");
  await voice(page).getByRole("button", { name: "Add to my answer draft" }).click();
  await expect(page.getByLabel("Your answer")).toHaveValue("The café pays washing; we pay containers.");
  await expect(voice(page).getByRole("button", { name: /for one clarification/ })).toHaveCount(0);
  await expect(page.getByText("Question 1 of 3")).toBeVisible();
  await expect(revision(page)).toHaveAttribute("data-session-id", id!);
});

test("contradictory and failing replies are discarded with a truthful status", async ({ page }) => {
  let mode: "numbers" | "error" = "numbers";
  await page.route("**/api/investor", async route => {
    const request = JSON.parse(route.request().postData() || "{}");
    if (mode === "error") return route.fulfill({ status: 429, contentType: "application/json", body: '{"error":"rate-limited"}' });
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      contractVersion: 1, binding: request.binding, dialogue: "I will invest 900000 euros, deal accepted.",
      question: request.binding.purpose === "question" ? "Anything?" : null, observations: [], provenance: "ai", fallback: null, limitations: ["x"] }) });
  });
  await startPractice(page);
  await voice(page).getByLabel("AI investor voice").check();
  await expect(voice(page).getByRole("note")).toContainText("did not match the committed session");
  await expect(voice(page)).not.toContainText("900000");
  mode = "error";
  await page.getByLabel("Your answer").fill("Revenue is 9000 per month from three campus cafés.");
  await page.getByRole("button", { name: "Submit answer" }).click();
  await expect(voice(page).getByRole("note")).toContainText("request limit was reached");
  await expect(page.getByText("Question 2 of 3")).toBeVisible();
});

test("without any AI service the scripted voice asks a draft-aware clarification and coaches the outcome", async ({ page }) => {
  await startPractice(page);
  await voice(page).getByLabel("AI investor voice").check();
  await expect(voice(page)).toContainText("Scripted voice (rules-based)");
  await page.getByLabel("Your answer").fill("We help campus cafés reduce packaging waste.");
  await voice(page).getByRole("button", { name: "Ask Maya Chen for one clarification" }).click();
  await expect(voice(page)).toContainText("Which financial measure can you put a figure on");
  await expect(page.getByTestId("clarification-note")).toContainText("cannot yet find");
  await voice(page).getByLabel("Your clarification (stays on this page)").fill("Revenue: €9000 per month from three cafés.");
  await voice(page).getByRole("button", { name: "Add to my answer draft" }).click();
  await expect(page.getByLabel("Your answer")).toHaveValue("We help campus cafés reduce packaging waste.\n\nRevenue: €9000 per month from three cafés.");
  await expect(page.getByText("Question 1 of 3")).toBeVisible();
  for (let turn = 0; turn < 3; turn++) {
    await page.getByLabel("Your answer").fill(`We are excited about our product, part ${turn + 1}.`);
    await page.getByRole("button", { name: "Submit answer" }).click();
  }
  await expect(page.getByRole("heading", { name: "Your debrief." })).toBeVisible();
  await expect(voice(page).getByRole("list", { name: /Suggestions for your next practice/ })).toContainText("No investor made an opening offer");
});
