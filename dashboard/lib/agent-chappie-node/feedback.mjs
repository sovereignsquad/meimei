/**
 * Task feedback pipeline (parity with Python process_task_feedback / apply_task_feedback).
 */
import crypto from "node:crypto";
import { getAgentChappieDb } from "./db.mjs";
import { buildWorkspacePayload } from "./workspace.mjs";
import { regenerateProjectChecklist } from "./regenerate.mjs";

export const FEEDBACK_V2_ACTION_TYPES = new Set([
  "done",
  "edit",
  "decline_and_replace",
  "delete_only",
  "delete_and_teach",
  "hold_for_later"
]);

function mapV2ToInternal(actionType) {
  const m = {
    done: "completed",
    edit: "edited",
    decline_and_replace: "declined",
    delete_only: "deleted_silent",
    delete_and_teach: "deleted_with_annotation",
    hold_for_later: "held_for_later"
  };
  const v = m[actionType];
  if (!v) throw new Error(`Unknown action_type: ${actionType}`);
  return v;
}

export function resolveTaskFromChecklist(tasks, taskId) {
  const tid = String(taskId).trim();
  for (const entry of tasks) {
    if (String(entry.task_id || "") === tid) return entry;
    if (String(entry.rank || "") === tid) return entry;
  }
  if (/^\d+$/.test(tid)) {
    const rank = Number(tid);
    for (const entry of tasks) {
      if (Number(entry.rank || 0) === rank) return entry;
    }
    if (rank >= 1 && rank <= tasks.length) return tasks[rank - 1];
  }
  return null;
}

