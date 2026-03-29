# Checklist

**Issue:** #727
**Category:** Apps
**Route:** `/727/Checklist` (registry: `/dashboard/727/Checklist`)
**API:** `POST /dashboard/api/functions/checklist`

## Description

Competitor monitoring and decision-support tool. Migrated from standalone Original Checklist app.

## Actions

| Action | Description |
|--------|-------------|
| `list` | Get overview + active checklist items |
| `competitors.list` | Get tracked competitors |
| `competitors.update` | Update competitor list |
| `pipeline.run` | Run weekly snapshot pipeline |
| `pipeline.snapshots` | Get recent snapshots |
| `pipeline.insights` | Get recent insights |
| `checklist.get` | Get active + archived items |
| `checklist.generate` | Generate new recommendations |
| `checklist.update` | Update item status (done/edit/decline/clarify) |
| `annotations.list` | Get feedback annotations |

## Data Storage

Local JSON files in `apps/checklist/data/`:
- `competitors.json` — Tracked competitors
- `snapshots.json` — Captured snapshots
- `insights.json` — Generated insights
- `checklist.json` — Active + archived items
- `annotations.json` — User feedback

## Test

```bash
# List competitors
curl -s -X POST http://127.0.0.1:45285/api/functions/checklist \
  -H "content-type: application/json" \
  -d '{"action":"competitors.list"}'

# Add competitor
curl -s -X POST http://127.0.0.1:45285/api/functions/checklist \
  -H "content-type: application/json" \
  -d '{"action":"competitors.update","competitors":[{"name":"Acme","url":"https://acme.com"}]}'

# Run pipeline
curl -s -X POST http://127.0.0.1:45285/api/functions/checklist \
  -H "content-type: application/json" \
  -d '{"action":"pipeline.run"}'

# Generate recommendations
curl -s -X POST http://127.0.0.1:45285/api/functions/checklist \
  -H "content-type: application/json" \
  -d '{"action":"checklist.generate","businessName":"My Startup"}'
```

## Dependencies

- `dashboard/lib/llm.mjs` (callOllamaJson, parseJsonResponse)
- `dashboard/lib/brain/index.mjs` (brain.log, brain.buildContext)
- Ollama at localhost:11434

## Status

✅ Production — LLM-powered recommendations
