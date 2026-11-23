import {test,expect,type Page} from "@playwright/test";

const storageKey="shark-tank-ai.session";
async function start(page:Page,save=false){
 await page.goto("/prototype/studio");
 await expect(page.getByText("Checking saved progress…",{exact:true})).toHaveCount(0);
 if(save)await page.getByLabel("Save this prototype session in this browser").check();
 await page.getByRole("button",{name:"Start LunchLoop episode",exact:true}).click();
 await expect(page.getByLabel("Your answer",{exact:true})).toBeVisible();
}
async function offers(page:Page,save=false){
 await start(page,save);
 for(let i=0;i<3;i++){
  await page.getByRole("button",{name:"Use sample answer",exact:true}).click();
  await page.getByRole("button",{name:"Submit answer",exact:true}).click();
 }
 await expect(page.getByTestId("session-meta")).toHaveAttribute("data-revision","3");
}
async function enter(page:Page){
 await page.getByRole("button",{name:"Enter 3D studio",exact:true}).click();
 await expect(page.locator("canvas")).toBeVisible();
 await expect(page.getByTestId("render-metrics")).toContainText('"characters":3',{timeout:20000});
}
test("preview exactness, invalid input and draft preservation without a binding action",async({page})=>{
 await offers(page,true);
 await expect(page.getByLabel("Save status",{exact:true})).toHaveText("Save status · Saved");
 const before=await page.evaluate(key=>localStorage.getItem(key),storageKey);
 await page.getByLabel("Investment (EUR)",{exact:true}).fill("120000");
 await page.getByLabel("Investor equity (%)",{exact:true}).fill("25");
 await expect(page.getByLabel("Financial preview")).toContainText("€480,000.00");
 await expect(page.getByLabel("Financial preview")).toContainText("€360,000.00");
 await expect(page.getByLabel("Financial preview")).toContainText("60%");
 await enter(page);
 await page.getByRole("button",{name:"Use simplified view",exact:true}).click();
 await expect(page.getByLabel("Investment (EUR)",{exact:true})).toHaveValue("120000");
 await expect(page.getByLabel("Investor equity (%)",{exact:true})).toHaveValue("25");
 expect(await page.evaluate(key=>localStorage.getItem(key),storageKey)).toBe(before);
 await expect(page.getByTestId("session-meta")).toHaveAttribute("data-rounds","0");
 await page.getByLabel("Investor equity (%)",{exact:true}).fill("0");
 await expect(page.getByRole("button",{name:"Send counter to Maya",exact:true})).toBeDisabled();
});

