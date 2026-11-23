// Demonstration preflight (Issues #78, #86, #87). Run before presenting:  npm run demo:check
// Checks the machine can run the offline demo and prints the verified figures to look for.
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:net";

const checks = [];
const ok = (name, pass, detail) => checks.push({ name, pass, detail });

const major = Number(process.versions.node.split(".")[0]);
ok("Node.js 24", major === 24, `found ${process.versions.node}`);
ok("Dependencies installed (npm ci)", existsSync("node_modules/next/package.json"), "node_modules/next");
const build = ".next/BUILD_ID";
ok("Production build present (npm run build)", existsSync(build), build);
if (existsSync(build)) {
  const built = statSync(build).mtimeMs;
  const newest = ["src/app/page.tsx", "src/features/simulation/practice-room.tsx", "package-lock.json"].map(file => statSync(file).mtimeMs);
  ok("Build is newer than the source", newest.every(time => time <= built), "rebuild if the code changed after the last build");
}
const port = Number(process.env.PORT ?? 3000);
const free = await new Promise(resolve => {
  const server = createServer().once("error", () => resolve(false)).once("listening", () => server.close(() => resolve(true)));
  server.listen(port, "127.0.0.1");
});
ok(`Port ${port} is free`, free, free ? "" : "another server is using it; stop it or set PORT");
ok("Demo answers available", readFileSync("tests/browser-fixtures.ts", "utf8").includes("Revenue: €9000"), "tests/browser-fixtures.ts");

for (const { name, pass, detail } of checks) console.log(`${pass ? "✔" : "✖"} ${name}${detail ? ` — ${detail}` : ""}`);
console.log(`
Start:   npm start -- --hostname 127.0.0.1 --port ${port}
Open:    http://127.0.0.1:${port}/simulate   (no network, API key or GPU needed)
Expect:  openings Maya €100,000.00 for 13% · Adrian €90,000.00 for 15% · Sofia €80,000.00 for 12%
         counter Maya to 11% → agreed → accept → founder 60% → 53.4%, post-money €909,090.91
Script:  docs/presentation/demo-script.md`);
process.exitCode = checks.every(check => check.pass) ? 0 : 1;
