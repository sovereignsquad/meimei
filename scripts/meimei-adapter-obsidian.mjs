#!/usr/bin/env node
/**
 * Standalone Obsidian → meimei_jobs ingress (chokidar) + completed-job egress (append summary).
 * Not an Obsidian plugin. Contract: docs/architecture/adapter-obsidian.v1.md
 *
 * Requires: dashboard running (in-process worker) + Ollama for inference.
 *
 * Env:
 *   MEIMEI_OBSIDIAN_VAULT   — absolute path to vault root (required)
 *   MEIMEI_REPO_ROOT        — agent.meimei checkout (default: parent of scripts/)
 *   MEIMEI_OBSIDIAN_DEBOUNCE_MS — default 2000
 *   MEIMEI_OBSIDIAN_EGRESS_POLL_MS — default 5000
 *
 * Usage:
 *   MEIMEI_OBSIDIAN_VAULT=~/Documents/MyVault npm run adapter:obsidian
 */
import { readFileSync, appendFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import chokidar from "chokidar";
import { createMeimeiJobQueue } from "../dashboard/lib/meimei-job-queue.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(process.env.MEIMEI_REPO_ROOT || path.join(scriptDir, ".."));
const vaultRaw = process.env.MEIMEI_OBSIDIAN_VAULT?.trim() || process.argv[2]?.trim();
const debounceMs = Math.max(500, Number(process.env.MEIMEI_OBSIDIAN_DEBOUNCE_MS || 2000) || 2000);
const egressPollMs = Math.max(1000, Number(process.env.MEIMEI_OBSIDIAN_EGRESS_POLL_MS || 5000) || 5000);
const ADAPTER_NAME = "obsidian";
const MAX_NOTE_CHARS = 1_500_000;

const TAG_RE = /(?:^|[\s\u200b])#meimei-summarize(?:\s|$)/m;

if (!vaultRaw) {
  console.error(
    "Missing vault path. Set MEIMEI_OBSIDIAN_VAULT or pass path as first argument."
  );
  process.exit(2);
}

const vaultAbs = path.resolve(vaultRaw.replace(/^~(?=\/)/, process.env.HOME || ""));
if (!existsSync(vaultAbs)) {
  console.error(`Vault not found: ${vaultAbs}`);
  process.exit(2);
}

const queue = createMeimeiJobQueue(repoRoot);

function isUnderVault(absFile) {
  const v = path.resolve(vaultAbs) + path.sep;
  const f = path.resolve(absFile);
  return f.startsWith(v);
}

function isInMeimeiInbox(absFile) {
  if (!isUnderVault(absFile)) return false;
  const rel = path.relative(vaultAbs, absFile);
  return rel.split(path.sep).includes("_meimei_inbox");
}

function shouldProcessMarkdown(absPath) {
  if (!absPath.endsWith(".md")) return false;
  if (!isUnderVault(absPath)) return false;
  if (isInMeimeiInbox(absPath)) return { trigger: "inbox" };
  try {
    const text = readFileSync(absPath, "utf8");
    if (text.length > MAX_NOTE_CHARS) return null;
    if (TAG_RE.test(text)) return { trigger: "tag" };
  } catch {
    return null;
  }
  return null;
}

function buildPayload(absPath, trigger, noteText) {
  const base = path.basename(absPath);
  return {
    kind: "inference_v1",
    request: {
      model: "router-auto",
      messages: [
        {
          role: "system",
          content:
            "You summarize Obsidian notes for the user. Use clear, concise language. Do not repeat the entire note unless asked."
        },
        {
          role: "user",
          content: `Note path: ${base}\nTrigger: ${trigger}\n\n---\n\n${noteText}`
        }
      ],
      stream: false,
      meimei: {
        localOnly: true,
        taskCategory: "summarize"
      }
    },
    obsidian: {
      sourcePath: absPath,
      trigger
    }
  };
}

function enqueueFromPath(absPath) {
  const rule = shouldProcessMarkdown(absPath);
  if (!rule) return;

  let noteText;
  try {
    noteText = readFileSync(absPath, "utf8");
  } catch (e) {
    console.warn(`[${ADAPTER_NAME}] skip read ${absPath}: ${e.message || e}`);
    return;
  }
  if (noteText.length > MAX_NOTE_CHARS) {
    console.warn(`[${ADAPTER_NAME}] skip (too large): ${absPath}`);
    return;
  }

  try {
    const payload = buildPayload(absPath, rule.trigger, noteText);
    const id = queue.enqueueIngress({
      adapterName: ADAPTER_NAME,
      direction: "ingress",
      payload
    });
    console.log(`[${ADAPTER_NAME}] enqueued job ${id} ${rule.trigger} ${absPath}`);
  } catch (e) {
    console.error(`[${ADAPTER_NAME}] enqueue failed ${absPath}:`, e.message || e);
  }
}

/** @type {Map<string, ReturnType<typeof setTimeout>>} */
const debouncers = new Map();

function scheduleEnqueue(absPath) {
  const prev = debouncers.get(absPath);
  if (prev) clearTimeout(prev);
  const t = setTimeout(() => {
    debouncers.delete(absPath);
    enqueueFromPath(absPath);
  }, debounceMs);
  debouncers.set(absPath, t);
}

function extractAssistantText(resultJson) {
  try {
    const j = JSON.parse(resultJson);
    const c = j?.choices?.[0]?.message?.content;
    return typeof c === "string" ? c : "";
  } catch {
    return "";
  }
}

function formatAppendBlock(jobId, summaryText) {
  const lines = summaryText
    .trim()
    .split(/\r?\n/)
    .map((l) => `> ${l}`)
    .join("\n");
  return `\n\n<!-- meimei:job-${jobId} -->\n> [!info] MeiMei summary\n${lines}\n`;
}

function egressTick() {
  let rows;
  try {
    rows = queue.listCompletedForAdapter(ADAPTER_NAME, 15);
  } catch (e) {
    console.error(`[${ADAPTER_NAME}] egress list failed:`, e.message || e);
    return;
  }

  for (const row of rows) {
    const id = Number(row.id);
    let payload;
    try {
      payload = JSON.parse(String(row.payload));
    } catch {
      console.warn(`[${ADAPTER_NAME}] egress skip id=${id} bad payload JSON`);
      queue.deleteJob(id);
      continue;
    }

    const sourcePath = payload?.obsidian?.sourcePath;
    if (typeof sourcePath !== "string" || !isUnderVault(sourcePath)) {
      console.warn(`[${ADAPTER_NAME}] egress skip id=${id} missing/invalid sourcePath`);
      queue.deleteJob(id);
      continue;
    }

    const marker = `<!-- meimei:job-${id} -->`;
    let current = "";
    try {
      if (existsSync(sourcePath)) {
        current = readFileSync(sourcePath, "utf8");
      }
    } catch (e) {
      console.warn(`[${ADAPTER_NAME}] egress read failed id=${id}: ${e.message || e}`);
      continue;
    }

    if (current.includes(marker)) {
      queue.deleteJob(id);
      continue;
    }

    const summary = extractAssistantText(String(row.result_json || "{}"));
    if (!summary) {
      console.warn(`[${ADAPTER_NAME}] egress empty summary id=${id}, deleting row`);
      queue.deleteJob(id);
      continue;
    }

    try {
      appendFileSync(sourcePath, formatAppendBlock(id, summary), "utf8");
      queue.deleteJob(id);
      console.log(`[${ADAPTER_NAME}] egress wrote id=${id} → ${sourcePath}`);
    } catch (e) {
      console.error(`[${ADAPTER_NAME}] egress append failed id=${id}: ${e.message || e}`);
    }
  }
}

const watcher = chokidar.watch(vaultAbs, {
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 400,
    pollInterval: 100
  },
  ignored: [
    /(^|[\\/])\./,
    "**/node_modules/**",
    "**/.git/**"
  ]
});

watcher.on("add", (p) => {
  if (p.endsWith(".md")) scheduleEnqueue(path.resolve(p));
});
watcher.on("change", (p) => {
  if (p.endsWith(".md")) scheduleEnqueue(path.resolve(p));
});

console.log(
  `[${ADAPTER_NAME}] watching vault=${vaultAbs}\n` +
    `  debounce=${debounceMs}ms egress_poll=${egressPollMs}ms\n` +
    `  triggers: _meimei_inbox/**/*.md OR #meimei-summarize in file\n` +
    `  queue=${queue.dbPath}`
);

const egressHandle = setInterval(egressTick, egressPollMs);
egressTick();

function shutdown() {
  watcher.close().catch(() => {});
  clearInterval(egressHandle);
  for (const t of debouncers.values()) clearTimeout(t);
  debouncers.clear();
  console.log(`[${ADAPTER_NAME}] stopped`);
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
