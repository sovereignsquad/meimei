/**
 * POST dispatch for kernel apps: data/kernel/apps/registry.json (opt-in MEIMEI_KERNEL_EXTERNAL_APPS=1)
 * and in-repo apps (meimei.app.json per package, builtins, always on). Static server routes win if matched earlier.
 *
 * @see docs/planning/kernel-app-separation-and-https-program.v1.md (MM-KERNEL-501, MM-KERNEL-603, MM-KERNEL-301)
 */
import path from "node:path";
import { pathToFileURL } from "node:url";
import { assertKernelAppDispatchAuth } from "./kernel-app-auth.mjs";
import { exportNameForApiPathSuffix } from "./kernel-app-api-match.mjs";
import { resolveBuiltinPostMatch, clearBuiltinKernelAppsCache } from "./kernel-builtin-apps.mjs";
import { clearChecklistHandleApiCache } from "./checklist-app-handler.mjs";
import { clearAiRoutingHandleApiCache } from "./lazy-ai-routing-handler.mjs";
import { listKernelApps } from "./kernel-app-registry.mjs";
import { serverApiPath } from "./miniapp-registry.mjs";

const FUNCTIONS_PREFIX = "/api/functions/";

/** @type {Map<string, { hash: string, fn: Function }>} */
const handlerCache = new Map();

const FUNCTIONS_SUFFIX_RE = /^[a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]*)?$/;

function registryPathOverride() {
  const env = String(process.env.MEIMEI_KERNEL_APP_REGISTRY || "").trim();
  return env || undefined;
}

function externalAppsEnabled() {
  return String(process.env.MEIMEI_KERNEL_EXTERNAL_APPS || "").trim() === "1";
}

/**
 * @param {object} manifest
 * @returns {string|null} normalized server path e.g. /api/functions/my-app
 */
export function normalizedPostPathForExternalManifest(manifest) {
  const suffix = manifest?.api?.pathSuffix;
  if (!suffix || typeof suffix !== "string") return null;
  const full = `/dashboard/api/functions/${suffix}`;
  return serverApiPath(full);
}

/**
 * @param {{ app_id: string, manifest_sha256: string, install_path: string, manifest: object }} match
 * @param {string} exportName
 */
async function getOrLoadHandler(match, exportName) {
  const hash = match.manifest_sha256 || "";
  const cacheKey = `${match.app_id}::${exportName}`;
  const cached = handlerCache.get(cacheKey);
  if (cached && cached.hash === hash) return cached.fn;

  const entry = match.manifest?.entry;
  if (!entry || typeof entry.module !== "string") {
    throw new Error("manifest.entry.module missing");
  }
  const modRel = entry.module.replace(/^\.\//, "");
  const modAbs = path.resolve(match.install_path, modRel);
  const url = pathToFileURL(modAbs).href;
  const mod = await import(url);
  const fn = mod[exportName];
  if (typeof fn !== "function") {
    throw new Error(`module does not export function "${exportName}"`);
  }
  handlerCache.set(cacheKey, { hash, fn });
  return fn;
}

/** For self-tests only — clears dynamic import cache and builtin manifest cache. */
export function clearKernelExternalHandlerCache() {
  handlerCache.clear();
  clearBuiltinKernelAppsCache();
  clearChecklistHandleApiCache();
  clearAiRoutingHandleApiCache();
}

/**
 * @param {string} repoRoot
 * @param {string} normalizedPath
 * @param {import("node:http").IncomingMessage} req
 * @param {(r: import("node:http").IncomingMessage) => Promise<unknown>} readJson
 * @returns {Promise<{ status: number, payload: object } | null>}
 */
export async function tryKernelExternalAppPost(repoRoot, normalizedPath, req, readJson) {
  if (!normalizedPath.startsWith(FUNCTIONS_PREFIX)) return null;

  const suffix = normalizedPath.slice(FUNCTIONS_PREFIX.length);
  if (!suffix || !FUNCTIONS_SUFFIX_RE.test(suffix)) return null;

  const regPath = registryPathOverride();
  let match = null;
  let exportName = "handleApi";
  if (externalAppsEnabled()) {
    const apps = listKernelApps(repoRoot, regPath);
    for (const a of apps) {
      const ex = exportNameForApiPathSuffix(a.manifest, suffix);
      if (ex) {
        match = a;
        exportName = ex;
        break;
      }
    }
  }
  if (!match) {
    const built = resolveBuiltinPostMatch(repoRoot, suffix);
    if (built) {
      match = built.match;
      exportName = built.exportName;
    }
  }
  if (!match) return null;

  const auth = assertKernelAppDispatchAuth(req, match);
  if (!auth.ok) {
    return { status: auth.status, payload: auth.payload };
  }

  const handler = await getOrLoadHandler(match, exportName);
  const body = (await readJson(req)) || {};
  try {
    const result = await handler(req, body, repoRoot);
    const ok = result && typeof result === "object" && result.ok !== false;
    let status = ok ? 200 : 400;
    if (!ok && result && typeof result === "object" && typeof result.httpStatus === "number") {
      status = result.httpStatus;
    }
    return { status, payload: result };
  } catch (e) {
    return {
      status: 500,
      payload: { ok: false, error: e instanceof Error ? e.message : String(e) }
    };
  }
}
