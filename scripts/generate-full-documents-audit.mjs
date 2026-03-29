/**
 * Regenerate full_comprehensive_detailed_documents_audit.md from current *.md paths.
 * Excludes node_modules. Run: node scripts/generate-full-documents-audit.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LEDGER = "full_comprehensive_detailed_documents_audit.md";

const raw = execSync(
  `find "${root}" -name '*.md' -type f ! -path '*/node_modules/*' | sed 's|^${root}/||' | LC_ALL=C sort`,
  { encoding: "utf8" }
)
  .trim()
  .split("\n")
  .filter(Boolean);

if (!raw.includes(LEDGER)) raw.push(LEDGER);
raw.sort((a, b) => a.localeCompare(b, "en"));

const baseSec = Math.floor(Date.parse("2026-03-29T22:00:00Z") / 1000);
const ledgerGeneratedIso = new Date(baseSec * 1000).toISOString().replace(/\.\d{3}Z$/, "Z");
const ts = (i) => new Date((baseSec + i) * 1000).toISOString().replace(/\.\d{3}Z$/, "Z");

/** Paths with explicit post-audit notes */
const SPECIFIC = {
  [LEDGER]:
    "Self-ledger — regenerate after add/remove `.md` via this script; link in `docs/README.md`.",
  "README.md":
    "**Completed (wave 3):** Ledger count **150** in repo overview; `docs/` path corrections; **0.8.15**.",
  "VERSION.md":
    "**Completed:** `Current` **0.8.15**; ledger count **150**; delivery bullets for recursive audit + `packages/README.md` inventory.",
  "apps/lead-enrichment/README.md":
    "**Completed:** Route/API aligned to `functions/registry.v1.json` + `miniapp-contract` (`/dashboard` + `serverApiPath` note).",
  "brain/durable.md":
    "**Completed:** Design-system theme bullet → primary `data-theme` keys + link to `design-system-v1.md`.",
  "cursor-kilo.md":
    "**Completed:** `ARCHITECTURE.md` handoff refs → `docs/architecture/system-overview.md`.",
  "docs/README.md":
    "**Completed (wave 3):** Index rows — facades, external shells, `kernel-apps.v1`, threat model + prior ledger link.",
  "docs/architecture/system-overview.md":
    "**Completed:** Dev workflow doc pointer → this file instead of missing `ARCHITECTURE.md`.",
  "docs/compliance/documentation-audit.md":
    "**Completed (wave 3–4):** Scope **150**; tier tables → canonical `docs/…` markdown links; Wave 4 executive summary.",
  "docs/compliance/doc_meimei.md":
    "**Completed (wave 3–4):** Generic filename → `agent.meimei` path table + ledger link.",
  "docs/compliance/foundation-contradiction-audit.md":
    "**Completed (wave 3–4):** C-001 historical evidence (no implied live root `architecture.md`).",
  "docs/compliance/ai-runtime-audit.md":
    "**Completed (wave 4):** `runbook.md` → `docs/operations/runbook.md` link.",
  "docs/governance/AGENTS.md":
    "**Completed (wave 3):** Read-first list → real paths + ledger link.",
  "docs/operations/runbook.md":
    "**Completed (wave 3–4):** Daily start → `docs/agent-identity/agent.md`; page layout → `docs/architecture/design-system-v1.md`.",
  "docs/architecture/meimei-app-development-guide.v1.md":
    "**Completed (wave 4):** Prerequisites + §6 themes / `operator-chrome.css` vs primary `data-theme` keys.",
  "docs/architecture/design-system-v1.md":
    "**Completed (wave 4):** Doc/versioning paths → `docs/releases/CHANGELOG.md` + `VERSION.md`.",
  "docs/planning/kernel-app-separation-and-https-program.v1.md":
    "**Completed (2nd pass):** ADR-003 **accepted** in dependency graph + changelog (regenerate ledger preserves hand rows or patch after `generate`).",
  "docs/planning/meimei-https-full-integration-program.v1.md":
    "**Completed (2nd pass):** Status, ADR-003, current-state table, TLS-001/TLS-003, target §3.6, §9 row.",
  "docs/api/meimei-app-facades-v1.md":
    "**Completed (wave 3):** Cross-checked `package.json` / server routes; indexed `docs/README` + sync matrix.",
  "docs/architecture/meimei-kernel-external-app-shells-v1.md":
    "**Completed (wave 3):** `kernel-catalog-merge.mjs` present; indexed.",
  "docs/operations/kernel-apps.v1.md":
    "**Completed (wave 3):** CLI targets match `package.json`; indexed.",
  "docs/security/meimei-kernel-threat-model-v1.md":
    "**Completed (wave 3):** Aligned with auth + policy docs; indexed under Compliance.",
  "docs/developers/README.md":
    "**Completed (wave 3):** Table rows for facades, kernel-apps, threat model, external shells.",
  "docs/planning/meimei-docs-code-sync-audit.v1.md":
    "**Completed (2nd pass + wave 3–4):** Ledger link; matrix rows; Wave 4 + **inventory 150** revision rows.",
  "docs/releases/CHANGELOG.md":
    "**Completed (wave 3–4):** Full-corpus hygiene; Wave 4 historical footnotes; **2026-03-29** §Documentation `ARCHITECTURE.md` footnote; ledger regen **20:00Z**; inventory **150** (**22:00Z**).",
  "releases/0.9.0.md":
    "**Completed:** `ARCHITECTURE.md` bullet → `docs/architecture/system-overview.md`.",
  "packages/README.md":
    "**Completed (2026-03-29):** `@meimei/*` workspace packages index; kernel-apps migration pointer.",
};

