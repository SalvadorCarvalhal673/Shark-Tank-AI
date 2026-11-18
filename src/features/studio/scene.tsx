"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Color, LoopOnce, Shape, Vector3 } from "three";
import { createInvestorInstance } from "./avatar";
import { cameraPresets, cameraStep, sceneCue, type CameraView } from "./model";
import { INVESTOR_ORDER, type InvestorId } from "../simulation/negotiation/investor-policy";
import type { NegotiationSession } from "../simulation/negotiation/session";

type Metrics = {fps:number;frameP95Ms:number;triangles:number;drawCalls:number;geometries:number;textures:number;
 renderer:string;camera:number[];characters:number;skeletons:number;mixers:number};
export type StudioSceneProps = {
 view:CameraView;selected:InvestorId;session:NegotiationSession|null;reducedMotion:boolean;fault:string;
 onSelect:(investor:InvestorId)=>void;onFailure:(reason:string)=>void;onMetrics:(value:Metrics)=>void;
};
export function clearFailedAsset(){
 useLoader.clear(GLTFLoader,"/studio/investor-v1.glb");
 useLoader.clear(GLTFLoader,"/studio/intentionally-unavailable.glb");
}
const positions = [-2.5,0,2.5];
function Avatar({investor,index,props}:{investor:InvestorId;index:number;props:StudioSceneProps}){
 const {scene,animations}=useLoader(GLTFLoader,props.fault==="asset"?"/studio/intentionally-unavailable.glb":"/studio/investor-v1.glb");
 const instance=useMemo(()=>createInvestorInstance(scene,investor),[scene,investor]);
 const {invalidate}=useThree();
 const cue=sceneCue(props.session,investor);
 const action=useRef<ReturnType<typeof instance.mixer.clipAction> | null>(null);
 useEffect(()=>{
  const clip=animations.find(clip=>clip.name===cue.pose);
  if(!clip)return;
  const next=instance.mixer.clipAction(clip);
  action.current?.fadeOut(.16);next.reset().setLoop(LoopOnce,1);
  next.clampWhenFinished=true;next.fadeIn(.16).play();action.current=next;
  if(props.reducedMotion){instance.mixer.update(cue.pose==="Listening"?0:.8);next.paused=true;}
  invalidate();

 },[animations,cue.key,cue.pose,instance,props.reducedMotion,invalidate]);
 useEffect(()=>()=>instance.dispose(),[instance]);
 useFrame((_,delta)=>{if(!props.reducedMotion)instance.mixer.update(Math.min(delta,.05));});
 return <group position={[positions[index],0,0]} onClick={event=>{event.stopPropagation();props.onSelect(investor);}}>
  <primitive object={instance.root} dispose={null}/>
  {investor==="adrian" && <group position={[0,2.07,.21]}>
   {[-.088,.088].map(x=><mesh key={x} position={[x,0,0]}><torusGeometry args={[.052,.007,5,14]}/><meshStandardMaterial color="#b59d68" metalness={.5} roughness={.5}/></mesh>)}
  </group>}
  <mesh position={[0,.03,0]} rotation={[-Math.PI/2,0,0]}>
   <ringGeometry args={[.37,.40,28]}/><meshBasicMaterial color={props.selected===investor?"#d5f27d":"#344735"}/>
  </mesh>
 </group>;
}
function StudioRoom(){
 const top=useMemo(()=>{
  const s=new Shape();s.moveTo(-3.95,.56);s.quadraticCurveTo(0,.17,3.95,.56);
  s.lineTo(4.05,1.35);s.quadraticCurveTo(0,2.4,-4.05,1.35);s.closePath();return s;
 },[]);
 return <group>
  <mesh position={[0,-.07,0]}><boxGeometry args={[15,.12,13]}/><meshStandardMaterial color="#202e25" roughness={.9}/></mesh>
  <mesh position={[0,2.7,-2.2]}><boxGeometry args={[14,5.5,.15]}/><meshStandardMaterial color="#18382c" roughness={.9}/></mesh>
  {[-5.6,-4.8,-3.6,-1.3,1.3,3.6,4.8,5.6].map(x=><mesh key={x} position={[x,2.5,-2.06]}>
   <boxGeometry args={[.045,4.5,.09]}/><meshStandardMaterial color="#987c46" metalness={.65} roughness={.4}/>
  </mesh>)}
  <mesh position={[0,2.8,-2.01]}><torusGeometry args={[.66,.022,6,64]}/><meshStandardMaterial color="#c1c393" emissive="#3c5428" emissiveIntensity={.5}/></mesh>
  <mesh position={[0,1.19,0]} rotation={[Math.PI/2,0,0]}><extrudeGeometry args={[top,{depth:.12,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:1,steps:1}]}/>
   <meshStandardMaterial color="#806447" roughness={.55}/></mesh>
  {[-3.2,3.2].map(x=><mesh key={x} position={[x,.56,1]}><boxGeometry args={[.18,1.10,.55]}/><meshStandardMaterial color="#ac8d50" metalness={.7} roughness={.5}/></mesh>)}
  {positions.map(x=><group key={x} position={[x,0,-.11]}>
   <mesh position={[0,.70,0]}><boxGeometry args={[.72,.16,.72]}/><meshStandardMaterial color="#293a31" roughness={.85}/></mesh>
   <mesh position={[0,1.12,-.36]} rotation={[-.10,0,0]}><boxGeometry args={[.72,.85,.13]}/><meshStandardMaterial color="#293a31" roughness={.85}/></mesh>
   <mesh position={[0,.35,0]}><cylinderGeometry args={[.045,.065,.64,8]}/><meshStandardMaterial color="#9a804b" metalness={.7} roughness={.5}/></mesh>
   <mesh position={[0,.04,0]}><cylinderGeometry args={[.37,.37,.05,16]}/><meshStandardMaterial color="#333e32" metalness={.4}/></mesh>
  </group>)}
 </group>;
}
function Direction({props,ready,visible}:{props:StudioSceneProps;ready:boolean;visible:boolean}){
 const {camera,gl,invalidate,scene}=useThree();
 const target=useRef(new Vector3(0,1.45,.1));
 const settleFrames=useRef(3);
 const onFailure=props.onFailure;
 const wakeUntil=useRef(0),lastSample=useRef(0),samples=useRef<number[]>([]);
 const pose=cameraPresets[props.view];
 useEffect(()=>{
  wakeUntil.current=performance.now()+3200; samples.current=[];settleFrames.current=3;
  if(props.reducedMotion){camera.position.fromArray(pose.position);target.current.fromArray(pose.target);camera.lookAt(target.current);}
  invalidate();
  const measurement=setTimeout(()=>invalidate(),900);
  return ()=>clearTimeout(measurement);
 },[pose,props.session?.revision,props.reducedMotion,camera,invalidate,ready,visible]);
 useEffect(()=>{
  const canvas=gl.domElement;
  const lost=(event:Event)=>{event.preventDefault();onFailure("The graphics context was lost. Simplified view keeps your session, drafts and saved progress.");};
  canvas.addEventListener("webglcontextlost",lost);
  return ()=>canvas.removeEventListener("webglcontextlost",lost);
 },[gl,onFailure]);
 useFrame((_,delta)=>{
  const step=cameraStep(delta,props.reducedMotion);
  camera.position.lerp(new Vector3(...pose.position),step);
  target.current.lerp(new Vector3(...pose.target),step);camera.lookAt(target.current);
  const now=performance.now();
  if(delta>0 && delta<.25)samples.current.push(delta*1000);
  if(samples.current.length>180)samples.current.shift();
  if(now-lastSample.current>750){
   const frames=[...samples.current].sort((a,b)=>a-b);
   const mean=frames.reduce((a,b)=>a+b,0)/(frames.length||1);
   const context=gl.getContext(),extension=context.getExtension("WEBGL_debug_renderer_info");
   const skeletons=new Set(),mixers=new Set();
   let characters=0;
   scene.traverse(object=>{
    if(object.userData.studioMixer){mixers.add(object.userData.studioMixer);characters++;}
    if("isSkinnedMesh" in object && object.isSkinnedMesh){
     if("skeleton" in object && object.skeleton && typeof object.skeleton==="object" && "bones" in object.skeleton)skeletons.add((object.skeleton.bones as unknown[])[0]);
    }
   });
   props.onMetrics({fps:mean?Math.round(1000/mean):0,frameP95Ms:Math.round((frames[Math.floor(frames.length*.95)]??0)*10)/10,
    triangles:gl.info.render.triangles,drawCalls:gl.info.render.calls,
    geometries:gl.info.memory.geometries,textures:gl.info.memory.textures,
    renderer:extension?String(context.getParameter(extension.UNMASKED_RENDERER_WEBGL)):"Unavailable",
    camera:camera.position.toArray().map(v=>Math.round(v*100)/100),characters,skeletons:skeletons.size,mixers:mixers.size});
   lastSample.current=now;
  }
  if(settleFrames.current-->0 || (now<wakeUntil.current && !props.reducedMotion))invalidate();
 });
 return null;
}
function AssetsReady({onReady}:{onReady:()=>void}){
 useEffect(()=>{onReady();},[onReady]);return null;
}
export function StudioScene(props:StudioSceneProps){
 const [visible,setVisible]=useState(true),[ready,setReady]=useState(false);
 const [dpr,setDpr]=useState(()=>Math.min(window.devicePixelRatio,window.innerWidth<760?1:1.5));
 useEffect(()=>{const resize=()=>setDpr(Math.min(window.devicePixelRatio,window.innerWidth<760?1:1.5));
  window.addEventListener("resize",resize);return()=>window.removeEventListener("resize",resize);},[]);
 useEffect(()=>{
  const update=()=>setVisible(!document.hidden);update();
  document.addEventListener("visibilitychange",update);return()=>document.removeEventListener("visibilitychange",update);
 },[]);
 if(props.fault==="renderer")throw new Error("Requested development renderer initialization failure");
 if(props.fault==="webgl")return <Unavailable onFailure={props.onFailure}/>;
 return <>
  <Canvas frameloop={visible?"demand":"never"} dpr={dpr} camera={{position:[0,3.1,9.2],fov:43,near:.1,far:40}}
   gl={{antialias:true,powerPreference:"default"}} onCreated={({scene})=>{scene.background=new Color("#17271f");}}>
   <hemisphereLight args={["#e7f0c7","#283522",2.4]}/>
   <directionalLight position={[-3,6,5]} color="#ffe2b3" intensity={3}/>
   <directionalLight position={[4,4,-1]} color="#a7c8bd" intensity={1.5}/>
   <StudioRoom/>
   <Suspense fallback={null}>
    {INVESTOR_ORDER.map((id,index)=><Avatar key={id} investor={id} index={index} props={props}/>)}
    <AssetsReady onReady={()=>setReady(true)}/>
   </Suspense>
   <Direction props={props} ready={ready} visible={visible}/>
  </Canvas>
  {!ready && <p className="studio-loading" role="status">Loading and preparing the local character model…</p>}
 </>;
}
function Unavailable({onFailure}:{onFailure:StudioSceneProps["onFailure"]}){
 useEffect(()=>{onFailure("WebGL2 is unavailable. Simplified view keeps every financial control and your current session.");},[onFailure]);
 return null;
}
