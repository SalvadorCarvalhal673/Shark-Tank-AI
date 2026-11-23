import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AnimationMixer, Object3D } from "three";
// Execute the actual production Avatar frame callback, including a frame queued before visibility changes.
function avatarFrame(hidden: boolean, reducedMotion = false) {
 const source=readFileSync(new URL("../src/features/studio/scene.tsx",import.meta.url),"utf8");
 const avatar=source.slice(source.indexOf("function Avatar("),source.indexOf("/** Moves a perspective"));
 const registration=avatar.match(/useFrame\(\(_,delta\)=>\{[^}]*\}\);/)?.[0];
 assert.ok(registration,"the real Avatar frame callback is exercised");
 const mixer=new AnimationMixer(new Object3D()); let frame:((_:unknown,delta:number)=>void)|undefined;
 new Function("instance","props","document","useFrame",registration)(
  {mixer},{reducedMotion},{hidden},(callback:typeof frame)=>{frame=callback;});
 return {mixer,tick:(delta:number)=>frame!(null,delta)};
}
test("already-queued hidden Avatar frames never advance mixer time",()=>{
 const {mixer,tick}=avatarFrame(true);
 for(let i=0;i<120;i++)tick(.016);
 assert.equal(mixer.time,0);
});
test("visible Avatar frames advance and remain clamped; reduced motion stays frozen",()=>{
 const visible=avatarFrame(false);visible.tick(10);assert.equal(visible.mixer.time,.05);
 const reduced=avatarFrame(false,true);reduced.tick(.016);assert.equal(reduced.mixer.time,0);
});
