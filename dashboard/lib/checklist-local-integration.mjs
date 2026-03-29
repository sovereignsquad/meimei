/**
 * MeiMei Checklist — local Next.js reverse-proxy + HTML fallback shell (no upstream).
 * Registry POST shell: `checklist-api-shell.mjs`; HTTP bridge: `checklist-bridge.mjs`.
 *
 * @version 1.0.0
 * @aligned package agent-meimei 0.8.10
 */
import http from "node:http";
import https from "node:https";
import { CHECKLIST_BRIDGE_PREFIX } from "./checklist-bridge.mjs";
import {
  checklistUpstreamOrigin,
  checklistUpstreamPathPrefix
} from "./checklist-api-shell.mjs";

function rewriteSetCookiePathForChecklist(cookie, meiBrowserBase) {
  return cookie.replace(/;\s*path=(\/checklist)(\/[^;]*|)(?=[;]|$)/gi, (_m, _base, sub) => {
    const suffix = sub || "";
    return `; path=${meiBrowserBase}${suffix}`;
  });
}

function rewriteChecklistLocationHeader(loc, req, meiBrowserBase) {
  const origin = checklistUpstreamOrigin();
  if (!origin) return loc;
  try {
    const abs = new URL(loc, `${origin}/`);
    const upOrigin = new URL(origin);
    const upPrefix = checklistUpstreamPathPrefix();
    if (abs.origin !== upOrigin.origin) return loc;
    if (!abs.pathname.startsWith(upPrefix)) return loc;
    const rest = abs.pathname.slice(upPrefix.length) || "";
    const meiPath = `${meiBrowserBase}${rest}`;
    const proto = String(req.headers["x-forwarded-proto"] || "http").split(",")[0].trim();
    const host = String(req.headers.host || "127.0.0.1").split(",")[0].trim();
    return `${proto}://${host}${meiPath}${abs.search}`;
  } catch {
    return loc;
  }
}

function filterChecklistProxyResponseHeaders(rawHeaders, req, meiBrowserBase) {
  const out = {};
  const skip = new Set(["connection", "transfer-encoding", "content-length"]);
  for (const key of Object.keys(rawHeaders)) {
    const kl = key.toLowerCase();
    if (skip.has(kl)) continue;
    const v = rawHeaders[key];
    if (v === undefined) continue;
    if (kl === "set-cookie") {
      const arr = Array.isArray(v) ? v : [v];
      out["set-cookie"] = arr.map((c) => rewriteSetCookiePathForChecklist(String(c), meiBrowserBase));
    } else if (kl === "location") {
      out[key] = rewriteChecklistLocationHeader(String(v), req, meiBrowserBase);
    } else {
      out[key] = v;
    }
  }
  return out;
}

function copyRequestHeadersForProxy(req, hostHeader) {
  const out = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (v == null) continue;
    const kl = k.toLowerCase();
    if (kl === "host" || kl === "connection") continue;
    out[k] = Array.isArray(v) ? v.join(", ") : v;
  }
  out.host = hostHeader;
  return out;
}

/**
 * @typedef {{ checklistPublicPath: string; getChecklistBrowserBase: () => string }} ChecklistProxyCtx
 */

/**
 * Reverse-proxy checklist miniapp paths to local Next.js (full app, not an iframe).
 * @returns {Promise<boolean>} true if the request was handled (including errors written to res)
 */
export async function tryProxyChecklistRequest(req, res, incomingUrl, normalizedPath, ctx) {
  const { checklistPublicPath, getChecklistBrowserBase } = ctx;
  const origin = checklistUpstreamOrigin();
  if (!origin) return false;
  if (!(normalizedPath === checklistPublicPath || normalizedPath.startsWith(`${checklistPublicPath}/`))) {
    return false;
  }
  const methods = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
  if (!methods.includes(req.method)) return false;

  const up = new URL(origin);
  const pathPrefix = checklistUpstreamPathPrefix();
  let tail = "";
  if (normalizedPath === checklistPublicPath || normalizedPath === `${checklistPublicPath}/`) {
    tail = "";
  } else {
    tail = normalizedPath.slice(checklistPublicPath.length);
    if (!tail.startsWith("/")) tail = `/${tail}`;
  }
  const upstreamPath = tail === "" || tail === "/" ? `${pathPrefix}/` : `${pathPrefix}${tail}`;
  const pathWithQuery = upstreamPath + (incomingUrl.search || "");

  const lib = up.protocol === "https:" ? https : http;
  const defPort = up.protocol === "https:" ? 443 : 80;
  const portNum = up.port ? Number(up.port) : defPort;
  const hostHeader = portNum === defPort ? up.hostname : `${up.hostname}:${portNum}`;

  const meiBrowserBase = getChecklistBrowserBase();
  const headers = copyRequestHeadersForProxy(req, hostHeader);

  return new Promise((resolve) => {
    const opts = {
      protocol: up.protocol,
      hostname: up.hostname,
      port: up.port ? Number(up.port) : undefined,
      method: req.method,
      path: pathWithQuery,
      headers
    };
    const preq = lib.request(opts, (pres) => {
      const rh = filterChecklistProxyResponseHeaders(pres.headers, req, meiBrowserBase);
      res.writeHead(pres.statusCode ?? 502, rh);
      pres.pipe(res);
      pres.on("end", () => resolve(true));
    });
    preq.on("error", () => {
      if (!res.headersSent) {
        res.writeHead(502, {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store, max-age=0"
        });
        res.end(
          "Checklist upstream unreachable. Start Next.js in consultant-followup-web (e.g. npm run dev on port 3000 with basePath /checklist), or set MEIMEI_CHECKLIST_LOCAL_UPSTREAM. Disable proxy with MEIMEI_CHECKLIST_LOCAL_UPSTREAM=none to see the MeiMei runtime shell instead.\n"
        );
      }
      resolve(true);
    });
    if (req.method === "GET" || req.method === "HEAD") {
      preq.end();
    } else {
      req.pipe(preq);
    }
  });
}

