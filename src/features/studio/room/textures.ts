// Procedural canvas textures painted in code at load time.
// DECISION: no downloaded textures, so there is nothing to license or host and no extra transfer.
// Issue #3 (materials and textures) may replace these with documented, licensed texture files.
import { CanvasTexture, ClampToEdgeWrapping, LinearMipmapNearestFilter, RepeatWrapping, SRGBColorSpace, type Texture } from "three";
import { seededRandom } from "./geometry.ts";
import { PALETTE } from "./layout.ts";

type Painter = (g: CanvasRenderingContext2D, w: number, h: number) => void;

function paint(width: number, height: number, painter: Painter, repeat: [number, number] = [1, 1]): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("2D canvas is unavailable for studio textures");
  painter(context, width, height);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(...repeat);
  // DECISION: one mip level per sample instead of trilinear blending; texture sampling dominates
  // frame time on software renderers, and the visual difference is negligible at these sizes.
  texture.minFilter = LinearMipmapNearestFilter;
  return texture;
}

function grain(g: CanvasRenderingContext2D, random: () => number, y0: number, band: number, w: number, lines: number, tone: string) {
  for (let k = 0; k < lines; k++) {
    g.strokeStyle = `rgba(${tone},${.05 + random() * .09})`;
    g.lineWidth = 1 + random() * 2;
    const y = y0 + random() * band;
    g.beginPath(); g.moveTo(0, y);
    g.bezierCurveTo(w * .3, y + random() * 8 - 4, w * .6, y + random() * 8 - 4, w, y + random() * 4 - 2);
    g.stroke();
  }
}

export type StudioTextures = Record<"floor" | "walnut" | "concrete" | "rug" | "contact" | "art", Texture> & { dispose: () => void };

/** Texture sizes are capped at 1024 px (512 px on narrow screens) to bound GPU memory on phones. */
export function createStudioTextures(compact: boolean): StudioTextures {
  const random = seededRandom(7);
  const big = compact ? 512 : 1024, small = compact ? 256 : 512;
  const floor = paint(big, big, (g, w, h) => {
    const planks = 8;
    for (let i = 0; i < planks; i++) {
      const base = 168 + random() * 26, y = i * h / planks;
      g.fillStyle = `rgb(${base * .62 | 0},${base * .45 | 0},${base * .30 | 0})`;
      g.fillRect(0, y, w, h / planks);
      grain(g, random, y, h / planks, w, 50, "40,22,10");
      g.fillStyle = "rgba(20,10,5,.55)";
      g.fillRect(0, y, w, 2); g.fillRect(random() * w, y, 2, h / planks);
    }
  }, [3, 3]);
  const walnut = paint(small, small, (g, w, h) => {
    g.fillStyle = PALETTE.walnut; g.fillRect(0, 0, w, h);
    grain(g, random, 0, h, w, 120, "25,12,5");
  });
  const concrete = paint(small, small, (g, w, h) => {
    g.fillStyle = PALETTE.concrete; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 6000; i++) {
      const light = random() > .5 ? 255 : 0;
      g.fillStyle = `rgba(${light},${light},${light},${random() * .05})`;
      g.fillRect(random() * w, random() * h, 1 + random() * 3, 1 + random() * 3);
    }
  }, [2, 1]);
  const rug = paint(small, small, (g, w, h) => {
    g.fillStyle = PALETTE.rug; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(201,160,99,.6)"; g.lineWidth = w / 85; g.strokeRect(w * .043, h * .043, w * .914, h * .914);
    g.lineWidth = w / 256; g.strokeRect(w * .078, h * .078, w * .844, h * .844);
  });
  const contact = paint(128, 128, (g, w, h) => {
    const shade = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    shade.addColorStop(0, "rgba(30,20,12,.55)"); shade.addColorStop(1, "rgba(30,20,12,0)");
    g.fillStyle = shade; g.fillRect(0, 0, w, h);
  });
  contact.wrapS = contact.wrapT = ClampToEdgeWrapping;
  const art = paint(small, small * 1.25, (g, w, h) => {
    g.fillStyle = "#efe7da"; g.fillRect(0, 0, w, h);
    [PALETTE.brass, PALETTE.rug, "#a8552f", "#22324c"].forEach((color, i) => {
      g.globalAlpha = .85; g.fillStyle = color;
      g.beginPath(); g.arc(w * (.27 + i * .16), h * (.31 + i * .14), w * (.23 - i * .03), 0, Math.PI * 2); g.fill();
    });
    g.globalAlpha = 1;
  });
  const all = { floor, walnut, concrete, rug, contact, art };
  return { ...all, dispose: () => Object.values(all).forEach(texture => texture.dispose()) };
}
