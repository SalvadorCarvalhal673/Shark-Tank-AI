import { AnimationMixer, MeshStandardMaterial, SkinnedMesh, type Object3D, type Skeleton } from "three";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import type { InvestorId } from "../simulation/negotiation/investor-policy.ts";
import { belongsToOtherInvestor, INVESTOR_COLORS, type RigMaterial } from "./rig.ts";
import { CHARACTER_FINISH } from "./materials.ts";

export function createInvestorInstance(source: Object3D, investor: InvestorId) {
 const root=clone(source);
 // One file holds the whole cast (rig.ts): keep the shared body and this investor's features only.
 const others:Object3D[]=[];
 root.traverse(object=>{if(belongsToOtherInvestor(object.name,investor))others.push(object);});
 others.forEach(object=>object.removeFromParent());
 const ownedMaterials: MeshStandardMaterial[]=[];
 const ownedSkeletons=new Set<Skeleton>();
 root.traverse(object=>{
  if(!(object instanceof SkinnedMesh)) return;
  ownedSkeletons.add(object.skeleton);
  const originals=Array.isArray(object.material)?object.material:[object.material];
  const cloned=originals.map(original=>{
   const material=original.clone() as MeshStandardMaterial;
   const color=INVESTOR_COLORS[investor][material.name as RigMaterial];
   if(color) material.color.set(color);
   const finish=CHARACTER_FINISH[material.name as RigMaterial];
   if(finish){
    material.flatShading=false;material.roughness=finish.roughness;material.metalness=finish.metalness;
    if(finish.emissive){material.emissive.copy(material.color);material.emissiveIntensity=finish.emissive;}
    material.needsUpdate=true;
   }
   ownedMaterials.push(material); return material;
  });
  object.material=Array.isArray(object.material)?cloned:cloned[0];
 });
 const mixer=new AnimationMixer(root);
 root.userData.studioMixer=mixer;
 return {root,mixer,dispose(){mixer.stopAllAction();mixer.uncacheRoot(root);ownedMaterials.forEach(m=>m.dispose());ownedSkeletons.forEach(s=>s.dispose());}};
}
