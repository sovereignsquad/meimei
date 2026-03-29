#!/usr/bin/env node
/**
 * MM-KERNEL-604 — align functions/registry.v1.json with each apps/<pkg>/ or packages/<pkg>/ meimei.app.json on disk.
 * See config/kernel-registry-drift-allowlists.v1.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const registryPath = path.join(repoRoot, "functions", "registry.v1.json");
const allowPath = path.join(repoRoot, "config", "kernel-registry-drift-allowlists.v1.json");

function fail(msg) {
  console.error("FAIL: " + msg);
  process.exit(1);
}

function ok(msg) {
  console.log("PASS: " + msg);
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

/**
 * @returns {Map<string, string>} pkg name -> absolute path to meimei.app.json
 */
function diskManifestPathsByPkg() {
  /** @type {Map<string, string>} */
  const byPkg = new Map();
  for (const rootLabel of ["apps", "packages"]) {
    const base = path.join(repoRoot, rootLabel);
    if (!fs.existsSync(base)) continue;
    for (const ent of fs.readdirSync(base, { withFileTypes: true })) {
      if (!ent.isDirectory()) continue;
      const pkg = ent.name;
      const mf = path.join(base, pkg, "meimei.app.json");
      if (!fs.existsSync(mf)) continue;
      if (byPkg.has(pkg)) {
        fail(
          `duplicate meimei.app.json for "${pkg}" under both apps/${pkg} and packages/${pkg} — keep exactly one`
        );
      }
      byPkg.set(pkg, mf);
    }
  }
  return byPkg;
}

function relManifestPath(absMf) {
  return path.relative(repoRoot, absMf).split(path.sep).join("/");
}

const allowRaw = readJson(allowPath);
if (allowRaw.version !== 1) {
  fail(path.relative(repoRoot, allowPath) + ": version must be 1");
}

const registryAppsNoDisk = new Set(allowRaw.registryAppsWithoutDiskManifest || []);
const toolsKernel = new Set(allowRaw.registryToolsImplementedInKernel || []);
const diskDeferred = new Set(allowRaw.diskMiniappsDeferredFromRegistry || []);

const registry = readJson(registryPath);
const functions = Array.isArray(registry.functions)
  ? registry.functions
  : fail("registry.functions must be an array");
const registryIds = new Set(functions.map((f) => f.id));

const diskByPkg = diskManifestPathsByPkg();
const diskPkgs = [...diskByPkg.keys()].sort();

for (const pkg of diskPkgs) {
  const mf = diskByPkg.get(pkg);
  if (!mf) continue;
  let manifest;
  try {
    manifest = readJson(mf);
  } catch (e) {
    fail(relManifestPath(mf) + ": " + (e instanceof Error ? e.message : String(e)));
  }
  const mname = manifest?.name;
  if (typeof mname !== "string" || mname !== pkg) {
    fail(
      relManifestPath(mf) +
        ': manifest.name "' +
        mname +
        '" must equal directory name "' +
        pkg +
        '"'
    );
  }
  if (diskDeferred.has(pkg)) {
    fail(pkg + " is listed in diskMiniappsDeferredFromRegistry but a manifest exists on disk — remove from allowlist");
  }
  if (!registryIds.has(pkg)) {
    fail(
      relManifestPath(mf) +
        ' has no functions/registry.v1.json entry with id "' +
        pkg +
        '" - add contract row or defer in allowlist'
    );
  }
}

for (const fn of functions) {
  const id = fn.id;
  const cat = fn.category || "apps";

  if (cat === "apps") {
    if (registryAppsNoDisk.has(id)) {
      if (diskByPkg.has(id)) {
        fail(
          'registry app "' +
            id +
            '" is allowlisted as without disk but ' +
            relManifestPath(diskByPkg.get(id)) +
            " exists"
        );
      }
      continue;
    }
    if (!diskByPkg.has(id)) {
      fail(
        'registry apps entry "' +
          id +
          '" requires apps/' +
          id +
          "/meimei.app.json or packages/" +
          id +
          "/meimei.app.json (or add to registryAppsWithoutDiskManifest)"
      );
    }
  } else if (cat === "tools") {
    if (toolsKernel.has(id)) {
      continue;
    }
    if (!diskByPkg.has(id)) {
      fail(
        'registry tools entry "' +
          id +
          '" requires apps/' +
          id +
          "/meimei.app.json or packages/" +
          id +
          "/meimei.app.json or registryToolsImplementedInKernel allowlist"
      );
    }
  }

  const mfPath = diskByPkg.get(id);
  if (!mfPath) continue;

  let manifest;
  try {
    manifest = readJson(mfPath);
  } catch {
    continue;
  }
  const suffix = manifest?.api?.pathSuffix;
  if (typeof suffix !== "string" || suffix !== id) {
    fail(
      relManifestPath(mfPath) +
        ': api.pathSuffix must equal registry id "' +
        id +
        '" (got "' +
        suffix +
        '")'
    );
  }
}

ok("kernel registry drift check - registry.v1.json vs apps|packages/*/meimei.app.json");