test("fictional quick-start scenarios remain drafts until explicit answer submission",async({page})=>{
 await page.goto("/prototype/studio");
 await expect(page.getByLabel("Choose a fictional scenario")).toHaveValue("meal-orders");
 await expect(page.getByText(/Fictional demo data/)).toBeVisible();
 await page.getByLabel("Choose a fictional scenario").selectOption("reusable-containers");
 await expect(page.getByText(/€100,000 ask for 10% and 60% founder ownership/)).toBeVisible();
 await expect(page.getByTestId("session-meta")).toHaveAttribute("data-revision","0");
 await page.getByRole("button",{name:"Start LunchLoop episode",exact:true}).click();
 await expect(page.getByText("FOUNDER OWNS 60% AT START")).toBeVisible();
 await page.getByRole("button",{name:"Use sample answer",exact:true}).click();
 const answer=page.getByLabel("Your answer",{exact:true});
 await expect(answer).toHaveValue(/Revenue: 9000 per month/);
 await expect(page.getByTestId("session-meta")).toHaveAttribute("data-revision","0");
 await page.getByRole("button",{name:"Submit answer",exact:true}).click();
 await expect(page.getByTestId("session-meta")).toHaveAttribute("data-revision","1");
});
test("committed counter updates history, cue and persisted journal exactly once",async({page})=>{
 await offers(page,true);await enter(page);
 await page.getByLabel("Investment (EUR)",{exact:true}).fill("100000.01");
 await page.getByRole("button",{name:"Send counter to Maya",exact:true}).click();
 await expect(page.getByTestId("session-meta")).toHaveAttribute("data-rounds","1");
 await expect(page.getByLabel("Investor response")).toContainText("exceeds my cash limit");
 await expect(page.getByRole("button",{name:/Maya Chen Finance/})).toContainText("Withdrawal");
 await expect(page.getByLabel("Save status",{exact:true})).toHaveText("Save status · Saved");
 expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).actions.length,storageKey)).toBe(4);
 await page.reload();
 await page.getByRole("button",{name:"Resume saved session",exact:true}).click();
 await expect(page.getByTestId("session-meta")).toHaveAttribute("data-rounds","1");
 await expect(page.getByLabel("Investor response")).toContainText("exceeds my cash limit");
});
test("camera redirect, independent rigs and character picking",async({page})=>{
 await start(page);await enter(page);
 await page.getByRole("button",{name:/Maya Chen Finance/}).click();
 await page.getByRole("button",{name:/Adrian Vale Growth/}).click();
 await page.getByRole("button",{name:/Sofia Mendes Operations/}).click();
 await expect(page.getByTestId("studio-viewport")).toHaveAttribute("data-view","sofia");
 await expect.poll(async()=>JSON.parse(await page.getByTestId("render-metrics").textContent()||"{}").camera?.[0]).toBe(2.5);
 const metrics=JSON.parse(await page.getByTestId("render-metrics").textContent()||"{}");
 expect(metrics.skeletons).toBe(3);expect(metrics.mixers).toBe(3);
 expect(metrics.triangles).toBeGreaterThan(2000);expect(metrics.triangles).toBeLessThan(90000);
 expect(metrics.drawCalls).toBeLessThanOrEqual(60);
 await page.getByRole("button",{name:"Full panel",exact:true}).click();
 await expect.poll(async()=>JSON.parse(await page.getByTestId("render-metrics").textContent()||"{}").camera?.[0]).toBe(0);
 const bounds=await page.locator("canvas").boundingBox();
 await page.mouse.click(bounds!.x+bounds!.width*.50,bounds!.y+bounds!.height*.40);
 await expect(page.getByTestId("studio-viewport")).toHaveAttribute("data-view","adrian");
 await expect(page.getByTestId("session-meta")).toHaveAttribute("data-revision","0");
});
test("reduced motion and keyboard selection do not change the session",async({page})=>{
 await page.emulateMedia({reducedMotion:"reduce"});await start(page);await enter(page);
 await expect(page.getByLabel("Reduce motion",{exact:true})).toBeChecked();
 const button=page.getByRole("button",{name:/Sofia Mendes Operations/});await button.focus();await page.keyboard.press("Enter");
 await expect(page.getByTestId("studio-viewport")).toHaveAttribute("data-view","sofia");
 await expect(page.getByTestId("studio-viewport")).toHaveAttribute("data-motion","reduced");
 await expect(page.getByTestId("session-meta")).toHaveAttribute("data-revision","0");
});
for(const fault of ["asset","renderer","webgl"]){
 test(fault+" failure preserves answers, numeric drafts, session and journal",async({page})=>{
  await page.goto("/prototype/studio?fault="+fault);
  await page.getByRole("button",{name:"Start LunchLoop episode",exact:true}).click();
  const id=await page.getByTestId("session-meta").getAttribute("data-session-id");
  await page.getByLabel("Your answer",{exact:true}).fill("My unfinished customer evidence");
  await page.getByLabel("Investor equity (%)",{exact:true}).fill("27.25");
  await page.getByRole("button",{name:"Enter 3D studio",exact:true}).click();
  await expect(page.getByRole("button",{name:"Enter 3D studio",exact:true})).toBeVisible();
  await expect(page.getByLabel("Your answer",{exact:true})).toHaveValue("My unfinished customer evidence");
  await expect(page.getByLabel("Investor equity (%)",{exact:true})).toHaveValue("27.25");
  await expect(page.getByTestId("session-meta")).toHaveAttribute("data-session-id",id!);
  await expect(page.getByTestId("session-meta")).toHaveAttribute("data-revision","0");
 });
}
test("actual WebGL2 unavailability during renderer initialization falls back",async({page})=>{
 await page.addInitScript(()=>{
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(this:HTMLCanvasElement,...args:Parameters<typeof original>){
   if(String(args[0]).includes("webgl"))return null;
   return Reflect.apply(original,this,args);
  } as typeof original;
 });
 await start(page);await page.getByLabel("Your answer",{exact:true}).fill("Retain this unfinished answer");
 await page.getByRole("button",{name:"Enter 3D studio",exact:true}).click();
 await expect(page.getByText(/renderer or local model could not initialize/)).toBeVisible();
 await expect(page.getByLabel("Your answer",{exact:true})).toHaveValue("Retain this unfinished answer");
});

