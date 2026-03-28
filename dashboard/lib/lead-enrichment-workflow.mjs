import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const STORE_FILE = "lead-enrichment-workflow.v1.json";
const MAX_ITEMS = 200;

export function workflowStorePath(repoRoot) {
  return path.join(repoRoot, "data", STORE_FILE);
}

export async function readWorkflowStore(repoRoot) {
  const p = workflowStorePath(repoRoot);
  try {
    const raw = await readFile(p, "utf8");
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object" || !Array.isArray(data.items)) {
      return { version: 1, items: [] };
    }
    return data;
  } catch {
    return { version: 1, items: [] };
  }
}

export async function writeWorkflowStore(repoRoot, store) {
  const p = workflowStorePath(repoRoot);
  await mkdir(path.dirname(p), { recursive: true });
  await writeFile(p, JSON.stringify(store, null, 2), "utf8");
}

function newId() {
  return "le_wf_" + Math.random().toString(36).slice(2, 12);
}

export async function enqueueWorkflowItem(repoRoot, fields) {
  const source = String(fields.source || "").trim();
  const sourceData = fields.sourceData;
  if (!source || sourceData == null || typeof sourceData !== "object" || Array.isArray(sourceData)) {
    return { ok: false, error: "workflow_enqueue requires source and sourceData (object)." };
  }
  const store = await readWorkflowStore(repoRoot);
  if (store.items.length >= MAX_ITEMS) {
    return {
      ok: false,
      error: `Workflow queue is full (${MAX_ITEMS}). Remove or archive items first.`
    };
  }
  const now = new Date().toISOString();
  const item = {
    id: newId(),
    status: "queued",
    createdAt: now,
    updatedAt: now,
    label: String(fields.label || "").slice(0, 200),
    source,
    sourceData,
    enrichmentLevel: String(fields.enrichmentLevel || "standard"),
    priority: String(fields.priority || "medium")
  };
  store.items.push(item);
  await writeWorkflowStore(repoRoot, store);
  return { ok: true, item };
}

export async function listWorkflowItems(repoRoot) {
  const store = await readWorkflowStore(repoRoot);
  return { ok: true, items: store.items };
}

export async function removeWorkflowItem(repoRoot, id) {
  const wid = String(id || "").trim();
  if (!wid) return { ok: false, error: "workflow_remove requires workflowId." };
  const store = await readWorkflowStore(repoRoot);
  const before = store.items.length;
  store.items = store.items.filter((x) => x.id !== wid);
  if (store.items.length === before) {
    return { ok: false, error: "Workflow item not found." };
  }
  await writeWorkflowStore(repoRoot, store);
  return { ok: true };
}

export async function skipWorkflowItem(repoRoot, id) {
  const wid = String(id || "").trim();
  if (!wid) return { ok: false, error: "workflow_skip requires workflowId." };
  const store = await readWorkflowStore(repoRoot);
  const item = store.items.find((x) => x.id === wid);
  if (!item) return { ok: false, error: "Workflow item not found." };
  item.status = "skipped";
  item.updatedAt = new Date().toISOString();
  await writeWorkflowStore(repoRoot, store);
  return { ok: true, item };
}

/**
 * @param {string} repoRoot
 * @param {string} id
 * @param {(opts: object) => Promise<object>} enrichLead same contract as enrichLead() in server
 */
export async function runWorkflowItem(repoRoot, id, enrichLead) {
  const wid = String(id || "").trim();
  if (!wid) return { ok: false, error: "workflow_run requires workflowId." };
  const store = await readWorkflowStore(repoRoot);
  const item = store.items.find((x) => x.id === wid);
  if (!item) return { ok: false, error: "Workflow item not found." };
  if (item.status === "skipped") {
    return { ok: false, error: "Item is skipped; remove it or enqueue a new one." };
  }
  if (item.status === "enriched") {
    return { ok: false, error: "Already enriched. Open Lead outreach or remove this row." };
  }

  const enrichResult = await enrichLead({
    source: item.source,
    sourceData: item.sourceData,
    enrichmentLevel: item.enrichmentLevel || "standard",
    priority: item.priority || "medium"
  });

  item.updatedAt = new Date().toISOString();
  if (enrichResult.ok) {
    item.status = "enriched";
    item.enrichedAt = item.updatedAt;
    item.result = { lead: enrichResult.lead, audit: enrichResult.audit };
    item.lastError = undefined;
  } else {
    item.status = "failed";
    item.lastError = enrichResult.error || "Enrichment failed";
    item.result = undefined;
  }
  await writeWorkflowStore(repoRoot, store);
  return { ok: true, item, enrichResult };
}
