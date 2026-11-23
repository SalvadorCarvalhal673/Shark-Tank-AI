// Studio performance measurement (Issue #12).
//
// Measures the 3D studio against the documented budgets (docs/3D-STUDIO.md, src/features/studio/performance.ts):
// transfer, decode time, triangles, draw calls, rendered DPR, time to ready and resource stability.
//
// Usage (the studio prototype route only exists in development):
//   npm run dev -- --hostname 127.0.0.1 --port 3193      (in one terminal)
//   node scripts/measure-studio.mjs [baseUrl] [out.json]  (in another)
//
// Results on a software renderer or an emulated phone are NOT device evidence: the report records the
// renderer string so readers can tell. Real phones must be measured separately (docs/design/performance.md).
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { brotliCompressSync, gzipSync } from "node:zlib";
import { chromium, devices } from "playwright";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { CAST_URL } from "../src/features/studio/rig.ts";

const base = process.argv[2] ?? "http://127.0.0.1:3193";
const out = process.argv[3];
const report = { measuredAt: new Date().toISOString() };

// ---- Transfer: the cast file is the studio's only downloaded asset (room textures are painted in code).
const glb = readFileSync(new URL("../public" + CAST_URL, import.meta.url));
report.castFile = { bytes: glb.length, gzipBytes: gzipSync(glb, { level: 9 }).length, brotliBytes: brotliCompressSync(glb).length };

// Studio JavaScript from a production build, when one exists (`npm run build`).
try {
  const chunks = [];
  const walk = dir => readdirSync(dir).forEach(name => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (name.endsWith(".js") && /WebGLRenderer|studio-viewport/.test(readFileSync(path, "utf8"))) chunks.push(path);
  });
  walk(".next/static/chunks");
  const sizes = chunks.map(path => readFileSync(path));
  report.studioScripts = { files: chunks.length, bytes: sizes.reduce((sum, b) => sum + b.length, 0), gzipBytes: sizes.reduce((sum, b) => sum + gzipSync(b, { level: 9 }).length, 0) };
} catch { report.studioScripts = "no production build found; run npm run build first"; }

// ---- Decode: CPU-side GLB parse (no GPU upload), median of 15 runs after 3 warm-ups.
const parse = () => new Promise((resolve, reject) =>
  new GLTFLoader().parse(glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.byteLength), "", resolve, reject));
const times = [];
for (let i = 0; i < 18; i++) { const start = performance.now(); await parse(); if (i >= 3) times.push(performance.now() - start); }
times.sort((a, b) => a - b);
report.decodeMs = { median: +times[7].toFixed(1), max: +times.at(-1).toFixed(1), note: "Node GLTFLoader.parse; GPU upload and shader compile are included in timeToReadyMs instead" };

// ---- Browser views.
// Same browser selection as the Playwright configs: PLAYWRIGHT_CHANNEL (e.g. msedge, chrome) or an explicit executable.
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined, executablePath: process.env.STUDIO_CHROME || undefined });
const metrics = async page => JSON.parse(await page.getByTestId("render-metrics").textContent() || "{}");
async function open(context) {
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(base + "/prototype/studio");
  await page.getByText("Checking saved progress…", { exact: true }).waitFor({ state: "detached" }).catch(() => {});
  await page.getByRole("button", { name: "Start LunchLoop episode", exact: true }).click();
  const start = Date.now();
  await page.getByRole("button", { name: "Enter 3D studio", exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[data-testid="render-metrics"]')?.textContent?.includes('"characters":3'), null, { timeout: 120000 });
  return { page, errors, timeToReadyMs: Date.now() - start };
}
async function settle(page, x) {
  for (let i = 0; i < 80; i++) {
    const { camera } = await metrics(page);
    if (camera && Math.abs(camera[0] - x) < .02) break;
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(500);
  return metrics(page);
}
const renderedDpr = page => page.evaluate(() => {
  const canvas = document.querySelector('[data-testid="studio-viewport"] canvas');
  return canvas ? +(canvas.width / canvas.clientWidth).toFixed(2) : null;
});
const views = [["panel", null, 0], ["maya", /Maya Chen Finance/, -2.5], ["adrian", /Adrian Vale Growth/, 0], ["sofia", /Sofia Mendes Operations/, 2.5]];
async function measure(label, contextOptions) {
  const context = await browser.newContext(contextOptions);
  const { page, errors, timeToReadyMs } = await open(context);
  const result = { timeToReadyMs, deviceDpr: contextOptions.deviceScaleFactor ?? 1, renderedDpr: await renderedDpr(page), views: {} };
  for (const [view, name, x] of views) {
    if (name) await page.getByRole("button", { name }).click();
    const { triangles, drawCalls, geometries, textures, renderer } = await settle(page, x);
    result.views[view] = { triangles, drawCalls, geometries, textures };
    result.renderer = renderer;
  }
  // Resource stability: cycle every view ten times and hide/show the page, then compare GPU resources.
  const before = await metrics(page);
  for (let round = 0; round < 10; round++) for (const [, name] of views.slice(1)) {
    await page.getByRole("button", { name }).click();
    await page.waitForTimeout(150);
  }
  await page.evaluate(() => {
    for (const hidden of [true, false]) {
      Object.defineProperty(document, "hidden", { configurable: true, value: hidden });
      document.dispatchEvent(new Event("visibilitychange"));
    }
  });
  const after = await settle(page, 2.5);
  result.stability = Object.fromEntries(["geometries", "textures", "characters", "skeletons", "mixers"].map(key => [key, [before[key], after[key]]]));
  result.stable = Object.values(result.stability).every(([a, b]) => a === b);
  result.pageErrors = errors;
  report[label] = result;
  await context.close();
}
await measure("desktop", { viewport: { width: 1440, height: 1080 }, deviceScaleFactor: 2 });
await measure("phoneEmulation", { ...devices["iPhone 13"], defaultBrowserType: undefined });
await browser.close();

console.log(JSON.stringify(report, null, 2));
if (out) writeFileSync(out, JSON.stringify(report, null, 2) + "\n");
