import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { CAST_URL } from "../src/features/studio/rig.ts";

// Issue #13: every production asset has a recorded creator, source, licence, version, modifications
// and redistribution rights; files on disk must match the record byte for byte, and 3D studio assets
// that cannot be verified are rejected.

type Asset = {
  id: string; workstream: string; files: { path: string; bytes: number; sha256: string }[]; sourceFiles?: string[];
  package?: string; creator: string; source: string; license: string; version: string; modifications: string;
  redistribution: string; notices: string[]; status: "verified" | "unverified"; evidence?: string; openFinding?: string;
};
const manifest = JSON.parse(readFileSync("docs/design/asset-manifest.json", "utf8")) as { schema: number; assets: Asset[] };
const listed = new Map(manifest.assets.flatMap(asset => asset.files.map(file => [file.path, file] as const)));
const walk = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});
const sha256 = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");

test("every production asset file in the repository is recorded", () => {
  const assets = [
    ...walk("public"),
    ...walk("src").filter(path => /\.(ttf|otf|woff2?|png|jpe?g|webp|gif|svg|ico|glb|gltf|bin|hdr|ktx2|mp3|wav|mp4)$/i.test(path)),
  ];
  for (const path of assets) assert.ok(listed.has(path), `${path} has no provenance record`);
  assert.ok(listed.has("public" + CAST_URL), "the cast file is recorded");
});

test("recorded files exist and match their recorded size and SHA-256", () => {
  for (const [path, file] of listed) {
    assert.ok(existsSync(path), `${path} is recorded but missing`);
    assert.equal(statSync(path).size, file.bytes, `${path} size changed: update the manifest`);
    assert.equal(sha256(path), file.sha256, `${path} content changed: update the manifest`);
  }
});

test("every record states creator, source, licence, version, modifications and redistribution", () => {
  assert.equal(manifest.schema, 1);
  assert.equal(new Set(manifest.assets.map(asset => asset.id)).size, manifest.assets.length, "ids are unique");
  for (const asset of manifest.assets) {
    for (const field of ["creator", "source", "license", "version", "modifications", "redistribution"] as const)
      assert.ok(asset[field]?.trim(), `${asset.id} records ${field}`);
    for (const notice of asset.notices) assert.ok(existsSync(notice), `${asset.id} notice ${notice} exists`);
    for (const source of asset.sourceFiles ?? []) assert.ok(existsSync(source), `${asset.id} source ${source} exists`);
    if (asset.status === "verified") assert.ok(asset.evidence?.trim(), `${asset.id} says how it was verified`);
    else assert.ok(asset.openFinding?.trim(), `${asset.id} is unverified and must carry an open finding`);
  }
});

test("unverifiable 3D studio assets are rejected", () => {
  for (const asset of manifest.assets.filter(entry => entry.workstream === "3d"))
    assert.equal(asset.status, "verified", `${asset.id}: 3D assets must be verified before they are merged`);
});

test("runtime 3D libraries match the installed version and declared licence", () => {
  for (const asset of manifest.assets.filter(entry => entry.package)) {
    const installed = JSON.parse(readFileSync(join("node_modules", asset.package!, "package.json"), "utf8"));
    assert.equal(asset.version, installed.version, `${asset.package} version`);
    assert.equal(asset.license, installed.license, `${asset.package} licence`);
  }
});

test("the cast file is self-contained and the studio loads nothing from remote hosts", () => {
  const glb = readFileSync("public" + CAST_URL);
  const json = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString("utf8"));
  assert.ok(!(json.buffers ?? []).some((buffer: { uri?: string }) => buffer.uri), "no external buffers");
  assert.equal((json.images ?? []).length, 0, "no embedded or external images");
  assert.deepEqual(json.extensionsRequired ?? [], [], "no decoder extensions required");
  for (const path of walk("src/features/studio"))
    assert.ok(!/https?:\/\//.test(readFileSync(path, "utf8")), `${path} references a remote URL`);
});
