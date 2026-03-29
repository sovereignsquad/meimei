/**
 * MeiMei Checklist — HTTP bridge for the Checklist Next.js app and optional Python worker.
 * Default: **Node engine** (SQLite + Ollama in-process). Optional: `MEIMEI_CHECKLIST_ENGINE=python` + HTTP worker.
 *
 * Registry shell: `checklist-api-shell.mjs`. HTTP `/api/checklist/bridge`: `checklist-bridge-http.mjs`.
 *
 * @version 1.0.0
 * @aligned package agent-meimei 0.8.6
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import {
  isNodeChecklistEngine,
  runNodeChecklistBridge,
  resolveChecklistSqlitePath
} from "./checklist-node/engine.mjs";

export { isNodeChecklistEngine, runNodeChecklistBridge, resolveChecklistSqlitePath };

/** Public HTTP path on the MeiMei dashboard (strip `MEIMEI_PUBLIC_PREFIX` when proxying). */
export const CHECKLIST_BRIDGE_PREFIX = "/api/checklist/bridge";

/** @typedef {{ root: string; host: string; port: number; secret: string; autoStart: boolean; python: string; dbPath: string | null; databaseUrl: string; meimeiFallbackDb: string }} ChecklistBridgeRuntimeConfig */

let workerChild = null;
let ensureInFlight = null;
let shutdownHooksRegistered = false;

function registerShutdownHooks() {
  if (shutdownHooksRegistered) return;
  shutdownHooksRegistered = true;
  const stop = () => {
    if (!workerChild || workerChild.killed) return;
    try {
      workerChild.kill("SIGTERM");
    } catch {
      /* ignore */
    }
  };
  process.on("exit", stop);
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

/**
 * @param {string} repoRoot MeiMei repo root (for default data dir hint only)
 * @returns {ChecklistBridgeRuntimeConfig}
 */
export function getChecklistBridgeConfig(repoRoot) {
  const root = String(process.env.MEIMEI_CHECKLIST_ROOT || "").trim();
  const host = String(process.env.MEIMEI_CHECKLIST_WORKER_HOST || "127.0.0.1").trim() || "127.0.0.1";
  const port = Number(process.env.MEIMEI_CHECKLIST_WORKER_PORT || 8787);
  const secret = String(process.env.MEIMEI_CHECKLIST_SHARED_SECRET || "").trim();
  const autoStart = String(process.env.MEIMEI_CHECKLIST_AUTO_START || "").trim() === "1";
  const python = String(process.env.MEIMEI_CHECKLIST_PYTHON || "python3").trim() || "python3";
  const dbOverride = String(process.env.MEIMEI_CHECKLIST_DB_PATH || "").trim();
  const databaseUrl = String(process.env.MEIMEI_CHECKLIST_DATABASE_URL || "").trim();
  const dataDir = path.join(repoRoot, "data", "checklist");
  const meimeiFallbackDb = path.join(dataDir, "agent_brain.sqlite3");
  return {
    root,
    host,
    port: Number.isFinite(port) ? port : 8787,
    secret,
    autoStart,
    python,
    dbPath: dbOverride || null,
    databaseUrl,
    meimeiFallbackDb
  };
}

export function workerScriptPath(root) {
  return path.join(root, "scripts", "worker_bridge.py");
}

export function workerScriptExists(root) {
  try {
    return fs.existsSync(workerScriptPath(root));
  } catch {
    return false;
  }
}

/**
 * @param {number} port
 * @param {string} host
 * @returns {Promise<{ ok: boolean; status?: number; body?: unknown; error?: string }>}
 */
export function probeWorkerHealth(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: host,
        port,
        path: "/health",
        method: "GET",
        timeout: 2500
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          try {
            resolve({
              ok: res.statusCode === 200,
              status: res.statusCode,
              body: raw ? JSON.parse(raw) : {}
            });
          } catch {
            resolve({ ok: false, status: res.statusCode, error: "invalid_json", raw: raw.slice(0, 200) });
          }
        });
      }
    );
    req.on("timeout", () => {
      req.destroy();
      resolve({ ok: false, error: "timeout" });
    });
    req.on("error", (e) => {
      resolve({ ok: false, error: e instanceof Error ? e.message : String(e) });
    });
    req.end();
  });
}

