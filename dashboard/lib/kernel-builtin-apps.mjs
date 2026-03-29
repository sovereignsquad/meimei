/**
 * In-repo apps: each package may ship meimei.app.json under apps/<name>/ (dynamic load, MM-KERNEL-603).
 * External registry (`data/kernel/apps/registry.json`) is consulted by default; set **`MEIMEI_KERNEL_EXTERNAL_APPS=0`** to skip it.
 *
 * @see docs/planning/kernel-app-separation-and-https-program.v1.md
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { assertValidManifest, sha256Json } from "./kernel-app-registry.mjs";
import { exportNameForApiPathSuffix } from "./kernel-app-api-match.mjs";

/** @type {{ root: string, apps: object[] } | null} */
let cache = null;

/**
 * Deterministic UUID-shaped id from manifest name (policy / auth key).
 * @param {string} manifestName
 */
export function builtinStableAppId(manifestName) {
  const h = createHash("sha256").update(`meimei.kernel.builtin.v1:${manifestName}`).digest();
  const hex = h.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(12, 15)}-a${hex.slice(15, 18)}-${hex.slice(18, 32)}`;
}

/**
 * @param {string} repoRoot
 * @returns {object[]}
 */
export function listBuiltinKernelApps(repoRoot) {
  const root = path.resolve(repoRoot);
  if (cache && cache.root === root) return cache.apps;

  const appsDir = path.join(root, "apps");
  const out = [];
  if (!fs.existsSync(appsDir)) {
    cache = { root, apps: out };
    return out;
  }

  for (const name of fs.readdirSync(appsDir, { withFileTypes: true })) {
    if (!name.isDirectory()) continue;
    const install_path = path.join(appsDir, name.name);
    const mfPath = path.join(install_path, "meimei.app.json");
    if (!fs.existsSync(mfPath)) continue;
    let manifest;
    try {
      manifest = JSON.parse(fs.readFileSync(mfPath, "utf8"));
    } catch {
      continue;
    }
    try {
      assertValidManifest(root, manifest);
    } catch {
      continue;
    }
    const manifest_sha256 = sha256Json(manifest);
    const app_id = builtinStableAppId(manifest.name);
    out.push({
      app_id,
      install_path,
      manifest,
      manifest_sha256,
      enabled: true,
      registered_at_ms: 0,
      updated_at_ms: 0,
      builtin: true
    });
  }

  cache = { root, apps: out };
  return out;
}

export function clearBuiltinKernelAppsCache() {
  cache = null;
}

/**
 * @param {string} repoRoot
 * @param {string} pathSuffix after /api/functions/
 * @returns {{ match: object, exportName: string } | null}
 */
export function resolveBuiltinPostMatch(repoRoot, pathSuffix) {
  for (const match of listBuiltinKernelApps(repoRoot)) {
    const exportName = exportNameForApiPathSuffix(match.manifest, pathSuffix);
    if (exportName) return { match, exportName };
  }
  return null;
}
