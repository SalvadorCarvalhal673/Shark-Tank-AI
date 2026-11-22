"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Color, LoopOnce, PerspectiveCamera, Vector3, type Camera } from "three";
import { createInvestorInstance } from "./avatar";
import { CAST_URL } from "./rig";
import { StudioRoom } from "./room/studio-room";
import { SEAT_X } from "./room/layout";
import { cameraFov, cameraPresets, cameraStep, sceneCue, type CameraView } from "./model";
import { INVESTOR_ORDER, type InvestorId } from "../simulation/negotiation/investor-policy";
import type { NegotiationSession } from "../simulation/negotiation/session";

type Metrics = {fps:number;frameP95Ms:number;triangles:number;drawCalls:number;geometries:number;textures:number;
 renderer:string;camera:number[];characters:number;skeletons:number;mixers:number};
export type StudioSceneProps = {
 view:CameraView;selected:InvestorId;session:NegotiationSession|null;reducedMotion:boolean;fault:string;
 onSelect:(investor:InvestorId)=>void;onFailure:(reason:string)=>void;onMetrics:(value:Metrics)=>void;
};
export function clearFailedAsset(){
 useLoader.clear(GLTFLoader,CAST_URL);
 useLoader.clear(GLTFLoader,"/studio/intentionally-unavailable.glb");
}
const positions = SEAT_X;
function Avatar({investor,index,props}:{investor:InvestorId;index:number;props:StudioSceneProps}){
 const {scene,animations}=useLoader(GLTFLoader,props.fault==="asset"?"/studio/intentionally-unavailable.glb":CAST_URL);
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
  <mesh position={[0,.03,0]} rotation={[-Math.PI/2,0,0]}>
   <ringGeometry args={[.37,.40,28]}/><meshBasicMaterial color={props.selected===investor?"#d5f27d":"#344735"}/>
  </mesh>
 </group>;
}
/** Moves a perspective camera's field of view a fraction of the way to the target and reprojects. */
function easeFov(camera:Camera,fov:number,step:number){
 if(!(camera instanceof PerspectiveCamera) || Math.abs(camera.fov-fov)<=.01)return;
 camera.fov+=(fov-camera.fov)*step;camera.updateProjectionMatrix();
}
function Direction({props,ready,visible}:{props:StudioSceneProps;ready:boolean;visible:boolean}){
 const {camera,gl,invalidate,scene,size}=useThree();
 const fov=cameraFov(props.view,size.width/Math.max(size.height,1));
 const target=useRef(new Vector3(0,1.45,.1));
 const settleFrames=useRef(3);
 const onFailure=props.onFailure;
 const wakeUntil=useRef(0),lastSample=useRef(0),samples=useRef<number[]>([]);
 const pose=cameraPresets[props.view];
 useEffect(()=>{
  wakeUntil.current=performance.now()+3200; samples.current=[];settleFrames.current=3;
  if(props.reducedMotion){
   camera.position.fromArray(pose.position);target.current.fromArray(pose.target);camera.lookAt(target.current);
   easeFov(camera,fov,1);
  }
  invalidate();
  const measurement=setTimeout(()=>invalidate(),900);
  return ()=>clearTimeout(measurement);
 },[pose,fov,props.session?.revision,props.reducedMotion,camera,invalidate,ready,visible]);
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
  // The field of view eases with the same step, so shot changes and window resizes never jump.
  easeFov(camera,fov,step);
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
