// Local review capture. Writes only ignored test artifacts unless STUDIO_ARTIFACTS is set.
import {chromium} from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
const output=process.env.STUDIO_ARTIFACTS || "test-results/studio-review";
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:"msedge",headless:true});
const results={date:new Date().toISOString(),mode:"Next.js development server; not a production payload benchmark",samples:[]};
async function metrics(page){
 return JSON.parse(await page.getByTestId("render-metrics").textContent());
}
async function enter(page){
 await page.getByRole("button",{name:"Enter 3D studio",exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('[data-testid="render-metrics"]')?.textContent?.includes('"characters":3'),{},{timeout:120000});
}
async function offers(page){
 await page.getByRole("button",{name:"Start LunchLoop episode",exact:true}).click();
 for(let i=0;i<3;i++){
  await page.getByRole("button",{name:"Use sample answer",exact:true}).click();
  await page.getByRole("button",{name:"Submit answer",exact:true}).click();
 }
}
for(const setup of [
 {name:"desktop",width:1440,height:1080,dpr:1,mbps:20,latency:60},
 {name:"mobile-emulation",width:375,height:900,dpr:3,mbps:10,latency:80}
]){
 const context=await browser.newContext({viewport:{width:setup.width,height:setup.height},deviceScaleFactor:setup.dpr});
 const page=await context.newPage();page.setDefaultTimeout(120000);
 const cdp=await context.newCDPSession(page);
 await cdp.send("Network.enable");await cdp.send("Network.setCacheDisabled",{cacheDisabled:true});
 await cdp.send("Network.emulateNetworkConditions",{offline:false,latency:setup.latency,downloadThroughput:setup.mbps*1000000/8,uploadThroughput:1250000});
 const transfers=[];const urls=new Map();const external=new Set();
 cdp.on("Network.requestWillBeSent",event=>urls.set(event.requestId,event.request.url));
 cdp.on("Network.loadingFinished",event=>transfers.push({url:urls.get(event.requestId),bytes:event.encodedDataLength}));
 page.on("request",req=>{if(!req.url().startsWith("http://127.0.0.1:3193") && /^https?:/.test(req.url()))external.add(req.url());});
 const navigationStart=Date.now();
 await page.goto("http://127.0.0.1:3193/prototype/studio");
 await page.getByRole("button",{name:"Enter 3D studio",exact:true}).waitFor();
 const htmlReadyMs=Date.now()-navigationStart;
 const countBefore=transfers.length,entryStart=Date.now();
 await enter(page);const entryMs=Date.now()-entryStart;
 const criticalTransfers=transfers.slice(countBefore);
 await cdp.send("Network.emulateNetworkConditions",{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
 const frames=[];
 for(const name of ["Maya Chen Finance","Adrian Vale Growth","Sofia Mendes Operations"]){
  await page.getByRole("button",{name:new RegExp(name)}).click();
  await page.waitForTimeout(1500);frames.push(await metrics(page));
 }
 await page.getByRole("button",{name:"Full panel",exact:true}).click();await page.waitForTimeout(1800);
 const gl=await page.locator("canvas").evaluate(c=>{
  const context=c.getContext("webgl2");return {drawingBuffer:[context.drawingBufferWidth,context.drawingBufferHeight],canvasCss:[c.clientWidth,c.clientHeight],devicePixelRatio};
 });
 await page.screenshot({path:path.join(output,setup.name+".png"),fullPage:true});
 await page.evaluate(()=>{
  window.studioPreviewSamples=[];
  let started=null;
  document.getElementById("studio-amount").addEventListener("input",()=>{started=performance.now();},true);
  new MutationObserver(()=>{if(started!==null){window.studioPreviewSamples.push(performance.now()-started);started=null;}})
   .observe(document.querySelector(".studio-preview"),{childList:true,subtree:true,characterData:true});
 });
 for(let i=0;i<20;i++)await page.getByLabel("Investment (EUR)",{exact:true}).fill(String(100000+i));
 const previewMs=await page.evaluate(()=>window.studioPreviewSamples);
 results.samples.push({...setup,browser:await browser.version(),userAgent:await page.evaluate(()=>navigator.userAgent),htmlReadyMs,entryMs,
 critical3DBytes:criticalTransfers.reduce((n,r)=>n+r.bytes,0),criticalTransfers,externalRequests:[...external],frames,gl,previewMs});
 await context.close();
}
// The video is separate from performance sampling; recording changes rendering cost.
const context=await browser.newContext({viewport:{width:1440,height:1200},recordVideo:{dir:output,size:{width:1440,height:1200}}});
const page=await context.newPage();const video=page.video();
await page.goto("http://127.0.0.1:3193/prototype/studio");await enter(page);
await offers(page);await page.waitForTimeout(1800);
for(const name of ["Maya Chen Finance","Adrian Vale Growth","Sofia Mendes Operations"]){
 await page.getByRole("button",{name:new RegExp(name)}).click();await page.waitForTimeout(1600);
 await page.locator(".studio-viewport").screenshot({path:path.join(output,name.split(" ")[0].toLowerCase()+"-camera.png")});
}
await page.getByRole("button",{name:/Maya Chen Finance/}).click();
await page.getByLabel("Investment (EUR)",{exact:true}).fill("100000");
await page.getByLabel("Investor equity (%)",{exact:true}).fill("22");
await page.waitForTimeout(1000);
await page.getByRole("button",{name:"Send counter to Maya",exact:true}).click();await page.waitForTimeout(1600);
await page.getByRole("button",{name:/Sofia Mendes Operations/}).click();
await page.getByLabel("Investment (EUR)",{exact:true}).fill("100000.01");
await page.getByRole("button",{name:"Send counter to Sofia",exact:true}).click();await page.waitForTimeout(1800);
await page.locator(".studio-viewport").screenshot({path:path.join(output,"withdrawal.png")});
await page.getByRole("button",{name:"Use simplified view",exact:true}).click();await page.waitForTimeout(1000);
await page.getByRole("button",{name:"Enter 3D studio",exact:true}).click();await page.waitForTimeout(1200);
await context.close();await video.saveAs(path.join(output,"Shark-Tank-AI-3D-Prototype.webm"));
await fs.unlink(await video.path());
await browser.close();
await fs.writeFile(path.join(output,"measurements.json"),JSON.stringify(results,null,2));
console.log(JSON.stringify(results.samples.map(({name,entryMs,htmlReadyMs,critical3DBytes,frames,previewMs,gl,externalRequests})=>({name,entryMs,htmlReadyMs,critical3DBytes,frames,previewMs,gl,externalRequests})),null,2));
