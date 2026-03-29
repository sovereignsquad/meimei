/**
 * Neon queue consumer for Agent.Chappie (Node engine): mirrors checklist
 * `scripts/worker_queue_consumer.py` against the hosted Next.js worker API.
 *
 * Flow: claim job → processJobPayload (local SQLite + Ollama) → POST complete → POST workspace.
 */
import { resolveNodeAgentChappieDbPath, isNodeAgentChappieEngine } from "./engine.mjs";
import { processJobPayload } from "./jobs.mjs";
import { buildWorkspacePayload } from "./workspace.mjs";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function requiredEnv(name) {
  const v = String(process.env[name] || "").trim();
  if (!v) throw new Error(`${name} is required`);
  return v;
}

/**
 * @param {string} url
 * @param {object} opts
 * @param {string} opts.method
 * @param {string} opts.secret
 * @param {object | null} opts.body
 * @param {number} opts.timeoutMs
 */
async function requestJson(url, opts) {
  const { method, secret, body, timeoutMs } = opts;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-agent-worker-secret": secret,
        Connection: "close"
      },
      body: body == null ? undefined : JSON.stringify(body)
    });
    const text = await res.text();
    let data = null;
    if (text.trim()) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text.slice(0, 500) };
      }
    }
    return { status: res.status, data };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { status: 0, data: { error: msg } };
  } finally {
    clearTimeout(t);
  }
}

async function postWithRetries(apiBase, path, secret, payload, label, timeoutMs, attempts) {
  const url = `${apiBase.replace(/\/+$/, "")}${path}`;
  const sleepCap = Number(process.env.WORKER_RETRY_SLEEP_CAP_SECONDS || 90) * 1000;
  let last = /** @type {{ status: number, data: unknown }} */ ({ status: 0, data: null });
  for (let attempt = 0; attempt < attempts; attempt++) {
    last = await requestJson(url, {
      method: "POST",
      secret,
      body: payload,
      timeoutMs
    });
    if (last.status === 200) return last;
    if ([400, 401, 403, 404, 422].includes(last.status)) return last;
    const wait = Math.min(sleepCap, 5000 * 2 ** attempt);
    console.warn(
      `[warn] ${label} attempt=${attempt + 1}/${attempts} status=${last.status} sleep=${Math.round(wait / 1000)}s detail=${JSON.stringify(last.data)}`
    );
    await sleep(wait);
  }
  return last;
}

async function claimWithRetries(apiBase, secret, sleepSeconds) {
  const url = `${apiBase.replace(/\/+$/, "")}/api/worker/jobs/claim`;
  const claimTimeout = Number(process.env.WORKER_HTTP_TIMEOUT_CLAIM || 60) * 1000;
  const maxAttempts = 5;
  let last = { status: 0, data: null };
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    last = await requestJson(url, {
      method: "POST",
      secret,
      body: {},
      timeoutMs: claimTimeout
    });
    if (last.status === 200 || last.status === 204) return last;
    console.warn(
      `[warn] claim network/HTTP attempt=${attempt + 1}/${maxAttempts} status=${last.status} ${JSON.stringify(last.data)}`
    );
    await sleep(Math.min(60_000, sleepSeconds * 1000 * 2 ** attempt));
  }
  return last;
}

async function failJobWithRetries(apiBase, secret, jobId, detail) {
  const attempts = Number(process.env.WORKER_FAIL_ATTEMPTS || 6);
  const timeout = Number(process.env.WORKER_HTTP_TIMEOUT_FAIL || 60) * 1000;
  const st = await postWithRetries(
    apiBase,
    `/api/worker/jobs/${encodeURIComponent(jobId)}/fail`,
    secret,
    { error_detail: String(detail).slice(0, 8000) },
    "fail",
    timeout,
    attempts
  );
  if (st.status !== 200) {
    console.error(`[error] could not mark job failed job_id=${jobId} status=${st.status} payload=${JSON.stringify(st.data)}`);
  }
}

const UPLOAD_FAIL_MESSAGE =
  "We analyzed your document on the worker, but saving results to the app failed after several tries " +
  "(usually a temporary network or hosting glitch). Please wait a minute and use Run again, or re-upload.";

/**
 * @param {{ repoRoot: string }} opts
 */
