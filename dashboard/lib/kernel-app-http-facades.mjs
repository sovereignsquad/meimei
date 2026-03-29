/**
 * MM-KERNEL-303a–d — app-scoped HTTP façades (path carries `app_id`).
 * Auth: same as kernel POST dispatch (`kernel-app-auth.mjs` + optional secret).
 */
import crypto from "node:crypto";
import { assertKernelAppDispatchAuth } from "./kernel-app-auth.mjs";
import {
  assertCapabilityAllowed,
  assertManifestCapabilitiesSatisfiedForDispatch,
  policyEnvAllowKeys
} from "./kernel-app-policy.mjs";
import { findKernelAppMatchByAppId } from "./kernel-app-resolve.mjs";
import { handleMeimeiInferenceRoute } from "./inference-route.mjs";
import { createMeimeiJobQueue } from "./meimei-job-queue.mjs";
import { loadStoreSync, entryAppliesToRuntime, getActiveProfile } from "./meimei-env-store.mjs";
import { buildKernelAppFsRootsPayload } from "./kernel-app-fs-roots.mjs";

const APP_ID_PATH_RE =
  /^\/api\/meimei\/v1\/apps\/([^/]+)\/(inference|jobs\/enqueue|env|fs\/roots)$/;

export function parseKernelAppFacadePath(normalizedPath) {
  const m = String(normalizedPath || "").match(APP_ID_PATH_RE);
  if (!m) return null;
  return { appId: m[1], facet: m[2] };
}

/**
 * @param {import("node:http").IncomingMessage} req
 * @param {string} repoRoot
 * @returns {{ ok: true, match: object } | { ok: false, status: number, json: object }}
 */
export function resolveKernelAppFacadeAuth(req, repoRoot, appIdFromPath) {
  const match = findKernelAppMatchByAppId(repoRoot, appIdFromPath);
  if (!match) {
    return {
      ok: false,
      status: 404,
      json: { ok: false, error: "unknown_app", code: "NOT_FOUND" }
    };
  }
  const sat = assertManifestCapabilitiesSatisfiedForDispatch(match);
  if (!sat.ok) {
    return {
      ok: false,
      status: 403,
      json: { ok: false, error: "policy_invalid", code: "FORBIDDEN", detail: sat.error }
    };
  }
  const auth = assertKernelAppDispatchAuth(req, match);
  if (!auth.ok) {
    return { ok: false, status: auth.status, json: auth.payload };
  }
  return { ok: true, match };
}

/**
 * @param {import("node:http").IncomingMessage} req
 * @param {(r: import("node:http").IncomingMessage) => Promise<unknown>} readJson
 * @param {string} repoRoot
 * @param {string} appIdFromPath
 */
export async function handleKernelAppInferenceFacade(req, readJson, repoRoot, appIdFromPath) {
  const gate = resolveKernelAppFacadeAuth(req, repoRoot, appIdFromPath);
  if (!gate.ok) return { statusCode: gate.status, json: gate.json };
  const cap = assertCapabilityAllowed(gate.match, "inference");
  if (!cap.ok) return { statusCode: cap.status, json: cap.payload };

  const body = (await readJson(req)) || {};
  const traceHeader = String(req.headers["x-meimei-trace-id"] || "").trim();
  const traceFromBody =
    body.meimei && typeof body.meimei === "object" && typeof body.meimei.traceId === "string"
      ? body.meimei.traceId.trim()
      : "";
  const traceId = traceHeader || traceFromBody || crypto.randomUUID();
  if (typeof body.meimei !== "object" || body.meimei === null) {
    body.meimei = {};
  }
  if (!body.meimei.traceId) {
    body.meimei.traceId = traceId;
  }
  return handleMeimeiInferenceRoute(body, { traceId, appId: gate.match.app_id });
}

/**
 * @param {import("node:http").IncomingMessage} req
 * @param {(r: import("node:http").IncomingMessage) => Promise<unknown>} readJson
 * @param {string} repoRoot
 * @param {string} appIdFromPath
 */