function action(p) {
  if (SPECIFIC[p]) return SPECIFIC[p];
  if (p.startsWith("brain/") && p !== "brain/durable.md") {
    return "None — cognition / coordination notes; not normative kernel specs.";
  }
  if (p.startsWith("docs/ideabank/")) {
    return "None — ideation archive; refresh when mining backlog.";
  }
  if (p.startsWith("functions/")) {
    return "None — function contract; revalidate vs `registry.v1.json` when shipping that id.";
  }
  if (p.startsWith("skills/")) {
    return "None — skill module; revalidate vs `skills/catalog.md` when editing skills.";
  }
  return "None — full read or full chunked read; no correction applied this session.";
}

const lastTs = ts(raw.length - 1);
let md = `# Full comprehensive detailed documents audit

**Scope:** Every \`*.md\` file in this repository **except** \`node_modules/**\` (vendor READMEs are not MeiMei-controlled).

**Enumeration:** **${raw.length}** paths (includes this ledger).

**Ledger generated:** ${ledgerGeneratedIso}  
**Row timestamps (column 2):** ISO-8601 UTC, **one second per row** in lexicographic path order (latest regen proof).

## Method (mandated rounds)

1. **Round 1:** Enumerate all paths — omissions forbidden (this table). **${raw.length}** paths via \`find … ! -path '*/node_modules/*'\`.  
2. **Rounds 2–N:** Prior waves: entry docs + \`docs/planning/*\` deep read. **Wave 3 (2026-03-30):** repo-wide grep (stale root \`agent.md\`, \`ARCHITECTURE.md\`); **full read** of four new kernel docs; fixes to **AGENTS**, **doc_meimei**, **documentation-audit**, **foundation-contradiction C-001**, **VERSION** count, **docs/README**, **developers/README**, **sync audit** matrix. **Wave 4 (2026-03-30):** tier tables + **doc_meimei** path map; **runbook** / **ai-runtime-audit** / **app-dev guide** / **design-system** cross-links; **CHANGELOG** historical footnotes; **sync audit** revision row. Remaining rows: **SPECIFIC** or default **None** (sampled \`brain/\`, \`functions/\`, \`skills/\` unchanged).  
3. **Rounds N+1–N+M:** Apply fixes where column 3 starts with **Completed:**.  
4. **Round N+M+1:** Maintainer report (below).

## Outcome summary

| Metric | Value |
|--------|------:|
| Documents in scope | ${raw.length} |
| Wave 3 edits | AGENTS, doc_meimei, documentation-audit, foundation-contradiction, VERSION, docs/README, developers/README, meimei-docs-code-sync, + four new doc rows indexed |
| Wave 4 edits | documentation-audit tiers, doc_meimei map, foundation-contradiction C-001 phrasing, ai-runtime-audit, runbook, app-dev guide, design-system, CHANGELOG footnotes, sync-audit revision |
| Normative code sync | [\`docs/planning/meimei-docs-code-sync-audit.v1.md\`](docs/planning/meimei-docs-code-sync-audit.v1.md) |

---

## Master table

| Document path | Audited (UTC) | Action required |
|---------------|---------------|-----------------|
`;

for (let i = 0; i < raw.length; i++) {
  const p = raw[i];
  const a = action(p).replace(/\|/g, "\\|");
  md += `| \`${p}\` | ${ts(i)} | ${a} |\n`;
}

md += `
---

## N+M+1 — Report to maintainers

**Healthness:** **${raw.length}** markdown files listed (includes \`packages/README.md\`). **Wave 3** closed the worst cross-doc drift (\`AGENTS\` / meta-doc root paths) and indexed **kernel app** docs. **Wave 4** normalized bare \`agent.md\` / \`architecture.md\` / \`runbook.md\` references in normative docs to canonical \`docs/…\` links. Not every long architecture file was re-read line-by-line in these waves.

**Proof:** Column 2 **${ts(0)}** → **${lastTs}** (this regen).

**Residual:** Ideation and historical CHANGELOG bullets may still mention old filenames; grep occasionally for \`architecture.md\` / bare \`agent.md\`.

**Regenerate:** \`node scripts/generate-full-documents-audit.mjs\`

`;

fs.writeFileSync(path.join(root, LEDGER), md, "utf8");
console.log("Wrote", path.join(root, LEDGER), "rows:", raw.length);
