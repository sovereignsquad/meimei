/**
 * MeiMei Checklist Node engine (SQLite + Ollama in-process).
 * Set MEIMEI_CHECKLIST_ENGINE=python to use the checklist-repo HTTP worker instead.
 *
 * @version 1.0.0
 * @aligned package agent-meimei 0.8.13
 */
import path from "node:path";
import { processJobPayload } from "./jobs.mjs";
import { buildWorkspacePayload } from "./workspace.mjs";
import { handleManagementRequest } from "./management.mjs";

export function getChecklistEngineMode() {
  return String(process.env.MEIMEI_CHECKLIST_ENGINE || "node").toLowerCase();
}

export function isNodeChecklistEngine() {
  return getChecklistEngineMode() === "node";
}

/**
 * @param {string} repoRoot
 * @returns {string} absolute path to SQLite file
 */
export function resolveChecklistSqlitePath(repoRoot) {
  const envPath = String(process.env.MEIMEI_CHECKLIST_DB_PATH || "").trim();
  if (envPath) return path.isAbsolute(envPath) ? envPath : path.resolve(repoRoot, envPath);
  return path.join(repoRoot, "data", "checklist", "agent_brain.sqlite3");
}

function jsonBuf(obj) {
  const raw = JSON.stringify(obj);
  return {
    statusCode: 200,
    headers: { "content-type": "application/json; charset=utf-8" },
    body: Buffer.from(raw, "utf8")
  };
}

function errBuf(status, obj) {
  const raw = JSON.stringify(obj);
  return {
    statusCode: status,
    headers: { "content-type": "application/json; charset=utf-8" },
    body: Buffer.from(raw, "utf8")
  };
}

/**
 * @param {{ repoRoot: string; method: string; pathWithQuery: string; body: Buffer; contentType?: string }} opts
 */
export async function runNodeChecklistBridge(opts) {
  const { repoRoot, method, pathWithQuery, body } = opts;
  const pathname = (pathWithQuery.split("?")[0] || "/").replace(/\/+$/, "") || "/";
  const dbPath = resolveChecklistSqlitePath(repoRoot);

  if (method === "GET" && pathname === "/health") {
    return jsonBuf({ status: "ok", bridge: "meimei-checklist-node" });
  }

  if (method === "POST" && pathname === "/jobs") {
    let payload;
    try {
      payload = JSON.parse(body.length ? body.toString("utf8") : "{}");
    } catch {
      return errBuf(400, { error: "worker_job_failed", detail: "invalid JSON body" });
    }
    try {
      const out = await processJobPayload(dbPath, payload);
      return jsonBuf(out);
    } catch (e) {
      return errBuf(400, {
        error: "worker_job_failed",
        detail: e instanceof Error ? e.message : String(e)
      });
    }
  }

  const ws = pathname.match(/^\/projects\/([^/]+)\/workspace$/);
  if (method === "GET" && ws) {
    const projectId = decodeURIComponent(ws[1]);
    const payload = buildWorkspacePayload(dbPath, projectId);
    return jsonBuf(payload);
  }

  if (method === "POST" || method === "PATCH" || method === "DELETE") {
    let payload = {};
    if (body && body.length > 0) {
      try {
        payload = JSON.parse(body.toString("utf8"));
      } catch {
        return errBuf(400, { error: "invalid_json", detail: "management body must be JSON" });
      }
    }
    try {
      const r = await handleManagementRequest(dbPath, method, pathname, payload);
      return {
        statusCode: r.status,
        headers: { "content-type": "application/json; charset=utf-8" },
        body: Buffer.from(JSON.stringify(r.body), "utf8")
      };
    } catch (e) {
      return errBuf(400, {
        error: "worker_management_failed",
        detail: e instanceof Error ? e.message : String(e)
      });
    }
  }

  return errBuf(404, { error: "not_found" });
}
