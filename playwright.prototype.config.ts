import { defineConfig } from "@playwright/test";
export default defineConfig({
 outputDir:"test-results/prototype-suite",testDir:"./tests/prototype", testMatch:"prototype.spec.ts",workers:1,timeout:45000,
 use:{baseURL:"http://127.0.0.1:3193",channel:process.env.PLAYWRIGHT_BROWSER==="firefox"?undefined:process.env.PLAYWRIGHT_CHANNEL||"msedge",
  browserName:process.env.PLAYWRIGHT_BROWSER==="firefox"?"firefox":"chromium",
  viewport:{width:1440,height:1080},screenshot:"only-on-failure",trace:"retain-on-failure"},
 webServer:{command:"npm run dev -- --hostname 127.0.0.1 --port 3193",url:"http://127.0.0.1:3193",reuseExistingServer:true,timeout:60000},
});
