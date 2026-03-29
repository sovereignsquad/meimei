#!/usr/bin/env node
/**
 * Separate-process JSON file-drop → meimei_jobs (SQLite).
 * Scans `data/meimei-demo-in/*.json` on an interval; does NOT call /api/meimei/route.
 *
 * Proves multi-process access to the queue (with WAL) before Obsidian/Discord adapters.
 * Contract: docs/architecture/adapter-contract.v1.md
 *
 * Usage:
 *   node scripts/meimei-demo-file-drop-ingest.mjs
 *   MEIMEI_FILE_DROP_POLL_MS=3000 node scripts/meimei-demo-file-drop-ingest.mjs
 *
 * Drop a file `hello.json`:
 *   { "kind": "inference_v1", "request": { "model": "router-auto", "messages": [{"role":"user","content":"Hi"}], "stream": false, "meimei": { "localOnly": true, "taskCategory": "summarize" } } }
 */
import { mkdirSync, readdirSync, readFileSync, renameSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createMeimeiJobQueue } from "../dashboard/lib/meimei-job-queue.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inboxDir = path.join(root, "data", "meimei-demo-in");
const processedDir = path.join(inboxDir, "processed");
const failedDir = path.join(inboxDir, "failed");
const pollMs = Math.max(500, Number(process.env.MEIMEI_FILE_DROP_POLL_MS || 2000) || 2000);
const ADAPTER_NAME = "demo-file-drop";

mkdirSync(inboxDir, { recursive: true });
mkdirSync(processedDir, { recursive: true });
mkdirSync(failedDir, { recursive: true });

const queue = createMeimeiJobQueue(root);

function listInboxJsonFiles() {
  let names;
  try {
    names = readdirSync(inboxDir);
  } catch {
    return [];
  }
  return names
    .filter((n) => n.endsWith(".json") && !n.startsWith("."))
    .filter((n) => {
      try {
        return statSync(path.join(inboxDir, n)).isFile();
      } catch {
        return false;
      }
    })
    .sort();
}

function moveTo(destDir, baseName, prefix) {
  const safe = baseName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const target = path.join(destDir, `${prefix}-${safe}`);
  renameSync(path.join(inboxDir, baseName), target);
  return target;
}

function ingestOne(fileName) {
  const full = path.join(inboxDir, fileName);
  let raw;
  try {
    raw = readFileSync(full, "utf8");
  } catch (e) {
    console.error(`[${ADAPTER_NAME}] read failed ${fileName}:`, e.message || e);
    try {
      moveTo(failedDir, fileName, `readerr-${Date.now()}`);
    } catch {}
    return;
  }

  let doc;
  try {
    doc = JSON.parse(raw);
  } catch (e) {
    console.error(`[${ADAPTER_NAME}] invalid JSON ${fileName}:`, e.message || e);
    try {
      moveTo(failedDir, fileName, `json-${Date.now()}`);
    } catch {}
    return;
  }

  if (!doc || typeof doc !== "object") {
    console.error(`[${ADAPTER_NAME}] not an object ${fileName}`);
    try {
      moveTo(failedDir, fileName, `shape-${Date.now()}`);
    } catch {}
    return;
  }

  if (doc.kind !== "inference_v1") {
    console.error(`[${ADAPTER_NAME}] unsupported kind in ${fileName}:`, doc.kind);
    try {
      moveTo(failedDir, fileName, `kind-${Date.now()}`);
    } catch {}
    return;
  }

  if (!doc.request || typeof doc.request !== "object") {
    console.error(`[${ADAPTER_NAME}] missing request in ${fileName}`);
    try {
      moveTo(failedDir, fileName, `req-${Date.now()}`);
    } catch {}
    return;
  }

  const traceId =
    typeof doc.traceId === "string" && doc.traceId.trim() ? doc.traceId.trim() : undefined;
  const payload = { kind: "inference_v1", request: doc.request };

  try {
    const id = queue.enqueueIngress({
      traceId,
      adapterName: ADAPTER_NAME,
      direction: "ingress",
      payload
    });
    moveTo(processedDir, fileName, `${Date.now()}-job${id}`);
    console.log(`[${ADAPTER_NAME}] enqueued job id=${id} from ${fileName} trace=${traceId || "(auto)"}`);
  } catch (e) {
    console.error(`[${ADAPTER_NAME}] enqueue failed ${fileName}:`, e.message || e);
    try {
      moveTo(failedDir, fileName, `enqueue-${Date.now()}`);
    } catch {}
  }
}

function tick() {
  const files = listInboxJsonFiles();
  for (const f of files) {
    ingestOne(f);
  }
}

console.log(
  `[${ADAPTER_NAME}] polling ${inboxDir} every ${pollMs}ms → ${queue.dbPath} (Ctrl+C to stop)`
);
tick();
const handle = setInterval(tick, pollMs);

function shutdown() {
  clearInterval(handle);
  console.log(`[${ADAPTER_NAME}] stopped`);
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
