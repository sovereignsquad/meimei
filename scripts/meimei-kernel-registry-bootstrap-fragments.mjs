#!/usr/bin/env node
/**
 * One-shot: build functions/registry.fragments.v1.json from the current registry + disk manifests.
 *   node scripts/meimei-kernel-registry-bootstrap-fragments.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function diskManifestIds(repoRoot) {
  const ids = new Set();
  for (const rel of ["apps", "packages"]) {
    const base = path.join(repoRoot, rel);
    if (!fs.existsSync(base)) continue;
    for (const ent of fs.readdirSync(base, { withFileTypes: true })) {
      if (!ent.isDirectory()) continue;
      const mf = path.join(base, ent.name, "meimei.app.json");
      if (fs.existsSync(mf)) ids.add(ent.name);
    }
  }
  return ids;
}

const reg = JSON.parse(fs.readFileSync(path.join(root, "functions", "registry.v1.json"), "utf8"));
const manifestIds = diskManifestIds(root);
const frags = {};
for (const fn of reg.functions) {
  if (manifestIds.has(fn.id)) {
    const { id: _id, version: _v, displayName: _dn, description: _d, route: _r, api: _a, ...rest } = fn;
    frags[fn.id] = rest;
  } else {
    frags[fn.id] = { __static: true, ...fn };
  }
}
const out = {
  version: 1,
  description:
    "MM-KERNEL-604 — input to meimei-kernel-registry-generate.mjs. Manifest-backed rows omit id, version, displayName, description, route, api (derived from meimei.app.json). __static rows are emitted verbatim (minus __static).",
  fragments: frags
};
fs.writeFileSync(path.join(root, "functions", "registry.fragments.v1.json"), `${JSON.stringify(out, null, 2)}\n`, "utf8");
console.log("Wrote functions/registry.fragments.v1.json");