/**
 * @typedef {{
 *   port: number;
 *   checklistPublicPath: string;
 *   checklistLabel: string;
 *   checklistApiRoute: string;
 *   appsRoute: string;
 *   designSystemCssPath: string;
 *   escapeHtml: (v: unknown) => string;
 *   escapeAttr: (v: unknown) => string;
 *   buildLayoutFlowHtml: (layoutDoc: unknown, pageKey: string, parts: { topbar: string; main: string }, esc: (v: unknown) => string) => string;
 *   miniappPageKey: (id: string) => string;
 * }} ChecklistShellPageCtx
 */

/**
 * Fallback HTML when `MEIMEI_CHECKLIST_LOCAL_UPSTREAM` disables proxy — runtime panel + hints.
 */
export function renderChecklistLocalShellPage(layoutDoc, ctx) {
  const {
    port,
    checklistPublicPath,
    checklistLabel,
    checklistApiRoute,
    appsRoute,
    designSystemCssPath,
    escapeHtml,
    escapeAttr,
    buildLayoutFlowHtml,
    miniappPageKey
  } = ctx;

  const publicPrefixRaw = String(process.env.MEIMEI_PUBLIC_PREFIX ?? "/dashboard").replace(/\/+$/, "");
  const urlDashPrefix = publicPrefixRaw === "/" ? "" : publicPrefixRaw;
  const meiOriginDisplay = `http://127.0.0.1:${port}${urlDashPrefix}`;
  const meiChecklistUrlDisplay = `${meiOriginDisplay}${checklistPublicPath.startsWith("/") ? "" : "/"}${checklistPublicPath}`;
  const upPrefix = checklistUpstreamPathPrefix();
  const topbar = `<div class="topbar">
      <a class="button secondary" href="${escapeHtml(appsRoute)}">&larr; Back to Apps</a>
      <span class="title">${escapeHtml(checklistLabel)}</span>
    </div>`;
  const proxyHint = `<section class="route-card u-mb12">
        <h2 class="u-mt0" style="font-size:1.15rem;">Full checklist UI</h2>
        <p class="lede u-mb12">You are on the <strong>fallback shell</strong> because <code class="route-code">MEIMEI_CHECKLIST_LOCAL_UPSTREAM=none</code> (or equivalent). To load the real Next.js checklist <em>at this URL</em>, remove that setting: MeiMei will reverse-proxy to <code class="route-code">http://127.0.0.1:3000${escapeHtml(upPrefix)}</code> by default (set <code class="route-code">MEIMEI_CHECKLIST_LOCAL_UPSTREAM</code> for another origin). The checklist app must use the same path prefix (<code class="route-code">MEIMEI_CHECKLIST_UPSTREAM_PATH_PREFIX</code>, default <code class="route-code">${escapeHtml(upPrefix)}</code> → Next <code class="route-code">basePath</code>).</p>
      </section>`;
  const main = `<main class="hero">
      <section class="route-card u-mb12">
        <h2 class="u-mt0" style="font-size:1.15rem;">Local runtime (MeiMei)</h2>
        <p class="muted u-mb12">The <strong>Node engine</strong> uses SQLite in <code class="route-code">data/checklist/</code> and LLM via <code class="route-code">/api/llm/gateway/generate</code>. The bridge <code class="route-code">${escapeHtml(CHECKLIST_BRIDGE_PREFIX)}</code> is what the checklist Next app calls when it talks to your Mac. Set <code class="route-code">MEIMEI_CHECKLIST_ENGINE=python</code> for the checklist-repo HTTP worker instead.</p>
        <p class="muted u-mb12"><strong>MeiMei home:</strong> <code class="route-code">${escapeHtml(`${meiOriginDisplay}/`)}</code> · <strong>This route:</strong> <code class="route-code">${escapeHtml(meiChecklistUrlDisplay)}</code></p>
        <div id="checklist-runtime-panel" class="result-card">
          <p class="muted u-m0" id="checklist-runtime-loading">Loading runtime status…</p>
        </div>
        <div class="route-actions u-mt12">
          <button type="button" class="button secondary" id="checklist-refresh-runtime">Refresh status</button>
          <button type="button" class="button secondary" id="checklist-ensure-worker">Ensure worker</button>
        </div>
      </section>
      ${proxyHint}
    </main>`;
  const layout = buildLayoutFlowHtml(layoutDoc, miniappPageKey("checklist"), { topbar, main }, escapeAttr);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(checklistLabel)} - agent.meimei</title>
  <link rel="stylesheet" href="${escapeHtml(designSystemCssPath)}" />
