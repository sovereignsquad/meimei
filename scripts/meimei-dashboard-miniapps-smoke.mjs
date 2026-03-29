#!/usr/bin/env node
/**
 * One-pass smoke: GET miniapp pages + safe POST per registry API.
 * Run with dashboard already listening (e.g. node dashboard/server.mjs).
 *
 * Usage: node scripts/meimei-dashboard-miniapps-smoke.mjs [baseUrl]
 *   baseUrl default: http://127.0.0.1:<defaults.port> (upstream Node).
 *   Set MEIMEI_SMOKE_HTTPS=1 for https://<MEIMEI_PUBLIC_HOST||meimei.localhost>:8443 (TLS proxy path).
 *   Trust local CA: NODE_EXTRA_CA_CERTS=$HOME/.openclaw/certs/meimei.localhost.crt
 *
 * Exit 1 if any GET is non-200 or any POST returns non-JSON / throws.
 * "API ok" means HTTP 200 and body parses; body.ok may be false (deps missing).
 *
 * **Strict mode:** `MEIMEI_SMOKE_STRICT=1` also asserts `GET /api/meimei/monitor/feed` shape (K4).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registry = JSON.parse(fs.readFileSync(path.join(root, "functions/registry.v1.json"), "utf8"));

const port = await (async () => {
  try {
    const { readSurfaceJsonSync, effectiveCanonicalListenPort } = await import(
      "../config/dashboard-listen-normalize.mjs"
    );
    return String(effectiveCanonicalListenPort(readSurfaceJsonSync(root)));
  } catch {
    return "45285";
  }
})();

const publicHost = String(process.env.MEIMEI_PUBLIC_HOST || "meimei.localhost").trim() || "meimei.localhost";
const tlsPort = String(process.env.MEIMEI_PUBLIC_TLS_PORT || "8443").trim() || "8443";
const useHttpsSmoke = String(process.env.MEIMEI_SMOKE_HTTPS || "").trim() === "1";
const defaultBase = useHttpsSmoke
  ? `https://${publicHost}:${tlsPort}`
  : `http://127.0.0.1:${port}`;

const base = process.argv[2] || process.env.MEIMEI_SMOKE_BASE || defaultBase;

const headers = { Accept: "text/html,application/json", "User-Agent": "meimei-dashboard-miniapps-smoke/1" };

async function get(pathname) {
  const url = `${base.replace(/\/+$/, "")}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
  const res = await fetch(url, { headers: { ...headers, Accept: "text/html" } });
  const text = await res.text();
  return { url, status: res.status, snippet: text.slice(0, 80).replace(/\s+/g, " ") };
}

async function getJson(pathname) {
  const url = `${base.replace(/\/+$/, "")}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": headers["User-Agent"] }
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { _parseError: true, raw: text.slice(0, 200) };
  }
  return { url, status: res.status, json };
}

async function postJson(pathname, body, timeoutMs = 120_000) {
  const url = `${base.replace(/\/+$/, "")}${pathname}`;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { ...headers, "content-type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: ac.signal
    });
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { _parseError: true, raw: text.slice(0, 200) };
    }
    return { url, status: res.status, json };
  } finally {
    clearTimeout(t);
  }
}

/** Safe POST bodies: minimal read-only or low-side-effect where possible */
const apiBodies = {
  checklist: { action: "overview" },
  "lead-enrichment": { action: "workflow_list" },
  "lead-outreach": { action: "overview" },
  "ai-sdr-analytics": { action: "overview" },
  inbox: { action: "list", limit: 1 },
  "what-next": { sources: ["tasks"] },
  "explain-it": { url: "https://example.com" },
  "daily-briefing": { sink: "markdown" },
  "ai-routing": { channel: "dashboard", taskType: "chat", costTarget: "low" },
  "api-access": {
    channel: "dashboard",
    taskType: "chat",
    costTarget: "low",
    message: "",
    approved: false
  },
  memory: { layer: "identity" },
  "mission-control": {},
  "supabase-connector": { action: "overview" },
  "environment-variables": { action: "catalog" },
  "reference-app-1": { action: "config" },
  "reference-app-2": { action: "config" }
};

console.log(`MeiMei miniapp smoke — base ${base}\n`);

let fail = false;

const extraGets = ["/api/health", "/dashboard/", "/dashboard/apps", "/dashboard/tools", "/dashboard/admin", "/dashboard/knowmore", "/dashboard/system-monitor"];

for (const p of extraGets) {
  const r = await get(p);
  const ok = r.status === 200;
  if (!ok) fail = true;
  console.log(`${ok ? "OK " : "FAIL"} GET  ${p} → ${r.status}`);
}

if (process.env.MEIMEI_SMOKE_STRICT === "1") {
  console.log("\n--- MEIMEI_SMOKE_STRICT: monitor feed shape ---\n");
  const r = await getJson("/api/meimei/monitor/feed?limit=5");
  let strictOk = r.status === 200 && r.json && !r.json._parseError;
  const j = r.json;
  if (strictOk && typeof j === "object") {
    if (j.ok !== true || !Array.isArray(j.items)) strictOk = false;
    if (strictOk && j.items.length > 0) {
      const row = j.items[0];
      if (!row || typeof row.trace_id !== "string" || typeof row.display_line !== "string" || typeof row.status !== "string") {
        strictOk = false;
      }
    }
  } else if (strictOk) {
    strictOk = false;
  }
  if (!strictOk) fail = true;
  console.log(`${strictOk ? "OK " : "FAIL"} GET  /api/meimei/monitor/feed?limit=5 → ${r.status} (strict shape)`);
}

for (const fn of registry.functions) {
  const route = fn.route;
  if (!route) continue;
  const r = await get(route);
  const checklistProxyDown = fn.id === "checklist" && r.status === 502;
  const strict = process.env.MEIMEI_SMOKE_STRICT === "1";
  const ok = r.status === 200 || (checklistProxyDown && !strict);
  if (!ok) fail = true;
  const tag = r.status === 200 ? "OK " : checklistProxyDown && !strict ? "WARN" : "FAIL";
  const note = checklistProxyDown && !strict ? " (Next upstream not running — expected)" : "";
  console.log(`${tag} GET  ${route} → ${r.status} (${fn.id})${note}`);
}

console.log("\n--- API POST (200 + JSON expected; ok field may be false if Ollama/Mail/Supabase missing) ---\n");

for (const fn of registry.functions) {
  const apiPath = fn.api?.path;
  const method = (fn.api?.method || "POST").toUpperCase();
  if (!apiPath || method !== "POST") continue;
  const id = fn.id;
  const body = apiBodies[id] ?? {};
  const shortTimeout = id === "explain-it" ? 45_000 : 90_000;
  let r;
  try {
    r = await postJson(apiPath, body, shortTimeout);
  } catch (e) {
    console.log(`FAIL POST ${apiPath} (${id}) → ${e.message || e}`);
    fail = true;
    continue;
  }
  if (r.status !== 200) {
    console.log(`FAIL POST ${apiPath} (${id}) → HTTP ${r.status}`);
    fail = true;
    continue;
  }
  if (r.json._parseError) {
    console.log(`FAIL POST ${apiPath} (${id}) → non-JSON ${r.json.raw}`);
    fail = true;
    continue;
  }
  const okField = r.json.ok === true ? "ok:true" : `ok:${r.json.ok}`;
  const err = r.json.error ? ` error:${String(r.json.error).slice(0, 60)}` : "";
  console.log(`HTTP POST ${apiPath} (${id}) → 200 ${okField}${err}`);
}

process.exit(fail ? 1 : 0);
