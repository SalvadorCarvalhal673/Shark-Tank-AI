import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { LIGHT_BUDGET, LIGHTING_TIERS, type LightSpec } from "../src/features/studio/lighting.ts";
import { cameraPresets } from "../src/features/studio/model.ts";
import { SEATED_BODY } from "../src/features/studio/room/layout.ts";

// Issue #4: a three-point rig that lights faces from the camera side, separates heads from the
// window, stays within a per-tier light budget and uses no post-processing or shadow maps.

const role = (tier: readonly LightSpec[], name: LightSpec["role"]) => tier.find(light => light.role === name);

test("every tier keeps a key, fill and rim within its light budget", () => {
  for (const [name, tier] of Object.entries(LIGHTING_TIERS) as [keyof typeof LIGHTING_TIERS, readonly LightSpec[]][]) {
    assert.ok(tier.length <= LIGHT_BUDGET[name], `${name} uses ${tier.length} lights`);
    for (const needed of ["key", "fill", "rim"] as const) assert.ok(role(tier, needed), `${name} has a ${needed} light`);
  }
  for (const light of LIGHTING_TIERS.compact) assert.ok((LIGHTING_TIERS.wide as readonly LightSpec[]).includes(light), "narrow screens only drop lights");
});

test("the key lights faces from the camera side and the rim comes from behind the investors", () => {
  const key = role(LIGHTING_TIERS.wide, "key"), rim = role(LIGHTING_TIERS.wide, "rim"), fill = role(LIGHTING_TIERS.wide, "fill");
  assert.ok(key?.kind === "directional" && rim?.kind === "directional" && fill?.kind === "hemisphere");
  assert.ok(key.position[2] > 0 && key.position[1] > SEATED_BODY.headLowest, "key is in front of and above the heads");
  assert.ok(rim.position[2] < 0, "rim is behind the investors, on the window side");
  for (const preset of Object.values(cameraPresets)) assert.ok(preset.position[2] > 0, "every camera looks from the key side");
  assert.ok(key.intensity > fill.intensity, "key dominates fill so faces keep shape");
});

test("the studio uses no shadow maps or post-processing passes", () => {
  const dir = new URL("../src/features/studio/", import.meta.url);
  const files = readdirSync(dir, { recursive: true }).map(String).filter(name => /\.tsx?$/.test(name));
  for (const name of files) {
    const source = readFileSync(new URL(name, dir), "utf8");
    assert.ok(!/castShadow\s*=?\s*\{?\s*true|shadows\s*=\s*\{?true|EffectComposer|postprocessing/.test(source), `${name} adds shadows or post-processing`);
  }
});
