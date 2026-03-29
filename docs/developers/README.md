# Developer guides — MeiMei kernel

Documentation for engineers who **design against**, **extend**, or **operate** the MeiMei platform core (the **kernel**): bounded HTTP entry, contract-first inference, job spooler, registry, and shared libraries.

| Document | Audience | Purpose |
|----------|----------|---------|
| [meimei-kernel-handbook.v1.md](meimei-kernel-handbook.v1.md) | Architects, senior implementers | Handbook: invariants, boot, config, HTTP dispatch, registry, inference, jobs, persistence, integration modes, observability |
| [../architecture/meimei-system-vision-and-platform-audit.v3.md](../architecture/meimei-system-vision-and-platform-audit.v3.md) | Architects, product, integrators | **Vision audit (v3):** what the system is for, design theory, workflows, what to build on the application layer |
| [../architecture/meimei-kernel-code-audit.v1.md](../architecture/meimei-kernel-code-audit.v1.md) | Tech leads, auditors, integrators | Evidence-based audit: module inventory, contracts, concurrency, CI matrix, commentary assessment, K1–K4 alignment |
| [../architecture/system-overview.md](../architecture/system-overview.md) | All developers | Product-level architecture (LLM layer, Brain, dashboard surfaces) |
| [../architecture/meimei-repo-boundaries.v1.md](../architecture/meimei-repo-boundaries.v1.md) | Contributors | Layer model, `dashboard/lib` allowlist, `server.mjs` rules |
| [../api/inference-route.v1.md](../api/inference-route.v1.md) | API consumers | Normative `POST /api/meimei/route` contract |
| [../compliance/ai-runtime-audit.md](../compliance/ai-runtime-audit.md) | Product and engineering leadership | Which surfaces use Ollama, OpenClaw, rules, or non-LLM data — use before external claims |

**Reading order**

1. [system-overview.md](../architecture/system-overview.md) — product context.  
2. [meimei-system-vision-and-platform-audit.v3.md](../architecture/meimei-system-vision-and-platform-audit.v3.md) — purpose, theory, pipelines, application-layer opportunities.  
3. [meimei-repo-boundaries.v1.md](../architecture/meimei-repo-boundaries.v1.md) — what may depend on what.  
4. [meimei-kernel-code-audit.v1.md](../architecture/meimei-kernel-code-audit.v1.md) — evidence and inventory.  
5. [meimei-kernel-handbook.v1.md](meimei-kernel-handbook.v1.md) — operational and integration detail.  
6. [inference-route.v1.md](../api/inference-route.v1.md) — request/response truth for the inference seam.  
7. [ai-runtime-audit.md](../compliance/ai-runtime-audit.md) — full runtime map when messaging or scoping features.