function buildWorkerEnv(cfg, dashboardPort) {
  const gw = `http://127.0.0.1:${dashboardPort}/api/llm/gateway/generate`;
  const env = { ...process.env };
  env.AGENT_WORKER_HOST = cfg.host;
  env.AGENT_WORKER_PORT = String(cfg.port);
  if (cfg.secret) env.AGENT_SHARED_SECRET = cfg.secret;
  if (cfg.databaseUrl) env.DATABASE_URL = cfg.databaseUrl;
  env.OLLAMA_URL = gw;
  const gatewaySecret = String(process.env.MEIMEI_LLM_GATEWAY_SECRET || "").trim();
  if (gatewaySecret) env.MEIMEI_LLM_GATEWAY_SECRET = gatewaySecret;
  if (cfg.dbPath) env.AGENT_LOCAL_DB_PATH = cfg.dbPath;
  return env;
}

/**
 * @param {ChecklistBridgeRuntimeConfig} cfg
 * @param {number} dashboardPort
 */
async function spawnWorkerProcess(cfg, dashboardPort) {
  if (!cfg.root || !workerScriptExists(cfg.root)) {
    return { ok: false, error: "MEIMEI_CHECKLIST_ROOT missing or scripts/worker_bridge.py not found" };
  }
  if (!cfg.secret) {
    return { ok: false, error: "MEIMEI_CHECKLIST_SHARED_SECRET required for auto-start" };
  }
  if (cfg.dbPath) {
    fs.mkdirSync(path.dirname(cfg.dbPath), { recursive: true });
  } else {
    fs.mkdirSync(path.join(cfg.root, "runtime_status"), { recursive: true });
  }
  const script = workerScriptPath(cfg.root);
  const child = spawn(cfg.python, [script], {
    cwd: cfg.root,
    env: buildWorkerEnv(cfg, dashboardPort),
    stdio: "ignore",
    detached: false
  });
  workerChild = child;
  registerShutdownHooks();
  child.on("exit", (code, signal) => {
    if (workerChild === child) workerChild = null;
    void code;
    void signal;
  });
  child.on("error", () => {
    if (workerChild === child) workerChild = null;
  });
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 250));
    const h = await probeWorkerHealth(cfg.port, cfg.host);
    if (h.ok) return { ok: true, pid: child.pid };
  }
  return { ok: false, error: "worker did not become healthy in time", pid: child.pid };
}

/**
 * @param {ChecklistBridgeRuntimeConfig} cfg
 * @param {number} dashboardPort
 */
export async function ensureWorkerRunning(cfg, dashboardPort) {
  if (!cfg.autoStart) return { ok: false, reason: "auto_start_disabled" };
  const h = await probeWorkerHealth(cfg.port, cfg.host);
  if (h.ok) return { ok: true, reason: "already_running", health: h };
  if (!cfg.root) return { ok: false, reason: "no_root" };
  if (ensureInFlight) return ensureInFlight;
  ensureInFlight = (async () => {
    try {
      return await spawnWorkerProcess(cfg, dashboardPort);
    } finally {
      ensureInFlight = null;
    }
  })();
  return ensureInFlight;
}

/**
 * @param {import("node:http").IncomingMessage} req
 * @param {number} [limit]
 * @returns {Promise<Buffer>}
 */
