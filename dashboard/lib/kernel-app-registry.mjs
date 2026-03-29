/**
 * Persistent registry for externally installed MeiMei apps (kernel / app separation).
 * Storage: data/kernel/apps/registry.json (gitignored — operator-local paths).
 *
 * @see docs/planning/kernel-app-separation-and-https-program.v1.md (MM-KERNEL-202, MM-KERNEL-203)
 */
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createAuditTrail } from "./audit-trail.mjs";
import { loadManifestSchemaSync, validateManifestAgainstSchema } from "./meimei-app-manifest-validate.mjs";

const MANIFEST_FILENAME = "meimei.app.json";

/** @param {string} repoRoot */
export function defaultKernelAppRegistryPath(repoRoot) {
  return path.join(repoRoot, "data", "kernel", "apps", "registry.json");
}

/**
 * @param {object} state
 * @returns {object}
 */
function normalizeState(state) {
  const s = state && typeof state === "object" ? state : {};
  const apps = Array.isArray(s.apps) ? s.apps : [];
  const tombstones = Array.isArray(s.tombstones) ? s.tombstones : [];
  return {
    schemaVersion: 1,
    apps,
    tombstones
  };
}

/**
 * @param {string} repoRoot
 * @param {string} [registryPath]
 */
export function loadKernelAppRegistrySync(repoRoot, registryPath) {
  const file = registryPath || defaultKernelAppRegistryPath(repoRoot);
  if (!fs.existsSync(file)) {
    return normalizeState(null);
  }
  try {
    const raw = fs.readFileSync(file, "utf8");
    const parsed = JSON.parse(raw);
    return normalizeState(parsed);
  } catch {
    throw new Error(`kernel app registry: invalid JSON at ${file}`);
  }
}

/**
 * @param {string} repoRoot
 * @param {object} state
 * @param {string} [registryPath]
 */
export function saveKernelAppRegistrySync(repoRoot, state, registryPath) {
  const file = registryPath || defaultKernelAppRegistryPath(repoRoot);
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });
  const normalized = normalizeState(state);
  fs.writeFileSync(file, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
}

export function sha256Json(obj) {
  return createHash("sha256").update(JSON.stringify(obj)).digest("hex");
}

function resolveInstallPath(installPath) {
  const abs = path.resolve(installPath);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
    throw new Error(`install path is not a directory: ${abs}`);
  }
  return abs;
}

/**
 * @param {string} installPathAbs
 */
