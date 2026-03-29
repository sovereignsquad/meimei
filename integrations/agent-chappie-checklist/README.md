# Agent.Chappie ↔ MeiMei integration

## Checklist UI in MeiMei (no iframe)

MeiMei **reverse-proxies** `/727/Checklist` (and subpaths) to your local Next.js dev server so you get the full operator UI on the same origin as the dashboard (cookies, `fetch`, RSC). Defaults: upstream `http://127.0.0.1:3000`, path prefix `/checklist` (must match `basePath` in the checklist `next.config`).

- **`MEIMEI_CHECKLIST_LOCAL_UPSTREAM`** — origin only, e.g. `http://127.0.0.1:3000` (default). Set to `none` to disable proxy and show only the MeiMei runtime status shell.
- **`MEIMEI_CHECKLIST_UPSTREAM_PATH_PREFIX`** — default `/checklist`.

If you see **502**, start `next dev` in `consultant-followup-web` (or your checklist app) on the expected port with the matching `basePath`.

The **MeiMei menu bar app** (`macos/MeiMei`, `npm run menubar:build`) includes **Checklist (local Next)** and **Checklist · MeiMei weekly pipeline** entries; default HTTPS path is `/dashboard/727/Checklist` (overridable in Preferences).

## Queue + local SQLite (Node engine)

Production flow matches [checklist runbook](https://github.com/moldovancsaba/checklist/blob/main/docs/07_runbooks/consultant_followup_web.md): the **hosted** Next app holds the Neon queue; a **local** worker claims jobs, writes to **SQLite**, then **`POST`s** completed `job_result` and **workspace** (Know More / cards) to the app.

MeiMei implements that worker loop for the **default Node engine**:

```bash
export APP_QUEUE_BASE_URL="https://checklist.messmass.com"
export WORKER_QUEUE_SHARED_SECRET="…same as Vercel…"
cd /path/to/agent.meimei
npm run agent-chappie:queue-consumer
```

Requires Ollama reachable from MeiMei (same as `POST /jobs` on the bridge). Optional env mirrors the Python consumer: `WORKER_QUEUE_POLL_SECONDS`, `WORKER_QUEUE_DRAIN_ONCE=1`, `WORKER_HTTP_TIMEOUT_*`, etc.

`buildWorkspacePayload` in MeiMei now fills the same top-level fields the hosted app expects: `draft_segments`, `fact_chips` (atomic facts + evidence units + observation chips), `knowledge_cards` (from intelligence cards), `knowledge_summary`, `monitor_jobs`, richer `competitive_snapshot`, and `source_cards` with real `signal_count` / `display_label` labels.

For the **Python** worker, keep using `checklist/scripts/worker_queue_consumer.py`.

## MeiMei-themed checklist UI

`meimei-checklist-theme.css` overrides consultant-followup-web tokens toward the MeiMei green/dark shell. Sync into your checklist clone:

```bash
export CHECKLIST_WEB_APP="/path/to/checklist/apps/consultant-followup-web"
npm run agent-chappie:sync-checklist-theme -- --patch-layout
```

Then deploy the checklist app so [checklist.messmass.com](https://checklist.messmass.com/checklist) picks up the new CSS.

## MeiMei weekly pipeline (Mongo + Playwright) in the checklist app

The **original checklist** flow (competitor snapshots, Mongo insights/recommendations, checklist cards) lives in the Next app at **`/original-checklist`** (footer: “MeiMei weekly pipeline”). LLM calls can use the **same MeiMei Ollama gateway** as Agent.Chappie so routing, secrets, and Ollama stay in one place on the Mac.

### Local MongoDB

1. Run MongoDB locally (Docker example):

   ```bash
   docker run -d --name meimei-checklist-mongo -p 27017:27017 mongo:7
   ```

2. Point the app at it (default in code is `mongodb://127.0.0.1:27017/fortitude-ai`):

   ```bash
   export MONGODB_URI='mongodb://127.0.0.1:27017/fortitude-ai'
   ```

3. No separate “schema migrate” step is required for a fresh DB: Mongoose creates collections on first write when you run the pipeline.

4. Seed **file-backed** inputs under `apps/consultant-followup-web/data/original-checklist/` (`competitors.json`, `knowledge-base.json`). Competitors can also be edited from the `/original-checklist` UI.

5. Install Playwright browser once: `npx playwright install chromium`.

### Route LLM through MeiMei (recommended)

1. Start the **MeiMei dashboard** (the process that serves `/api/llm/gateway/generate` and proxies `/727/Checklist` if configured).

2. Ensure **Ollama** is running with the model you will name in env (e.g. `llama3.2`).

3. In the **checklist** app `.env.local`:

   ```bash
   ORIGINAL_PIPELINE_MEIMEI_GATEWAY_URL=http://127.0.0.1:<DASHBOARD_PORT>/api/llm/gateway/generate
   ORIGINAL_PIPELINE_MEIMEI_MODEL=llama3.2
   ```

   Use the real dashboard port from `config/dashboard-surface.v1.json` / your launchd env. If `MEIMEI_LLM_GATEWAY_SECRET` is set on the dashboard, set **`ORIGINAL_PIPELINE_MEIMEI_GATEWAY_SECRET`** (or `MEIMEI_LLM_GATEWAY_SECRET`) in the Next env so server-side `fetch` can send **`x-meimei-llm-secret`**. Loopback calls work without the secret when the dashboard leaves the secret unset.

4. If the gateway URL is **unset**, behavior is unchanged: the pipeline tries **Ollama → OpenClaw → MLX** on localhost.

### “Feeding” the online (hosted) app

- **Know More / Neon queue / SQLite worker** — unchanged: use `APP_QUEUE_BASE_URL`, `npm run agent-chappie:queue-consumer`, and the hosted checklist URL as documented above. That path does **not** use the Mongo weekly pipeline.

- **Weekly pipeline data** — the pipeline **cannot execute on Vercel** (Playwright + local Mongo). Options:

  1. **Same Mongo in the cloud**: Run MongoDB Atlas (or another host), set `MONGODB_URI` on the machine that runs the pipeline **and** on any deployment that only **reads** checklist data. Run the pipeline on a Mac/CI job that has Playwright + network access.

  2. **Export / sync**: Periodically export Mongo collections (insights, recommendations, checklist items) and import into Atlas, or add a small sync job — not bundled in-repo; pick the tool you already use for backups.

  3. **Operator-only**: Keep production as **demo + queue**; use `/original-checklist` **locally** (or via MeiMei reverse proxy to local Next) to refresh Mongo-backed cards when needed.

### MeiMei shell + local Next

With **`MEIMEI_CHECKLIST_LOCAL_UPSTREAM`** and **`MEIMEI_CHECKLIST_UPSTREAM_PATH_PREFIX=/checklist`**, open **`/727/Checklist/original-checklist`** in the browser to use the pipeline UI on the same origin as the dashboard. Set **`NEXT_PUBLIC_BASE_PATH=/checklist`** in the Next app so client `fetch` paths match.
