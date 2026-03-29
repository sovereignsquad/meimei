/**
 * Feedback-driven checklist regeneration (subset of Python regenerate_project_checklist).
 */
import { getChecklistDb } from "./db.mjs";
import { inferenceCallOllamaJson } from "../meimei-inference-client.mjs";
import {
  normalizeRecommendedTasks,
  persistChecklistAndCards,
  insertFallbackObservation,
  nowIso
} from "./checklist-persist.mjs";

/**
 * @param {string} dbPath
 * @param {object} options
 * @param {string} options.projectId
 * @param {string} options.jobId
 * @param {string} [options.appId]
 * @param {number} [options.confidence]
 * @param {object[]|null} [options.retainedTasks]
 */
export async function regenerateProjectChecklist(dbPath, options) {
  const projectId = String(options.projectId || "");
  const jobId = String(options.jobId || "");
  const appId = String(options.appId || "consultant_followup_web");
  const confidence = Number(options.confidence ?? 0.74);
  const retainedTasks = Array.isArray(options.retainedTasks) ? options.retainedTasks : null;

  if (!projectId || !jobId) throw new Error("projectId and jobId are required");

  const db = getChecklistDb(dbPath);

  const memCount =
    db.prepare(`select count(*) as c from generation_memory where project_id = ?`).get(projectId)?.c ?? 0;
  if (memCount > 0) {
    db.prepare(`update generation_memory set weight = weight * 0.92 where project_id = ?`).run(projectId);
  }

  const sourceRows = db
    .prepare(
      `select source_ref, source_kind, project_summary, raw_text, competitor, region
       from source_snapshots where project_id = ? order by datetime(created_at) desc limit 3`
    )
    .all(projectId);

  const latestSourceRef = sourceRows[0]?.source_ref || `feedback_source_${projectId}`;
  const sourceExcerpt = sourceRows.length
    ? sourceRows.map((r) => String(r.raw_text || "").slice(0, 4500)).join("\n\n---\n\n")
    : "Feedback-driven regeneration (no ingested source yet).";

  /** @type {Array<{signal_id:string,signal_type:string,summary:string}>} */
  let observationRows = db
    .prepare(
      `select signal_id, signal_type, summary, observed_at, source_ref
       from system_observations where project_id = ? and superseded_by is null
       order by observed_at desc limit 40`
    )
    .all(projectId);

  const observedAt = nowIso();
  if (observationRows.length === 0) {
    const snippet = sourceRows[0]?.raw_text?.trim()
      ? String(sourceRows[0].raw_text).slice(0, 400)
      : "No observations yet — anchor tasks to competitive context from feedback and sources.";
    insertFallbackObservation(db, projectId, latestSourceRef, snippet, observedAt);
    observationRows = db
      .prepare(
        `select signal_id, signal_type, summary, observed_at, source_ref
         from system_observations where project_id = ? and superseded_by is null
         order by observed_at desc limit 40`
      )
      .all(projectId);
  }

  const feedbackRows = db
    .prepare(
      `select feedback_type, original_title, feedback_comment, adjusted_text, created_at
       from task_feedback where project_id = ? order by created_at desc limit 20`
    )
    .all(projectId);

  const memoryRows = db
    .prepare(
      `select memory_kind, pattern_key, signal_value, weight
       from generation_memory where project_id = ? order by updated_at desc limit 30`
    )
    .all(projectId);

  const obsLines = observationRows.slice(0, 24).map(
    (o) => `- ${o.signal_id} (${o.signal_type}): ${String(o.summary || "").slice(0, 200)}`
  );
  const fbLines = feedbackRows.map(
    (f) =>
      `- ${f.feedback_type}: "${String(f.original_title || "").slice(0, 80)}"` +
      (f.feedback_comment ? ` note: ${String(f.feedback_comment).slice(0, 120)}` : "")
  );
  const memLines = memoryRows.map(
    (m) =>
      `- ${m.memory_kind} w=${m.weight} key="${String(m.pattern_key || "").slice(0, 60)}"` +
      (m.signal_value ? ` val="${String(m.signal_value).slice(0, 80)}"` : "")
  );

  const retained = retainedTasks ?? [];
  const retainedJson = JSON.stringify(
    retained.map((t) => ({
      rank: t.rank,
      title: t.title,
      why_now: t.why_now,
      expected_advantage: t.expected_advantage
    }))
  );

  const prompt = `You are a competitive intelligence analyst. Regenerate exactly 3 recommended tasks for the project. Return JSON ONLY (no markdown).

Required shape:
{
  "summary": "2-4 sentences for operators",
  "recommended_tasks": [
    { "rank": 1, "title": "...", "why_now": "...", "expected_advantage": "...", "evidence_refs": ["obs_id"] },
    { "rank": 2, "title": "...", "why_now": "...", "expected_advantage": "...", "evidence_refs": ["obs_id"] },
    { "rank": 3, "title": "...", "why_now": "...", "expected_advantage": "...", "evidence_refs": ["obs_id"] }
  ]
}

Rules:
- Exactly 3 recommended_tasks with ranks 1,2,3.
- evidence_refs MUST use only signal_id values from the OBSERVATIONS list below (repeat allowed).
- Honor RETAINED_TASKS: preserve their intent in the new three moves where it still fits operator feedback and memory.
- Apply GENERATION_MEMORY: avoid repeating avoided titles; prefer phrases/channels from memory when consistent with sources.

OBSERVATIONS (valid evidence_refs only from these ids):
${obsLines.join("\n")}

RECENT_TASK_FEEDBACK:
${fbLines.length ? fbLines.join("\n") : "(none)"}

GENERATION_MEMORY:
${memLines.length ? memLines.join("\n") : "(none)"}

RETAINED_TASKS (keep intent):
${retainedJson}

SOURCE CONTEXT (excerpt):
${sourceExcerpt.slice(0, 12000)}`;

  const llm = await inferenceCallOllamaJson(prompt, {
    model: "qwen3.5:0.8b",
    temperature: 0.25,
    maxTokens: 4096
  });
  const data = llm.data && typeof llm.data === "object" ? llm.data : {};
  const tasksIn = Array.isArray(data.recommended_tasks) ? data.recommended_tasks : [];
  const summary = String(data.summary || "Checklist regenerated from workspace context.");

  const allObs = db
    .prepare(`select signal_id from system_observations where project_id = ? and superseded_by is null`)
    .all(projectId);
  const validRefFinal = new Set(allObs.map((r) => r.signal_id));

  const tasks = normalizeRecommendedTasks(projectId, tasksIn, validRefFinal, latestSourceRef);
  const snapshotRef = sourceRows[0]?.source_ref ?? null;

  const job_result = persistChecklistAndCards(db, projectId, jobId, tasks, summary, {
    sourceRef: snapshotRef,
    observationCount: allObs.length,
    pipelineDetail: {
      engine: "meimei-node",
      kind: "feedback_regenerate",
      observation_count: allObs.length
    }
  });
  job_result.app_id = appId;
  job_result.decision_summary = { route: "proceed", confidence };

  return job_result;
}
