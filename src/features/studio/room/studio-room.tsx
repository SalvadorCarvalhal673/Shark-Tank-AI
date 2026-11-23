"use client";

// Rooftop VC Boardroom (Issue #1). Presentation only: this component reads nothing from the
// negotiation session and dispatches nothing, so it cannot affect financial outcomes.
import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import {
  DoubleSide, Fog, MeshBasicMaterial, MeshLambertMaterial, MeshStandardMaterial, type Material,
} from "three";
import { buildStudioRoom, createSkyGeometry, ROOM_MATERIALS, type RoomMaterial } from "./geometry.ts";
import { PALETTE } from "./layout.ts";
import { LIGHTING_TIERS, STUDIO_EXPOSURE } from "../lighting.ts";
import { createStudioTextures, type StudioTextures } from "./textures.ts";

/**
 * DECISION: matte surfaces use Lambert shading and only metal and stone use physically based
 * shading. Lambert is several times cheaper per pixel, which matters because the room now covers
 * the whole frame: CI and the browser suites render on a CPU software renderer, and phones are
 * fill-rate bound. There is no environment map: generating one stalled the first frame on software
 * renderers long enough to delay the safe fallback, so brass reads through the lights instead.
 */
function createMaterials(t: StudioTextures): Record<RoomMaterial, Material> {
  const matte = (options: ConstructorParameters<typeof MeshLambertMaterial>[0]) => new MeshLambertMaterial(options);
  return {
    floor: matte({ map: t.floor }),
    rug: matte({ map: t.rug }),
    ceiling: matte({ color: PALETTE.ceiling }),
    oak: matte({ color: PALETTE.oak }),
    walnut: matte({ map: t.walnut, side: DoubleSide }),
    walnutDark: matte({ color: PALETTE.walnutDark }),
    concrete: matte({ map: t.concrete }),
    stone: new MeshStandardMaterial({ color: PALETTE.stone, roughness: .3 }),
    leather: matte({ color: PALETTE.leather }),
    brass: new MeshStandardMaterial({ color: PALETTE.brass, metalness: .55, roughness: .32, emissive: PALETTE.brass, emissiveIntensity: .08 }),
    steel: new MeshStandardMaterial({ color: PALETTE.blackSteel, metalness: .5, roughness: .45 }),
    glass: new MeshBasicMaterial({ color: PALETTE.glass, transparent: true, opacity: .1, depthWrite: false }),
    glow: new MeshBasicMaterial({ color: "#ffd9a0" }),
    plant: matte({ color: PALETTE.plant, side: DoubleSide }),
    dark: matte({ color: PALETTE.pot }),
    paper: matte({ color: "#f1ece3" }),
    books: matte({ vertexColors: true }),
    skyline: new MeshBasicMaterial({ vertexColors: true }),
    contact: new MeshBasicMaterial({ map: t.contact, transparent: true, depthWrite: false, toneMapped: false }),
    founderMark: matte({ color: "#2a2f2e" }),
    art: matte({ map: t.art }),
    reeded: matte({ map: t.reeded }),
  };
}

/**
 * Opaque draw order: near furniture first, then large surfaces, then the city and sky, so the
 * depth test discards hidden background pixels before they are shaded. Transparent layers last.
 */
const RENDER_ORDER: Partial<Record<RoomMaterial, number>> = {
  floor: 1, rug: 1, ceiling: 2, oak: 2, concrete: 2, walnutDark: 2, skyline: 3, contact: 10, glass: 11,
};

export function StudioRoom() {
  const size = useThree(state => state.size);
  const getState = useThree(state => state.get);
  const compact = size.width < 760;
  const room = useMemo(() => buildStudioRoom(), []);
  const textures = useMemo(() => createStudioTextures(compact), [compact]);
  const materials = useMemo(() => createMaterials(textures), [textures]);
  const sky = useMemo(() => ({ geometry: createSkyGeometry(), material: new MeshBasicMaterial({ vertexColors: true, fog: false }) }), []);

  useEffect(() => () => room.dispose(), [room]);
  useEffect(() => () => {
    Object.values(materials).forEach(material => material.dispose());
    textures.dispose();
  }, [materials, textures]);
  useEffect(() => () => { sky.geometry.dispose(); sky.material.dispose(); }, [sky]);

  // Warm distance haze and brighter exposure, restored on unmount so the simplified fallback and
  // other canvases are unaffected.
  useEffect(() => {
    const { gl: renderer, scene } = getState();
    const previous = { fog: scene.fog, exposure: renderer.toneMappingExposure };
    scene.fog = new Fog(PALETTE.fog, 17, 42);
    renderer.toneMappingExposure = STUDIO_EXPOSURE;
    return () => {
      scene.fog = previous.fog;
      renderer.toneMappingExposure = previous.exposure;
    };
  }, [getState]);

  return <group name="studio-room">
    {ROOM_MATERIALS.map(key => {
      const geometry = room.parts.get(key);
      return geometry && <mesh key={key} name={`room-${key}`} geometry={geometry} material={materials[key]}
        renderOrder={RENDER_ORDER[key] ?? 0} raycast={() => null}/>;
    })}
    <mesh position={[0, 8, -27]} geometry={sky.geometry} material={sky.material} renderOrder={4} raycast={() => null}/>
    {/* Three-point cinematic rig from lighting.ts (Issue #4). No light casts shadow maps; see the
        contact shadows in geometry.ts. */}
    {LIGHTING_TIERS[compact ? "compact" : "wide"].map(light => light.kind === "hemisphere"
      ? <hemisphereLight key={light.role} args={[light.sky, light.ground, light.intensity]}/>
      : <directionalLight key={light.role} name={`light-${light.role}`} position={light.position} color={light.color} intensity={light.intensity}/>)}
  </group>;
}