export function readRawBody(req, limit = 25 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let n = 0;
    req.on("data", (chunk) => {
      n += chunk.length;
      if (n > limit) {
        reject(new Error("Request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function pathNeedsWorkerSecret(method, pathNoQuery) {
  if (method === "GET" && pathNoQuery === "/health") return false;
  return true;
}

/**
 * Forward to Checklist Python worker (localhost).
 * @param {{
 *   cfg: ChecklistBridgeRuntimeConfig;
 *   method: string;
 *   pathWithQuery: string;
 *   body: Buffer;
 *   contentType?: string;
 * }} opts
 */
export function forwardToWorker(opts) {
  const { cfg, method, pathWithQuery, body, contentType } = opts;
  const pathNoQuery = pathWithQuery.split("?")[0] || "/";
  const headers = {};
  if (pathNeedsWorkerSecret(method, pathNoQuery) && cfg.secret) {
    headers["x-agent-shared-secret"] = cfg.secret;
  }
  if (body && body.length > 0) {
    headers["Content-Length"] = String(body.length);
    if (contentType) headers["Content-Type"] = contentType;
  }

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: cfg.host,
        port: cfg.port,
        path: pathWithQuery,
        method,
        headers,
        timeout: 120_000
      },
      (upstream) => {
        const chunks = [];
        upstream.on("data", (c) => chunks.push(c));
        upstream.on("end", () => {
          resolve({
            statusCode: upstream.statusCode || 502,
            headers: upstream.headers,
            body: Buffer.concat(chunks)
          });
        });
      }
    );
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("worker_timeout"));
    });
    req.on("error", reject);
    if (body && body.length > 0) req.write(body);
    req.end();
  });
}

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade"
]);

/**
 * @param {import("node:http").IncomingHttpHeaders} h
 */
export function filterForwardResponseHeaders(h) {
  /** @type {Record<string, string | string[]>} */
  const out = {};
  for (const [k, v] of Object.entries(h)) {
    if (!k || v === undefined) continue;
    const lk = k.toLowerCase();
    if (HOP_BY_HOP.has(lk)) continue;
    out[k] = v;
  }
  return out;
}

/**
 * @param {string} repoRoot
 * @param {number} dashboardPort
 */
export async function getChecklistRuntimeSummary(repoRoot, dashboardPort) {
  if (isNodeChecklistEngine()) {
    const dbPath = resolveChecklistSqlitePath(repoRoot);
    const databaseUrl = String(process.env.MEIMEI_CHECKLIST_DATABASE_URL || "").trim();
    return {
      engine: "node",
      configured: true,
      checklistWorkerRepo: null,
      workerScriptPresent: false,
      workerHost: "in-process",
      workerPort: null,
      workerReachable: true,
      workerHealth: { ok: true, body: { bridge: "meimei-checklist-node" } },
      localDbPath: dbPath,
      onlineDatabaseConfigured: Boolean(databaseUrl),
      autoStart: false,
      sharedSecretConfigured: true,
      bridgePath: CHECKLIST_BRIDGE_PREFIX,
      ollamaViaMeiMeiGateway: `http://127.0.0.1:${dashboardPort}/api/llm/gateway/generate`,
      note: "MeiMei Checklist Node engine (default). Set MEIMEI_CHECKLIST_ENGINE=python for the checklist-repo HTTP worker."
    };
  }
  const cfg = getChecklistBridgeConfig(repoRoot);
  const scriptOk = cfg.root ? workerScriptExists(cfg.root) : false;
  const health = await probeWorkerHealth(cfg.port, cfg.host);
  const localDb =
    cfg.dbPath ||
    (cfg.root ? path.join(cfg.root, "runtime_status", "agent_brain.sqlite3") : cfg.meimeiFallbackDb);
  return {
    engine: "python",
    configured: Boolean(cfg.root && scriptOk),
    checklistWorkerRepo: cfg.root || null,
    workerScriptPresent: scriptOk,
    workerHost: cfg.host,
    workerPort: cfg.port,
    workerReachable: health.ok,
    workerHealth: health,
    localDbPath: localDb,
    onlineDatabaseConfigured: Boolean(cfg.databaseUrl),
    autoStart: cfg.autoStart,
    sharedSecretConfigured: Boolean(cfg.secret),
    bridgePath: CHECKLIST_BRIDGE_PREFIX,
    ollamaViaMeiMeiGateway: `http://127.0.0.1:${dashboardPort}/api/llm/gateway/generate`
  };
}
