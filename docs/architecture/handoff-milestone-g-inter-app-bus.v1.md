# Handoff: Milestone G — Inter-app message bus (developer message)

**Use:** Copy or send this to the implementation owner. It assumes **Milestone F (Reference App 1)** is approved.

---

**Subject / heading:** Re: Reference App 1 delivered & next phase — sovereign inter-app communication

This is a massive win. Reference App 1 proves the platform is actually a platform.

By strictly decoupling the UI from the LLM and forcing the AI request through `handleReferenceAppQueueApi` → `meimei_jobs` → `getJobByIdForAdapter`, you have proven that our **Golden Rule** (no ad-hoc LLM calls) works in practice without destroying the user experience. Good catch on the duplicate `checklist` registry ID causing CI issues as well.

**Consider Milestone F (Reference App) fully approved.**

### Next phase: local multi-agent system (inter-app communication)

Now that an app can reach the LLM via the queue, we need **apps to talk to each other**—delegate tasks, run autonomously, and decide within their own bounded scope.

### Architectural constraint (non-negotiable)

If App A sends a **synchronous** HTTP `fetch` to App B’s local API, we get a brittle, hard-to-debug web: when B is blocked on Ollama, A **times out**; chains like A → B → C create **cascading stalls**.

**Apps must not call each other’s APIs for inter-app work.** They must use the SQLite WAL queue as an **asynchronous event bus**.

### Contract (summary)

Full spec: **`docs/architecture/inter-app-message-bus.v1.md`** (includes **§4 Claim Check** / payload size limits and **§5 correlation** — read before coding).

1. **`app_task` envelope** — Extend the queue payload contract beyond `inference_v1`. When App A wants App B to do work, it inserts a job roughly like:

   ```json
   {
     "kind": "app_task",
     "target_adapter": "writer_app",
     "source_adapter": "research_app",
     "payload": {
       "intent": "draft_summary",
       "context_id": "job-9876",
       "constraints": ["bullet_points", "max_500_words"]
     }
   }
   ```

2. **Sovereign inbox** — App B does **not** expose an open HTTP port for peer orders. It runs an **inbox worker** (timer + queue query) that claims jobs where it is the target. It interprets `intent`, applies its own rules, and may **`failed`** invalid work. It decides **how** to execute (e.g. enqueue its own `inference_v1`).

3. **Egress / callback** — When B finishes, it does **not** hold the line open. It enqueues a **new** job addressed back to `source_adapter` (e.g. `research_app`) with the result. A’s loop picks it up asynchronously.

### Your deliverables (Milestone G)

1. Update **`meimei-job-queue.mjs`** and **`docs/architecture/adapter-contract.v1.md`** so **`kind: "app_task"`** with **`source_adapter`** / **`target_adapter`** targeting is specified and implemented (including how rows map to `adapter_name` / `direction`, or a justified schema migration).
2. Build **Reference App 2** and a **producer path**: Reference App 1 (or a minimal dummy) drops an **`app_task`** for Reference App 2; App 2 claims it, processes it, and enqueues a **reply** to the producer’s inbox—**no direct HTTP** between apps.

Let’s turn this queue into a true multi-agent bus.

---

## Coding phase kickoff (docs merged — architect approved)

**Subject / heading:** Re: Artifact spillover & correlation rules (docs merged — cleared for Milestone G)

The spec has been fully updated and merged. Thank you for flagging the database blob-store risk; the Claim Check pattern is the exact right solution.

**Please review the updated specification before writing code:**

- Read **`docs/architecture/inter-app-message-bus.v1.md`** — specifically **§4** (payload size & Claim Check) and **§5** (correlation lineage).
- Note that the artifacts directory is already **`.gitignore`d** under **`data/meimei/artifacts/`**. Do not change this path.

**You are now officially cleared to begin coding Milestone G.** Execute in **two phases**:

1. **Phase 1 (plumbing):** Implement the **ping/pong** handshake first to prove **`app_task` routing**, **inbox polling**, and **egress callbacks** without touching the LLM.
2. **Phase 2 (business value):** Implement the **Standup Digest** workflow. This is where you must prove the correlation rules from **§5**. When Reference App 2 fires its **`inference_v1`** job, it **must** thread **`trace_id`** through so that when it wakes up, it knows exactly how to route the **`app_task`** reply back to Reference App 1.

**PR review criteria:** No synchronous HTTP calls (`fetch`) between apps — strictly the SQLite bus. Say when **ping/pong** is ready for review.
