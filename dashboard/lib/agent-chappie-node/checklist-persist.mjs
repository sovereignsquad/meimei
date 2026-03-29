/**
 * Shared: normalize LLM recommended_tasks and persist intelligence_cards + project_active_checklist.
 */
import crypto from "node:crypto";

export function nowIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

/**
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {string} projectId
 * @param {unknown[]} tasksIn
 * @param {Set<string>} validRef
 * @param {string} [sourceRef] used for fallback task wording when the LLM returns fewer than 3 tasks
 */
export function normalizeRecommendedTasks(projectId, tasksIn, validRef, sourceRef = "") {
  const fillerStem = sourceRef.trim()
    ? `Follow up on source ${sourceRef.slice(0, 40)}`
    : `Follow up on workspace ${String(projectId).slice(0, 32)}`;
  /** @type {Array<{rank:number,title:string,why_now:string,expected_advantage:string,evidence_refs:string[]}>} */
  let tasks = tasksIn
    .filter((t) => t && typeof t === "object")
    .map((t) => ({
      rank: Number(t.rank),
      title: String(t.title || "").slice(0, 500),
      why_now: String(t.why_now || "").slice(0, 800),
      expected_advantage: String(t.expected_advantage || "").slice(0, 800),
      evidence_refs: Array.isArray(t.evidence_refs)
        ? t.evidence_refs.map((x) => String(x)).filter((x) => validRef.has(x))
        : []
    }))
    .filter((t) => t.title);

  if (tasks.length < 3) {
    const filler = Array.from(validRef)[0] || "obs_placeholder";
    while (tasks.length < 3) {
      const r = tasks.length + 1;
      tasks.push({
        rank: r,
        title: fillerStem,
        why_now: "MeiMei native worker generated a fallback task to preserve the three-move contract.",
        expected_advantage: "Keeps the workspace actionable while context is filled in.",
        evidence_refs: [filler].filter((x) => validRef.has(x))
      });
    }
  }
  tasks = tasks.slice(0, 3);
  const firstEvidence = Array.from(validRef)[0];
  for (let i = 0; i < 3; i++) {
    const refs =
      tasks[i].evidence_refs && tasks[i].evidence_refs.length
        ? tasks[i].evidence_refs
        : firstEvidence
          ? [firstEvidence]
          : [];
    tasks[i] = {
      ...tasks[i],
      rank: i + 1,
      evidence_refs: refs,
      task_id: String(i + 1)
    };
  }
  return tasks;
}

/**
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {string} projectId
 * @param {string} jobId
 * @param {ReturnType<typeof normalizeRecommendedTasks>} tasks
 * @param {string} summary
 * @param {{ sourceRef?: string | null; observationCount?: number; pipelineDetail?: object }} [opts]
 */
export function persistChecklistAndCards(db, projectId, jobId, tasks, summary, opts = {}) {
  const sourceRef = opts.sourceRef ?? null;
  const observationCount = opts.observationCount ?? null;
  const pipelineDetail = opts.pipelineDetail ?? { engine: "meimei-node" };

  db.prepare(`delete from intelligence_cards where project_id = ?`).run(projectId);
  db.prepare(`delete from card_scores where project_id = ?`).run(projectId);

  const insCard = db.prepare(`
    insert into intelligence_cards (
      card_id, project_id, insight, implication, potential_moves_json, segment, competitor, channel,
      fact_refs_json, source_refs_json, state, expires_at, created_at, updated_at
    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', null,
      strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  `);
  const insScore = db.prepare(`
    insert into card_scores (card_id, project_id, confidence, impact_score, freshness_score, evidence_strength, rank_score)
    values (?, ?, ?, ?, ?, ?, ?)
  `);

  const cardSourceRefs = sourceRef ? [sourceRef] : [];

  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    const cardId = `meimei:${jobId}:${t.rank}`;
    const moves = [t.why_now.slice(0, 200), t.expected_advantage.slice(0, 200)];
    insCard.run(
      cardId,
      projectId,
      t.title,
      t.why_now,
      JSON.stringify(moves),
      "meimei_native",
      null,
      null,
      JSON.stringify(t.evidence_refs),
      JSON.stringify(cardSourceRefs.length ? cardSourceRefs : ["native"])
    );
    const rs = 0.95 - i * 0.05;
    insScore.run(cardId, projectId, 0.75, 0.7, 0.65, 0.72, rs);
  }

  db.prepare(
    `insert into project_active_checklist (project_id, job_id, tasks_json, updated_at)
     values (?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
     on conflict(project_id) do update set job_id = excluded.job_id, tasks_json = excluded.tasks_json`
  ).run(projectId, jobId, JSON.stringify(tasks));

  if (sourceRef) {
    db.prepare(
      `update source_snapshots set
        status = ?, processing_summary = ?, key_takeaway = ?, business_impact = ?,
        linked_task_titles_json = ?, source_confidence = ?, signal_count = coalesce(?, signal_count), knowledge_count = ?,
        last_used_in_checklist = 1
       where source_ref = ?`
    ).run(
      "processed",
      summary.slice(0, 2000),
      summary.slice(0, 400),
      "medium",
      JSON.stringify(tasks.map((t) => t.title)),
      0.72,
      observationCount,
      0,
      sourceRef
    );
  }

  const pipelineRunId = `run_${jobId}_${crypto.randomUUID().slice(0, 10)}`;
  db.prepare(
    `insert into flashcard_pipeline_runs (run_id, job_id, project_id, pipeline_source, reason, detail_json)
     values (?, ?, ?, 'meimei_node', '', ?)`
  ).run(pipelineRunId, jobId, projectId, JSON.stringify(pipelineDetail));

  const traceRefs = [...new Set(tasks.flatMap((t) => t.evidence_refs))];
  const completedAt = nowIso();

  return {
    job_id: jobId,
    app_id: "consultant_followup_web",
    project_id: projectId,
    status: "complete",
    completed_at: completedAt,
    result_payload: {
      recommended_tasks: tasks,
      summary
    },
    decision_summary: { route: "proceed", confidence: 0.82 },
    trace_run_id: `meimei-node-${jobId}`,
    trace_refs: traceRefs
  };
}

export function insertFallbackObservation(db, projectId, sourceRef, rawSnippet, observedAt) {
  const sid = `obs_${crypto.randomUUID().slice(0, 8)}`;
  db.prepare(`
    insert into system_observations (
      signal_id, project_id, competitor, region, signal_type, summary, source_ref,
      observed_at, confidence, business_impact, superseded_by
    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    sid,
    projectId,
    "Unknown",
    "global",
    "proof_signal",
    rawSnippet.slice(0, 400),
    sourceRef,
    observedAt,
    0.35,
    "low",
    null
  );
  return sid;
}
