#!/usr/bin/env node
/**
 * Run the Neon-backed queue loop for MeiMei Node Agent.Chappie (same contract as
 * moldovancsaba/checklist `scripts/worker_queue_consumer.py`).
 *
 * Required env:
 *   APP_QUEUE_BASE_URL       — e.g. https://checklist.messmass.com
 *   WORKER_QUEUE_SHARED_SECRET — must match hosted app WORKER_QUEUE_SECRET / workerQueueSecret
 *
 * Optional: WORKER_QUEUE_POLL_SECONDS, WORKER_QUEUE_DRAIN_ONCE=1, WORKER_HTTP_TIMEOUT_* (see checklist runbook)
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runQueueConsumer } from "../dashboard/lib/agent-chappie-node/queue-consumer.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const engine = String(process.env.MEIMEI_AGENT_CHAPPIE_ENGINE || "node").toLowerCase();
if (engine !== "node") {
  console.error(
    "This consumer only runs the in-MeiMei Node engine. Set MEIMEI_AGENT_CHAPPIE_ENGINE=node (or unset).\n" +
      "For Python, use the checklist repo: python3 scripts/worker_queue_consumer.py"
  );
  process.exit(1);
}

runQueueConsumer({ repoRoot }).catch((e) => {
  console.error(e);
  process.exit(1);
});