test("actual asset request failure falls back safely",async({page})=>{
 await start(page);await page.route("**/studio/investor-v1.glb",route=>route.abort());
 await page.getByRole("button",{name:"Enter 3D studio",exact:true}).click();
 await expect(page.getByText(/renderer or local model could not initialize/)).toBeVisible();
 await expect(page.getByTestId("session-meta")).toHaveAttribute("data-revision","0");
 await page.unroute("**/studio/investor-v1.glb");
 await enter(page);
 await expect(page.getByTestId("session-meta")).toHaveAttribute("data-revision","0");
});
test("actual context loss switches presentation and preserves pending drafts",async({page})=>{
 await offers(page,true);await enter(page);
 await page.getByLabel("Investor equity (%)",{exact:true}).fill("22.75");
 await expect(page.getByLabel("Save status",{exact:true})).toHaveText("Save status · Saved");
 const saved=await page.evaluate(key=>localStorage.getItem(key),storageKey);
 const supported=await page.locator("canvas").evaluate(canvas=>{
  const gl=(canvas as HTMLCanvasElement).getContext("webgl2");
  const extension=gl?.getExtension("WEBGL_lose_context");extension?.loseContext();return Boolean(extension);
 });
 expect(supported,"real context loss extension is required for this test").toBe(true);
 await expect(page.getByText(/graphics context was lost/)).toBeVisible();
 await expect(page.getByLabel("Investor equity (%)",{exact:true})).toHaveValue("22.75");
 expect(await page.evaluate(key=>localStorage.getItem(key),storageKey)).toBe(saved);
});
test("visibility suspension preserves state and resumes camera movement",async({page})=>{
 await start(page);await enter(page);
 const before=await page.getByTestId("session-meta").getAttribute("data-session-id");
 await page.getByRole("button",{name:/Sofia Mendes Operations/}).click();
 await page.evaluate(()=>{
  Object.defineProperty(document,"hidden",{configurable:true,value:true});
  document.dispatchEvent(new Event("visibilitychange"));
 });
 await page.waitForTimeout(150);
 const metrics=await page.getByTestId("render-metrics").textContent();
 await page.waitForTimeout(3500);
 expect(await page.getByTestId("render-metrics").textContent()).toBe(metrics);
 await page.evaluate(()=>{
  Object.defineProperty(document,"hidden",{configurable:true,value:false});
  document.dispatchEvent(new Event("visibilitychange"));
 });
 await expect.poll(async()=>JSON.parse(await page.getByTestId("render-metrics").textContent()||"{}").camera?.[0]).toBe(2.5);
 await expect(page.getByTestId("session-meta")).toHaveAttribute("data-session-id",before!);
 await expect(page.getByTestId("session-meta")).toHaveAttribute("data-revision","0");
});

test("responsive layouts keep complete controls without horizontal overflow",async({page})=>{
 await start(page);await enter(page);
 for(const width of [320,375,681,768,1440]){
  await page.setViewportSize({width,height:900});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),String(width)).toBe(true);
  await expect(page.getByLabel("Investor equity (%)",{exact:true})).toBeVisible();
  await expect(page.getByRole("button",{name:/Sofia Mendes Operations/})).toBeVisible();
 }
});

