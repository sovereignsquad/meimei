# App Architecture & Management Playbook

**Date:** 2026-03-28
**Status:** Proposed Architecture

---

## Current State

All 8 apps/tools live in ONE monolithic structure:

```
agent.meimei/
├── functions/
│   ├── registry.v1.json          ← App definitions
│   ├── inbox.md                  ← Contract docs
│   ├── lead-enrichment.md
│   └── ... (16 contract files)
├── dashboard/
│   └── server.mjs                ← ALL code (7000+ lines!)
├── dashboard/lib/
│   ├── llm.mjs
│   ├── brain/
│   ├── mail-adapter.mjs
│   └── telemetry.mjs
└── brain/                        ← Memory system
```

**Problems:**
- `server.mjs` is 7000+ lines (unmaintainable)
- No clear boundary between apps
- Can't version/reload apps independently
- All logic in one file

---

## Proposed Architecture

### Option A: Monorepo with App Folders (Recommended)

Keep everything in one repo but organize by app:

```
agent.meimei/
├── apps/
│   ├── inbox/
│   │   ├── index.mjs             ← API handler
│   │   ├── page.mjs              ← UI renderer
│   │   ├── settings.mjs          ← Settings page
│   │   ├── README.md             ← App docs
│   │   └── adapter.mjs           ← macOS Mail adapter
│   │
│   ├── lead-enrichment/
│   │   ├── index.mjs
│   │   ├── page.mjs
│   │   ├── settings.mjs
│   │   └── README.md
│   │
│   ├── memory/
│   │   ├── index.mjs
│   │   ├── page.mjs
│   │   ├── settings.mjs
│   │   └── README.md
│   │
│   ├── mission-control/
│   │   ├── index.mjs
│   │   ├── page.mjs
│   │   ├── settings.mjs
│   │   └── telemetry-adapter.mjs
│   │
│   ├── what-next/
│   │   ├── index.mjs
│   │   └── page.mjs
│   │
│   ├── explain-it/
│   │   ├── index.mjs
│   │   └── page.mjs
│   │
│   ├── daily-briefing/
│   │   ├── index.mjs
│   │   └── page.mjs
│   │
│   └── ai-routing/
│       ├── index.mjs
│       └── settings.mjs
│
├── dashboard/
│   ├── server.mjs                ← Core server (routes only)
│   ├── router.mjs                ← App loader/router
│   └── lib/
│       ├── llm.mjs
│       ├── brain/
│       └── ...
│
├── functions/
│   ├── registry.v1.json
│   ├── inbox.md
│   └── ...
│
└── brain/
```

### App Structure Standard

Each app follows this structure:

```
apps/[app-id]/
├── index.mjs          ← API handler (export function handleApi)
├── page.mjs           ← UI renderer (export function renderPage)
├── settings.mjs       ← Settings page (export function renderSettings)
├── adapter.mjs        ← Optional: external service adapter
├── README.md          ← App documentation
└── package.json       ← Optional: app-specific dependencies
```

### App Contract

Every app MUST export:

```javascript
// apps/[app-id]/index.mjs
export async function handleApi(req, body) {
  // Handle POST requests to /api/functions/[app-id]
  // Return: { ok: true, ... } or { ok: false, error: "..." }
}

export function renderPage(layoutDoc) {
  // Return HTML string for the main page
}

export function renderSettings(layoutDoc) {
  // Return HTML string for settings page
}

export const meta = {
  id: "app-id",
  name: "App Name",
  description: "What this app does",
  category: "apps" | "tools"
};
```

### App Registry

`functions/registry.v1.json` defines all apps:

```json
{
  "functions": [
    {
      "id": "inbox",
      "category": "apps",
      "displayName": "Inbox",
      "description": "Email inbox",
      "route": "/dashboard/563/Inbox",
      "api": { "method": "POST", "path": "/api/functions/inbox" },
      "module": "apps/inbox/index.mjs",
      "dependencies": ["mail-adapter", "llm"],
      "status": "production"
    }
  ]
}
```

---

## App Creation Playbook

### Step 1: Define the App

```bash
# Create issue on GitHub
gh issue create --repo moldovancsaba/mvp-factory-control \
  --title "agent.meimei #XXX P0: [App Name]" \
  --body "## Objective\n[What this app does]\n\n## Expected Result\n[Output format]\n\n## Acceptance Criteria\n- [ ] Test 1\n- [ ] Test 2"
```

### Step 2: Create App Structure

