#!/usr/bin/env node
/**
 * Sacrificial lamb: enqueue one inference_v1 job into meimei_jobs (SQLite).
 * Does NOT call /api/meimei/route — proves adapter quarantine per adapter-contract.v1.md
 *
 * Usage:
 *   node scripts/meimei-demo-enqueue-job.mjs
 *   node scripts/meimei-demo-enqueue-job.mjs "Your prompt here"
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createMeimeiJobQueue } from "../dashboard/lib/meimei-job-queue.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const prompt =
  process.argv.slice(2).join(" ").trim() ||
  "Reply with exactly one word: pong.";

const queue = createMeimeiJobQueue(root);
const id = queue.enqueueIngress({
  adapterName: "demo-cli",
  direction: "ingress",
  payload: {
    kind: "inference_v1",
    request: {
      model: "router-auto",
      messages: [{ role: "user", content: prompt }],
      stream: false,
      meimei: {
        localOnly: true,
        taskCategory: "summarize"
      }
    }
  }
});

console.log(`Enqueued job id=${id} (dashboard worker will process; ensure npm run dashboard is up)`);
console.log(`DB: ${queue.dbPath}`);
