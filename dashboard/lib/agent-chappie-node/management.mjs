/**
 * POST/PATCH/DELETE /projects/... — parity subset for Next.js worker mode.
 */
import { getAgentChappieDb } from "./db.mjs";
import { buildWorkspacePayload } from "./workspace.mjs";
import { processJobPayload } from "./jobs.mjs";
import { applyTaskFeedbackV2, processTaskFeedback } from "./feedback.mjs";

function nowIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function parsePath(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "projects" || parts.length < 3) return null;
  return { projectId: parts[1], parts };
}

/**
 * @returns {Promise<{ status: number, body: object }>}
 */
export async function handleManagementRequest(dbPath, method, pathname, body) {
  const parsed = parsePath(pathname);
  if (!parsed) return { status: 404, body: { error: "not_found" } };
  const { projectId, parts } = parsed;
  const resource = parts[2];
  const db = getAgentChappieDb(dbPath);

  if (resource === "sources") {
    if (method === "POST" && parts.length === 3) {
      db.prepare(
        `insert into managed_sources (
          source_id, project_id, label, source_kind, content_text, repeat_interval, repeat_anchor_at,
          status, last_run_at, last_result_status, last_result_summary
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        body.source_id,
        projectId,
        body.label,
        body.source_kind,
        body.content_text,
        body.repeat_interval ?? "never",
        body.repeat_anchor_at ?? null,
        body.status ?? "active",
        body.last_run_at ?? null,
        body.last_result_status ?? null,
        body.last_result_summary ?? null
      );
      const sources = db
        .prepare(
          `select * from managed_sources where project_id = ? order by updated_at desc`
        )
        .all(projectId);
      return { status: 200, body: { sources } };
    }
    if (method === "PATCH" && parts.length === 4) {
      const sourceId = parts[3];
      const allowed = [
        "label",
        "source_kind",
        "content_text",
        "repeat_interval",
        "repeat_anchor_at",
        "status",
        "last_run_at",
        "last_result_status",
        "last_result_summary"
      ];
      const sets = [];
      const vals = [];
      for (const k of allowed) {
        if (k in body) {
          sets.push(`${k} = ?`);
          vals.push(body[k]);
        }
      }
      if (sets.length) {
        sets.push(`updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')`);
        vals.push(sourceId);
        db.prepare(`update managed_sources set ${sets.join(", ")} where source_id = ?`).run(...vals);
      }
      const sources = db
        .prepare(`select * from managed_sources where project_id = ? order by updated_at desc`)
        .all(projectId);
      return { status: 200, body: { sources } };
    }
    if (method === "DELETE" && parts.length === 4) {
      db.prepare(`delete from managed_sources where source_id = ?`).run(parts[3]);
      const sources = db
        .prepare(`select * from managed_sources where project_id = ? order by updated_at desc`)
        .all(projectId);
      return { status: 200, body: { sources } };
    }
  }

  if (resource === "jobs") {
    if (method === "POST" && parts.length === 3) {
      db.prepare(
        `insert into managed_jobs (
          managed_job_id, project_id, name, trigger_type, schedule_text, status, source_id,
          last_run_at, last_result_status, last_action_summary, last_expected_impact, last_runs_json
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        body.managed_job_id,
        projectId,
        body.name,
        body.trigger_type,
        body.schedule_text ?? null,
        body.status ?? "active",
        body.source_id ?? null,
        body.last_run_at ?? null,
        body.last_result_status ?? null,
        body.last_action_summary ?? null,
        body.last_expected_impact ?? null,
        JSON.stringify(body.last_runs ?? [])
      );
      const jobs = db
        .prepare(`select * from managed_jobs where project_id = ? order by updated_at desc`)
        .all(projectId);
      return { status: 200, body: { jobs: jobs.map(normalizeJobRow) } };
    }
    if (method === "PATCH" && parts.length === 4) {
      const jobId = parts[3];
      const allowed = [
        "name",
        "trigger_type",
        "schedule_text",
        "status",
        "source_id",
        "last_run_at",
        "last_result_status",
        "last_action_summary",
        "last_expected_impact"
      ];
      const sets = [];
      const vals = [];
      for (const k of allowed) {
        if (k in body) {
          sets.push(`${k} = ?`);
          vals.push(body[k]);
        }
      }
      if (body.last_runs !== undefined) {
        sets.push(`last_runs_json = ?`);
        vals.push(JSON.stringify(body.last_runs));
      }
      if (sets.length) {
        sets.push(`updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')`);
        vals.push(jobId);
        db.prepare(`update managed_jobs set ${sets.join(", ")} where managed_job_id = ?`).run(...vals);
      }
      const jobs = db
        .prepare(`select * from managed_jobs where project_id = ? order by updated_at desc`)
        .all(projectId);
      return { status: 200, body: { jobs: jobs.map(normalizeJobRow) } };
    }
    if (method === "DELETE" && parts.length === 4) {
      db.prepare(`delete from managed_jobs where managed_job_id = ?`).run(parts[3]);
      const jobs = db
        .prepare(`select * from managed_jobs where project_id = ? order by updated_at desc`)
        .all(projectId);
      return { status: 200, body: { jobs: jobs.map(normalizeJobRow) } };
    }
  }

  if (resource === "tasks" && method === "POST" && parts.length === 4 && parts[3] === "feedback") {
    try {
      const out = await applyTaskFeedbackV2(dbPath, { ...body, project_id: projectId });
      return { status: 200, body: out };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (
        msg.includes("required") ||
        msg.includes("Unsupported action_type") ||
        msg.includes("edit requires") ||
        msg.includes("does not match")
      ) {
        return { status: 400, body: { error: "invalid_task_feedback", detail: msg } };
      }
      throw e;
    }
  }

  if (resource === "task-feedback" && method === "POST" && parts.length === 3) {
    try {
      const r = await processTaskFeedback(dbPath, projectId, body);
      return {
        status: 200,
        body: { job_result: r.job_result, workspace: r.workspace }
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("requires at least one")) {
        return { status: 400, body: { error: "invalid_task_feedback", detail: msg } };
      }
      throw e;
    }
  }

  if (resource === "checklist" && method === "POST" && parts.length === 3) {
    const jobId = String(body.job_id || `regen_${projectId}_${Date.now()}`);
    const appId = String(body.app_id || "consultant_followup_web");
    const row = db
      .prepare(
        `select * from source_snapshots where project_id = ? order by datetime(created_at) desc limit 1`
      )
      .get(projectId);
    if (!row) {
      return { status: 400, body: { error: "no_source", detail: "Ingest a source before regenerating." } };
    }
    const syntheticJob = {
      job_id: jobId,
      app_id: appId,
      project_id: projectId,
      priority_class: "normal",
      job_class: "light",
      submitted_at: nowIso(),
      requested_capability: "checklist_regenerate",
      input_payload: {
        context_type: "working_document",
        prompt: "Regenerate the three-move competitive checklist from the latest ingested source.",
        artifacts: [{ type: "upload", ref: "regenerate" }]
      }
    };
    const out = await processJobPayload(dbPath, {
      job_request: syntheticJob,
      source_package: {
        source_kind: row.source_kind,
        project_summary: row.project_summary,
        raw_text: row.raw_text,
        source_ref: row.source_ref,
        competitor: row.competitor,
        region: row.region
      }
    });
    return {
      status: 200,
      body: {
        job_result: out.job_result,
        workspace: buildWorkspacePayload(dbPath, projectId)
      }
    };
  }

  if (resource === "generation-memory" && method === "GET" && parts.length === 3) {
    const rows = db
      .prepare(
        `select memory_id, project_id, memory_kind, pattern_key, signal_value, weight, source_feedback_id, created_at, updated_at
         from generation_memory where project_id = ? order by updated_at desc limit 500`
      )
      .all(projectId);
    return { status: 200, body: { generation_memory: rows, count: rows.length } };
  }

  if (resource === "generation-memory" && method === "DELETE" && parts.length === 4) {
    const r = db.prepare(`delete from generation_memory where memory_id = ? and project_id = ?`).run(parts[3], projectId);
    return { status: r.changes ? 200 : 404, body: { deleted: Boolean(r.changes), memory_id: parts[3] } };
  }

  if (resource === "generation-memory" && method === "DELETE" && parts.length === 3) {
    const r = db.prepare(`delete from generation_memory where project_id = ?`).run(projectId);
    return { status: 200, body: { cleared: true, rows_removed: r.changes } };
  }

  if (resource === "held-tasks" && method === "GET" && parts.length === 3) {
    const tasks = db
      .prepare(
        `select held_task_id, project_id, original_title, original_rank, held_at, status from held_tasks
         where project_id = ? and status = 'held' order by held_at desc`
      )
      .all(projectId);
    return { status: 200, body: { held_tasks: tasks, count: tasks.length } };
  }

  return { status: 404, body: { error: "not_found" } };
}

function normalizeJobRow(row) {
  const { last_runs_json, ...rest } = row;
  let last_runs = [];
  try {
    last_runs = last_runs_json ? JSON.parse(last_runs_json) : [];
  } catch {
    last_runs = [];
  }
  return { ...rest, last_runs };
}
