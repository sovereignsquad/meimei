/**
 * Local SQLite job spooler — `meimei_jobs` table.
 * Contract: docs/architecture/adapter-contract.v1.md
 */

import { mkdirSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite";

const SCHEMA_VERSION = 2;

/**
 * @param {object} payload
 */
export function deriveRoutingMeta(payload) {
  if (!payload || typeof payload !== "object") {
    return { payload_kind: "inference_v1", target_adapter: null, source_adapter: null };
  }
  if (payload.kind === "app_task") {
    return {
      payload_kind: "app_task",
      target_adapter:
        typeof payload.target_adapter === "string" ? payload.target_adapter.trim() || null : null,
      source_adapter:
        typeof payload.source_adapter === "string" ? payload.source_adapter.trim() || null : null
    };
  }
  if (payload.kind === "inference_v1") {
    return { payload_kind: "inference_v1", target_adapter: null, source_adapter: null };
  }
  return { payload_kind: "inference_v1", target_adapter: null, source_adapter: null };
}

/**
 * @param {import("node:sqlite").DatabaseSync} db
 */
function migrate(db) {
  const master = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='meimei_jobs'")
    .get();
  let uv = db.prepare("PRAGMA user_version").get()?.user_version ?? 0;

  if (!master) {
    db.exec(`
    CREATE TABLE meimei_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trace_id TEXT NOT NULL,
      adapter_name TEXT NOT NULL,
      direction TEXT NOT NULL CHECK (direction IN ('ingress', 'egress')),
      payload TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
      retry_count INTEGER NOT NULL DEFAULT 0,
      result_json TEXT,
      error_message TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      payload_kind TEXT,
      target_adapter TEXT,
      source_adapter TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_meimei_jobs_pending ON meimei_jobs (status, id);
    CREATE INDEX IF NOT EXISTS idx_meimei_jobs_app_inbox ON meimei_jobs (status, target_adapter, payload_kind, id);
  `);
    db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
    return;
  }

  if (uv < 2) {
    try {
      db.exec(`ALTER TABLE meimei_jobs ADD COLUMN payload_kind TEXT`);
    } catch {
      /* column exists */
    }
    try {
      db.exec(`ALTER TABLE meimei_jobs ADD COLUMN target_adapter TEXT`);
    } catch {
      /* column exists */
    }
    try {
      db.exec(`ALTER TABLE meimei_jobs ADD COLUMN source_adapter TEXT`);
    } catch {
      /* column exists */
    }

    const rows = db.prepare(`SELECT id, payload FROM meimei_jobs`).all();
    const upd = db.prepare(`
      UPDATE meimei_jobs SET payload_kind = ?, target_adapter = ?, source_adapter = ? WHERE id = ?
    `);
    for (const row of rows) {
      try {
        const p = JSON.parse(String(row.payload));
        const m = deriveRoutingMeta(p);
        upd.run(m.payload_kind, m.target_adapter, m.source_adapter, row.id);
      } catch {
        upd.run("inference_v1", null, null, row.id);
      }
    }

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_meimei_jobs_app_inbox ON meimei_jobs (status, target_adapter, payload_kind, id);
    `);
    db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  }
}

/**
 * @param {string} repoRoot
 */
export function createMeimeiJobQueue(repoRoot) {
  const dir = path.join(repoRoot, "data", "meimei");
  mkdirSync(dir, { recursive: true });
  const dbPath = path.join(dir, "meimei-jobs.sqlite");
  const db = new DatabaseSync(dbPath);
  migrate(db);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA synchronous = NORMAL;");
  db.exec("PRAGMA busy_timeout = 8000;");

  const insert = db.prepare(`
    INSERT INTO meimei_jobs (
      trace_id, adapter_name, direction, payload, status, retry_count,
      result_json, error_message, created_at, updated_at,
      payload_kind, target_adapter, source_adapter
    ) VALUES (?, ?, ?, ?, 'pending', 0, NULL, NULL, ?, ?, ?, ?, ?)
  `);

  const claimInference = db.prepare(`
    UPDATE meimei_jobs
    SET status = 'processing', updated_at = ?
    WHERE id = (
      SELECT id FROM meimei_jobs
      WHERE status = 'pending'
        AND COALESCE(payload_kind, 'inference_v1') = 'inference_v1'
      ORDER BY id ASC
      LIMIT 1
    )
    RETURNING *
  `);

  const claimAppTask = db.prepare(`
    UPDATE meimei_jobs
    SET status = 'processing', updated_at = ?
    WHERE id = (
      SELECT id FROM meimei_jobs
      WHERE status = 'pending'
        AND payload_kind = 'app_task'
        AND target_adapter = ?
      ORDER BY id ASC
      LIMIT 1
    )
    RETURNING *
  `);

  const complete = db.prepare(`
    UPDATE meimei_jobs
    SET status = 'completed', result_json = ?, error_message = NULL, updated_at = ?
    WHERE id = ?
  `);

  const failPermanent = db.prepare(`
    UPDATE meimei_jobs
    SET status = 'failed', error_message = ?, result_json = NULL, updated_at = ?
    WHERE id = ?
  `);

  const requeue = db.prepare(`
    UPDATE meimei_jobs
    SET status = 'pending', retry_count = ?, error_message = ?, updated_at = ?
    WHERE id = ?
  `);

  const resetStaleProcessing = db.prepare(`
    UPDATE meimei_jobs SET status = 'pending', updated_at = ?
    WHERE status = 'processing'
  `);

  const listCompletedForAdapterStmt = db.prepare(`
    SELECT * FROM meimei_jobs
    WHERE adapter_name = ? AND status = 'completed'
    ORDER BY id ASC
    LIMIT ?
  `);

  const deleteJobStmt = db.prepare(`DELETE FROM meimei_jobs WHERE id = ?`);

  const getFullByIdStmt = db.prepare(`SELECT * FROM meimei_jobs WHERE id = ?`);

  const listInboxStmt = db.prepare(`
    SELECT id, trace_id, adapter_name, status, payload, result_json, error_message,
           created_at, updated_at, payload_kind, target_adapter, source_adapter
    FROM meimei_jobs
    WHERE payload_kind = 'app_task' AND target_adapter = ?
    ORDER BY id DESC
    LIMIT ?
  `);

  const listTraceForPartyStmt = db.prepare(`
    SELECT id, trace_id, adapter_name, status, payload, result_json, error_message,
           created_at, updated_at, payload_kind, target_adapter, source_adapter
    FROM meimei_jobs
    WHERE trace_id = ?
      AND payload_kind = 'app_task'
      AND (target_adapter = ? OR source_adapter = ?)
    ORDER BY id ASC
    LIMIT ?
  `);

  return {
    dbPath,

    resetProcessingToPending() {
      resetStaleProcessing.run(Date.now());
    },

    /**
     * @param {{ traceId?: string, adapterName: string, direction?: 'ingress'|'egress', payload: object }} opts
     * @returns {number} job id
     */
    enqueueIngress(opts) {
      const meta = deriveRoutingMeta(opts.payload);
      const traceId = (opts.traceId && String(opts.traceId).trim()) || crypto.randomUUID();
      const direction = opts.direction === "egress" ? "egress" : "ingress";
      const now = Date.now();
      const payloadJson = JSON.stringify(opts.payload);
      const adapterName =
        meta.payload_kind === "app_task" && meta.target_adapter
          ? String(meta.target_adapter)
          : String(opts.adapterName);
      insert.run(
        traceId,
        adapterName,
        direction,
        payloadJson,
        now,
        now,
        meta.payload_kind,
        meta.target_adapter,
        meta.source_adapter
      );
      const row = db.prepare("SELECT last_insert_rowid() AS id").get();
      return Number(row?.id);
    },

    /** Inference worker: next pending inference_v1 only. */
    claimNextInferencePending() {
      const now = Date.now();
      const row = claimInference.get(now);
      return row || null;
    },

    /** Sovereign inbox: next app_task for this target_adapter. */
    claimNextAppTaskForTarget(targetAdapter) {
      const now = Date.now();
      const row = claimAppTask.get(now, String(targetAdapter));
      return row || null;
    },

    /** @deprecated use claimNextInferencePending — kept for scripts that expect old name */
    claimNextPending() {
      const now = Date.now();
      const row = claimInference.get(now);
      return row || null;
    },

    markCompleted(id, resultJson) {
      complete.run(resultJson, Date.now(), id);
    },

    markPermanentFailure(id, errorMessage) {
      failPermanent.run(String(errorMessage).slice(0, 4000), Date.now(), id);
    },

    markRetryOrDeadLetter(id, currentRetryCount, errorMessage, maxFailures) {
      const next = currentRetryCount + 1;
      const msg = String(errorMessage).slice(0, 4000);
      if (next >= maxFailures) {
        failPermanent.run(msg, Date.now(), id);
      } else {
        requeue.run(next, msg, Date.now(), id);
      }
    },

    listCompletedForAdapter(adapterName, limit = 10) {
      const lim = Math.max(1, Math.min(100, Number(limit) || 10));
      return listCompletedForAdapterStmt.all(String(adapterName), lim);
    },

    deleteJob(id) {
      deleteJobStmt.run(Number(id));
    },

    getJobByIdForAdapter(id, adapterName) {
      const row = getFullByIdStmt.get(Number(id));
      if (!row || String(row.adapter_name) !== String(adapterName)) return null;
      return row;
    },

    /**
     * Job visible if party is adapter_name, source_adapter, target_adapter, or legacy payload match.
     * @param {number} id
     * @param {string} partyAdapter
     */
    getJobByIdForParty(id, partyAdapter) {
      const row = getFullByIdStmt.get(Number(id));
      if (!row) return null;
      const p = String(partyAdapter);
      if (String(row.adapter_name) === p) return row;
      if (row.source_adapter && String(row.source_adapter) === p) return row;
      if (row.target_adapter && String(row.target_adapter) === p) return row;
      try {
        const pl = JSON.parse(String(row.payload));
        if (pl.source_adapter === p || pl.target_adapter === p) return row;
      } catch {
        /* ignore */
      }
      return null;
    },

    listInboxAppTasksForTarget(targetAdapter, limit = 20) {
      const lim = Math.max(1, Math.min(100, Number(limit) || 20));
      return listInboxStmt.all(String(targetAdapter), lim);
    },

    listAppTasksForTraceParty(traceId, partyAdapter, limit = 30) {
      const lim = Math.max(1, Math.min(100, Number(limit) || 30));
      return listTraceForPartyStmt.all(String(traceId), String(partyAdapter), String(partyAdapter), lim);
    }
  };
}