test("dialogue names the speaker, keeps the complete transcript and labels scripted replies",async({page})=>{
 await start(page);
 const dialogue=page.getByRole("region",{name:"Dialogue"});
 await expect(dialogue.getByText(/Scripted · rules-based replies, no live AI/)).toBeVisible();
 await expect(page.getByTestId("active-speaker")).toHaveText("Maya Chen · Finance");
 await expect(dialogue.getByRole("status")).toContainText("Waiting for your answer to Maya Chen");
 await page.getByRole("button",{name:"Use sample answer",exact:true}).click();
 const text=await page.getByLabel("Your answer",{exact:true}).inputValue();
 await page.getByRole("button",{name:"Submit answer",exact:true}).click();
 const history=page.getByRole("list",{name:"Dialogue history"});
 await expect(history.getByText(text,{exact:true})).toBeVisible();
 await expect(history.locator("li")).toHaveCount(3);
 await expect(page.getByTestId("active-speaker")).toHaveText("Adrian Vale · Growth");
 await expect(dialogue.getByRole("status")).toContainText("Waiting for your answer to Adrian Vale");
 await history.focus();await expect(history).toBeFocused();
 await expect(page.getByTestId("session-meta")).toHaveAttribute("data-revision","1");
});

test("counter binding is explicit and a double submit commits exactly one shared counter",async({page})=>{
 await offers(page,true);
 const binding=page.getByTestId("counter-binding");
 await expect(binding).toContainText("Bound to Maya Chen's current offer at revision 3");
 await expect(binding).toContainText("shared counter 1 of 3");
 await expect(page.getByRole("list",{name:"Shared counters: 3 of 3 left"})).toBeVisible();
 const offerId=await binding.getAttribute("data-offer-id");
 await page.getByLabel("Investor equity (%)",{exact:true}).fill("10");
 await page.getByRole("button",{name:"Send counter to Maya",exact:true}).dblclick();
 await expect(page.getByTestId("session-meta")).toHaveAttribute("data-rounds","1");
 await expect(page.getByLabel("Save status",{exact:true})).toHaveText("Save status · Saved");
 expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).actions.length,storageKey)).toBe(4);
 await expect(page.getByRole("list",{name:"Shared counters: 2 of 3 left"})).toBeVisible();
 if(await binding.count()) expect(await binding.getAttribute("data-offer-id")).not.toBe(offerId);
});

test("the camera follows each new speaker, can be interrupted and never changes the session",async({page})=>{
 const cameraX=async()=>JSON.parse(await page.getByTestId("render-metrics").textContent()||"{}").camera?.[0];
 await start(page);await enter(page);
 await expect(page.getByTestId("studio-viewport")).toHaveAttribute("data-view","maya");
 await expect.poll(cameraX).toBe(-2.5);
 await page.getByRole("button",{name:"Use sample answer",exact:true}).click();
 await page.getByRole("button",{name:"Submit answer",exact:true}).click();
 await expect(page.getByTestId("studio-viewport")).toHaveAttribute("data-view","adrian");
 await page.getByRole("button",{name:/Sofia Mendes Operations/}).click();
 await expect(page.getByTestId("studio-viewport")).toHaveAttribute("data-view","sofia");
 await expect.poll(cameraX).toBe(2.5);
 await page.waitForTimeout(500);
 await expect(page.getByTestId("studio-viewport")).toHaveAttribute("data-view","sofia");
 await expect(page.getByTestId("session-meta")).toHaveAttribute("data-revision","1");
});
test("with reduced motion the camera cuts to the new speaker",async({page})=>{
 await page.emulateMedia({reducedMotion:"reduce"});await start(page);await enter(page);
 await page.getByRole("button",{name:"Use sample answer",exact:true}).click();
 await page.getByRole("button",{name:"Submit answer",exact:true}).click();
 await expect(page.getByTestId("studio-viewport")).toHaveAttribute("data-view","adrian");
 await expect(page.getByTestId("studio-viewport")).toHaveAttribute("data-motion","reduced");
 await expect.poll(async()=>JSON.parse(await page.getByTestId("render-metrics").textContent()||"{}").camera?.[0],{timeout:3000}).toBe(0);
});
