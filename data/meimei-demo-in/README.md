# Demo file-drop inbox (MeiMei)

Place **one JSON file per job** in this directory (not in `processed/` or `failed/`).

Run the ingest process (separate terminal from the dashboard):

```bash
npm run jobs:demo-file-drop
```

Each `*.json` file is moved to `processed/` after a row is inserted into `meimei_jobs`, or to `failed/` if the file is invalid.

## File shape

Same envelope as the `payload` column in `adapter-contract.v1.md`:

```json
{
  "traceId": "optional-correlation-id",
  "kind": "inference_v1",
  "request": {
    "model": "router-auto",
    "messages": [{ "role": "user", "content": "Say hello in three words." }],
    "stream": false,
    "meimei": { "localOnly": true, "taskCategory": "summarize" }
  }
}
```

Requires a running dashboard (`npm run dashboard`) so the in-process worker can drain the queue.
