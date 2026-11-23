import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*-browser.spec.ts",
  use: {
    baseURL: "http://127.0.0.1:3192",
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
  },
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3192",
    url: "http://127.0.0.1:3192",
    timeout: 30000,
  },
});