export async function runQueueConsumer(opts) {
  if (!isNodeAgentChappieEngine()) {
    throw new Error(
      "Node engine required. Unset MEIMEI_AGENT_CHAPPIE_ENGINE or set to node. For Python, run checklist repo scripts/worker_queue_consumer.py."
    );
  }

  const apiBase = requiredEnv("APP_QUEUE_BASE_URL");
  const secret = requiredEnv("WORKER_QUEUE_SHARED_SECRET");
  const sleepSeconds = Number(process.env.WORKER_QUEUE_POLL_SECONDS || 3);
  const drainOnce = String(process.env.WORKER_QUEUE_DRAIN_ONCE || "").trim() === "1";

  const completeTimeout = Number(process.env.WORKER_HTTP_TIMEOUT_COMPLETE || 600) * 1000;
  const completeAttempts = Number(process.env.WORKER_COMPLETE_ATTEMPTS || 12);
  const workspaceTimeout = Number(process.env.WORKER_HTTP_TIMEOUT_WORKSPACE || 300) * 1000;
  const workspaceAttempts = Number(process.env.WORKER_WORKSPACE_ATTEMPTS || 8);

  const dbPath = resolveNodeAgentChappieDbPath(opts.repoRoot);

  console.log(`MeiMei Agent.Chappie queue consumer (node) polling ${apiBase}/api/worker/jobs/claim`);
  console.log(`Local SQLite: ${dbPath}`);

  for (;;) {
    const { status, data: claimed } = await claimWithRetries(apiBase, secret, sleepSeconds);
    if (status === 204) {
      if (drainOnce) {
        console.log("[drain_once] queue empty; exiting 0");
        return;
      }
      await sleep(sleepSeconds * 1000);
      continue;
    }
    if (status !== 200 || !claimed || typeof claimed !== "object") {
      console.warn(`[warn] claim failed status=${status} payload=${JSON.stringify(claimed)}`);
      await sleep(sleepSeconds * 1000);
      continue;
    }

    const jobId = String(claimed.job_id || "");
    console.log(`[job] claimed ${jobId}`);

    let result;
    try {
      const projectId = String(claimed.project_id || "");
      const payload = {
        job_request: claimed.job_request,
        source_package: claimed.source_package
      };
      result = await processJobPayload(dbPath, payload);
    } catch (exc) {
      const msg = exc instanceof Error ? exc.message : String(exc);
      await failJobWithRetries(apiBase, secret, jobId, msg);
      console.error(`[error] job ${jobId} failed during processing: ${msg}`);
      await sleep(Math.max(1000, sleepSeconds * 1000));
      if (drainOnce) return;
      continue;
    }

    const cs = await postWithRetries(
      apiBase,
      `/api/worker/jobs/${encodeURIComponent(jobId)}/complete`,
      secret,
      { job_result: result.job_result },
      "complete",
      completeTimeout,
      completeAttempts
    );

    if (cs.status !== 200) {
      console.error(`[error] complete failed after retries job_id=${jobId} status=${cs.status} payload=${JSON.stringify(cs.data)}`);
      await failJobWithRetries(apiBase, secret, jobId, UPLOAD_FAIL_MESSAGE);
      await sleep(Math.max(1000, sleepSeconds * 1000));
      if (drainOnce) return;
      continue;
    }

    console.log(`[job] completed ${jobId}`);

    const projectId = String(claimed.project_id || "");
    if (projectId) {
      try {
        const workspacePayload = buildWorkspacePayload(dbPath, projectId);
        const ws = await postWithRetries(
          apiBase,
          `/api/worker/projects/${encodeURIComponent(projectId)}/workspace`,
          secret,
          { workspace: workspacePayload },
          "workspace",
          workspaceTimeout,
          workspaceAttempts
        );
        if (ws.status !== 200) {
          console.warn(
            `[warn] workspace sync failed after retries project_id=${projectId}: status=${ws.status} payload=${JSON.stringify(ws.data)} (tasks are still in job result)`
          );
        } else {
          console.log(`[sync] workspace pushed ${projectId}`);
        }
      } catch (syncExc) {
        console.warn(`[warn] workspace build/sync failed for ${projectId}: ${syncExc}`);
      }
    }

    if (drainOnce) {
      console.log("[drain_once] finished one job; exiting 0");
      return;
    }

    await sleep(Math.max(1000, sleepSeconds * 1000));
  }
}
