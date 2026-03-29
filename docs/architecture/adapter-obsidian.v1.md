# Obsidian adapter — v1

**Process:** `scripts/meimei-adapter-obsidian.mjs` (standalone Node, **not** an Obsidian community plugin).  
**Depends on:** `agent.meimei` job queue + dashboard worker + Ollama (same as Milestone D).  
**Queue:** `docs/architecture/adapter-contract.v1.md`

## Why not a plugin (v1)

The TypeScript plugin lifecycle and distribution are deferred. A **separate daemon** watches the vault with **chokidar**, enqueues work in SQLite, and handles egress—matching the adapter quarantine model.

## Ingress (vault → `meimei_jobs`)

1. **Watch root:** `MEIMEI_OBSIDIAN_VAULT` (absolute path to the vault).
2. **Triggers** (either is enough to enqueue on `add` / `change`):
   - **Inbox path:** file path includes a segment **`_meimei_inbox`** under the vault (e.g. `Vault/_meimei_inbox/Note.md`).
   - **Tag:** file content matches `#meimei-summarize` (whitespace/word-boundary safe regex).
3. **Debounce:** **2000 ms** per file path (`MEIMEI_OBSIDIAN_DEBOUNCE_MS`) so Obsidian auto-save does not enqueue on every keystroke.
4. **Partial writes:** chokidar **`awaitWriteFinish`** (stability window) reduces reads mid-save. For production file drops, prefer **write-to-`*.tmp` then rename** to `*.md` (atomic).
5. **Payload:** `inference_v1` + `request` (OpenAI-shaped) + extension:
   ```json
   "obsidian": { "sourcePath": "<absolute .md path>", "trigger": "inbox" | "tag" }
   ```
6. **Adapter name:** `obsidian`. **No HTTP** to `/api/meimei/route` from the watcher.

**macOS:** Terminal/Node may need **Full Disk Access** to read the vault under `~/Documents` (TCC).

## Egress (completed jobs → vault)

1. The **dashboard worker** runs inference and sets `status = completed`, `result_json` = router output.
2. The **Obsidian daemon** polls SQLite (`listCompletedForAdapter('obsidian')`) on **`MEIMEI_OBSIDIAN_EGRESS_POLL_MS`** (default **5000**).
3. For each row: read `payload.obsidian.sourcePath`, parse `result_json.choices[0].message.content`.
4. If the note already contains `<!-- meimei:job-<id> -->`, **delete** the job row (idempotent).
5. Otherwise **append** a callout block:
   - HTML comment marker + `> [!info] MeiMei summary` + blockquoted lines.
6. **Delete** the job row after a successful append. **Never** write egress from inside `server.mjs`.

## Limits

- Notes larger than **~1.5M characters** are skipped at ingress (defense in depth with router token heuristics).

## Run

```bash
# Terminal 1
npm run dashboard

# Terminal 2
MEIMEI_OBSIDIAN_VAULT="$HOME/Documents/MyVault" npm run adapter:obsidian
```

## Versioning

Bump this doc when triggers, payload shape, or egress format changes.
