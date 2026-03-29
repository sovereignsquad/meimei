/**
 * MeiMei Checklist — HTTP handler for `/api/checklist/bridge` (Node engine or Python worker proxy).
 * Wired from `dashboard/server.mjs`; core logic remains in `checklist-bridge.mjs`.
 *
 * @version 1.0.0
 * @aligned package agent-meimei 0.8.14
 */
import {
  CHECKLIST_BRIDGE_PREFIX,
  readRawBody,
  forwardToWorker,
  filterForwardResponseHeaders,
  getChecklistBridgeConfig,
  ensureWorkerRunning,
  isNodeChecklistEngine,
  runNodeChecklistBridge
} from "./checklist-bridge.mjs";

/**
 * @typedef {{
 *   req: import("node:http").IncomingMessage;
 *   res: import("node:http").ServerResponse;
 *   url: URL;
 *   normalizedPath: string;
 *   repoRoot: string;
 *   port: number;
 *   sendJson: (res: import("node:http").ServerResponse, statusCode: number, payload: object) => void;
 * }} ChecklistBridgeHttpCtx
 */

/**
 * @param {ChecklistBridgeHttpCtx} ctx
 * @returns {Promise<boolean>} true if the request was fully handled (caller should return)
 */
export async function serveChecklistBridgeHttp(ctx) {
  const { req, res, url, normalizedPath, repoRoot, port, sendJson } = ctx;

  if (!normalizedPath.startsWith(CHECKLIST_BRIDGE_PREFIX)) {
    return false;
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS,HEAD",
      "access-control-allow-headers": "content-type,x-meimei-checklist-secret,authorization",
      "cache-control": "no-store, max-age=0"
    });
    res.end();
    return true;
  }

  let method = req.method || "GET";
  if (method === "HEAD") method = "GET";
  if (!["GET", "POST", "PATCH", "DELETE"].includes(method)) {
    sendJson(res, 405, { ok: false, error: "method_not_allowed" });
    return true;
  }

  const suffix = normalizedPath.slice(CHECKLIST_BRIDGE_PREFIX.length);
  const workerPathPart =
    !suffix || suffix === "/" ? "/" : suffix.startsWith("/") ? suffix : `/${suffix}`;
  const pathWithQuery = workerPathPart + (url.search || "");

  let body = Buffer.alloc(0);
  if (method === "POST" || method === "PATCH" || method === "DELETE") {
    try {
      body = await readRawBody(req);
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
      return true;
    }
  }

  const rawCt = req.headers["content-type"];
  const contentType = Array.isArray(rawCt) ? rawCt[0] : rawCt;
  const bridgeSecret = String(process.env.MEIMEI_CHECKLIST_SHARED_SECRET || "").trim();
  const pathNoQuery = (pathWithQuery.split("?")[0] || "/").replace(/\/+$/, "") || "/";
  const bridgeNeedsSecret = !(method === "GET" && pathNoQuery === "/health");
  if (bridgeNeedsSecret && bridgeSecret) {
    const hdr = req.headers["x-meimei-checklist-secret"];
    if (hdr !== bridgeSecret) {
      sendJson(res, 401, { error: "unauthorized" });
      return true;
    }
  }

  if (isNodeChecklistEngine()) {
    try {
      const out = await runNodeChecklistBridge({
        repoRoot,
        method,
        pathWithQuery,
        body,
        contentType
      });
      const fh = filterForwardResponseHeaders(out.headers);
      res.writeHead(out.statusCode, {
        ...fh,
        "cache-control": "no-store, max-age=0"
      });
      res.end(out.body);
    } catch (error) {
      sendJson(res, 502, {
        ok: false,
        error: "checklist_node_failed",
        detail: error instanceof Error ? error.message : String(error)
      });
    }
    return true;
  }

  const cfg = getChecklistBridgeConfig(repoRoot);
  if (cfg.autoStart && cfg.root) {
    try {
      await ensureWorkerRunning(cfg, port);
    } catch (error) {
      sendJson(res, 503, {
        ok: false,
        error: "checklist_worker_start_failed",
        detail: error instanceof Error ? error.message : String(error)
      });
      return true;
    }
  }

  try {
    const out = await forwardToWorker({
      cfg,
      method,
      pathWithQuery,
      body,
      contentType
    });
    const fh = filterForwardResponseHeaders(out.headers);
    res.writeHead(out.statusCode, {
      ...fh,
      "cache-control": "no-store, max-age=0"
    });
    res.end(out.body);
  } catch (error) {
    sendJson(res, 502, {
      ok: false,
      error: "checklist_upstream_failed",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
  return true;
}
