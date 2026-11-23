import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { createInvestorInstance } from "../src/features/studio/avatar.ts";
import { cameraPresets, cameraStep, demonstrationAnswers, demonstrationPitch, financialPreview, sceneCue } from "../src/features/studio/model.ts";
import { applyFounderAction, startNegotiation } from "../src/features/simulation/negotiation/session.ts";
import { SkinnedMesh } from "three";
function openings(){
 let session=startNegotiation("studio-test",demonstrationPitch)!;
 for(const [turn,text] of demonstrationAnswers.entries())
  session=applyFounderAction(session,{kind:"answer",sessionId:session.id,expectedRevision:session.revision,turn,text});
 return session;
}
test("studio preview delegates exact valuations and reconciles all owners",()=>{
 const preview=financialPreview("100000","20",8000);
 assert.deepEqual(preview.value,{preMoney:40000000,postMoney:50000000});
 assert.equal(preview.cap!.founderAfterBps,6400);
 assert.equal(preview.cap!.otherExistingAfterBps,1600);
 assert.equal(preview.cap!.investorBps,2000);
});
test("studio preview rejects malformed, precision and range violations",()=>{
 for(const [amount,equity] of [["1e5","20"],["-1","20"],["0","20"],["1","0"],["1","100.01"],["0.001","1"],["","20"]])
  assert.ok(financialPreview(amount,equity,8000).error,amount+"/"+equity);
});
test("studio preview supports minimum minor unit and full investor ownership",()=>{
 const preview=financialPreview(".01","100",0);
 assert.deepEqual(preview.value,{preMoney:0,postMoney:1});
 assert.equal(preview.cap!.founderAfterBps,0);assert.equal(preview.cap!.investorBps,10000);
});
test("studio camera presets are bounded and reduced motion cuts immediately",()=>{
 assert.equal(Object.keys(cameraPresets).length,4);
 assert.equal(cameraStep(1/60,true),1);
 assert.equal(cameraStep(-1,false),0);
 assert.ok(cameraStep(1/60,false)>0 && cameraStep(1/60,false)<1);
 assert.equal(cameraStep(10,false),cameraStep(.05,false));
});
test("studio cues reflect committed offers and withdrawals without touching state",()=>{
 const session=openings(),before=JSON.stringify(session);
 for(const id of ["maya","adrian","sofia"] as const) assert.equal(sceneCue(session,id).pose,"Offering");
 const offer=session.offers.find(o=>o.investor==="maya" && o.status==="active")!;
 const withdrawn=applyFounderAction(session,{kind:"counter",sessionId:session.id,expectedRevision:session.revision,offerId:offer.id,
 terms:{amount:session.pitch.amount+1,equity:2000}});
 assert.equal(sceneCue(withdrawn,"maya").pose,"Withdrawal");
 assert.equal(sceneCue(withdrawn,"adrian").key,sceneCue(session,"adrian").key);
 assert.equal(JSON.stringify(session),before);
});
test("studio preview and camera selection never consume counters or mutate journals",()=>{
 const session=openings(),before=JSON.stringify(session);
 for(let i=0;i<100;i++){financialPreview(String(i+1),String((i%99)+1),session.pitch.founderOwnershipBps);sceneCue(session,"maya");}
 assert.equal(JSON.stringify(session),before);assert.equal(session.roundsUsed,0);
});
test("original local GLB has embedded geometry and the required gesture clips",async()=>{
 const bytes=await fs.readFile(new URL("../public/studio/investor-v1.glb",import.meta.url));
 const jsonLength=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+jsonLength).toString());
 assert.ok(json.buffers.every((b:{uri?:string})=>!b.uri));
 assert.equal(json.images,undefined);assert.equal(json.extensionsRequired,undefined);
 const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),"");
 // Issue #9 adds Explaining after the three original clips, which keep their names and order.
 assert.deepEqual(gltf.animations.map(c=>c.name),["Listening","Offering","Withdrawal","Explaining"]);
});
test("three characters have independent bones, mixers and materials but share geometry",async()=>{
 const bytes=await fs.readFile(new URL("../public/studio/investor-v1.glb",import.meta.url));
 const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),"");
 const instances=(["maya","adrian","sofia"] as const).map(id=>createInvestorInstance(gltf.scene,id));
 const meshes=instances.map(instance=>{const result:SkinnedMesh[]=[];instance.root.traverse(o=>{if(o instanceof SkinnedMesh)result.push(o);});return result;});
 assert.equal(new Set(instances.map(i=>i.mixer)).size,3);
 assert.equal(new Set(meshes.map(m=>m[0].skeleton.bones[0])).size,3);
 assert.equal(meshes[0][0].geometry,meshes[1][0].geometry);
 assert.notEqual(meshes[0][0].material,meshes[1][0].material);
 assert.equal(Array.isArray(meshes[0][0].material),false,"GLTF primitives retain single materials so they render");
 const other=meshes[1][0].skeleton.bones.find(b=>b.name==="RightArm")!.quaternion.clone();
 instances[0].mixer.clipAction(gltf.animations.find(c=>c.name==="Offering")!).play();
 instances[0].mixer.update(.7);
 assert.deepEqual(meshes[1][0].skeleton.bones.find(b=>b.name==="RightArm")!.quaternion.toArray(),other.toArray());
 assert.notDeepEqual(meshes[0][0].skeleton.bones.find(b=>b.name==="RightArm")!.quaternion.toArray(),other.toArray());
 instances.forEach(i=>i.dispose());
});
