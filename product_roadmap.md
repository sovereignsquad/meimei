# Product roadmap — agent.meimei (executive view)

This document is the **plain-English** story of what MeiMei delivers as **miniapps**, what is **already shipped**, and what we are **considering next** as feature requests (FR) and change requests (CR). It is meant for OC and leadership: **orientation**, not a technical specification. Technical detail lives in the repo and in individual GitHub issues.

**Board:** [MVP Factory Board](https://github.com/users/moldovancsaba/projects/1) — product filter `agent.meimei`.  
**How we link issues:** [issue-merge-walkthrough.md](./issue-merge-walkthrough.md).

---

## Where we are

MeiMei is moving from **strong foundations** (contracts, design system, local operator experience) toward **repeatable product delivery**: each idea becomes a **miniapp** with a stable id, a clear UI, and an API path. Three miniapps are **delivered in the product** today; everything else on the board is **future intent** until it ships.

---

## Shipped miniapps (baseline)

These are **Done** on the MVP Factory board and **live** in the dashboard (issue id is the stable anchor in URLs).

| Miniapp | Issue | In one sentence |
|--------|-------|------------------|
| **Any-URL summarization** | [#516](https://github.com/moldovancsaba/mvp-factory-control/issues/516) | Paste a link (including PDF); get a fast, structured summary. |
| **Per-channel model routing** | [#517](https://github.com/moldovancsaba/mvp-factory-control/issues/517) | See which model path fits a channel, task type, and cost target before you spend a turn. |
| **Daily briefing** | [#518](https://github.com/moldovancsaba/mvp-factory-control/issues/518) | Generate a day-start briefing and land it in Apple Notes (with markdown fallback). |
| **API channel adapter (reference)** | [#700](https://github.com/moldovancsaba/mvp-factory-control/issues/700) | Inspect the adapter spine (policy, audit, telemetry, lifecycle) that WhatsApp, iMessage, and Discord attach to. |

Together they prove the **end-to-end pattern**: one place to run the function, one contract, one honest result. **#700** is the **channel basement**, not a consumer chat app by itself.

---

## Future value tied to those three apps

Below is **not a commitment order**. It is **how backlog ideas cluster** so you can see what “better” looks like per miniapp after the baseline exists.

### Any-URL summarization (#516) — themes

- **Research intake (FR)** — [#535](https://github.com/moldovancsaba/mvp-factory-control/issues/535): richer “read this for me as research” framing on top of the same summarization core (plain-English spec in the issue). *Classified as an FR for #516; see traceability on the issue.*
- **Operator polish (FR/CR mix)** — ideas such as **copy to clipboard**, **history**, **clearer error states**, **progress/status**, **PDF metadata/citations**, **trust signals**, **long-article layout** (representative issues in the **#573–#584** range on the board) read as **the product maturing** after first delivery: fewer dead ends, more confidence, more reuse.

*Interpretation:* Most of these **assume #516** exists; they are **not** separate products unless we explicitly split them into new miniapps.

### Per-channel model routing (#517) — themes

- **Routing intelligence (FR)** — e.g. [#521](https://github.com/moldovancsaba/mvp-factory-control/issues/521) (context separation / pollution reduction): makes recommendations **more trustworthy** as channels multiply.
- **Overlap watch (CR/duplicate risk)** — [#561](https://github.com/moldovancsaba/mvp-factory-control/issues/561) sits close to the same job as #517; during walkthrough, decide **merge vs. refine** so the board does not carry two truths.

### Daily briefing (#518) — themes

- **Depth and reliability (FR/CR)** — sink options, source health, section contracts, run history (already discussed as next steps in product work). Treat these as **making the briefing boringly dependable**, not as new surface area unless scope explodes.

---

## Beyond the three miniapps

The board lists many **agent.meimei** ideas (email triage, health checks, Discord/Telegram, skills publishing, memory, etc.). Those are **candidate future miniapps or platform programs** until they pass intake, get a contract, and earn their own delivery issue. They belong in the board’s **IDEA BANK** until gated; they should not blur the story of **516 / 517 / 518**.

---

## How to read this with the board

1. **Shipped truth** — three issues **Done**: #516, #517, #518.  
2. **Next conversation** — pick one cluster (e.g. summarization polish vs. routing depth vs. briefing reliability).  
3. **Traceability** — FR/CR items should name their **target miniapp issue** in the issue body (see walkthrough template).  
4. **Refresh** — Update this file when a cluster **ships** or when you **reclassify** a large issue (merge/split).

---

## Document control

- **Audience:** OC, product owner, operators.  
- **Not for:** low-level API field lists (use `miniapp-contract-v1.md` and `functions/registry.v1.json`).  
- **Companion:** Technical phase outlook remains in [roadmap.md](./roadmap.md) (foundation vs. channels vs. reliability phases).  
- **Board hygiene (2026-03-27):** GitHub issue bodies now include the **Product traceability (agent.meimei)** block (FR/CR + target miniapp or platform). First batch: `#521`, `#561`, `#573`–`#584` (and `#535` → `#516`). **Continued:** `#519`–`#534`, `#536`–`#550`, `#551`–`#566`, `#567`–`#572`, `#585`–`#590` (includes **#585–#587** → `#517`, **#588–#590** → `#518`).
