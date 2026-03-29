# Admin vs miniapp ops — split (kernel K4)

**Purpose:** Separate **platform configuration** (kernel, listen surface, layout, env store) from **miniapp product operations** (per-registry apps/tools).

| Concern | Lives in | Operators use |
|--------|----------|----------------|
| Listen host/port, public prefix, static routes | `config/dashboard-surface.v1.json`, `openclaw.config.json` | Admin + env; runbook boot |
| Registry catalog & API paths | `functions/registry.v1.json` | Registry validate CI; catalog UI |
| Operator secrets / env SoT | `meimei-env-store`, `config/meimei-env-catalog.v1.json` | Environment variables tool |
| Page layout chrome | `config/page-layout.v1.json`, layout editor in admin | `/admin` |
| Miniapp business behavior | `apps/<id>/index.mjs`, `functions/<id>.md` | Per-miniapp docs + issue boards |

**Rule of thumb:** If it applies to **every** surface (HTTP entry, design system, jobs DB), it is **platform**. If it applies to **one** registry `id`, it is **miniapp ops** — document under `functions/<id>.md`, not only in the admin runbook.

**Companion:** [`meimei-repo-boundaries.v1.md`](meimei-repo-boundaries.v1.md) §2–§3, [`meimei-app-development-guide.v1.md`](../developers/meimei-app-development-guide.v1.md).