export function readMeimeiAppManifestFromDir(installPathAbs) {
  const mf = path.join(installPathAbs, MANIFEST_FILENAME);
  if (!fs.existsSync(mf)) {
    throw new Error(`missing ${MANIFEST_FILENAME} under ${installPathAbs}`);
  }
  try {
    return JSON.parse(fs.readFileSync(mf, "utf8"));
  } catch (e) {
    throw new Error(`invalid ${MANIFEST_FILENAME}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/**
 * @param {string} repoRoot
 * @param {unknown} manifest
 */
export function assertValidManifest(repoRoot, manifest) {
  const schema = loadManifestSchemaSync(repoRoot);
  const errors = validateManifestAgainstSchema(schema, manifest, "$");
  if (errors.length) {
    throw new Error(`invalid app manifest:\n${errors.join("\n")}`);
  }
}

/**
 * @typedef {{ app_id: string, install_path: string, manifest: object, manifest_sha256: string, enabled: boolean, registered_at_ms: number, updated_at_ms: number, auth_secret_sha256?: string, builtin?: boolean }} KernelRegisteredApp
 */

/**
 * @param {string} repoRoot
 * @param {string} installPath
 * @param {{ registryPath?: string, audit?: boolean, deploymentSecret?: string }} [opts]
 * @returns {Promise<{ ok: true, app_id: string, created: boolean }>}
 */
export async function registerKernelApp(repoRoot, installPath, opts = {}) {
  const { registryPath, audit = true, deploymentSecret } = opts;
  const abs = resolveInstallPath(installPath);
  const manifest = readMeimeiAppManifestFromDir(abs);
  assertValidManifest(repoRoot, manifest);

  const state = loadKernelAppRegistrySync(repoRoot, registryPath);
  const now = Date.now();
  const hash = sha256Json(manifest);

  const existingIdx = state.apps.findIndex((a) => a.install_path === abs);
  if (existingIdx >= 0) {
    const prev = state.apps[existingIdx];
    const next = {
      ...prev,
      manifest,
      manifest_sha256: hash,
      updated_at_ms: now
    };
    if (deploymentSecret !== undefined) {
      const s = String(deploymentSecret);
      if (s) {
        next.auth_secret_sha256 = createHash("sha256").update(s, "utf8").digest("hex");
      } else {
        delete next.auth_secret_sha256;
      }
    }
    state.apps[existingIdx] = next;
    saveKernelAppRegistrySync(repoRoot, state, registryPath);
    if (audit) {
      const { appendAuditEvent } = createAuditTrail(repoRoot);
      await appendAuditEvent({
        type: "kernel-app-updated",
        channel: "kernel",
        eventId: prev.app_id,
        outcome: "ok",
        reason: "manifest refreshed",
        details: { install_path: abs, manifest_name: manifest.name }
      });
    }
    return { ok: true, app_id: prev.app_id, created: false };
  }

  const nameTaken = state.apps.some((a) => a.manifest && a.manifest.name === manifest.name);
  if (nameTaken) {
    throw new Error(`manifest name "${manifest.name}" is already registered by another app`);
  }

  const app_id = randomUUID();
  const newApp = {
    app_id,
    install_path: abs,
    manifest,
    manifest_sha256: hash,
    enabled: true,
    registered_at_ms: now,
    updated_at_ms: now
  };
  if (deploymentSecret !== undefined && String(deploymentSecret)) {
    newApp.auth_secret_sha256 = createHash("sha256").update(String(deploymentSecret), "utf8").digest("hex");
  }
  state.apps.push(newApp);
  saveKernelAppRegistrySync(repoRoot, state, registryPath);

  if (audit) {
    const { appendAuditEvent } = createAuditTrail(repoRoot);
    await appendAuditEvent({
      type: "kernel-app-registered",
      channel: "kernel",
      eventId: app_id,
      outcome: "ok",
      reason: "app registered",
      details: { install_path: abs, manifest_name: manifest.name }
    });
  }

  return { ok: true, app_id, created: true };
}

/**
 * @param {string} repoRoot
 * @param {string} [registryPath]
 * @returns {KernelRegisteredApp[]}
 */
export function listKernelApps(repoRoot, registryPath) {
  return loadKernelAppRegistrySync(repoRoot, registryPath).apps;
}

/**
 * @param {string} repoRoot
 * @param {string} appId
 * @param {boolean} enabled
 * @param {{ registryPath?: string }} [opts]
 */
export function setKernelAppEnabled(repoRoot, appId, enabled, opts = {}) {
  const { registryPath } = opts;
  const state = loadKernelAppRegistrySync(repoRoot, registryPath);
  const app = state.apps.find((a) => a.app_id === appId);
  if (!app) throw new Error(`unknown app_id: ${appId}`);
  app.enabled = !!enabled;
  app.updated_at_ms = Date.now();
  saveKernelAppRegistrySync(repoRoot, state, registryPath);
}

/**
 * @param {string} repoRoot
 * @param {string} appId
 * @param {{ registryPath?: string, reason?: string, audit?: boolean }} [opts]
 * @returns {Promise<void>}
 */
export async function removeKernelApp(repoRoot, appId, opts = {}) {
  const { registryPath, reason = "removed", audit = true } = opts;
  const state = loadKernelAppRegistrySync(repoRoot, registryPath);
  const idx = state.apps.findIndex((a) => a.app_id === appId);
  if (idx < 0) throw new Error(`unknown app_id: ${appId}`);
  const [removed] = state.apps.splice(idx, 1);
  state.tombstones.push({
    app_id: removed.app_id,
    retired_at_ms: Date.now(),
    install_path: removed.install_path,
    manifest_name: removed.manifest?.name ?? "",
    reason: String(reason)
  });
  saveKernelAppRegistrySync(repoRoot, state, registryPath);

  if (audit) {
    const { appendAuditEvent } = createAuditTrail(repoRoot);
    await appendAuditEvent({
      type: "kernel-app-removed",
      channel: "kernel",
      eventId: appId,
      outcome: "ok",
      reason: String(reason),
      details: { install_path: removed.install_path, manifest_name: removed.manifest?.name }
    });
  }
}
