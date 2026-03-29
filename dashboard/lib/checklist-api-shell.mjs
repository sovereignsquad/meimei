/**
 * MeiMei Checklist — registry API shell (`POST …/checklist`: overview, worker_health, ensure_worker).
 * HTTP bridge lives in `checklist-bridge.mjs` (`/api/checklist/bridge`).
 *
 * Boundary: `docs/architecture/meimei-repo-boundaries.v1.md` (checklist row) —
 * Phase 0 — thin `server.mjs` delegates here; legacy JSON actions stay in `apps/checklist/index.mjs`.
 *
 * @version 1.0.0
 * @aligned package agent-meimei 0.8.14
 */
import {
  CHECKLIST_BRIDGE_PREFIX,
  getChecklistBridgeConfig,
  ensureWorkerRunning,
  getChecklistRuntimeSummary
} from "./checklist-bridge.mjs";

/** Actions handled by this module (not delegated to `apps/checklist/index.mjs`). */
export const CHECKLIST_SHELL_ACTIONS = Object.freeze(
  new Set(["", "overview", "worker_health", "ensure_worker"])
);

/**
 * Origin of the local checklist Next.js server (reverse proxy). Default `http://127.0.0.1:3000`.
 * `MEIMEI_CHECKLIST_LOCAL_UPSTREAM=none|false|0|off` disables proxy (runtime shell page only).
 */
export function checklistUpstreamOrigin() {
  const raw = String(process.env.MEIMEI_CHECKLIST_LOCAL_UPSTREAM ?? "").trim();
  const lower = raw.toLowerCase();
  if (lower === "none" || lower === "false" || lower === "0" || lower === "off") return null;
  const u = raw || "http://127.0.0.1:3000";
  return u.replace(/\/+$/, "");
}

/** Path prefix on the Next app (must match `next.config` basePath), default `/checklist`. */
export function checklistUpstreamPathPrefix() {
  let p = String(process.env.MEIMEI_CHECKLIST_UPSTREAM_PATH_PREFIX ?? "/checklist").trim();
  if (!p.startsWith("/")) p = `/${p}`;
  return p.replace(/\/+$/, "") || "/checklist";
}

/**
 * @typedef {object} ChecklistShellDeps
 * @property {string} repoRoot
 * @property {number} port Dashboard listen port
 * @property {string} checklistPublicPath Normalized browser path, e.g. `/727/Checklist`
 * @property {(normPath: string) => string} browserPathForNormalized
 */

/**
 * Registry shell: runtime summary, bridge hints, optional Python worker ensure.
 * @param {Record<string, unknown>} [body]
 * @param {ChecklistShellDeps} deps
 */
export async function processChecklistShell(body = {}, deps) {
  const { repoRoot, port, checklistPublicPath, browserPathForNormalized } = deps;
  const action = String(body.action || "overview");
  const runtime = await getChecklistRuntimeSummary(repoRoot, port);
  const bridgeBase = CHECKLIST_BRIDGE_PREFIX;
  const upstream = checklistUpstreamOrigin();
  const pathPrefix = checklistUpstreamPathPrefix();

  if (action === "overview") {
    return {
      ok: true,
      title: "Checklist",
      summary:
        "The checklist **Next.js operator UI** is reverse-proxied from this path to your local dev server (default `http://127.0.0.1:3000` + `/checklist`). Set `MEIMEI_CHECKLIST_LOCAL_UPSTREAM` / `MEIMEI_CHECKLIST_UPSTREAM_PATH_PREFIX` if needed; set `MEIMEI_CHECKLIST_LOCAL_UPSTREAM=none` to disable proxy and show the runtime shell only.",
      checklistLocalUpstream: upstream,
      checklistUpstreamPathPrefix: pathPrefix,
      checklistBrowserPath: browserPathForNormalized(checklistPublicPath),
      openPath: checklistPublicPath,
      repo: "https://github.com/moldovancsaba/checklist",
      runtime,
      bridgePath: bridgeBase,
      nextEnvHint: {
        AGENT_BRIDGE_MODE: "worker",
        AGENT_API_BASE_URL: `http://127.0.0.1:${port}${bridgeBase}`,
        bridgeSecretHeader: "x-meimei-checklist-secret",
        note: "Use https + /dashboard prefix when using the TLS proxy. Set MEIMEI_CHECKLIST_SHARED_SECRET on the MeiMei host; the hosted checklist must send x-meimei-checklist-secret with the same value."
      },
      queueConsumer: {
        when: "Hosted app uses AGENT_BRIDGE_MODE=queue + Neon; Node engine on a Mac pulls jobs and posts job_result + workspace back.",
        command: "npm run checklist:queue-consumer",
        env: ["APP_QUEUE_BASE_URL", "WORKER_QUEUE_SHARED_SECRET", "MEIMEI_CHECKLIST_ENGINE=node (default)"],
        themeSync: "npm run checklist:sync-theme with CHECKLIST_WEB_APP set"
      },
      weeklyPipeline: {
        path: `${pathPrefix.replace(/\/$/, "")}/original-checklist`,
        note: "Mongo + Playwright weekly pipeline in Next. LLM via ORIGINAL_PIPELINE_MEIMEI_GATEWAY_URL → this dashboard /api/llm/gateway/generate. See integrations/checklist-web/README.md."
      }
    };
  }
  if (action === "worker_health") {
    return { ok: true, action: "worker_health", ...runtime.workerHealth, runtime };
  }
  if (action === "ensure_worker") {
    const cfg = getChecklistBridgeConfig(repoRoot);
    const out = await ensureWorkerRunning(cfg, port);
    return {
      ok: out.ok,
      action: "ensure_worker",
      ...out,
      runtime: await getChecklistRuntimeSummary(repoRoot, port)
    };
  }
  return { ok: false, error: "Unknown action. Use overview, worker_health, or ensure_worker." };
}

/**
 * @typedef {ChecklistShellDeps & { checklistHandler: (req: import("node:http").IncomingMessage, body: object, repoRoot: string) => Promise<unknown> }} ChecklistPostDeps
 */

/**
 * Single POST entry: shell actions → `processChecklistShell`; else legacy `apps/checklist` handler.
 * @param {import("node:http").IncomingMessage} req
 * @param {unknown} body Parsed JSON body
 * @param {string} repoRoot
 * @param {ChecklistPostDeps} deps
 */
export async function handleChecklistPostShell(req, body, repoRoot, deps) {
  const raw = body && typeof body === "object" ? body : {};
  const a = raw.action;
  const action = a === undefined || a === "" ? "" : String(a);
  if (CHECKLIST_SHELL_ACTIONS.has(action)) {
    return processChecklistShell(raw, deps);
  }
  return deps.checklistHandler(req, raw, repoRoot);
}
