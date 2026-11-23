import { defineConfig, devices } from "@playwright/test";
import main from "./playwright.config.ts";

// Issue #69: the same browser suite in Playwright's WebKit engine, desktop and an emulated iPhone.
// Run on macOS after `npx playwright install webkit` and `npm run build`:
//   npx playwright test --config playwright.webkit.config.ts
// Playwright WebKit is close to Safari but is not Safari; record real Safari/iOS results separately
// in docs/qa/phase-4e.md.
export default defineConfig({
  ...main,
  outputDir: "test-results/webkit",
  projects: [
    { name: "webkit-desktop", use: { ...main.use, channel: undefined, browserName: "webkit", viewport: { width: 1440, height: 1000 } } },
    { name: "webkit-iphone", use: { ...devices["iPhone 13"], baseURL: main.use?.baseURL } },
  ],
});
