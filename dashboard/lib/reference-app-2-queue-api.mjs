/**
 * Reference App 2 — inbox consumer (sovereign); HTTP surface is debug/status only.
 * All inter-app work is via meimei_jobs; no peer fetch.
 */

import { createMeimeiJobQueue } from "./meimei-job-queue.mjs";
import {
  REFERENCE_APP_2_INBOX,
  REFERENCE_APP_1_INBOX
} from "./meimei-reference-app-inbox.mjs";

export { REFERENCE_APP_2_INBOX };

function refAppToggleEnabled() {
  const v = String(process.env.REFAPP_FEATURE_TOGGLE || "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
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
export function handleReferenceApp2QueueApi(body, repoRoot) {
  const action = String(body?.action || "config").toLowerCase();

  if (action === "config") {
    return {
      ok: true,
      adapter: REFERENCE_APP_2_INBOX,
      consumesAppTasksFor: REFERENCE_APP_2_INBOX,
      repliesTo: REFERENCE_APP_1_INBOX,
      toggleKey: "REFAPP_FEATURE_TOGGLE",
      enabled: refAppToggleEnabled()
    };
  }

  if (!refAppToggleEnabled()) {
    return {
      ok: false,
      error:
        "Reference apps are disabled. Set REFAPP_FEATURE_TOGGLE=1 in Environment variables."
    };
  }

  const queue = createMeimeiJobQueue(repoRoot);

  if (action === "inbox") {
    const rows = queue.listInboxAppTasksForTarget(REFERENCE_APP_2_INBOX, 25);
    return {
      ok: true,
      entries: rows.map(summarizeRow)
    };
  }

  return {
    ok: false,
    error: "Unknown action. Use config or inbox."
  };
}
