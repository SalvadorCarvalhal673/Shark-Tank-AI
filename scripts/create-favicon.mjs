// Original project favicon (Issue #84). Drawn in code, no third-party artwork: a lime fin rising
// above a wave on the app's dark green. Writes a 32×32 and 16×16 32-bit ICO without dependencies.
//   node scripts/create-favicon.mjs
import { writeFileSync } from "node:fs";

const BG = [0x12, 0x1b, 0x16], FIN = [0xd5, 0xf2, 0x7d], WAVE = [0x7f, 0xb0, 0x9a];

/** Coverage of a pixel by the shape, sampled 4×4 for smooth edges. */
function sample(size, x, y, inside) {
  let hits = 0;
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if (inside((x + (i + .5) / 4) / size, (y + (j + .5) / 4) / size)) hits++;
  return hits / 16;
}
const rounded = (u, v) => { // rounded-square tile
  const r = .22, dx = Math.max(Math.abs(u - .5) - (.5 - r), 0), dy = Math.max(Math.abs(v - .5) - (.5 - r), 0);
  return dx * dx + dy * dy <= r * r;
};
const fin = (u, v) => v >= .16 && v <= .66 && u >= .3 && u <= .3 + .42 * Math.sqrt((v - .16) / .5); // curved leading edge
const wave = (u, v) => { const crest = .72 + .05 * Math.sin(u * Math.PI * 4); return v >= crest && v <= crest + .09; };

function image(size) {
  const pixels = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const tile = sample(size, x, y, rounded);
    const f = sample(size, x, y, fin), w = sample(size, x, y, wave);
    const mix = (a, b, t) => a.map((c, k) => Math.round(c * (1 - t) + b[k] * t));
    const color = mix(mix(BG, WAVE, w), FIN, f);
    const row = size - 1 - y, o = (row * size + x) * 4; // BMP rows are bottom-up, BGRA
    pixels[o] = color[2]; pixels[o + 1] = color[1]; pixels[o + 2] = color[0]; pixels[o + 3] = Math.round(255 * tile);
  }
  const header = Buffer.alloc(40);
  header.writeUInt32LE(40, 0); header.writeInt32LE(size, 4); header.writeInt32LE(size * 2, 8);
  header.writeUInt16LE(1, 12); header.writeUInt16LE(32, 14); header.writeUInt32LE(pixels.length, 20);
  const mask = Buffer.alloc(Math.ceil(size / 32) * 4 * size); // AND mask unused with 32-bit alpha
  return Buffer.concat([header, pixels, mask]);
}

const sizes = [32, 16], images = sizes.map(image);
const dir = Buffer.alloc(6 + 16 * sizes.length);
dir.writeUInt16LE(0, 0); dir.writeUInt16LE(1, 2); dir.writeUInt16LE(sizes.length, 4);
let offset = dir.length;
sizes.forEach((size, i) => {
  const e = 6 + 16 * i;
  dir.writeUInt8(size, e); dir.writeUInt8(size, e + 1); dir.writeUInt16LE(1, e + 4); dir.writeUInt16LE(32, e + 6);
  dir.writeUInt32LE(images[i].length, e + 8); dir.writeUInt32LE(offset, e + 12); offset += images[i].length;
});
writeFileSync(new URL("../src/app/favicon.ico", import.meta.url), Buffer.concat([dir, ...images]));
console.log("src/app/favicon.ico", offset, "bytes");
