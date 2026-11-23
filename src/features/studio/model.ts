import { readTerms } from "../simulation/pitch.ts";
import { ownershipAfterInvestment, valuations } from "../simulation/negotiation/financials.ts";
import type { NegotiationPitch, NegotiationSession } from "../simulation/negotiation/session.ts";
import { INVESTOR_ORDER, type InvestorId } from "../simulation/negotiation/investor-policy.ts";
import type { RigClip } from "./rig.ts";

export type CameraView = "panel" | InvestorId;
export type Pose = "Listening" | "Explaining" | "Offering" | "Withdrawal" | "Skeptical" | "Agreeing" | "Considering" | "Firm";

type DecisionEvent = Extract<NegotiationSession["history"][number], { kind: "opening" | "counter" }>;

/**
 * Reaction for a committed decision reason (Issue #10). Every reason the engine can record maps to
 * exactly one recognisable reaction; the map is exhaustive by type, so a new reason fails to compile.
 * DECISION: reactions only follow committed decisions, so a face never anticipates an outcome.
 */
export const REACTIONS: Record<DecisionEvent["reason"], Pose> = {
  "required-signals-supplied": "Offering",
  "repeated-answer": "Skeptical",
  "missing-required-signals": "Withdrawal",
  "within-limits": "Agreeing",
  "limited-concession": "Considering",
  "at-concession-limit": "Firm",
  "above-cash-ceiling": "Withdrawal",
  "below-withdrawal-band": "Withdrawal",
};

/**
 * Policy-specific withdrawal clips (Issue #30). The cue's pose stays "Withdrawal" for every way an
 * investor leaves, so existing behaviour and labels hold, but each reason plays its own movement.
 * DECISION (approved): above the cash ceiling raises an open palm; below the equity range shakes the
 * head and draws back; a pass for missing signals keeps the original Withdrawal clip.
 */
export const WITHDRAWAL_CLIPS = {
  "missing-required-signals": "Withdrawal",
  "above-cash-ceiling": "WithdrawalCash",
  "below-withdrawal-band": "WithdrawalEquity",
} as const satisfies Partial<Record<DecisionEvent["reason"], RigClip>>;
/**
 * Camera presets (Issue #11). The panel shot is the founder's view of all three investors; each
 * investor shot is a medium close-up from just above eye level, so the face, hands and desk read.
 * DECISION: investor cameras stay on their seat's axis (x = seat), so selection, picking and the
 * existing camera tests keep their meaning; composition changes come from height, distance and aim.
 */
export const cameraPresets = {
  panel: { position: [0,3.1,9.2], target: [0,1.45,.1] },
  maya: { position: [-2.5,2.3,4.4], target: [-2.5,1.8,0] },
  adrian: { position: [0,2.3,4.4], target: [0,1.8,0] },
  sofia: { position: [2.5,2.3,4.4], target: [2.5,1.8,0] },
} as const;

/** Vertical field of view used on landscape screens, in degrees. */
export const BASE_FOV = 43;
/** Widest field of view any preset may use, to avoid fish-eye distortion on very tall screens. */
export const MAX_FOV = 74;
/**
 * Half-width (metres) each shot must always keep in frame, around its target: the whole panel for
 * the panel shot, one investor with their arms for an investor shot.
 */
export const FRAME_HALF_WIDTH = { panel: 3.1, investor: .62 } as const;

/**
 * Field of view for a preset at a canvas aspect ratio (width / height).
 * DECISION: on narrow, portrait canvases the camera widens its view instead of moving, so the panel
 * shot keeps all three investors in frame without walking the camera off the end of the room.
 */
export function cameraFov(view: CameraView, aspect: number) {
  const preset = cameraPresets[view];
  const distance = Math.hypot(preset.position[0] - preset.target[0], preset.position[1] - preset.target[1], preset.position[2] - preset.target[2]);
  const halfWidth = view === "panel" ? FRAME_HALF_WIDTH.panel : FRAME_HALF_WIDTH.investor;
  const safeAspect = Math.max(aspect, .2);
  const needed = 2 * Math.atan(halfWidth / distance / safeAspect) * 180 / Math.PI;
  return Math.min(MAX_FOV, Math.max(BASE_FOV, needed));
}
export function cameraStep(deltaSeconds: number, reducedMotion: boolean) {
  return reducedMotion ? 1 : 1-Math.exp(-Math.min(Math.max(deltaSeconds,0),.05)*7);
}

/**
 * Camera ease for one rendered frame. A slow frame is split into cameraStep-sized slices, so a
 * device rendering at 5 fps moves the camera in the same wall-clock time as one at 60 fps instead of
 * in slow motion. Frames longer than a quarter second (a stall or a background tab) still count as a
 * quarter second, so the camera never jumps.
 */
export function cameraEase(deltaSeconds: number, reducedMotion: boolean) {
  if (reducedMotion) return 1;
  const elapsed = Math.min(Math.max(deltaSeconds, 0), .25);
  const slices = Math.max(1, Math.ceil(elapsed / .05));
  return 1 - (1 - cameraStep(elapsed / slices, false)) ** slices;
}
/**
 * The pose an investor shows, derived only from the committed session (never from drafts, cameras
 * or selection), so presentation can never commit or imply a financial outcome.
 * During the question round the investor whose question is open is Explaining (Issue #9).
 */
