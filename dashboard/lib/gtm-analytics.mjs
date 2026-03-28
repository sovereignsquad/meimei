import { loadSdrEvents, summarizeSdr } from "./sdr-analytics.mjs";
import { readWorkflowStore } from "./lead-enrichment-workflow.mjs";

/** Bucket SDR events by UTC date (YYYY-MM-DD) for last N days. */
export function sdrEventsByDay(events, days = 14) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const map = {};
  for (const e of events) {
    const t = e.t ? Date.parse(e.t) : 0;
    if (t < cutoff) continue;
    const day = (e.t || "").slice(0, 10) || "unknown";
    map[day] = (map[day] || 0) + 1;
  }
  const keys = Object.keys(map).sort();
  return keys.map((d) => ({ date: d, count: map[d] }));
}

/** Redacted recent rows for API/UI (no full profile blobs in list). */
export function redactWorkflowItemForList(item) {
  return {
    id: item.id,
    status: item.status,
    label: item.label,
    source: item.source,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    enrichedAt: item.enrichedAt,
    lastError: item.lastError ? String(item.lastError).slice(0, 200) : undefined,
    hasEnrichedResult: Boolean(item.result?.lead)
  };
}

/**
 * Combined GTM funnel metrics: SDR JSONL (#654) + workflow queue (#650).
 */
export async function buildGtmAnalyticsPayload(repoRoot) {
  const events = await loadSdrEvents(repoRoot);
  const sdr = summarizeSdr(events);
  const byType = {};
  for (const e of events) {
    const k = e.type || "(none)";
    byType[k] = (byType[k] || 0) + 1;
  }
  const store = await readWorkflowStore(repoRoot);
  const items = store.items || [];
  const workflowByStatus = {};
  for (const it of items) {
    const s = it.status || "unknown";
    workflowByStatus[s] = (workflowByStatus[s] || 0) + 1;
  }
  const recentSdr = events.slice(-40).reverse();
  const recentWorkflow = items.slice(-15).reverse().map(redactWorkflowItemForList);
  return {
    issue: 651,
    generatedAt: new Date().toISOString(),
    sdr: {
      ...sdr,
      byType,
      series14d: sdrEventsByDay(events, 14)
    },
    workflow: {
      totalItems: items.length,
      byStatus: workflowByStatus
    },
    recentSdr,
    recentWorkflow
  };
}
