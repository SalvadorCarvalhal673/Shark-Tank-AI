// Original procedural artwork for Shark Tank AI, 2026. No downloaded models/textures.
// Regenerate with: node scripts/create-studio-avatar.mjs
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { mkdir, writeFile } from "node:fs/promises";
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((value) => { this.result = value; this.onloadend?.(); }); }
};
const bones = [], groups = Array.from({length: 7}, () => []);
function bone(name, parent, position) {
  const item = new THREE.Bone(); item.name = name; item.position.set(...position);
  if (parent !== null) bones[parent].add(item);
  bones.push(item); return bones.length - 1;
}
const pelvis = bone("Pelvis", null, [0,.78,0]);
const chest = bone("Chest", pelvis, [0,.58,0]);
const head = bone("Head", chest, [0,.49,0]);
const left = bone("LeftArm", chest, [-.34,.20,0]);
const leftHand = bone("LeftForearm", left, [-.03,-.31,.07]);
const right = bone("RightArm", chest, [.34,.20,0]);
const rightHand = bone("RightForearm", right, [.03,-.31,.07]);
const leftThigh = bone("LeftThigh", pelvis, [-.16,-.04,.05]);
const leftShin = bone("LeftShin", leftThigh, [0,-.04,.49]);
const rightThigh = bone("RightThigh", pelvis, [.16,-.04,.05]);
const rightShin = bone("RightShin", rightThigh, [0,-.04,.49]);
function part(geometry, center, scale, joint, material) {
  geometry.scale(...scale).translate(...center);
  const count = geometry.attributes.position.count;
  const indices = new Uint16Array(count*4), weights = new Float32Array(count*4);
  for(let i=0;i<count;i++){ indices[i*4]=joint; weights[i*4]=1; }
  geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(indices,4));
  geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(weights,4));
  groups[material].push(geometry);
}
const box = () => new THREE.BoxGeometry(1,1,1);
const sphere = () => new THREE.SphereGeometry(1,12,8);
part(sphere(),[0,1.32,0],[.34,.47,.21],chest,1);
part(box(),[0,1.55,.17],[.23,.27,.06],chest,5);
part(sphere(),[0,1.80,0],[.105,.17,.105],head,0);
part(sphere(),[0,2.02,0],[.23,.30,.21],head,0);
part(sphere(),[0,2.17,-.045],[.245,.20,.20],head,3);
part(box(),[0,2.02,-.19],[.40,.34,.07],head,3);
part(sphere(),[0,2.02,.204],[.042,.055,.05],head,0);
for(const x of [-.087,.087]){
  part(sphere(),[x,2.07,.185],[.032,.025,.025],head,6);
  part(box(),[x,2.13,.18],[.07,.013,.012],head,3);
}
part(box(),[0,1.92,.197],[.065,.011,.012],head,3);
for(const side of [-1,1]){
  const arm = side < 0 ? left : right, hand = side < 0 ? leftHand : rightHand;
  part(sphere(),[side*.35,1.43,.025],[.12,.23,.12],arm,1);
  part(sphere(),[side*.37,1.28,.24],[.095,.09,.23],hand,1);
  part(sphere(),[side*.37,1.28,.44],[.075,.048,.10],hand,0);
  part(sphere(),[side*.16,.75,.28],[.14,.14,.31],side<0?leftThigh:rightThigh,2);
  part(sphere(),[side*.16,.41,.56],[.10,.31,.10],side<0?leftShin:rightShin,2);
  part(sphere(),[side*.16,.10,.65],[.115,.075,.20],side<0?leftShin:rightShin,2);
}
part(sphere(),[0,.80,0],[.29,.20,.19],pelvis,2);
part(sphere(),[-.18,1.57,.18],[.035,.035,.025],chest,4);
const materials = ["#b97957","#283c34","#172321","#201b18","#b99b60","#e8dfc8","#171b19"].map((color,i)=>{
 const m = new THREE.MeshStandardMaterial({color,roughness:.82,metalness:i===4?.55:0,flatShading:true});
 m.name=["Skin","Jacket","Trousers","Hair","Brass","Shirt","Eyes"][i]; return m;
});
const geometry = mergeGeometries(groups.map(items=>mergeGeometries(items)),true);
const mesh = new THREE.SkinnedMesh(geometry, materials); mesh.name="StudioInvestor";
mesh.add(bones[0]); mesh.updateMatrixWorld(true); mesh.bind(new THREE.Skeleton(bones));
const root = new THREE.Group(); root.name="OriginalSeatedInvestor"; root.add(mesh);
function rotationTrack(name, times, rotations) {
 const q = rotations.flatMap(([x,y,z])=>new THREE.Quaternion().setFromEuler(new THREE.Euler(x,y,z)).toArray());
 return new THREE.QuaternionKeyframeTrack(name+".quaternion",times,q);
}
const clips = [
 new THREE.AnimationClip("Listening",2.8,[
  rotationTrack("Head",[0,1.4,2.8],[[0,0,0],[.025,.035,0],[0,0,0]]),
  rotationTrack("Chest",[0,1.4,2.8],[[0,0,0],[.012,0,0],[0,0,0]])
 ]),
 new THREE.AnimationClip("Offering",1.5,[
  rotationTrack("RightArm",[0,.55,1.5],[[0,0,0],[-.38,-.12,-.15],[-.1,0,-.05]]),
  rotationTrack("RightForearm",[0,.55,1.5],[[0,0,0],[-.28,0,0],[0,0,0]]),
  rotationTrack("Head",[0,.7,1.5],[[0,0,0],[.09,0,0],[0,0,0]])
 ]),
 new THREE.AnimationClip("Withdrawal",1.7,[
  rotationTrack("Chest",[0,.8,1.7],[[0,0,0],[-.14,0,0],[-.10,0,0]]),
  rotationTrack("Head",[0,.5,1,1.7],[[0,0,0],[0,.16,0],[0,-.12,0],[0,.04,0]])
 ])
];
const result = await new GLTFExporter().parseAsync(root,{binary:true,animations:clips});
await mkdir(new URL("../public/studio/",import.meta.url),{recursive:true});
await writeFile(new URL("../public/studio/investor-v1.glb",import.meta.url),Buffer.from(result));
console.log("Original GLB written:",result.byteLength,"bytes;",bones.length,"bones; three clips.");