export async function handleKernelAppJobsEnqueueFacade(req, readJson, repoRoot, appIdFromPath) {
  const gate = resolveKernelAppFacadeAuth(req, repoRoot, appIdFromPath);
  if (!gate.ok) return { statusCode: gate.status, json: gate.json };
  const cap = assertCapabilityAllowed(gate.match, "jobs.enqueue");
  if (!cap.ok) return { statusCode: cap.status, json: cap.payload };

  const body = (await readJson(req)) || {};
  const adapterName = String(body.adapterName || body.adapter_name || "").trim();
  if (!adapterName) {
    return {
      statusCode: 400,
      json: { ok: false, error: "adapterName required" }
    };
  }
  const payload = body.payload && typeof body.payload === "object" ? body.payload : null;
  if (!payload) {
    return {
      statusCode: 400,
      json: { ok: false, error: "payload object required" }
    };
  }
  const traceId =
    (body.traceId && String(body.traceId).trim()) ||
    (body.trace_id && String(body.trace_id).trim()) ||
    crypto.randomUUID();
  const direction = body.direction === "egress" ? "egress" : "ingress";
  const queue = createMeimeiJobQueue(repoRoot);
  const jobId = queue.enqueueIngress({
    adapterName,
    direction,
    payload,
    traceId,
    appId: gate.match.app_id
  });
  return {
    statusCode: 200,
    json: {
      ok: true,
      jobId,
      traceId,
      status: "pending",
      kernel_app_id: gate.match.app_id
    }
  };
}

/**
 * @param {import("node:http").IncomingMessage} req
 * @param {URL} url
 * @param {string} repoRoot
 * @param {string} appIdFromPath
 */
export function handleKernelAppEnvReadFacade(req, url, repoRoot, appIdFromPath) {
  const gate = resolveKernelAppFacadeAuth(req, repoRoot, appIdFromPath);
  if (!gate.ok) return { statusCode: gate.status, json: gate.json };
  const cap = assertCapabilityAllowed(gate.match, "env.read");
  if (!cap.ok) return { statusCode: cap.status, json: cap.payload };

  const keysRaw = String(url.searchParams.get("keys") || "").trim();
  if (!keysRaw) {
    return {
      statusCode: 400,
      json: { ok: false, error: "keys query required (comma-separated)" }
    };
  }
  const allow = new Set(policyEnvAllowKeys(gate.match.policy));
  if (allow.size === 0) {
    return {
      statusCode: 403,
      json: {
        ok: false,
        error: "env_allowlist_empty",
        code: "FORBIDDEN",
        message: "Set policy.env.allowKeys for this app to read secrets via this API."
      }
    };
  }
  const requested = keysRaw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  const profile = getActiveProfile();
  const store = loadStoreSync(repoRoot);
  const entries = store.entries || [];
  const values = {};
  for (const key of requested) {
    if (!allow.has(key)) {
      return {
        statusCode: 403,
        json: { ok: false, error: "key_not_allowed", code: "FORBIDDEN", key }
      };
    }
    const entry = entries.find((e) => e && e.key === key);
    if (!entry || !entryAppliesToRuntime(entry, profile)) {
      values[key] = null;
    } else {
      values[key] = entry.value != null ? String(entry.value) : "";
    }
  }
  return {
    statusCode: 200,
    json: {
      ok: true,
      activeProfile: profile,
      keys: requested,
      values
    }
  };
}

/** MM-KERNEL-303d — read-only `policy.filesystem.roots` (jailed to install_path). */
export function handleKernelAppFsRootsFacade(req, repoRoot, appIdFromPath) {
  const gate = resolveKernelAppFacadeAuth(req, repoRoot, appIdFromPath);
  if (!gate.ok) return { statusCode: gate.status, json: gate.json };
  const cap = assertCapabilityAllowed(gate.match, "filesystem.scoped");
  if (!cap.ok) return { statusCode: cap.status, json: cap.payload };
  const out = buildKernelAppFsRootsPayload(gate.match);
  return { statusCode: out.statusCode, json: out.json };
}
