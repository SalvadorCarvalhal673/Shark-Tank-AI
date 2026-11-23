import { defineConfig } from "@playwright/test";
import main from "./playwright.config.ts";

// Desktop browser matrix for the release scope (Windows and macOS desktops). Each project runs the
// full browser suite against the production build. Browsers must be installed on the machine:
//   Windows: Chrome and Edge are usually installed already  → PLAYWRIGHT_PROJECTS="chrome,msedge"
//   macOS:   npx playwright install webkit                    → PLAYWRIGHT_PROJECTS="chrome,webkit"
// Run:  npm run build  then  npx playwright test --config playwright.desktop.config.ts --project=<name>
const viewport = { width: 1440, height: 1000 };
export default defineConfig({
  ...main,
  outputDir: "test-results/desktop",
  projects: [
    { name: "chromium", use: { ...main.use, channel: undefined, browserName: "chromium", viewport } },
    { name: "chrome", use: { ...main.use, channel: "chrome", browserName: "chromium", viewport } },
    { name: "msedge", use: { ...main.use, channel: "msedge", browserName: "chromium", viewport } },
    { name: "webkit", use: { ...main.use, channel: undefined, browserName: "webkit", viewport } },
  ],
});