```bash
mkdir -p apps/[app-id]
touch apps/[app-id]/index.mjs
touch apps/[app-id]/page.mjs
touch/apps/[app-id]/settings.mjs
touch apps/[app-id]/README.md
```

### Step 3: Add Contract

```bash
cat > functions/[app-id].md << 'EOF'
# [App Name]

**Issue:** #[XXX]
**Category:** apps
**Route:** /dashboard/[id]/[Name]

## Objective
[What this app does]

## API
- Method: POST
- Path: /api/functions/[app-id]

## Actions
- [action1]: Description
- [action2]: Description
EOF
```

### Step 4: Register in Registry

Add to `functions/registry.v1.json`:

```json
{
  "id": "app-id",
  "version": "v1",
  "category": "apps",
  "displayName": "App Name",
  "description": "Short description",
  "catalogOrder": [next_number],
  "route": "/dashboard/[id]/App_Name",
  "api": { "method": "POST", "path": "/api/functions/app-id" },
  "input": { "required": ["action"], "optional": [...] },
  "output": { "statusField": "ok", "requiredFields": ["ok"] },
  "safety": { "untrustedInput": false },
  "capabilities": { "channels": ["dashboard", "api"] },
  "failureModel": { "clearErrorMessages": true }
}
```

### Step 5: Implement App

```javascript
// apps/[app-id]/index.mjs
export async function handleApi(req, body) {
  const action = body.action || "default";
  
  switch (action) {
    case "default":
      return { ok: true, data: "response" };
    default:
      return { ok: false, error: "Unknown action" };
  }
}

export function renderPage(layoutDoc) {
  return `<!DOCTYPE html><html>...</html>`;
}

export function renderSettings(layoutDoc) {
  return `<!DOCTYPE html><html>...</html>`;
}
```

### Step 6: Wire into Server

```javascript
// dashboard/router.mjs
import { handleApi as inboxApi } from "../apps/inbox/index.mjs";
import { handleApi as leadApi } from "../apps/lead-enrichment/index.mjs";

const appHandlers = {
  "inbox": inboxApi,
  "lead-enrichment": leadApi,
  // ...
};

export async function routeToApp(appId, req, body) {
  const handler = appHandlers[appId];
  if (!handler) throw new Error(`App not found: ${appId}`);
  return handler(req, body);
}
```

### Step 7: Test

```bash
curl -s -X POST http://127.0.0.1:3030/api/functions/[app-id] \
  -H "content-type: application/json" \
  -d '{"action":"test"}'
```

### Step 8: Close Issue

```bash
gh issue close [XXX] --repo moldovancsaba/mvp-factory-control \
  --comment "Delivered. App: [app-id]. Route: /api/functions/[app-id]."
```

---

## App Management Rules

### Versioning
- Each app has its own version in registry
- Breaking changes require new version
- Old versions supported for 30 days

### Dependencies
- Apps declare dependencies in registry
- Shared utilities in `dashboard/lib/`
- No circular dependencies

### Testing
- Each app must have `curl` test in README
- CI runs tests on changes
- LLM apps tested with Ollama running

### Documentation
- `README.md` in each app folder
- Contract in `functions/[app-id].md`
- Registry entry in `functions/registry.v1.json`

### Deployment
- Apps loaded dynamically by router
- Hot-reload possible (restart server)
- No need to rebuild entire system

---

## Migration Plan

### Phase 1: Create App Folders (Immediate)
```bash
mkdir -p apps/{inbox,lead-enrichment,memory,mission-control,what-next,explain-it,daily-briefing,ai-routing}
```

### Phase 2: Extract Logic (Next Sprint)
Move code from `server.mjs` to each app folder:
- API handlers → `apps/[id]/index.mjs`
- Page renderers → `apps/[id]/page.mjs`
- Settings → `apps/[id]/settings.mjs`

### Phase 3: Create Router (Final)
```javascript
// dashboard/router.mjs
export function loadApp(appId) {
  return import(`../apps/${appId}/index.mjs`);
}
```

---

## Benefits

| Current | Proposed |
|---------|----------|
| 7000+ line `server.mjs` | 100-line router + app modules |
| Can't reload one app | Hot-reload individual apps |
| No versioning per app | Per-app versioning |
| Hard to find code | Clear app boundaries |
| No clear ownership | App owners documented |

---

## Quick Reference

**Create new app:** Follow Playbook Steps 1-8
**Update existing app:** Edit `apps/[id]/` files, reload server
**Remove app:** Delete folder, remove from registry
**Debug app:** Check `apps/[id]/README.md` for curl test

---

**Maintained by:** KILO + CURSOR
**Last updated:** 2026-03-28
