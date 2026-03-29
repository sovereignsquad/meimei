/**
 * Sovereign inbox for Reference App 2 — processes app_task rows only.
 * No fetch() to other apps; bus-only.
 */

import { createMeimeiJobQueue } from "./meimei-job-queue.mjs";

export const REFERENCE_APP_2_INBOX = "reference-app-2";
export const REFERENCE_APP_1_INBOX = "reference-app-1";

/**
 * @param {object} opts
 * @param {string} opts.repoRoot
 * @param {number} [opts.pollMs]
 */
export function startReferenceApp2Inbox(opts) {
  if (String(process.env.MEIMEI_APP_INBOX_WORKER || "1").trim() === "0") {
    console.log("[ref-app-2/inbox] disabled (MEIMEI_APP_INBOX_WORKER=0)");
    return () => {};
  }

  const pollMs = Math.max(
    400,
    Number(opts.pollMs ?? process.env.MEIMEI_APP_INBOX_POLL_MS ?? 2500) || 2500
  );
  const queue = createMeimeiJobQueue(opts.repoRoot);
  let busy = false;

  const tick = async () => {
    if (busy) return;
    busy = true;
    try {
      const job = queue.claimNextAppTaskForTarget(REFERENCE_APP_2_INBOX);
      if (!job) return;

      const id = Number(job.id);
      const traceId = String(job.trace_id || "");

      let body;
      try {
        body = JSON.parse(String(job.payload));
      } catch {
        queue.markPermanentFailure(id, "app_task: invalid JSON payload");
        return;
      }

      if (body.kind !== "app_task") {
        queue.markPermanentFailure(id, "expected kind app_task");
        return;
      }

      const inner = body.payload && typeof body.payload === "object" ? body.payload : {};
      const intent = String(inner.intent || "").toLowerCase();

      if (intent === "ping") {
        const nonce = inner.nonce != null ? String(inner.nonce) : "";
        const replyPayload = {
          kind: "app_task",
          target_adapter: REFERENCE_APP_1_INBOX,
          source_adapter: REFERENCE_APP_2_INBOX,
          payload: {
            intent: "pong",
            nonce,
            reply_to: REFERENCE_APP_1_INBOX,
            parent_job_id: id
          }
        };
        const replyId = queue.enqueueIngress({
          adapterName: REFERENCE_APP_1_INBOX,
          traceId,
          payload: replyPayload
        });
        queue.markCompleted(
          id,
          JSON.stringify({ ok: true, phase: "pong_enqueued", reply_job_id: replyId })
        );
        console.log(`[ref-app-2/inbox][${traceId}] ping job=${id} -> pong job=${replyId}`);
        return;
      }

      if (intent === "standup_digest_request") {
        const date =
          String(inner.date || "").trim() || new Date().toISOString().slice(0, 10);
        const scope = String(inner.scope || "open_checklist_items").trim();
        const userPrompt = `Produce a brief standup-style digest for date ${date} and scope "${scope}". Use 3-6 short bullet points; plain text only.`;

        const inferencePayload = {
          kind: "inference_v1",
          request: {
            model: "router-auto",
            messages: [
              {
                role: "system",
                content: "You summarize operator context concisely for a daily standup."
              },
              { role: "user", content: userPrompt }
            ],
            stream: false,
            meimei: { localOnly: true, taskCategory: "summarize" }
          },
          meimei_correlation: {
            parent_app_task_id: id,
            reply_target_adapter: REFERENCE_APP_1_INBOX,
            source_adapter: REFERENCE_APP_2_INBOX,
            intent_reply: "standup_digest_ready",
            trace_id: traceId
          }
        };

        const infId = queue.enqueueIngress({
          adapterName: REFERENCE_APP_2_INBOX,
          traceId,
          payload: inferencePayload
        });
        queue.markCompleted(
          id,
          JSON.stringify({
            ok: true,
            phase: "inference_enqueued",
            inference_job_id: infId
          })
        );
        console.log(
          `[ref-app-2/inbox][${traceId}] standup_digest_request job=${id} -> inference job=${infId}`
        );
        return;
      }

      queue.markPermanentFailure(
        id,
        `unsupported app_task intent: ${intent || "(missing)"}`
      );
    } finally {
      busy = false;
    }
  };

  const handle = setInterval(() => {
    void tick();
  }, pollMs);

  console.log(
    `[ref-app-2/inbox] poll=${pollMs}ms target=${REFERENCE_APP_2_INBOX} db=${queue.dbPath}`
  );

  return () => clearInterval(handle);
}
