"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSavedSession } from "../simulation/negotiation/use-saved-session";
import { RecoveryPanel } from "../simulation/negotiation/recovery-panel";
import { NegotiationHistory } from "../simulation/negotiation/history";
import { INVESTOR_ORDER, NEGOTIATION_RULES, type InvestorId } from "../simulation/negotiation/investor-policy";
import { counterCopy, openingCopy, outcomeCopy } from "../simulation/negotiation/presentation";
import { money } from "../simulation/pitch";
import { percent } from "../simulation/negotiation/terms-display";
import { demoScenarios, financialPreview, sceneCue, type CameraView } from "./model";
import type { StudioSceneProps } from "./scene";
import { DialoguePanel } from "./dialogue-panel";

const Scene = dynamic(()=>import("./scene").then(module=>module.StudioScene),{
 ssr:false,loading:()=> <p className="studio-loading" role="status">Loading 3D code… HTML controls are ready.</p>,
});
class SceneBoundary extends Component<{children:ReactNode;onFailure:(reason:string)=>void},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 componentDidCatch(){this.props.onFailure("The 3D renderer or local model could not initialize. Your session and drafts are unchanged.");}
 render(){return this.state.failed ? null : this.props.children;}
}
export function StudioPrototype(){
 const controller=useSavedSession();
 const session=controller.run?.session ?? null;
 const [view,setView]=useState<CameraView>("panel");
 const [selected,setSelected]=useState<InvestorId>("maya");
 const [threeD,setThreeD]=useState(false);
 const [failure,setFailure]=useState("");
 const [motion,setMotion]=useState(true);
 const [save,setSave]=useState(false);
 const [answer,setAnswer]=useState("");
 const [amount,setAmount]=useState("100000");
 const [equity,setEquity]=useState("20");
 const [fault,setFault]=useState("");
 const [metrics,setMetrics]=useState<Parameters<StudioSceneProps["onMetrics"]>[0] | null>(null);
 const [feedback,setFeedback]=useState("");
 const [scenarioId,setScenarioId]=useState<(typeof demoScenarios)[number]["id"]>(demoScenarios[0].id);
 useEffect(()=>{
  const query=new URLSearchParams(location.search);
  Promise.resolve().then(()=>setFault(query.get("fault") ?? ""));
  const preference=matchMedia("(prefers-reduced-motion: reduce)");
  const update=()=>setMotion(!preference.matches);
  Promise.resolve().then(update);preference.addEventListener("change",update);
  return ()=>preference.removeEventListener("change",update);
 },[]);
 function select(investor: InvestorId){setSelected(investor);setView(investor);}
 function failed(reason:string){setFailure(reason);setThreeD(false);}
 const preview=financialPreview(amount,equity,session?.pitch.founderOwnershipBps ?? 8000);
 const activeOffer=session?.offers.find(offer=>offer.investor===selected && offer.status==="active");
 const canCounter=Boolean(session?.stage==="negotiation" && activeOffer);
 const latest=session?.history.findLast(event=>
  (event.kind==="counter" || event.kind==="opening") && event.investor===selected);
 const response=latest?.kind==="counter" ? counterCopy[latest.reason] :
 latest?.kind==="opening" ? openingCopy[latest.reason] : "Listening to your pitch.";
 const remaining=NEGOTIATION_RULES.counterBudget-(session?.roundsUsed ?? 0);
 const currentInvestor=INVESTOR_ORDER[session?.answers.length ?? 0];
 const readyToStart=!controller.checking && !controller.busy && !session;
 const scenario=demoScenarios.find(item=>item.id===scenarioId) ?? demoScenarios[0];
 return <main className="studio-page">
  <header className="studio-header">
   <Link href="/">SHARK TANK <span>AI</span></Link>
   <span>EXPERIMENT 4A.2 · LOCAL DEVELOPMENT ONLY</span>
   <Link href="/simulate">Original practice ↗</Link>
  </header>
  <section className="studio-intro">
   <div><p className="kicker">THE INVESTMENT ROOM</p><h1>Take your seat.</h1></div>
   <p>A three-investor 3D feasibility study. Real negotiation rules. Original prototype characters. No live AI.</p>
  </section>
  <div className="studio-layout">
   <section className="studio-stage-column" aria-label="Investment studio">
    <div className="studio-toolbar">
     <button type="button" aria-pressed={view==="panel"} onClick={()=>setView("panel")}>Full panel</button>
     <button type="button" onClick={async()=>{
      if(threeD){setThreeD(false);return;}
      if(failure){
       try{const studioModule=await import("./scene");studioModule.clearFailedAsset();}
       catch{setFailure("3D code could not load. You can continue using simplified view.");return;}
      }
      setFailure("");setThreeD(true);
     }}>
      {threeD ? "Use simplified view" : "Enter 3D studio"}</button>
     <label><input type="checkbox" checked={!motion} onChange={event=>setMotion(!event.target.checked)}/> Reduce motion</label>
    </div>
    <div className="studio-viewport" data-view={view} data-motion={motion?"animated":"reduced"} data-testid="studio-viewport">
     {threeD ? <SceneBoundary onFailure={failed}>
      <Scene view={view} selected={selected} session={session} reducedMotion={!motion}
       fault={fault} onSelect={select} onFailure={failed} onMetrics={setMetrics}/>
     </SceneBoundary> : <div className="studio-simplified">
      <p className="studio-room-title">THE PANEL</p>
      <div className="studio-portraits">{INVESTOR_ORDER.map(id=>
       <button key={id} type="button" aria-label={"Focus "+NEGOTIATION_RULES.investors[id].name}
        className={"studio-portrait "+id+(selected===id?" selected":"")} onClick={()=>select(id)}>
        <span className="portrait-head" aria-hidden="true"/><span className="portrait-body" aria-hidden="true"/>
        <strong>{NEGOTIATION_RULES.investors[id].name.split(" ")[0]}</strong>
        <small>{sceneCue(session,id).pose}</small>
       </button>)}</div><div className="studio-flat-table" aria-hidden="true"/>
      <p className="studio-simplified-label">Simplified view · same session, same controls</p>
     </div>}
     <div className="studio-scene-caption" aria-hidden="true">FOUNDER CAM / {view.toUpperCase()}</div>
    </div>
    {failure && <p role="status" className="studio-notice">{failure}</p>}
    <div className="studio-investors" aria-label="Select investor">
     {INVESTOR_ORDER.map(id=><button key={id} type="button" onClick={()=>select(id)}
      aria-pressed={selected===id}><span>{NEGOTIATION_RULES.investors[id].name}</span>
      <small>{id==="maya"?"Finance":id==="adrian"?"Growth":"Operations"} · {sceneCue(session,id).pose}</small></button>)}
    </div>
    <section className="studio-dialogue" aria-label="Investor response">
     <p className="kicker">{NEGOTIATION_RULES.investors[selected].name}</p>
     <p aria-live="polite">{response}</p>
     {activeOffer && <p>Current offer: <strong>{money(activeOffer.amount,session!.pitch.currency)} for {percent(activeOffer.equity)}</strong></p>}
    </section>
    <DialoguePanel session={session}>
    {session?.stage==="questions" && currentInvestor && <form className="studio-composer" aria-label="Your reply" onSubmit={event=>{
     event.preventDefault();if(answer.trim().length<10 || answer.trim().length>1500)return;
     controller.dispatch({kind:"answer",sessionId:session.id,expectedRevision:session.revision,
       turn:session.answers.length,text:answer});setAnswer("");setFeedback("Answer submitted to the deterministic engine.");
    }}>
     <p className="studio-muted">Replying to {NEGOTIATION_RULES.investors[currentInvestor].name}. Their full question is the last line above.</p>
     <label htmlFor="studio-answer">Your answer</label>
     <textarea id="studio-answer" minLength={10} maxLength={1500} required value={answer} onChange={event=>setAnswer(event.target.value)}/>
     <div className="studio-actions"><button type="button" onClick={()=>setAnswer(scenario.answers[session.answers.length])}>Use sample answer</button>
      <button className="button" type="submit">Submit answer</button></div>
    </form>}
    </DialoguePanel>
    <details className="studio-diagnostics">
     <summary>Rendering measurements</summary>
     <p>Live counters describe this renderer only; they are not physical mobile certification.</p>
     <output data-testid="render-metrics">{metrics ? JSON.stringify(metrics) : "Start 3D to collect measurements."}</output>
    </details>
   </section>
   <aside className="studio-controls" aria-label="Negotiation controls">
    <p className="kicker">{session?.pitch.startup ?? "LunchLoop"} / FOUNDER OWNS {percent(session?.pitch.founderOwnershipBps ?? 8000)} AT START</p>
    <h2>Your next move.</h2>
    <p className="studio-muted">Explore terms freely. Only submitting an answer or counter changes the negotiation.</p>
    {!session && <div className="studio-start">
     <p><strong>Fictional demo data.</strong> Choose either LunchLoop scenario; their pitches, asks and ownership are different. Selecting one only chooses the draft used to start this local scripted episode.</p>
     <label htmlFor="studio-scenario">Choose a fictional scenario</label>
     <select id="studio-scenario" value={scenarioId} disabled={!readyToStart} onChange={event=>{
      const next=demoScenarios.find(item=>item.id===event.target.value);
      if(next){setScenarioId(next.id);setAnswer("");}
     }}>{demoScenarios.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</select>
     <p>{scenario.description}</p>
     <p>Review the pitch, then write and explicitly submit each answer. Example answers are optional and never submit themselves.</p>
     <label><input type="checkbox" checked={save} disabled={controller.slot.kind!=="empty"}
      onChange={event=>setSave(event.target.checked)}/> Save this prototype session in this browser</label>
     {controller.slot.kind!=="empty" && <p>Existing saved information is retained. Resume it below, or begin this sample without saving.</p>}
     <button className="button" type="button" disabled={!readyToStart} onClick={async()=>{
       const started=await controller.begin(scenario.pitch,save && controller.slot.kind==="empty",null);
       if(started) setFeedback("Sample pitch started. Submit each answer to open real investor offers.");
     }}>Start LunchLoop episode</button>
    </div>}
    <div className="studio-session-meta" data-testid="session-meta" data-session-id={session?.id ?? ""}
     data-revision={session?.revision ?? 0} data-rounds={session?.roundsUsed ?? 0}>
     <span>Revision <b>{session?.revision ?? 0}</b></span><span>Counters left <b>{remaining}</b></span>
    </div>
    <form className="studio-financial-form" onSubmit={event=>{
     event.preventDefault();
     if(!session || !activeOffer || !canCounter || !preview.terms)return;
     controller.dispatch({kind:"counter",sessionId:session.id,expectedRevision:session.revision,offerId:activeOffer.id,terms:preview.terms});
     setFeedback("Counter submitted. The investor response and animation follow committed engine state.");
    }}>
     <label htmlFor="studio-amount">Investment ({session?.pitch.currency ?? "EUR"})</label>
     <input id="studio-amount" type="number" min=".01" max="999999999.99" step=".01" required value={amount} onChange={event=>setAmount(event.target.value)}/>
     <input aria-label="Investment slider" type="range" min=".01" max={Math.max(150000,preview.terms?.amount ? preview.terms.amount/100 : 150000)}
      step=".01" value={preview.terms ? preview.terms.amount/100 : .01} onChange={event=>setAmount(event.target.value)}/>
     <label htmlFor="studio-equity">Investor equity (%)</label>
     <input id="studio-equity" type="number" min=".01" max="100" step=".01" required value={equity} onChange={event=>setEquity(event.target.value)}/>
     <input aria-label="Equity slider" type="range" min=".01" max="100" step=".01" value={preview.terms ? preview.terms.equity/100 : .01}
      onChange={event=>setEquity(event.target.value)}/>
     {"error" in preview ? <p role="status">{preview.error}</p> : <div className="studio-preview" aria-label="Financial preview">
      <p>IF THESE TERMS WERE ACCEPTED</p>
      <dl>
       <div><dt>Pre-money valuation</dt><dd>{money(preview.value!.preMoney,session?.pitch.currency ?? "EUR")}</dd></div>
       <div><dt>Post-money valuation</dt><dd>{money(preview.value!.postMoney,session?.pitch.currency ?? "EUR")}</dd></div>
       <div><dt>Founder ownership</dt><dd>{percent(preview.cap!.founderAfterBps)}</dd></div>
       <div><dt>Investor ownership</dt><dd>{percent(preview.cap!.investorBps)}</dd></div>
       <div><dt>Other shareholders</dt><dd>{percent(preview.cap!.otherExistingAfterBps)}</dd></div>
      </dl>
      <p className="studio-muted">The investor receives newly issued shares. Existing shareholders dilute proportionally. Values use the approved rounding rules.</p>
     </div>}
     <button className="button" type="submit" disabled={!canCounter || !preview.terms}>Send counter to {NEGOTIATION_RULES.investors[selected].name.split(" ")[0]}</button>
     {!canCounter && <p className="studio-muted">{!session || session.stage==="questions" ? "Complete the three investor answers to negotiate." :
      session.stage==="finished" ? "This session is finished." : !activeOffer ? "This investor has no active offer." : "The counter allowance is exhausted."}</p>}
    </form>
    {session?.outcome && <p role="status">{outcomeCopy[session.outcome.kind]}</p>}
    <p role="status">{feedback}</p>
   </aside>
  </div>
  <div className="studio-bottom">
   <RecoveryPanel controller={controller} active={Boolean(session)} onNew={()=>setFeedback("The sample can start without replacing your existing save.")}/>
   {session && <details className="studio-history"><summary>Committed negotiation history</summary><NegotiationHistory session={session}/></details>}
  </div>
 </main>;
}
