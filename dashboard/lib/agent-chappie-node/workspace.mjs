/**
 * Build worker workspace snapshot for POST /api/worker/projects/:id/workspace
 * (aligned with checklist Python build_workspace_payload + WorkerWorkspacePayload in worker-bridge.ts).
 */
import { getAgentChappieDb } from "./db.mjs";

function parseJsonArray(s, fallback = []) {
  if (!s) return fallback;
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

function parseJsonObject(s, fallback = {}) {
  if (!s) return fallback;
  try {
    const v = JSON.parse(s);
    return v && typeof v === "object" && !Array.isArray(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

/**
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {string} projectId
 */
function loadHiddenDraftSegmentIds(db, projectId) {
  const rows = db
    .prepare(`select segment_id, status from draft_segment_feedback where project_id = ?`)
    .all(projectId);
  const hidden = new Set();
  for (const r of rows) {
    const st = String(r.status || "").toLowerCase();
    if (["declined", "deleted", "hidden", "rejected"].includes(st)) {
      hidden.add(String(r.segment_id));
    }
  }
  return hidden;
}

/**
 * @param {object} card intelligence card row + scores (flattened)
 */
function intelligenceCardToKnowledgeCard(card) {
  const pm = Array.isArray(card.potential_moves) ? card.potential_moves : [];
  const insight = String(card.insight || "");
  const implication = String(card.implication || "");
  const src = Array.isArray(card.source_refs) ? card.source_refs : [];
  const factRefs = Array.isArray(card.fact_refs) ? card.fact_refs : [];
  return {
    knowledge_id: String(card.card_id),
    title: insight.slice(0, 220) || "Intelligence card",
    summary: implication.slice(0, 2000),
    items: [],
    insight,
    implication,
    potential_moves: pm,
    source_refs: src,
    evidence_refs: factRefs,
    confidence: Number(card.confidence ?? 0.72),
    support_count: factRefs.length || src.length || 1,
    strongest_excerpt: null,
    annotation_status: "clean",
    confidence_source: "worker",
    audit: {
      original_value: {
        title: insight,
        summary: implication,
        items: [],
        insight,
        implication,
        potential_moves: pm
      },
      user_modification: null,
      timestamp: null
    }
  };
}

/**
 * @param {string} dbPath
 * @param {string} projectId
 */
export function buildWorkspacePayload(dbPath, projectId) {
  const db = getAgentChappieDb(dbPath);

  const sourceRows = db
    .prepare(
      `select source_ref, source_kind, created_at, raw_text, status, processing_summary,
              key_takeaway, business_impact, linked_task_titles_json, source_confidence,
              signal_count, knowledge_count, last_used_in_checklist, display_label, competitor, region
       from source_snapshots where project_id = ? order by created_at desc limit 40`
    )
    .all(projectId);

  const observationRows = db
    .prepare(
      `select signal_id, signal_type, summary, observed_at, source_ref, competitor, region, business_impact
       from system_observations
       where project_id = ? and superseded_by is null
       order by observed_at desc limit 200`
    )
    .all(projectId);

  const signalCountBySource = new Map();
  for (const o of observationRows) {
    const ref = String(o.source_ref || "");
    if (!ref) continue;
    signalCountBySource.set(ref, (signalCountBySource.get(ref) || 0) + 1);
  }

  const intelRows = db
    .prepare(
      `select ic.card_id, ic.project_id, ic.insight, ic.implication, ic.potential_moves_json,
              ic.segment, ic.competitor, ic.channel, ic.fact_refs_json, ic.source_refs_json,
              ic.state, ic.expires_at,
              cs.confidence, cs.impact_score, cs.freshness_score, cs.evidence_strength, cs.rank_score,
              cs.quarantine_reason, cs.gate_flags_json
       from intelligence_cards ic
       left join card_scores cs on ic.card_id = cs.card_id
       where ic.project_id = ?
       order by ic.updated_at desc`
    )
    .all(projectId);

  const intelligence_cards = intelRows.map((row) => {
    const potential_moves = parseJsonArray(row.potential_moves_json);
    const fact_refs = parseJsonArray(row.fact_refs_json);
    const source_refs = parseJsonArray(row.source_refs_json);
    return {
      card_id: row.card_id,
      project_id: row.project_id,
      insight: row.insight,
      implication: row.implication,
      potential_moves,
      fact_refs,
      source_refs,
      segment: row.segment || "",
      competitor: row.competitor,
      channel: row.channel,
      state: row.state || "candidate",
      expires_at: row.expires_at,
      confidence: Number(row.confidence ?? 0.6),
      impact_score: Number(row.impact_score ?? 0.5),
      freshness_score: Number(row.freshness_score ?? 0.5),
      evidence_strength: Number(row.evidence_strength ?? 0.5),
      rank_score: Number(row.rank_score ?? 0.5),
      quarantine_reason: row.quarantine_reason,
      gate_flags: row.gate_flags_json ? parseJsonArray(row.gate_flags_json) : []
    };
  });

  const visible_intelligence_cards = intelligence_cards.filter((c) => c.state === "active");

  const managed_sources = db
    .prepare(
      `select source_id, project_id, label, source_kind, content_text, repeat_interval,
              repeat_anchor_at, status, last_run_at, last_result_status, last_result_summary,
              created_at, updated_at
       from managed_sources where project_id = ? order by updated_at desc`
    )
    .all(projectId);

  const managedJobRows = db
    .prepare(
      `select managed_job_id, project_id, name, trigger_type, schedule_text, status, source_id,
              last_run_at, last_result_status, last_action_summary, last_expected_impact, last_runs_json,
              created_at, updated_at
       from managed_jobs where project_id = ? order by updated_at desc`
    )
    .all(projectId);

  const managed_jobs = managedJobRows.map((j) => {
    const { last_runs_json, ...rest } = j;
    return { ...rest, last_runs: parseJsonArray(last_runs_json) };
  });

  let latest_flashcard_pipeline_run = null;
  const pipeRow = db
    .prepare(
      `select run_id, job_id, project_id, pipeline_source, reason, detail_json, created_at
       from flashcard_pipeline_runs where project_id = ? order by created_at desc limit 1`
    )
    .get(projectId);
  if (pipeRow) {
    let detail = {};
    try {
      detail = pipeRow.detail_json ? JSON.parse(pipeRow.detail_json) : {};
    } catch {
      detail = {};
    }
    latest_flashcard_pipeline_run = {
      run_id: pipeRow.run_id,
      job_id: pipeRow.job_id,
      project_id: pipeRow.project_id,
      pipeline_source: pipeRow.pipeline_source,
      reason: pipeRow.reason || "",
      detail,
      created_at: pipeRow.created_at
    };
  }

  const market_summary = {
    pricing_changes: observationRows.filter((r) => r.signal_type === "pricing_change").length,
    closure_signals: observationRows.filter((r) => r.signal_type === "closure").length,
    offer_signals: observationRows.filter((r) => r.signal_type === "offer" || r.signal_type === "asset_sale")
      .length
  };

  /** @type {Array<{fact_id:string,category:string,label:string,confidence:number,source_refs:string[],evidence_refs:string[]}>} */
  const fact_chips = [];
  const usedFactIds = new Set();

  const atomicRows = db
    .prepare(
      `select fact_id, source_ref, fact_type, fact_key, fact_value_json, clause_text, trace_ref, confidence
       from atomic_facts where project_id = ? order by created_at desc limit 80`
    )
    .all(projectId);
  for (const row of atomicRows) {
    const fv = parseJsonObject(row.fact_value_json);
    const label =
      String(row.clause_text || "").trim() ||
      (typeof fv.name === "string" ? fv.name : "") ||
      `${row.fact_type}:${row.fact_key}`;
    fact_chips.push({
      fact_id: row.fact_id,
      category: row.fact_type,
      label: label.slice(0, 280),
      confidence: Number(row.confidence ?? 0.6),
      source_refs: row.source_ref ? [row.source_ref] : [],
      evidence_refs: row.trace_ref ? [String(row.trace_ref)] : []
    });
    usedFactIds.add(row.fact_id);
  }

  const evidenceRows = db
    .prepare(
      `select unit_id, source_ref, unit_kind, label, excerpt, confidence
       from evidence_units where project_id = ? order by created_at desc limit 60`
    )
    .all(projectId);
  for (const eu of evidenceRows) {
    fact_chips.push({
      fact_id: eu.unit_id,
      category: eu.unit_kind || "evidence",
      label: String(eu.label || eu.excerpt || "Evidence unit").slice(0, 280),
      confidence: Number(eu.confidence ?? 0.55),
      source_refs: eu.source_ref ? [eu.source_ref] : [],
      evidence_refs: []
    });
    usedFactIds.add(eu.unit_id);
  }

  for (const o of observationRows.slice(0, 36)) {
    const fid = `obs_signal_${o.signal_id}`;
    if (usedFactIds.has(fid)) continue;
    usedFactIds.add(fid);
    fact_chips.push({
      fact_id: fid,
      category: o.signal_type || "signal",
      label: String(o.summary || o.signal_type).slice(0, 280),
      confidence: 0.62,
      source_refs: o.source_ref ? [o.source_ref] : [],
      evidence_refs: [o.signal_id]
    });
  }

  const hiddenSegments = loadHiddenDraftSegmentIds(db, projectId);
  const draftSegmentRows = db
    .prepare(
      `select segment_id, project_id, segment_kind, title, segment_text, source_refs_json, evidence_refs_json,
              importance, confidence, created_at, updated_at
       from draft_knowledge_segments where project_id = ? order by updated_at desc limit 120`
    )
    .all(projectId);
  const draft_segments = [];
  for (const row of draftSegmentRows) {
    if (hiddenSegments.has(String(row.segment_id))) continue;
    draft_segments.push({
      segment_id: row.segment_id,
      project_id: row.project_id,
      segment_kind: row.segment_kind,
      title: row.title,
      segment_text: row.segment_text,
      source_refs: parseJsonArray(row.source_refs_json),
      evidence_refs: parseJsonArray(row.evidence_refs_json),
      importance: Number(row.importance ?? 0.5),
      confidence: Number(row.confidence ?? 0.5),
      created_at: row.created_at,
      updated_at: row.updated_at
    });
  }

  const knowledgeStateRows = db
    .prepare(
      `select project_id, region, competitor, latest_observed_at, knowledge_json
       from project_knowledge_state where project_id = ? order by latest_observed_at desc limit 12`
    )
    .all(projectId);

  let knowledge_summary = knowledgeStateRows
    .filter((r) => String(r.competitor || "").trim())
    .slice(0, 8)
    .map((r) => ({
      competitor: String(r.competitor),
      region: String(r.region || "global"),
      latest_observed_at: String(r.latest_observed_at)
    }));

  if (knowledge_summary.length === 0 && observationRows.length) {
    const byComp = new Map();
    for (const o of observationRows) {
      const c = String(o.competitor || "").trim() || "Unknown";
      const reg = String(o.region || "global");
      const key = `${c}\t${reg}`;
      const prev = byComp.get(key);
      if (!prev || String(o.observed_at) > prev) {
        byComp.set(key, String(o.observed_at));
      }
    }
    knowledge_summary = [...byComp.entries()].slice(0, 8).map(([k, at]) => {
      const [competitor, region] = k.split("\t");
      return { competitor, region, latest_observed_at: at };
    });
  }

  const monitorRows = db
    .prepare(
      `select job_name, last_run_at, last_source_ref, status from monitor_state order by updated_at desc limit 8`
    )
    .all();
  const monitor_jobs = monitorRows.map((row) => ({
    job_name: row.job_name,
    status: row.status,
    last_run_at: row.last_run_at ?? null,
    last_source_ref: row.last_source_ref ?? null
  }));

  const threats = observationRows
    .filter((o) => o.signal_type === "closure" || String(o.business_impact) === "high")
    .slice(0, 6)
    .map((o) => String(o.summary || "").slice(0, 240));

  const opportunities = observationRows
    .filter((o) =>
      ["offer", "opening", "pricing_change", "proof_signal"].includes(String(o.signal_type))
    )
    .slice(0, 6)
    .map((o) => String(o.summary || "").slice(0, 240));

  const topSource = sourceRows[0];
  const competitive_snapshot = {
    pricing_position:
      observationRows.find((o) => o.signal_type === "pricing_change")?.summary?.slice(0, 400) || "",
    acquisition_strategy_comparison: market_summary.pricing_changes
      ? `${market_summary.pricing_changes} pricing-related signal(s) in the workspace.`
      : "",
    current_weakness: threats[0] || "",
    active_threats: threats,
    immediate_opportunities: opportunities,
    reference_competitor: topSource?.competitor ? String(topSource.competitor) : "",
    risk_level: threats.length > 2 ? "elevated" : "watch"
  };

  const source_cards = sourceRows.slice(0, 16).map((row) => ({
    source_ref: row.source_ref,
    label: String(row.display_label || row.source_ref).slice(0, 200),
    source_kind: row.source_kind,
    status: row.status || "processed",
    processing_summary: row.processing_summary || "",
    last_used_in_checklist: Boolean(row.last_used_in_checklist),
    signal_count: signalCountBySource.get(row.source_ref) ?? row.signal_count ?? 0,
    key_takeaway: row.key_takeaway || "",
    business_impact: row.business_impact || "",
    linked_tasks: parseJsonArray(row.linked_task_titles_json),
    confidence: row.source_confidence ?? 0.58,
    created_at: row.created_at,
    preview: String(row.raw_text || "").slice(0, 220)
  }));

  const knowledge_cards = intelligence_cards.map(intelligenceCardToKnowledgeCard);

  return {
    project_id: projectId,
    recent_sources: sourceRows.slice(0, 5).map((row) => ({
      source_ref: row.source_ref,
      source_kind: row.source_kind,
      created_at: row.created_at,
      preview: String(row.raw_text || "").slice(0, 220)
    })),
    recent_activity: observationRows.slice(0, 6).map((row) => ({
      signal_id: row.signal_id,
      signal_type: row.signal_type,
      summary: row.summary,
      observed_at: row.observed_at,
      source_ref: row.source_ref
    })),
    market_summary,
    fact_chips,
    intelligence_cards,
    visible_intelligence_cards,
    latest_flashcard_pipeline_run,
    draft_segments,
    competitive_snapshot,
    knowledge_summary: knowledge_summary.slice(0, 5),
    monitor_jobs,
    knowledge_cards,
    source_cards,
    managed_sources,
    managed_jobs
  };
}
