/**
 * Reference App 1 — Phase 4 + Milestone G: inference via queue; ping/standup via app_task bus.
 * No direct LLM / Ollama calls; no fetch() to Reference App 2.
 */

import crypto from "node:crypto";
import { createMeimeiJobQueue } from "./meimei-job-queue.mjs";
import {
  REFERENCE_APP_1_INBOX,
  REFERENCE_APP_2_INBOX
} from "./meimei-reference-app-inbox.mjs";

export const REFERENCE_APP_QUEUE_ADAPTER = REFERENCE_APP_1_INBOX;

function refAppToggleEnabled() {
  const v = String(process.env.REFAPP_FEATURE_TOGGLE || "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

function maxPromptChars() {
  const n = Number.parseInt(String(process.env.REFAPP_MAX_PROMPT_CHARS || "8000"), 10);
  if (!Number.isFinite(n) || n < 200) return 8000;
  return Math.min(32000, n);
}

function extractAssistantText(resultJson) {
  if (!resultJson) return "";
  let j;
  try {
    j = typeof resultJson === "string" ? JSON.parse(resultJson) : resultJson;
  } catch {
    return "";
  }
  const c = j?.choices?.[0]?.message?.content;
  return typeof c === "string" ? c : "";
}

function parseJsonField(s) {
  try {
    return JSON.parse(String(s || ""));
  } catch {
    return null;
  }
}

function summarizeRow(r) {
  if (!r) return null;
  return {
    id: r.id,
    status: r.status,
    trace_id: r.trace_id,
    target_adapter: r.target_adapter,
    source_adapter: r.source_adapter,
    payload: parseJsonField(r.payload),
    result_json: parseJsonField(r.result_json),
    error_message: r.error_message || null,
    created_at: r.created_at,
    updated_at: r.updated_at
  };
}

/**
 * @param {object} body
 * @param {string} repoRoot
 */
export function handleReferenceAppQueueApi(body, repoRoot) {
  const action = String(body?.action || "config").toLowerCase();

  if (action === "config") {
    return {
      ok: true,
      enabled: refAppToggleEnabled(),
      toggleKey: "REFAPP_FEATURE_TOGGLE",
      maxPromptChars: maxPromptChars(),
      adapter: REFERENCE_APP_QUEUE_ADAPTER,
      mas: {
        peerInbox: REFERENCE_APP_2_INBOX,
        pingIntent: "ping",
        standupIntent: "standup_digest_request"
      }
    };
  }

  if (!refAppToggleEnabled()) {
    return {
      ok: false,
      error:
        "Reference app is disabled. Set REFAPP_FEATURE_TOGGLE=1 in Environment variables (or shell) and restart if needed."
    };
  }

  const queue = createMeimeiJobQueue(repoRoot);

  if (action === "status") {
    const jobId = Number(body?.jobId);
    if (!Number.isFinite(jobId) || jobId <= 0) {
      return { ok: false, error: "status requires numeric jobId." };
    }
    const row = queue.getJobByIdForParty(jobId, REFERENCE_APP_QUEUE_ADAPTER);
    if (!row) {
      return { ok: false, error: "Job not found." };
    }
    const status = String(row.status || "");
    const out = {
      ok: true,
      jobId,
      status,
      traceId: String(row.trace_id || ""),
      payloadKind: row.payload_kind || null
    };
    if (status === "failed" && row.error_message) {
      out.errorMessage = String(row.error_message);
    }
    if (status === "completed" && row.result_json) {
      out.assistantText = extractAssistantText(row.result_json);
      out.result = parseJsonField(row.result_json);
    }
    return out;
  }

  if (action === "enqueue") {
    const prompt = String(body?.prompt ?? "").trim();
    if (!prompt) {
      return { ok: false, error: "enqueue requires non-empty prompt." };
    }
    const cap = maxPromptChars();
    if (prompt.length > cap) {
      return {
        ok: false,
        error: `Prompt exceeds REFAPP_MAX_PROMPT_CHARS (${cap}).`
      };
    }

    const payload = {
      kind: "inference_v1",
      request: {
        model: "router-auto",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant. Answer clearly in at most a few short sentences unless the user asks for detail."
          },
          { role: "user", content: prompt }
        ],
        stream: false,
        meimei: {
          localOnly: true,
          taskCategory: "summarize"
        }
      }
    };

    const id = queue.enqueueIngress({
      adapterName: REFERENCE_APP_QUEUE_ADAPTER,
      direction: "ingress",
      payload
    });

    const row = queue.getJobByIdForParty(id, REFERENCE_APP_QUEUE_ADAPTER);

    return {
      ok: true,
      jobId: id,
      status: "pending",
      traceId: row ? String(row.trace_id || "") : ""
    };
  }

  if (action === "ping") {
    const traceId =
      String(body?.traceId || "").trim() || crypto.randomUUID();
    const nonce = String(body?.nonce || "").trim() || crypto.randomUUID();
    const envelope = {
      kind: "app_task",
      target_adapter: REFERENCE_APP_2_INBOX,
      source_adapter: REFERENCE_APP_1_INBOX,
      payload: {
        intent: "ping",
        nonce
      }
    };
    const jobId = queue.enqueueIngress({
      adapterName: REFERENCE_APP_2_INBOX,
      traceId,
      payload: envelope
    });
    return {
      ok: true,
      jobId,
      traceId,
      nonce,
      phase: "ping_enqueued"
    };
  }

  if (action === "standup") {
    const traceId =
      String(body?.traceId || "").trim() || crypto.randomUUID();
    const date =
      String(body?.date || "").trim() || new Date().toISOString().slice(0, 10);
    const scope = String(body?.scope || "open_checklist_items").trim();
    const envelope = {
      kind: "app_task",
      target_adapter: REFERENCE_APP_2_INBOX,
      source_adapter: REFERENCE_APP_1_INBOX,
      payload: {
        intent: "standup_digest_request",
        date,
        scope
      }
    };
    const jobId = queue.enqueueIngress({
      adapterName: REFERENCE_APP_2_INBOX,
      traceId,
      payload: envelope
    });
    return {
      ok: true,
      jobId,
      traceId,
      phase: "standup_request_enqueued"
    };
  }

  if (action === "trace") {
    const traceId = String(body?.traceId || "").trim();
    if (!traceId) {
      return { ok: false, error: "trace requires traceId." };
    }
    const rows = queue.listAppTasksForTraceParty(
      traceId,
      REFERENCE_APP_QUEUE_ADAPTER,
      40
    );
    return {
      ok: true,
      traceId,
      entries: rows.map(summarizeRow)
    };
  }

  if (action === "inbox") {
    const rows = queue.listInboxAppTasksForTarget(REFERENCE_APP_1_INBOX, 30);
    return {
      ok: true,
      entries: rows.map(summarizeRow)
    };
  }

  return {
    ok: false,
    error:
      "Unknown action. Use config, enqueue, status, ping, standup, trace, or inbox."
  };
}