</head>
<body data-theme="green" data-page="checklist">
  <div class="shell">
    ${layout}
  </div>
  <script>
    (function () {
      const checklistApi = ${JSON.stringify(checklistApiRoute)};
      const bridgePrefix = ${JSON.stringify(CHECKLIST_BRIDGE_PREFIX)};
      function apiDashPrefix() {
        var p = window.location.pathname || "";
        return (p === "/dashboard" || p.indexOf("/dashboard/") === 0) ? "/dashboard" : "";
      }
      function renderRuntime(data) {
        var panel = document.getElementById("checklist-runtime-panel");
        var loadEl = document.getElementById("checklist-runtime-loading");
        if (!panel) return;
        if (loadEl) loadEl.remove();
        var rt = data && data.runtime;
        if (!rt) {
          panel.innerHTML = "<p class=\\"muted u-m0\\">No runtime payload.</p>";
          return;
        }
        var bridge = window.location.origin + apiDashPrefix() + bridgePrefix;
        var lines = [
          "<p class=\\"u-m0\\"><strong>Engine</strong>: " + (rt.engine === "python" ? "python (external worker)" : "node (in MeiMei)") + "</p>",
          "<p class=\\"muted u-m0 u-mt8\\"><strong>Python repo</strong>: " + (rt.checklistWorkerRepo ? "MEIMEI_CHECKLIST_ROOT set" : "not used (node default)") + "</p>",
          "<p class=\\"muted u-m0 u-mt8\\"><strong>Worker</strong>: " + (rt.workerReachable ? "reachable" : "down") + " — " + (rt.workerHost || "?") + (rt.workerPort != null ? ":" + rt.workerPort : "") + "</p>",
          "<p class=\\"muted u-m0 u-mt8\\"><strong>Local SQLite</strong>: " + (rt.localDbPath || "—") + "</p>",
          "<p class=\\"muted u-m0 u-mt8\\"><strong>Online DB env</strong>: " + (rt.onlineDatabaseConfigured ? "DATABASE_URL set for worker" : "not set (Neon optional)") + "</p>",
          "<p class=\\"muted u-m0 u-mt8\\"><strong>MeiMei bridge</strong> (for Next.js <code class=\\"route-code\\">AGENT_API_BASE_URL</code>):<br /><code class=\\"route-code\\">" + bridge + "</code></p>",
          "<p class=\\"muted u-m0 u-mt8\\"><strong>Auto-start</strong>: " + (rt.engine === "node" ? "n/a (Node engine)" : (rt.autoStart ? "on (<code class=\\"route-code\\">MEIMEI_CHECKLIST_AUTO_START=1</code>)" : "off — run worker from checklist repo")) + "</p>"
        ];
        panel.innerHTML = "<div class=\\"result-card\\">" + lines.join("") + "</div>";
      }
      async function loadOverview() {
        var panel = document.getElementById("checklist-runtime-panel");
        if (!panel) return;
        try {
          var res = await fetch(apiDashPrefix() + checklistApi, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ action: "overview" })
          });
          var data = await res.json();
          if (!data.ok) throw new Error(data.error || "overview failed");
          renderRuntime(data);
        } catch (e) {
          panel.innerHTML = "<p class=\\"muted u-m0\\\">Could not load status: " + String(e.message || e) + "</p>";
        }
      }
      async function ensureWorker() {
        try {
          var res = await fetch(apiDashPrefix() + checklistApi, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ action: "ensure_worker" })
          });
          var data = await res.json();
          await loadOverview();
          if (!data.ok) alert(data.detail || data.error || "ensure_worker failed");
        } catch (e) {
          alert(String(e.message || e));
        }
      }
      document.getElementById("checklist-refresh-runtime")?.addEventListener("click", loadOverview);
      document.getElementById("checklist-ensure-worker")?.addEventListener("click", ensureWorker);
      loadOverview();
    })();
  </script>
</body>
</html>`;
}