export function sceneCue(session: NegotiationSession | null, investor: InvestorId): { pose: Pose; clip: RigClip; key: string } {
  if (!session) return {pose:"Listening",clip:"Listening",key:"idle"};
  if (session.stage === "questions") {
    const asking = INVESTOR_ORDER[session.answers.length] === investor;
    const pose = asking ? "Explaining" : "Listening";
    return {pose, clip: pose, key: session.id+":q"+session.answers.length+":"+investor+":"+pose};
  }
  const event = session.history.findLast((item): item is DecisionEvent =>
    (item.kind==="opening" || item.kind==="counter") && item.investor===investor);
  const outcome = session.outcome;
  const closedWith = outcome?.kind==="accepted-deal" && session.offers.find(offer => offer.id===outcome.offerId)?.investor===investor;
  const pose: Pose = closedWith ? "Agreeing" : !event ? "Listening" : REACTIONS[event.reason];
  const clip: RigClip = pose === "Withdrawal" && event ? WITHDRAWAL_CLIPS[event.reason as keyof typeof WITHDRAWAL_CLIPS] ?? pose : pose;
  return {pose,clip,key:session.id+":"+ (event?.revision ?? 0)+":"+investor+":"+pose};
}
export function financialPreview(amount: string, equity: string, founderBeforeBps: number) {
  const data = new FormData(); data.set("amount",amount); data.set("equity",equity);
  const terms=readTerms(data);
  if(typeof terms==="string") return {error:terms};
  const value=valuations(terms), cap=ownershipAfterInvestment(founderBeforeBps,terms.equity);
  if(!value || !cap) return {error:"These terms cannot be previewed."};
  return {terms,value,cap};
}
export const demonstrationPitch: NegotiationPitch = {
 startup:"LunchLoop", pitch:"LunchLoop connects campus kitchens with students who want affordable lunches, using advance orders to reduce waste.",
 currency:"EUR", amount:10000000,equity:2000,founderOwnershipBps:8000,
};
export const demonstrationAnswers = [
 "Revenue: €9,000. Runway: 8 months. Use of funds: campus kitchen onboarding and customer acquisition.",
 "Target segment: university students buying lunch. Acquisition channel: campus ambassadors. CAC: €12.",
 "Customer evidence: students requested repeat weekly lunch orders. Milestone: deliver 500 lunches across three campuses.",
];
export const demoScenarios = [
 {id:"meal-orders",title:"LunchLoop · campus meal orders",description:"Fictional meal-ordering prototype, with a €100,000 ask for 20% and 80% founder ownership.",pitch:demonstrationPitch,answers:demonstrationAnswers},
 {id:"reusable-containers",title:"LunchLoop · reusable containers",description:"Fictional reusable-container episode, with a €100,000 ask for 10% and 60% founder ownership.",
  pitch:{startup:"LunchLoop",pitch:"LunchLoop supplies reusable lunch containers to campus cafes. Students borrow a box with their meal and return it to any partner cafe. We collect, wash and redistribute the containers. Cafes pay a service fee to reduce disposable packaging.",currency:"EUR",amount:10000000,equity:1000,founderOwnershipBps:6000},
  answers:["Revenue: 9000 per month; Monthly costs: 12000; Cash balance: 24000; Runway: 8 months; Use of funds: washing equipment, reusable containers and partner cafe launches.",
   "Target segment: university campus cafes; Acquisition channel: campus partnerships and cafe demonstrations; CAC: 300 per cafe.",
   "Customer evidence: five pilot cafes renewed after students requested more return points; Milestone: add two return stations and sign five more cafes within three months."]},
] as const;

/**
 * Who the camera should frame for the latest committed moment (Issue #19). The key changes only when a
 * new moment is committed, so the studio moves the camera once per moment and the founder can
 * interrupt it at any time by choosing another view.
 * DECISION (approved): follow every new speaker; a manual choice holds until the next moment.
 * Openings are simultaneous, so they frame the whole panel; so do outcomes without a deal.
 */
export function activeSpeaker(session: NegotiationSession | null): { view: CameraView; key: string } {
  if (!session) return { view: "panel", key: "idle" };
  if (session.stage === "questions") {
    const asking = INVESTOR_ORDER[session.answers.length];
    return { view: asking, key: `${session.id}:q${session.answers.length}` };
  }
  const outcome = session.outcome;
  if (outcome) {
    const investor = outcome.kind === "accepted-deal" ? session.offers.find(offer => offer.id === outcome.offerId)?.investor : undefined;
    return { view: investor ?? "panel", key: `${session.id}:end:${session.revision}` };
  }
  const last = session.history.findLast(event => event.kind === "counter" || event.kind === "opening");
  if (last?.kind === "counter") return { view: last.investor, key: `${session.id}:c:${last.revision}` };
  return { view: "panel", key: `${session.id}:open` };
}
