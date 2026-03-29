#!/usr/bin/env node
/**
 * Milestone G smoke: ping → pong on SQLite bus only (no HTTP between apps).
 * Run with dashboard up: REFAPP_FEATURE_TOGGLE=1 npm run dashboard
 *
 *   node scripts/meimei-test-mas-handshake.mjs
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createMeimeiJobQueue } from "../dashboard/lib/meimei-job-queue.mjs";
import {
  REFERENCE_APP_1_INBOX,
  REFERENCE_APP_2_INBOX
} from "../dashboard/lib/meimei-reference-app-inbox.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const queue = createMeimeiJobQueue(root);
const traceId = `test-mas-${Date.now()}`;
const nonce = `n-${Date.now()}`;

const jobId = queue.enqueueIngress({
  adapterName: REFERENCE_APP_2_INBOX,
  traceId,
  payload: {
    kind: "app_task",
    target_adapter: REFERENCE_APP_2_INBOX,
    source_adapter: REFERENCE_APP_1_INBOX,
    payload: { intent: "ping", nonce }
  }
});

console.log(`Enqueued ping job id=${jobId} trace=${traceId}`);

const deadline = Date.now() + 60000;
let found = false;
while (Date.now() < deadline) {
  const rows = queue.listAppTasksForTraceParty(traceId, REFERENCE_APP_1_INBOX, 20);
  for (const r of rows) {
    let pl;
    try {
      pl = JSON.parse(String(r.payload));
    } catch {
      continue;
    }
    const inner = pl.payload;
    if (inner && inner.intent === "pong" && String(inner.nonce) === nonce) {
      console.log("PASS: pong observed", { id: r.id, status: r.status });
      found = true;
      break;
    }
  }
  if (found) break;
  await new Promise((r) => setTimeout(r, 800));
}

if (!found) {
  console.error("FAIL: no pong within timeout (is dashboard running with inbox worker?)");
  process.exit(1);
}
