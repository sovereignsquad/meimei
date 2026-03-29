#!/usr/bin/env node
/**
 * MM-KERNEL-604 — assemble functions/registry.v1.json from:
 *   - functions/registry.shell.v1.json (metadata)
 *   - functions/registry.fragments.v1.json (contract fields + __static full rows)
 *   - config/registry-functions-order.v1.json
 *   - meimei.app.json on disk (apps/*, packages/*) for non-static rows
 *
 * Usage:
 *   node scripts/meimei-kernel-registry-generate.mjs           # write registry.v1.json
 *   node scripts/meimei-kernel-registry-generate.mjs --check   # exit 1 if output would differ
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const shellPath = path.join(repoRoot, "functions", "registry.shell.v1.json");
const fragmentsPath = path.join(repoRoot, "functions", "registry.fragments.v1.json");
const orderPath = path.join(repoRoot, "config", "registry-functions-order.v1.json");
const outPath = path.join(repoRoot, "functions", "registry.v1.json");

const FN_KEY_ORDER = [
  "id",
  "version",
  "category",
  "displayName",
  "description",
  "catalogOrder",
  "route",
  "api",
  "input",
  "output",
  "safety",
  "capabilities",
  "failureModel"
];

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function findManifestPath(id) {
  for (const rel of ["apps", "packages"]) {
    const p = path.join(repoRoot, rel, id, "meimei.app.json");
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function orderFunctionFields(fn) {
  const out = {};
  for (const k of FN_KEY_ORDER) {
    if (Object.prototype.hasOwnProperty.call(fn, k)) out[k] = fn[k];
  }
  for (const k of Object.keys(fn)) {
    if (!Object.prototype.hasOwnProperty.call(out, k)) out[k] = fn[k];
  }
  return out;
}

function layerFromManifest(manifest) {
  const r = manifest.routes || {};
  const issueId = typeof r.dashboardIssueId === "number" ? r.dashboardIssueId : null;
  const slug = typeof r.slug === "string" ? r.slug : null;
  if (!issueId || !slug) {
    fail(
      `registry generate: manifest "${manifest.name}" needs routes.dashboardIssueId and routes.slug`
    );
  }
  const pathSuffix = manifest.api?.pathSuffix;
  if (!pathSuffix || typeof pathSuffix !== "string") {
    fail(`registry generate: manifest "${manifest.name}" needs api.pathSuffix`);
  }
  return {
    id: manifest.name,
    version: "v1",
    displayName: manifest.displayName,
    description: String(manifest.description || "").slice(0, 480),
    route: `/dashboard/${issueId}/${slug}`,
    api: { method: "POST", path: `/dashboard/api/functions/${pathSuffix}` }
  };
}

function mergeFragmentAndManifest(frag, manifest) {
  const overrides = {
    description: frag.description,
    displayName: frag.displayName,
    route: frag.route,
    api: frag.api
  };
  const base = { ...frag };
  delete base.description;
  delete base.displayName;
  delete base.route;
  delete base.api;
  delete base.__static;

  const layer = layerFromManifest(manifest);
  const out = { ...base, ...layer };
  if (overrides.description !== undefined) {
    out.description = String(overrides.description).slice(0, 480);
  }
  if (overrides.displayName !== undefined) out.displayName = overrides.displayName;
  if (overrides.route !== undefined) out.route = overrides.route;
  if (overrides.api !== undefined) out.api = overrides.api;
  return orderFunctionFields(out);
}

function emitStatic(frag) {
  const { __static: _s, ...rest } = frag;
  return orderFunctionFields(rest);
}

function stableStringify(obj) {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(stableStringify).join(",")}]`;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}

function buildRegistry() {
  const shell = readJson(shellPath);
  const { fragments } = readJson(fragmentsPath);
  const orderDoc = readJson(orderPath);
  if (orderDoc.version !== 1 || !Array.isArray(orderDoc.functionIds)) {
    fail("registry-functions-order.v1.json: version 1 and functionIds[] required");
  }

  const functions = [];
  for (const id of orderDoc.functionIds) {
    const frag = fragments[id];
    if (!frag || typeof frag !== "object") {
      fail(`registry.fragments.v1.json: missing fragments["${id}"]`);
    }
    if (frag.__static) {
      if (frag.id !== id) {
        fail(`static fragment "${id}" id mismatch (got "${frag.id}")`);
      }
      functions.push(emitStatic(frag));
      continue;
    }
    const mfPath = findManifestPath(id);
    if (!mfPath) {
      fail(`registry generate: no meimei.app.json on disk for manifest-backed id "${id}"`);
    }
    const manifest = readJson(mfPath);
    if (manifest.name !== id) {
      fail(`${mfPath}: manifest.name "${manifest.name}" must equal "${id}"`);
    }
    functions.push(mergeFragmentAndManifest(frag, manifest));
  }

  return {
    version: shell.version,
    generatedAt: shell.generatedAt,
    platformAlignment: shell.platformAlignment,
    functions
  };
}

const check = process.argv.includes("--check");
const built = buildRegistry();
const serialized = `${JSON.stringify(built, null, 2)}\n`;

if (check) {
  const existing = fs.readFileSync(outPath, "utf8");
  if (stableStringify(JSON.parse(existing)) !== stableStringify(JSON.parse(serialized))) {
    console.error(
      "FAIL: functions/registry.v1.json is out of date — run: node scripts/meimei-kernel-registry-generate.mjs"
    );
    process.exit(1);
  }
  console.log("PASS: registry.v1.json matches shell + fragments + manifests");
} else {
  fs.writeFileSync(outPath, serialized, "utf8");
  console.log(`Wrote ${path.relative(repoRoot, outPath)} (${built.functions.length} functions)`);
}
