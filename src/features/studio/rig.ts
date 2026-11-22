// Shared character rig contract (Issue #8). Pure data used by the GLB generator, the runtime
// (avatar.ts / scene.tsx) and the tests, so all three agree on one skeleton, one clip set and one
// way of telling which meshes belong to which investor.
import type { InvestorId } from "../simulation/negotiation/investor-policy.ts";

/** One local file holds the whole cast. The name is kept from Phase 4A so existing fault tests apply. */
export const CAST_URL = "/studio/investor-v1.glb";

/**
 * The single seated skeleton every investor uses: bone name, parent and rest offset from the parent
 * (metres). Bone names are the animation binding keys, so they must never be renamed per character.
 */
export const RIG_BONES = [
  { name: "Pelvis", parent: null, position: [0, .78, 0] },
  { name: "Chest", parent: "Pelvis", position: [0, .58, 0] },
  { name: "Head", parent: "Chest", position: [0, .49, 0] },
  { name: "LeftArm", parent: "Chest", position: [-.34, .2, 0] },
  { name: "LeftForearm", parent: "LeftArm", position: [-.03, -.31, .07] },
  { name: "RightArm", parent: "Chest", position: [.34, .2, 0] },
  { name: "RightForearm", parent: "RightArm", position: [.03, -.31, .07] },
  { name: "LeftThigh", parent: "Pelvis", position: [-.16, -.04, .05] },
  { name: "LeftShin", parent: "LeftThigh", position: [0, -.04, .49] },
  { name: "RightThigh", parent: "Pelvis", position: [.16, -.04, .05] },
  { name: "RightShin", parent: "RightThigh", position: [0, -.04, .49] },
] as const satisfies readonly { name: string; parent: string | null; position: readonly [number, number, number] }[];
export type RigBone = typeof RIG_BONES[number]["name"];

/**
 * Clip names shared by the whole cast. Every clip is authored once against RIG_BONES and works on
 * every investor; a clip may only animate bone rotations, never positions or scale, so seated
 * proportions and the chair fit stay valid in every frame.
 */
export const RIG_CLIPS = ["Listening", "Offering", "Withdrawal"] as const;
export type RigClip = typeof RIG_CLIPS[number];

/** Mesh names inside the cast file. The body is shared; each investor adds their own features. */
export const CAST_BODY = "Cast_Body";
export const castMeshName = (investor: InvestorId) => `Cast_${investor}`;

/** Material slot names. Per-investor colours are applied to these at runtime (avatar.ts). */
export const RIG_MATERIALS = ["Skin", "Jacket", "Trousers", "Hair", "Brass", "Shirt", "Eyes"] as const;
export type RigMaterial = typeof RIG_MATERIALS[number];

/** True for any object that belongs to another investor's features and must be removed from this instance. */
export function belongsToOtherInvestor(name: string, investor: InvestorId) {
  return name.startsWith("Cast_") && !name.startsWith(CAST_BODY) && !name.startsWith(castMeshName(investor));
}
