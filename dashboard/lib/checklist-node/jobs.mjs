/**
 * POST /jobs — Node-native pipeline (MeiMei inference plane), compatible job_result contract.
 */
import crypto from "node:crypto";
import { getChecklistDb } from "./db.mjs";
import { inferenceCallOllamaJson } from "../meimei-inference-client.mjs";
import { normalizeRecommendedTasks, persistChecklistAndCards } from "./checklist-persist.mjs";

const SIGNAL_TYPES = new Set([
  "pricing_change",
  "opening",
  "closure",
  "staffing",
  "offer",
  "asset_sale",
  "messaging_shift",
  "proof_signal",
  "vendor_adoption"
]);

function normSignal(t) {
  const s = String(t || "").trim();
  return SIGNAL_TYPES.has(s) ? s : "messaging_shift";
}

function sha256Hex(s) {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

function nowIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function validateJobRequest(jr) {
  if (!jr || typeof jr !== "object") throw new Error("job_request required");
  for (const k of ["job_id", "app_id", "project_id", "requested_capability", "submitted_at"]) {
    if (!jr[k] || typeof jr[k] !== "string") throw new Error(`job_request.${k} required`);
  }
  const pc = jr.priority_class;
  const jc = jr.job_class;
  if (!["critical", "normal", "low"].includes(pc)) throw new Error("job_request.priority_class invalid");
  if (!["heavy", "light"].includes(jc)) throw new Error("job_request.job_class invalid");
  const ip = jr.input_payload;
  if (!ip || typeof ip !== "object") throw new Error("job_request.input_payload required");
  const ctxOk = ["meeting_notes", "call_summary", "working_document"].includes(ip.context_type);
  if (!ctxOk) throw new Error("input_payload.context_type invalid");
  if (!ip.prompt || typeof ip.prompt !== "string") throw new Error("input_payload.prompt required");
  if (!Array.isArray(ip.artifacts) || ip.artifacts.length < 1) {
    throw new Error("input_payload.artifacts must be non-empty");
  }
  for (let i = 0; i < ip.artifacts.length; i++) {
    const a = ip.artifacts[i];
    if (!a || a.type !== "upload" || !a.ref) throw new Error(`artifact ${i} invalid`);
  }
}

/**
 * @param {string} dbPath
 * @param {object} payload { job_request, source_package }
 */
export async function processJobPayload(dbPath, payload) {
  validateJobRequest(payload.job_request);
  const jr = payload.job_request;
  const sp = payload.source_package;
  if (!sp || typeof sp !== "object") throw new Error("source_package required");

  const projectId = String(jr.project_id);
  const jobId = String(jr.job_id);
  const rawText = String(sp.raw_text || "");
  const sourceRef = String(sp.source_ref || `source_${jobId}`);
  const sourceKind = String(sp.source_kind || "manual_text");
  const projectSummary = String(sp.project_summary || "managed_on_meimei");
  const competitor = sp.competitor != null ? String(sp.competitor) : null;
  const region = sp.region != null ? String(sp.region) : null;
  const sourceHash = sha256Hex(`${projectId}|${sourceRef}|${rawText.length}|${rawText.slice(0, 8000)}`);

  const db = getChecklistDb(dbPath);
  const displayLabel =
    sp.file_name ||
    (rawText.trim()
      ? `${rawText.trim().split(/\n/)[0].split(".")[0].trim().slice(0, 72)}${rawText.length > 72 ? "…" : ""}`
      : sourceRef);

  const insSnap = db.prepare(`
    insert into source_snapshots (
      source_ref, project_id, source_kind, project_summary, raw_text, competitor, region,
      source_hash, display_label, status
    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    on conflict(source_ref) do update set
      project_summary = excluded.project_summary,
      raw_text = excluded.raw_text,
      competitor = excluded.competitor,
      region = excluded.region,
      source_hash = excluded.source_hash,
      display_label = coalesce(source_snapshots.display_label, excluded.display_label),
      status = coalesce(source_snapshots.status, excluded.status)
  `);
  insSnap.run(
    sourceRef,
    projectId,
    sourceKind,
    projectSummary,
    rawText,
    competitor,
    region,
    sourceHash,
    displayLabel,
    "received"
  );

  const prompt = `You are a competitive intelligence analyst. Read the source and return JSON ONLY (no markdown).

Required shape:
{
  "summary": "2-4 sentences for operators",
  "observations": [
    {
      "signal_id": "unique id like obs_1",
      "signal_type": "one of: pricing_change, opening, closure, staffing, offer, asset_sale, messaging_shift, proof_signal, vendor_adoption",
      "competitor": "entity name or Unknown",
      "region": "e.g. US, EU, global",
      "summary": "short signal",
      "confidence": 0.0-1.0,
      "business_impact": "low|medium|high"
    }
  ],
  "recommended_tasks": [
    { "rank": 1, "title": "...", "why_now": "...", "expected_advantage": "...", "evidence_refs": ["obs_1"] },
    { "rank": 2, "title": "...", "why_now": "...", "expected_advantage": "...", "evidence_refs": ["obs_2"] },
    { "rank": 3, "title": "...", "why_now": "...", "expected_advantage": "...", "evidence_refs": ["obs_1"] }
  ]
}

Rules:
- Exactly 3 recommended_tasks with ranks 1,2,3 in order.
- evidence_refs must list signal_id values that exist in observations (repeat allowed).
- At least 1 observation.

Job prompt (context): ${JSON.stringify(jr.input_payload.prompt).slice(0, 2000)}
Source ref: ${sourceRef}
Text (may truncate):
${rawText.slice(0, 14000)}`;

  const llm = await inferenceCallOllamaJson(prompt, {
    model: "qwen3.5:0.8b",
    temperature: 0.25,
    maxTokens: 4096
  });
  const data = llm.data && typeof llm.data === "object" ? llm.data : {};
  const observationsIn = Array.isArray(data.observations) ? data.observations : [];
  const tasksIn = Array.isArray(data.recommended_tasks) ? data.recommended_tasks : [];
  const summary = String(data.summary || "Source processed by MeiMei native worker.");

  const observedAt = nowIso();
  const obsInsert = db.prepare(`
    insert into system_observations (
      signal_id, project_id, competitor, region, signal_type, summary, source_ref,
      observed_at, confidence, business_impact, superseded_by
    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    on conflict(signal_id) do update set
      summary = excluded.summary,
      observed_at = excluded.observed_at,
      confidence = excluded.confidence,
      business_impact = excluded.business_impact
  `);

  const seenIds = new Set();
  for (const o of observationsIn.slice(0, 24)) {
    const sid = String(o.signal_id || `obs_${crypto.randomUUID().slice(0, 8)}`);
    if (seenIds.has(sid)) continue;
    seenIds.add(sid);
    obsInsert.run(
      sid,
      projectId,
      String(o.competitor || "Unknown").slice(0, 200),
      String(o.region || "global").slice(0, 120),
      normSignal(o.signal_type),
      String(o.summary || "").slice(0, 2000),
      sourceRef,
      String(o.observed_at || observedAt),
      Math.min(1, Math.max(0, Number(o.confidence ?? 0.6))),
      ["low", "medium", "high"].includes(String(o.business_impact)) ? o.business_impact : "medium",
      null
    );
  }

  if (seenIds.size === 0) {
    const sid = `obs_${crypto.randomUUID().slice(0, 8)}`;
    obsInsert.run(
      sid,
      projectId,
      "Unknown",
      "global",
      "proof_signal",
      rawText.trim() ? rawText.trim().slice(0, 400) : "Empty source — add content and re-run.",
      sourceRef,
      observedAt,
      0.35,
      "low",
      null
    );
    seenIds.add(sid);
  }

  const allObs = db
    .prepare(
      `select signal_id from system_observations where project_id = ? and superseded_by is null`
    )
    .all(projectId);
  const validRef = new Set(allObs.map((r) => r.signal_id));

  const tasks = normalizeRecommendedTasks(projectId, tasksIn, validRef, sourceRef);

  const job_result = persistChecklistAndCards(db, projectId, jobId, tasks, summary, {
    sourceRef,
    observationCount: seenIds.size,
    pipelineDetail: { engine: "meimei-node", observation_count: seenIds.size }
  });
  job_result.app_id = String(jr.app_id);

  return {
    job_result,
    observation_count: seenIds.size,
    observation_refs: Array.from(seenIds)
  };
}
