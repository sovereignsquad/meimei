/**
 * Polls `meimei_jobs` and runs inference for `inference_v1` payloads only.
 * `app_task` rows are handled by sovereign inbox processors.
 * Contract: docs/architecture/adapter-contract.v1.md
 */

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createMeimeiJobQueue } from "./meimei-job-queue.mjs";
import { handleMeimeiInferenceRoute } from "./inference-route.mjs";

const NON_RETRYABLE_STATUS = new Set([400, 413, 501]);
const CLAIM_CHECK_BYTES = 64 * 1024;

function extractAssistantFromRouterJson(jsonStr) {
  try {
    const j = typeof jsonStr === "string" ? JSON.parse(jsonStr) : jsonStr;
    const c = j?.choices?.[0]?.message?.content;
    return typeof c === "string" ? c : "";
  } catch {
    return "";
  }
}

/**
 * @param {string} repoRoot
 * @param {string} traceId
 * @param {string} text
 */
function maybeSpillDigest(repoRoot, traceId, text) {
  const buf = Buffer.byteLength(text, "utf8");
  if (buf <= CLAIM_CHECK_BYTES) {
    return { summary_text: text, artifact_path: null, byte_length: buf };
  }
  const safeTrace = String(traceId || "unknown").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120);
  const dir = path.join(repoRoot, "data", "meimei", "artifacts", safeTrace);
  mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, "digest.md");
  writeFileSync(filePath, text, "utf8");
  const rel = path.relative(repoRoot, filePath);
  return {
    summary_text: null,
    artifact_path: rel.split(path.sep).join("/"),
    content_type: "text/markdown",
    byte_length: buf
  };
}

function enqueueCorrelationReply(queue, repoRoot, body, traceId, outJson) {
  const mc = body.meimei_correlation;
  if (!mc || typeof mc !== "object") return;
  const replyTarget = typeof mc.reply_target_adapter === "string" ? mc.reply_target_adapter.trim() : "";
  const parentId = Number(mc.parent_app_task_id);
  if (!replyTarget || !Number.isFinite(parentId) || parentId <= 0) return;

  const digest = extractAssistantFromRouterJson(JSON.stringify(outJson));
  const spill = maybeSpillDigest(repoRoot, mc.trace_id || traceId, digest);
  const inner = {
    intent: typeof mc.intent_reply === "string" ? mc.intent_reply : "standup_digest_ready",
    reply_to: replyTarget,
    parent_job_id: parentId
  };
  if (spill.artifact_path) {
    inner.artifact_path = spill.artifact_path;
    inner.content_type = spill.content_type || "text/markdown";
    inner.byte_length = spill.byte_length;
  } else {
    inner.summary_text = spill.summary_text || "";
    inner.byte_length = spill.byte_length;
  }

  const envelope = {
    kind: "app_task",
    target_adapter: replyTarget,
    source_adapter:
      typeof mc.source_adapter === "string" && mc.source_adapter.trim()
        ? mc.source_adapter.trim()
        : "reference-app-2",
    payload: inner
  };

  const tid = typeof mc.trace_id === "string" && mc.trace_id.trim() ? mc.trace_id.trim() : traceId;
  queue.enqueueIngress({
    adapterName: replyTarget,
    traceId: tid,
    payload: envelope
  });
  console.log(
    `[meimei/jobs][${traceId}] correlation reply enqueued -> ${replyTarget} parent_app_task=${parentId}`
  );
}

/**
 * @param {object} opts
 * @param {string} opts.repoRoot
 * @param {number} [opts.pollMs]
 * @param {number} [opts.maxFailures]
 */
export function startMeimeiJobWorker(opts) {
  if (String(process.env.MEIMEI_JOB_WORKER || "1").trim() === "0") {
    console.log("[meimei/jobs] worker disabled (MEIMEI_JOB_WORKER=0)");
    return () => {};
  }

  const pollMs = Math.max(500, Number(opts.pollMs ?? process.env.MEIMEI_JOB_POLL_MS ?? 5000) || 5000);
  const maxFailures = Math.max(1, Number(opts.maxFailures ?? process.env.MEIMEI_JOB_MAX_FAILURES ?? 3) || 3);
  const repoRoot = opts.repoRoot;
  const queue = createMeimeiJobQueue(repoRoot);
  queue.resetProcessingToPending();

  let busy = false;

  const tick = async () => {
    if (busy) return;
    busy = true;
    try {
      const job = queue.claimNextInferencePending();
      if (!job) return;

      const id = Number(job.id);
      const traceId = String(job.trace_id || "");
      console.log(`[meimei/jobs][${traceId}] claim id=${id} adapter=${job.adapter_name}`);

      let body;
      try {
        body = JSON.parse(String(job.payload));
      } catch {
        queue.markPermanentFailure(id, "invalid payload: not JSON");
        return;
      }

      if (body.kind !== "inference_v1") {
        queue.markPermanentFailure(id, `unknown job kind for inference worker: ${body.kind ?? "missing"}`);
        return;
      }

      if (!body.request || typeof body.request !== "object") {
        queue.markPermanentFailure(id, "inference_v1 requires request object");
        return;
      }

      try {
        const out = await handleMeimeiInferenceRoute(body.request, { traceId });
        if (out.statusCode >= 200 && out.statusCode < 300) {
          queue.markCompleted(id, JSON.stringify(out.json));
          enqueueCorrelationReply(queue, repoRoot, body, traceId, out.json);
          console.log(`[meimei/jobs][${traceId}] completed id=${id}`);
          return;
        }

        const errText = JSON.stringify(out.json);
        if (NON_RETRYABLE_STATUS.has(out.statusCode)) {
          queue.markPermanentFailure(id, `HTTP ${out.statusCode}: ${errText}`);
          console.warn(`[meimei/jobs][${traceId}] dead letter id=${id} non-retryable ${out.statusCode}`);
          return;
        }

        const rc = Number(job.retry_count) || 0;
        queue.markRetryOrDeadLetter(id, rc, errText, maxFailures);
        console.warn(`[meimei/jobs][${traceId}] retry id=${id} retry_count->${rc + 1}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const rc = Number(job.retry_count) || 0;
        queue.markRetryOrDeadLetter(id, rc, msg, maxFailures);
        console.warn(`[meimei/jobs][${traceId}] error id=${id}: ${msg}`);
      }
    } finally {
      busy = false;
    }
  };

  const handle = setInterval(() => {
    void tick();
  }, pollMs);

  console.log(
    `[meimei/jobs] worker poll=${pollMs}ms maxFailures=${maxFailures} db=${queue.dbPath} (inference_v1 only)`
  );

  return () => clearInterval(handle);
}
