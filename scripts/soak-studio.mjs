// Ten-minute local soak; no domain actions or persistent changes.
import {chromium} from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
const output=process.env.STUDIO_ARTIFACTS||"test-results/studio-review";
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:"msedge",headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1080}});
const page=await context.newPage(),errors=[];
page.on("pageerror",error=>errors.push(error.message));
await page.goto("http://127.0.0.1:3193/prototype/studio");
await page.getByRole("button",{name:"Enter 3D studio",exact:true}).click();
await page.waitForFunction(()=>document.querySelector('[data-testid="render-metrics"]')?.textContent?.includes('"characters":3'));
const started=Date.now(),samples=[];
const names=["Maya Chen Finance","Adrian Vale Growth","Sofia Mendes Operations"];
const duration=Number(process.env.STUDIO_SOAK_MS||600000);
let iteration=0;
while(Date.now()-started<duration){
 const index=iteration++%3;
 await page.getByRole("button",{name:new RegExp(names[index])}).click();
 await page.waitForTimeout(1500);
 if(iteration%10===0){
  samples.push({elapsedMs:Date.now()-started,metrics:JSON.parse(await page.getByTestId("render-metrics").textContent())});
  await fs.writeFile(path.join(output,"soak-progress.json"),JSON.stringify({duration,samples,errors},null,2));
 }
 if(iteration%40===0){
  await page.getByRole("button",{name:"Use simplified view",exact:true}).click();
  await page.getByRole("button",{name:"Enter 3D studio",exact:true}).click();
  await page.waitForFunction(()=>Boolean(document.querySelector("canvas")));
 }
}
await fs.writeFile(path.join(output,"soak.json"),JSON.stringify({elapsedMs:Date.now()-started,iterations:iteration,samples,errors,
 concurrentWork:"Other browser regression suites may run on the same host; this is a resource stability exercise, not an isolated FPS benchmark."},null,2));
await browser.close();console.log("Completed soak:",Date.now()-started,"ms;",iteration,"selections;",errors.length,"page errors.");