function normalizeTaskKey(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

/**
 * @param {object[]} feedbackRows memory-eligible rows (excludes deleted_silent, completed)
 */
function buildGenerationMemoryRows(feedbackRows) {
  const rows = [];
  for (const row of feedbackRows) {
    const feedbackId = String(row.feedback_id || "");
    const feedbackType = String(row.feedback_type || "");
    const originalTitle = String(row.original_title || "");
    const normalizedTitle = normalizeTaskKey(originalTitle);
    const adjustedText = String(row.adjusted_text || "").trim();

    if (
      ["declined", "commented", "deleted_with_annotation", "held_for_later"].includes(feedbackType) &&
      normalizedTitle
    ) {
      const weight =
        feedbackType === "declined" || feedbackType === "deleted_with_annotation"
          ? 3.0
          : feedbackType === "commented"
            ? 2.0
            : 1.0;
      rows.push({
        memory_kind: "avoid_title",
        pattern_key: normalizedTitle,
        signal_value: originalTitle,
        weight,
        source_feedback_id: feedbackId
      });
    }

    if (adjustedText) {
      const adjustedLower = adjustedText.toLowerCase();
      rows.push({
        memory_kind: "prefer_phrase",
        pattern_key: normalizeTaskKey(adjustedText),
        signal_value: adjustedLower,
        weight: 2.0,
        source_feedback_id: feedbackId
      });
    }
  }
  return rows;
}

function memoryIdFromRow(projectId, row) {
  const h = crypto
    .createHash("sha256")
    .update(`${row.memory_kind}|${row.pattern_key}|${row.signal_value || ""}|${projectId}`)
    .digest("hex")
    .slice(0, 24);
  return `mem_${projectId.slice(0, 24)}_${h}`;
}

export function getProjectActiveChecklist(db, projectId) {
  const row = db
    .prepare(`select project_id, job_id, tasks_json from project_active_checklist where project_id = ?`)
    .get(projectId);
  if (!row) return null;
  let tasks = [];
  try {
    tasks = JSON.parse(row.tasks_json || "[]");
  } catch {
    tasks = [];
  }
  return { project_id: row.project_id, job_id: row.job_id, tasks };
}

export function saveProjectActiveChecklist(db, projectId, jobId, tasks) {
  db.prepare(
    `insert into project_active_checklist (project_id, job_id, tasks_json, updated_at)
     values (?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
     on conflict(project_id) do update set job_id = excluded.job_id, tasks_json = excluded.tasks_json`
  ).run(projectId, jobId, JSON.stringify(tasks));
}

function saveTaskFeedbackRows(db, projectId, jobId, rows) {
  const ins = db.prepare(`
    insert into task_feedback (
      feedback_id, task_id, job_id, project_id, original_title, original_expected_advantage,
      feedback_type, feedback_comment, adjusted_text, replacement_generated, action_type
    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const row of rows) {
    ins.run(
      row.feedback_id,
      row.task_id != null ? String(row.task_id) : null,
      jobId,
      projectId,
      row.original_title,
      row.original_expected_advantage != null ? String(row.original_expected_advantage) : null,
      row.feedback_type,
      row.feedback_comment != null ? String(row.feedback_comment) : null,
      row.adjusted_text != null ? String(row.adjusted_text) : null,
      row.replacement_generated ? 1 : 0,
      row.action_type != null ? String(row.action_type) : null
    );
  }
}

function saveGenerationMemoryRows(db, projectId, memoryRows) {
  const ins = db.prepare(`
    insert into generation_memory (
      memory_id, project_id, memory_kind, pattern_key, signal_value, weight, source_feedback_id
    ) values (?, ?, ?, ?, ?, ?, ?)
    on conflict(memory_id) do update set
      pattern_key = excluded.pattern_key,
      signal_value = excluded.signal_value,
      weight = excluded.weight,
      source_feedback_id = excluded.source_feedback_id,
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
  `);
  for (const row of memoryRows) {
    const memory_id = memoryIdFromRow(projectId, row);
    ins.run(
      memory_id,
      projectId,
      row.memory_kind,
      row.pattern_key,
      row.signal_value ?? null,
      Number(row.weight ?? 1),
      row.source_feedback_id ?? null
    );
  }
}

function saveReplacementHistory(db, projectId, priorTitle, replacementTitle, sourceFeedbackId) {
  const replacementId = `replacement_${projectId}_${crypto.randomUUID().slice(0, 12)}`;
  db.prepare(
    `insert into replacement_history (replacement_id, project_id, prior_task_title, replacement_title, source_feedback_id)
     values (?, ?, ?, ?, ?)`
  ).run(replacementId, projectId, priorTitle, replacementTitle, sourceFeedbackId ?? null);
}

function saveHeldTask(db, projectId, heldTaskId, title, rank) {
  db.prepare(
    `insert into held_tasks (held_task_id, project_id, original_title, original_rank, status)
     values (?, ?, ?, ?, 'held')
     on conflict(held_task_id) do nothing`
  ).run(heldTaskId, projectId, title, rank ?? null);
}

/**
 * @param {string} dbPath
 * @param {string} projectId
 * @param {object} payload { job_id?, current_tasks, task_feedback_items }
 */
export async function processTaskFeedback(dbPath, projectId, payload) {
  const db = getAgentChappieDb(dbPath);
  let jobId = String(payload.job_id || "");
  const feedbackItems = payload.task_feedback_items;
  const currentTasks = Array.isArray(payload.current_tasks) ? payload.current_tasks : [];

  if (!Array.isArray(feedbackItems) || feedbackItems.length === 0) {
    throw new Error("Task feedback requires at least one feedback item.");
  }
  if (!jobId) jobId = `feedback_job_${projectId}_${Date.now()}`;

  const rows = [];
  for (let index = 0; index < feedbackItems.length; index++) {
    const item = feedbackItems[index];
    if (!item || typeof item !== "object") continue;
    rows.push({
      feedback_id: String(item.feedback_id || `task_feedback_${projectId}_${index + 1}_${Date.now()}`),
      task_id: item.task_id ?? item.rank ?? null,
      original_title: String(item.original_title || ""),
      original_expected_advantage: item.original_expected_advantage,
      feedback_type: String(item.feedback_type || "commented"),
      feedback_comment: item.feedback_comment ?? null,
      adjusted_text: item.adjusted_text ?? null,
      replacement_generated: true,
      action_type: item.action_type ?? null
    });
  }

  if (rows.length === 0) throw new Error("Task feedback requires at least one valid feedback item.");

  saveTaskFeedbackRows(db, projectId, jobId, rows);

  const memoryEligible = rows.filter((r) => !["deleted_silent", "completed"].includes(r.feedback_type));
  if (memoryEligible.length) {
    saveGenerationMemoryRows(db, projectId, buildGenerationMemoryRows(memoryEligible));
  }

  for (const row of rows) {
    if (row.feedback_type === "held_for_later") {
      const tid = row.task_id;
      const rank =
        tid != null && String(tid).match(/^\d+$/) ? Number(String(tid)) : null;
      saveHeldTask(
        db,
        projectId,
        String(row.feedback_id || `held_${projectId}_${Date.now()}`),
        row.original_title,
        rank
      );
    }
  }

  const interactedTitles = new Set(rows.map((r) => String(r.original_title || "")));
  const retainedTasks = currentTasks.filter((t) => !interactedTitles.has(String(t.title || "")));

  for (const item of rows) {
    if (item.feedback_type === "edited") {
      const originalTask = currentTasks.find(
        (t) => String(t.title || "") === String(item.original_title || "")
      );
      if (originalTask) {
        const editedTask = {
          ...originalTask,
          title: String(item.adjusted_text || originalTask.title || "")
        };
        retainedTasks.push(editedTask);
      }
    }
  }

  const resultDocument = await regenerateProjectChecklist(dbPath, {
    projectId,
    jobId,
    appId: "consultant_followup_web",
    confidence: 0.74,
    retainedTasks
  });

  const declinedTypes = new Set([
    "declined",
    "commented",
    "deleted_silent",
    "deleted_with_annotation",
    "held_for_later"
  ]);
  const declinedRows = rows.filter((r) => declinedTypes.has(r.feedback_type));
  const newTasks = resultDocument.result_payload.recommended_tasks;
  const n = Math.min(declinedRows.length, newTasks.length);
  for (let i = 0; i < n; i++) {
    saveReplacementHistory(
      db,
      projectId,
      declinedRows[i].original_title,
      newTasks[i].title,
      declinedRows[i].feedback_id
    );
  }

  saveProjectActiveChecklist(db, projectId, jobId, resultDocument.result_payload.recommended_tasks);

  return {
    job_result: resultDocument,
    workspace: buildWorkspacePayload(dbPath, projectId)
  };
}

/**
 * feedback_v2: { project_id, task_id, action_type, comment?, edited_title? }
 */
export async function applyTaskFeedbackV2(dbPath, body) {
  const projectId = String(body.project_id || "").trim();
  const taskId = String(body.task_id || "").trim();
  const actionType = String(body.action_type || "").trim();
  const comment = String(body.comment || "").trim();
  const editedTitle = String(body.edited_title || "").trim();

  if (!projectId || !taskId || !actionType) {
    throw new Error("project_id, task_id, and action_type are required");
  }
  if (!FEEDBACK_V2_ACTION_TYPES.has(actionType)) {
    throw new Error(`Unsupported action_type: ${actionType}`);
  }

  const db = getAgentChappieDb(dbPath);
  let stored = getProjectActiveChecklist(db, projectId);
  let currentTasks;
  let jobId;

  if (!stored || !Array.isArray(stored.tasks) || stored.tasks.length === 0) {
    const jobIdBoot = `bootstrap_${projectId}_${Date.now()}`;
    const resultDocument = await regenerateProjectChecklist(dbPath, {
      projectId,
      jobId: jobIdBoot,
      appId: "consultant_followup_web",
      retainedTasks: []
    });
    saveProjectActiveChecklist(db, projectId, jobIdBoot, resultDocument.result_payload.recommended_tasks);
    currentTasks = resultDocument.result_payload.recommended_tasks;
    jobId = jobIdBoot;
  } else {
    currentTasks = stored.tasks;
    jobId = stored.job_id;
  }

  const target = resolveTaskFromChecklist(currentTasks, taskId);
  if (!target) throw new Error("task_id does not match the active checklist");

  const internalType = mapV2ToInternal(actionType);
  let adjustedText = null;
  if (actionType === "edit") {
    adjustedText = editedTitle || comment || null;
    if (!adjustedText) throw new Error("edit requires edited_title or comment with new wording");
  }

  const feedbackItem = {
    feedback_id: `fb_v2_${projectId}_${Date.now()}`,
    task_id: target.rank,
    original_title: target.title,
    original_expected_advantage: target.expected_advantage,
    feedback_type: internalType,
    feedback_comment: comment || null,
    adjusted_text: adjustedText,
    replacement_generated: true,
    action_type: actionType
  };

  const result = await processTaskFeedback(dbPath, projectId, {
    job_id: jobId,
    current_tasks: [...currentTasks],
    task_feedback_items: [feedbackItem]
  });

  return {
    tasks: result.job_result.result_payload.recommended_tasks,
    job_id: jobId,
    job_result: result.job_result,
    workspace: result.workspace
  };
}
