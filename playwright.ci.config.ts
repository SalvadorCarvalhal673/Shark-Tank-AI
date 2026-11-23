import { defineConfig } from "@playwright/test";
// CI exercises a software renderer, not physical mobile GPU performance.
export default defineConfig({
 testDir:"./tests/prototype",testMatch:"prototype.spec.ts",outputDir:"test-results/prototype-ci",
 workers:1,timeout:45000,
 use:{baseURL:"http://127.0.0.1:3193",browserName:"chromium",channel:"chromium",
  viewport:{width:1440,height:1080},trace:"retain-on-failure",
  launchOptions:{args:["--use-angle=swiftshader","--enable-unsafe-swiftshader"]}},
 webServer:{command:"npm run dev -- --hostname 127.0.0.1 --port 3193",
  url:"http://127.0.0.1:3193",timeout:60000},
});
