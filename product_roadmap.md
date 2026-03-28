# Product roadmap — agent.meimei (executive view)

**Updated:** 2026-03-27  
**Board:** [MVP Factory Board](https://github.com/users/moldovancsaba/projects/1) — product filter `agent.meimei`.

---

## Where we are

MeiMei delivers value through two surfaces:

| Surface | Who uses it | What it does |
|---------|-------------|--------------|
| **Apps** (`/apps`) | Joe (end user) | Solves problems — "Explain it", "Brief me" |
| **Tools** (`/tools`) | Operator | Configures the system — AI routing, API access |

Every product is a **miniapp** with a stable contract, a URL, and an API path. Foundation is solid. Now we ship value.

---

## Shipped products

### Apps (Joe's everyday tools)

| App | Issue | Status | In one sentence |
|-----|-------|--------|-----------------|
| **Explain it** | [#516](https://github.com/moldovancsaba/mvp-factory-control/issues/516) | Live | Paste a URL or PDF; get a fast structured explanation. Schedule daily briefings. |
| **Brief me** | [#518](https://github.com/moldovancsaba/mvp-factory-control/issues/518) | Merged into Explain it | "Set alarm" on Explain it handles scheduled briefings. |

### Tools (Operator configuration)

| Tool | Issue | Status | In one sentence |
|------|-------|--------|-----------------|
| **AI routing** | [#517](https://github.com/moldovancsaba/mvp-factory-control/issues/517) | Live | Configure how requests route to different AI models by channel, task type, and cost. |
| **API access** | [#700](https://github.com/moldovancsaba/mvp-factory-control/issues/700) | Live | Manage API integration: policy, audit trail, telemetry. The spine for external systems. |

---

## Priority delivery list

Ordered by **impact × dependencies**. Ship top to bottom.

### Phase 1: Daily value (highest impact)

| Priority | Name | Type | Issues | Why now | Dependencies |
|----------|------|------|--------|---------|--------------|
| **1** | **What next?** | App | NEW | Daily recurring engagement. Answers Joe's #1 question. | Explain it, AI routing |
| **2** | **AI routing presets** | Tool | #585 | One-click optimization. No manual config every time. | AI routing |

### Phase 2: Polish (habit formation)

| Priority | Name | Type | Issues | Why now | Dependencies |
|----------|------|------|--------|---------|--------------|
| **3** | **Explain it history** | App | #575 | Never lose a summary. Enables future research. | Explain it |
| **4** | **Copy to clipboard** | App | #573 | Instant usability win. | Explain it |
| **5** | **Progress reporting** | App | #577 | Confidence builder. Shows work happening. | Explain it |

### Phase 3: Observability (operator trust)

| Priority | Name | Type | Issues | Why now | Dependencies |
|----------|------|------|--------|---------|--------------|
| **6** | **Mission control** | Tool | #639 | Full task/log/agent visibility. | Telemetry baseline (#710) |
| **7** | **Health checks** | Tool | #520, #522 | Catch failures before Joe notices. | Telemetry |
| **8** | **Audit trail** | Tool | #709 | Compliance and debugging. | Decision audit pipeline |

### Phase 4: Intelligence (AI improvement)

| Priority | Name | Type | Issues | Why now | Dependencies |
|----------|------|------|--------|---------|--------------|
| **9** | **Business brain** | Platform | #605 | Long-term memory. Reduces repetition. | Memory layer (#564) |
| **10** | **Autonomous learning** | Platform | #647 | Agent improves every 3 hours. | Business brain |

---

## Backlog by category

Issues not in priority list are organized below by where they belong.

### Apps (Joe's tools)

| Category | Issues | Notes |
|----------|--------|-------|
| **Explain it addons** | #573–#584 | History, clipboard, progress, PDF metadata, trust signals |
| **Research** | #535 | "Read this for research" framing |
| **Email triage** | #519 | Draft-only triage with urgent alerts |
| **Calendar** | #529, #533 | Meeting coordination, family calendar |
| **Voice/Screenshot** | #527, #528 | Capture tools |
| **Multi-agent** | #526, #542 | Parallel research |

### Tools (Operator configuration)

| Category | Issues | Notes |
|----------|--------|-------|
| **AI routing** | #585–#587 | Presets, route history, per-channel defaults |
| **Daily briefing** | #588–#595 | Sources, sinks, output routing, delivery status |
| **Channels** | #536, #620, #621, #624 | WhatsApp, Discord, Telegram |
| **Connectors** | #609, #628–#632 | GitHub, Email, Calendar, CRM |
| **Webhooks** | #625–#627 | Form pipeline, workflow automation |
| **Security** | #525, #524, #597 | Audit routines, prompt injection screening |
| **Memory** | #564, #568, #604 | Durable memory, QMD backend |

### Platform (foundation)

| Category | Issues | Notes |
|----------|--------|-------|
| **Business brain** | #601, #602, #603 | Context prompts, identity, soul file |
| **Multi-agent** | #607, #612, #618 | Builder/orchestrator/executor, brain-muscle split |
| **Model optimization** | #613, #614, #617 | Caching, context capping, token optimization |
| **Mission control** | #635, #636, #639 | Command center, real-time control |

---

## New product recommendation: "What next?"

### The product

An app that answers Joe's daily question: **"What should I focus on today?"**

Combines:
- **Scheduled briefing** (Explain it with alarm)
- **Source ranking** (configurable priority sources)
- **Action recommendations** (what to do with the information)

### The UX

```
6:00 AM — Joe wakes up
↓
MeiMei delivers "What next?" briefing:
- Top 3 priorities from sources
- Conflicts to resolve
- Opportunities to chase
↓
Joe acts or delegates
↓
MeiMei learns from outcomes
```

### Why this is #1

| Factor | Score | Notes |
|--------|-------|-------|
| Recurring value | ★★★★★ | Daily habit = stickiness |
| Problem clarity | ★★★★★ | "What should I do?" is universal |
| Differentiation | ★★★★★ | No competitor does this |
| Dependencies | ★★★☆☆ | Uses existing tools |
| Time to MVP | ★★★★☆ | 1-2 weeks |

### Roadmap position

This is **Phase 1 #1** — the highest impact deliverable. It combines Explain it + AI routing into a new product that answers Joe's daily question.

---

## How to read this with the board

1. **Shipped truth** — Apps: Explain it. Tools: AI routing, API access.
2. **Priority** — Phase 1 list is ordered by impact × effort. Start at #1.
3. **New products** — Track **What next?** on the board as [#724](https://github.com/moldovancsaba/mvp-factory-control/issues/724); new miniapps still use `miniapp-contract-v1.md`.
4. **Addons** — Issues #573–#595 are improvements to existing products, not new products.
5. **Platform** — Issues #601–#723 are foundation/platform work. Deliver after Phase 1-3.
6. **knowmore** — `/knowmore` cards are driven by `config/knowmore-releases.v1.json` (foundation spine **#692–#724** on [mvp-factory-control](https://github.com/moldovancsaba/mvp-factory-control)), with **open/closed** synced from GitHub periodically. The [Project 1 board](https://github.com/users/moldovancsaba/projects/1) is authoritative for workflow; refresh the JSON when board status diverges.

---

## Document control

- **Audience:** OC, product owner, operators
- **Not for:** technical API specs (use `miniapp-contract-v1.md` and `functions/registry.v1.json`)
- **Companion:** [roadmap.md](./roadmap.md) for technical phases
- **Board hygiene:** All issues tagged `agent.meimei` on the MVP Factory board
