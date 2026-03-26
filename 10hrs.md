# 10 Hours Working Draft

This file is a transcript-backed ranking worksheet for the ideas kept from the `Master OpenClaw in 10 Hours [I Created 5 AI Employees]` source.

Each entry is written to help with product judgment before issue creation:
- `Transcript basis`: what the presenter explicitly shows, names, or repeats in the video.
- `Draft shape`: the cleanest product, function, connector, or business surface this idea could become.
- `Draft user story`: plain-English behavior statement, not marketing copy.
- `Dependencies`: only the dependencies that materially unlock or strengthen the idea.

Current source set:
- Video: [Master OpenClaw in 10 Hours [I Created 5 AI Employees]](https://www.youtube.com/watch?v=E7fCvH-W61U)
- Community / source code: [join.verticalsystems.io](https://join.verticalsystems.io/)
- Skool community: [skool.com/aibox/about](https://www.skool.com/aibox/about)
- Free guide: [mani-k.kit.com/claw](https://mani-k.kit.com/claw)
- Discovery call: [mani.wiki/discovery](https://mani.wiki/discovery)
- Tech stack page: [building-your-tech-stack-o5f3o8g.gamma.site](https://building-your-tech-stack-o5f3o8g.gamma.site/)

Reference chapters used throughout:
- `0:18:47` Installation & Setup
- `0:27:59` Sub-Agent Configuration
- `0:34:59` Token Optimization
- `0:58:05` Security
- `1:21:47` Business Brain - Level 1
- `1:24:24` Business Brain - Level 2 & 3
- `1:32:22` Memory Architecture
- `1:36:09` Mission Control Dashboard
- `1:57:51` Integrations
- `2:03:44` Task Management
- `3:23:06` Builder, Orchestrator & Executor
- `4:28:45` Business Operations Loop
- `4:33:08` Meeting Intelligence
- `5:50:46` Voice AI & Phone Agent
- `6:23:20` Typeform Clone & Webhooks
- `6:30:45` AI SDR & Email Engine
- `8:13:27` Multi-Agent Orchestration
- `8:38:09` Cronjobs & Automations
- `8:55:02` Discord Integration
- `9:10:15` Claw Alley - Agent-to-Agent Marketplace

## Core Operating Ideas

### 2. Cronjob-driven daily business digest with an 8 a.m. briefing
- Transcript basis: In the automation section, Mani describes a recurring digest that compiles meetings, action items, campaigns, AI logs, memory, and business deltas, then sends it at `8 a.m. Pacific`.
- Draft shape: A scheduled daily-ops briefing function that turns yesterday's operational noise into one executive summary with risks, wins, follow-ups, and anomalies.
- Draft user story: As an operator, I want MeiMei to send one clean morning briefing that tells me what changed across meetings, campaigns, tasks, and system health so I can start the day with priorities instead of manual review.
- Dependencies: `#72` Cronjob automation manager, `#73` Daily digest email at 8 a.m., `#74` AI log summarizer, `#76` Calendar integration, `#101` Email connector.

### 3. AI SDR and email engine for personalized outreach, analytics, and tracking
- Transcript basis: The `AI SDR & Email Engine` chapter shows campaign creation, templates, sequences, analytics, lead enrichment, natural-language campaign instructions, and the loop where the system learns from campaign results.
- Draft shape: A sales-outreach function that creates campaigns, personalizes messages, tracks delivery/reply metrics, and pushes insights back into the operating loop.
- Draft user story: As a founder or operator, I want MeiMei to build and run outbound email campaigns with measurable performance so I can scale outreach without turning every campaign into manual work.
- Dependencies: `#62` SDR analytics dashboard, `#63` Campaign templates and auto replies, `#64` Lead enrichment workflow, `#65` Hyper-personalized cold email campaigns, `#101` Email connector, `#108` CRM-style lead enrichment connector.

### 5. Business Brain memory architecture with durable context layers
- Transcript basis: The `Business Brain` and `Memory Architecture` chapters separate identity, mission, strategy, business context, durable memory, and append-only logs. The presenter explicitly uses this to avoid losing business understanding between sessions.
- Draft shape: A layered memory system with identity memory, strategic memory, operational memory, and append-only activity logs.
- Draft user story: As an operator, I want MeiMei to retain durable business context across sessions so I do not have to restate identity, customers, goals, and operating rules every time.
- Dependencies: `#41` Business Brain level 1 context prompt, `#42` Business Brain level 2/3 context prompt, `#43` Identity and soul file overhaul, `#44` `memory.md` durable notebook, `#74` AI log summarizer, `#76` Calendar integration.

### 6. Mission control dashboard for task status, logs, and real-time agent control
- Transcript basis: The `Mission Control Dashboard` section frames the dashboard as the operator surface for status, actions, logs, and applications like meetings, campaigns, and operations data.
- Draft shape: A central control panel where the operator sees system state, open tasks, recent agent actions, and direct action controls.
- Draft user story: As an operator, I want one control surface for MeiMei's current state, recent work, and next actions so I can supervise the system without jumping between disconnected tools.
- Dependencies: `#46` Mission control board with AI logs and status, `#47` Integration hub, `#48` Task management layer, `#66` AI agent command center, `#80` Visual overhaul, `#81` Sidebar navigation redesign.

### 7. Sub-agent configuration with a main brain and cheaper worker agents
- Transcript basis: In the sub-agent configuration and optimization sections, Mani explicitly describes a main brain plus cheaper workers, with different roles and responsibilities instead of one expensive general-purpose loop.
- Draft shape: A routing and role system where one orchestrator handles reasoning and specialized worker agents handle bounded execution.
- Draft user story: As an operator, I want MeiMei to split work between a strong coordinating brain and cheaper specialist workers so I can control cost and keep execution reliable.
- Dependencies: `#32` Model routing / brain-muscle split, `#36` Sub-agent isolation strategy, `#49` Builder/orchestrator/executor roles, `#78` Manager dispatches work to other agents, `#123` Sub-agent ROI case study.

### 8. Multi-agent orchestration layer for agent-to-agent work dispatch
- Transcript basis: In the orchestration section the presenter shows agents dispatching tasks to each other, overnight autonomous work, and a council-like model where one system hands work to others.
- Draft shape: A task-dispatch layer with role-aware agents, handoff rules, execution receipts, and result return paths.
- Draft user story: As an operator, I want MeiMei to hand tasks between agents with traceable ownership so complex workflows do not collapse into one overstuffed session.
- Dependencies: `#7` Sub-agent configuration, `#69` Agent-to-agent communication layer, `#70` Multi-agent council, `#71` Overnight autonomous builds, `#110` API connector for agent-to-agent work dispatch.

### 9. Token optimization stack for lowering AI spend
- Transcript basis: The `Token Optimization` chapter is explicit: model routing, prompt caching, context discipline, heartbeat strategy, and sub-agent isolation are presented as stacked levers that materially cut costs.
- Draft shape: A cost-governance function that combines routing policy, cache policy, context caps, heartbeat rules, and reporting.
- Draft user story: As an operator, I want MeiMei to reduce avoidable token spend without degrading the quality of important work so the system stays economically usable.
- Dependencies: `#32` Model routing / brain-muscle split, `#33` Prompt caching guidance, `#34` Session discipline and context capping, `#35` Heartbeat to local model control, `#36` Sub-agent isolation strategy.

### 11. Lead enrichment automation from LinkedIn or contact inputs
- Transcript basis: The email engine section repeatedly couples campaigns with lead enrichment and contact preparation before outbound messages are generated.
- Draft shape: A lead enrichment function that takes a raw contact or company and returns usable sales context for campaign generation and prioritization.
- Draft user story: As an operator, I want MeiMei to enrich leads before outreach so campaigns are personalized from evidence instead of generic guessing.
- Dependencies: `#64` Lead enrichment workflow, `#108` CRM-style lead enrichment connector, `#3` AI SDR and email engine.

### 12. Discord bot per agent with channel presence and task routing
- Transcript basis: In the Discord integration section, Mani shows Discord as a serious operating surface, not a toy notification channel. He describes agents with their own presence and channel-level handling.
- Draft shape: A Discord-based operating surface where each agent has identity, presence, and task routing behavior.
- Draft user story: As an operator, I want MeiMei agents to be visible and reachable in Discord so I can supervise and trigger work from a channel-based workspace.
- Dependencies: `#67` Discord integration for agent presence, `#68` Discord channel per agent, `#69` Agent-to-agent communication layer, `#100` Telegram alerts connector for cross-channel notification.

### 13. Security hardening and audit toolkit for OpenClaw deployments
- Transcript basis: The security chapter warns about exposed instances, unpatched zero days, weak defaults, and prompt/command confusion. Security is treated as mandatory operating hygiene.
- Draft shape: A hardening and audit function with deploy-time checklists, runtime verification, and known-risk scans.
- Draft user story: As an operator, I want MeiMei to ship with explicit hardening and audit steps so I do not accidentally run an exposed or abusable agent environment.
- Dependencies: `#38` Mac Mini hardening guide, `#39` VPS hardening guide, `#40` Code injection defense via crafted skill, `#126` Security hardening case study.

### 14. AI lead generation pipeline from scrape to close
- Transcript basis: Across the business loop and email engine sections, Mani frames the system as moving from prospect identification to enrichment to campaigns to discovery and proposal generation.
- Draft shape: A top-of-funnel pipeline that gathers prospects, enriches them, sequences outreach, and routes qualified responses into downstream sales workflows.
- Draft user story: As a founder, I want MeiMei to move leads from raw target list to qualified opportunity so the lead-generation process is operational instead of ad hoc.
- Dependencies: `#11` Lead enrichment automation, `#62` SDR analytics dashboard, `#65` Hyper-personalized cold email campaigns, `#91` Outreach employee, `#92` Discovery employee.

### 15. Builder / orchestrator / executor guidance as a product pattern
- Transcript basis: The `Builder, Orchestrator & Executor` chapter is explicit that OpenClaw is the orchestrator, not the builder. The builder handles UI/app construction, OpenClaw coordinates, and executors do bounded work.
- Draft shape: A reference architecture and operating rule set that tells teams when to use builder tools, when to use MeiMei, and when to spin workers.
- Draft user story: As a product team, I want a clear role model for builders, orchestrators, and executors so we stop overloading one system with every job.
- Dependencies: `#49` Builder/orchestrator/executor roles, `#88` Cloud Code builder integration, `#89` AI agent code generation workflow.

### 16. Task management board for agent work assignment and execution
- Transcript basis: The task-management section frames work as visible tasks, not invisible chat state. Work needs assignment, progression, and closure.
- Draft shape: A board where MeiMei jobs are created, routed, tracked, and closed with explicit ownership.
- Draft user story: As an operator, I want MeiMei's work to appear as tasks with status and ownership so execution is inspectable and recoverable.
- Dependencies: `#48` Task management layer, `#66` AI agent command center, `#79` GitHub auth and repo access layer.

### 18. Hyper-personalized campaign dashboard for cold email
- Transcript basis: The email chapter repeatedly emphasizes personalized campaigns, campaign reviews, analytics, and learning loops instead of blast-email behavior.
- Draft shape: A campaign dashboard optimized for small-batch, high-context, measurable outbound work.
- Draft user story: As an operator, I want to review personalized campaigns, results, and learning signals in one place so I can improve campaign quality over time.
- Dependencies: `#62` SDR analytics dashboard, `#63` Campaign templates and auto replies, `#65` Hyper-personalized cold email campaigns.

### 19. Webhook connector layer for form and workflow automation
- Transcript basis: The `Typeform Clone & Webhooks` chapter treats inbound payloads and outbound workflow triggers as a first-class integration pattern.
- Draft shape: A reusable webhook intake and dispatch layer for forms, meetings, calls, and external system events.
- Draft user story: As an operator, I want MeiMei to react to webhooks from external systems so workflows can start from real events instead of manual copy-paste.
- Dependencies: `#61` Webhook-powered form pipeline, `#102` Webhooks connector, `#110` API connector for agent-to-agent work dispatch.

### 20. Business operations loop covering outreach, discovery, onboarding, delivery, and retention
- Transcript basis: Mani explicitly names the business loop as outreach, discovery, proposals, onboarding, delivery, retention, plus competitor intelligence as a standing lane.
- Draft shape: A reference operating model that turns isolated agent functions into one end-to-end revenue and delivery loop.
- Draft user story: As a founder, I want MeiMei to cover the full operating loop from lead generation to retention so business work can be automated in connected stages instead of isolated tricks.
- Dependencies: `#91` Outreach employee, `#92` Discovery employee, `#93` Proposal employee, `#94` Onboarding employee, `#95` Delivery employee, `#96` Retention employee, `#98` Competitor watch employee.

### 23. Daily AI log summarizer and memory curation helper
- Transcript basis: In the automation section the presenter includes logs and activity streams in the daily digest loop, and in the memory sections he distinguishes raw logs from durable memory.
- Draft shape: A summarizer that turns noisy logs into important events, memory candidates, and operator-visible alerts.
- Draft user story: As an operator, I want MeiMei to condense raw logs into operationally important signals so I can preserve learning without reading every event.
- Dependencies: `#44` `memory.md` durable notebook, `#72` Cronjob automation manager, `#74` AI log summarizer.

### 24. Competitor monitoring and research assistant
- Priority override: Highest priority.
- Transcript basis: In the business operations loop, competitor intelligence is named as a standing workstream. Later the cronjob section shows `daily competitive intel` runs and explicit operator questions like `What are my competitors doing?` and `What are the ideas that I should be working on?`
- Draft shape: A scheduled competitor-intelligence function that tracks named competitors, surfaces notable changes, suggests content or sales responses, and feeds strategy back into the business loop.
- Draft user story: As an operator, I want MeiMei to watch competitors continuously and explain what changed, why it matters, and what action I should take so I stop doing manual market surveillance.
- Dependencies: `#72` Cronjob automation manager, `#73` Daily digest email, `#75` Research topic automation, `#98` Competitor watch employee, `#100` Telegram alerts connector.

### 25. On-chain agent credits / payment workflow on Base and USDC
- Transcript basis: In `Claw Alley`, the presenter demonstrates agents receiving a `402 payment required` response, then paying in `USDC` on `Base`, including a testnet path before real settlement.
- Draft shape: A payment workflow that lets one agent pay another for work using metered credits and on-chain settlement.
- Draft user story: As an operator, I want MeiMei to handle paid agent-to-agent work with explicit payment requests and receipts so marketplaces and paid automations are enforceable.
- Dependencies: `#109` On-chain payments connector, `#110` API connector for agent-to-agent work dispatch, `#129` Claw Alley marketplace.

### 27. Installation guide with free API credits
- Transcript basis: Early in setup, Mani explicitly calls out startup credits across AWS, Google Cloud, and Azure/OpenAI as a practical way to get the stack running without immediate cash burn.
- Draft shape: An installation guide that includes current startup-credit paths, eligibility notes, expiry notes, and a quarterly maintenance checklist.
- Draft user story: As a new operator, I want MeiMei's setup guide to tell me which credit programs are real, current, and worth applying for so I can stand up the stack cheaply and legally.
- Current credit programs to track as of `2026-03-26`:
  - AWS Activate: `$1,000` self-funded or up to `$100,000` with provider sponsorship. Official: [aws.amazon.com/startups/credits](https://aws.amazon.com/startups/credits)
  - Google for Startups Cloud Program: up to `$2,000` early-stage, `$100,000` scale, up to `$350,000` for AI startups. Official: [startup.google.com/cloud](https://startup.google.com/cloud/)
  - Microsoft startup credits: `$1,000` initial, up to `$5,000` after verification. Official: [learn.microsoft.com/en-us/azure/signups/startup-programs](https://learn.microsoft.com/en-us/azure/signups/startup-programs)
  - Azure for Startups: Azure credits can be used for Azure OpenAI; direct OpenAI credits are now limited and no longer broadly available through Founders Hub. Official: [learn.microsoft.com/en-us/microsoft-for-startups/benefits/azure-for-startups](https://learn.microsoft.com/en-us/microsoft-for-startups/benefits/azure-for-startups)
- Maintenance note: This entry is temporal. Re-verify the credit table every quarter and record eligibility changes, expiry windows, and whether credits can fund AI inference in practice.

### 32. Model routing / brain-muscle split
- Transcript basis: The optimization chapter explicitly recommends a strong brain model for coordination and cheaper muscle models for execution and narrow sub-tasks.
- Draft shape: A routing policy that classifies prompts by reasoning depth and cost profile before they reach a model.
- Draft user story: As an operator, I want MeiMei to send strategic reasoning to the brain and repetitive execution to cheaper models so I do not pay premium prices for mechanical work.
- Dependencies: `#7` Sub-agent configuration, `#9` Token optimization stack, `#36` Sub-agent isolation strategy.

### 33. Prompt caching guidance
- Transcript basis: Mani calls prompt caching one of the stacked cost levers and explains it as a direct way to reduce repeated input-token cost.
- Draft shape: A caching policy and implementation guide for repeated long prompts, repeated role context, and stable system instructions.
- Draft user story: As an operator, I want MeiMei to reuse stable prompt inputs wherever possible so recurring tasks stay fast and cheap.
- Dependencies: `#9` Token optimization stack, `#34` Session discipline and context capping.

### 34. Session discipline and context capping
- Transcript basis: The token chapter warns that long sessions and careless context growth are part of why deployments become expensive and unreliable.
- Draft shape: A session-governance function with context caps, compaction rules, and escalation paths when a thread gets too large.
- Draft user story: As an operator, I want MeiMei to keep sessions bounded and intentional so long-running work does not degrade into expensive context sprawl.
- Dependencies: `#5` Business Brain memory architecture, `#9` Token optimization stack, `#44` `memory.md` durable notebook.

### 35. Heartbeat to Ollama or local model control
- Transcript basis: The optimization section explicitly includes heartbeat strategy and local-model routing as part of the cost stack.
- Draft shape: A heartbeat policy that routes lightweight recurring checks to local or cheaper inference when full cloud reasoning is unnecessary.
- Draft user story: As an operator, I want MeiMei to use low-cost local or lightweight models for heartbeat-style checks so recurring automation does not waste premium tokens.
- Dependencies: `#9` Token optimization stack, `#72` Cronjob automation manager.

### 36. Sub-agent isolation strategy
- Transcript basis: The presenter explicitly names sub-agent isolation as one of the key optimization and reliability layers. Workers should execute in bounded contexts instead of sharing one polluted thread.
- Draft shape: An isolation model for worker sessions, inputs, outputs, and memory boundaries.
- Draft user story: As an operator, I want MeiMei workers to execute in isolated contexts so one task does not pollute the memory or state of another.
- Dependencies: `#7` Sub-agent configuration, `#8` Multi-agent orchestration, `#32` Model routing / brain-muscle split.

### 38. Mac Mini hardening guide
- Transcript basis: In the security section the presenter treats the Mac Mini path as a real deployment option and pairs it with explicit hardening instructions rather than assuming local hardware is automatically safe.
- Draft shape: A hardening checklist for a local Mac deployment covering network exposure, remote access, secrets, and recovery.
- Draft user story: As an operator running MeiMei on a Mac Mini, I want a specific hardening checklist so local hosting does not become a soft security target.
- Dependencies: `#13` Security hardening and audit toolkit, `#40` Code injection defense via crafted skill.

### 39. VPS hardening guide
- Transcript basis: The security section repeatedly contrasts Mac Mini and VPS deployments and makes it clear that public VPS exposure needs stronger default hardening.
- Draft shape: A VPS deployment checklist with port exposure rules, SSH practices, auth, reverse proxy, secrets handling, and verification steps.
- Draft user story: As an operator running MeiMei on a VPS, I want a concrete hardening sequence so the stack is not exposed by default.
- Dependencies: `#13` Security hardening and audit toolkit, `#40` Code injection defense via crafted skill, `#126` Security hardening case study.

### 40. Code injection defense via crafted skill
- Transcript basis: The security section explicitly mentions command injection and crafted-skill confusion as realistic attack surfaces.
- Draft shape: A defensive layer that validates skills, narrows execution scope, and blocks prompt-to-command confusion patterns.
- Draft user story: As an operator, I want MeiMei to detect or prevent malicious skill behavior so agent extensibility does not become an execution backdoor.
- Dependencies: `#13` Security hardening and audit toolkit, `#38` Mac Mini hardening guide, `#39` VPS hardening guide.

### 41. Business Brain level 1 context prompt
- Transcript basis: Level 1 is framed as identity, mission, values, tone, and operating principles. It is the stable identity layer, not a running log.
- Draft shape: A first-layer context file defining who MeiMei is, what it optimizes for, and how it should behave.
- Draft user story: As an operator, I want MeiMei's core identity written once in a durable prompt layer so its behavior stays coherent over time.
- Dependencies: `#5` Business Brain memory architecture, `#43` Identity and soul file overhaul.

### 42. Business Brain level 2 / 3 context prompt
- Transcript basis: Levels 2 and 3 add business context, services, positioning, market context, strategic frameworks, and internal operating knowledge.
- Draft shape: Deeper context layers for business facts, revenue model, service lines, customer segments, and strategic constraints.
- Draft user story: As an operator, I want MeiMei to know my business context in structured layers so it can generate relevant outputs without relearning the company each session.
- Dependencies: `#5` Business Brain memory architecture, `#41` Business Brain level 1 context prompt, `#44` `memory.md` durable notebook.

### 43. Identity and soul file overhaul
- Transcript basis: The memory and business-brain sections rely on a stable identity layer; the presenter also treats the assistant's persona and business role as something intentionally authored.
- Draft shape: A cleaned, canonical identity system spanning agent purpose, tone, boundaries, and non-negotiable operating rules.
- Draft user story: As an operator, I want MeiMei's identity files to be explicit and durable so behavior changes are intentional instead of accidental prompt drift.
- Dependencies: `#41` Business Brain level 1 context prompt, `#42` Business Brain level 2 / 3 context prompt.

### 44. `memory.md` durable notebook
- Transcript basis: The presenter explicitly distinguishes durable `memory.md` from daily append-only logs. Durable memory holds stable knowledge; logs hold raw chronology.
- Draft shape: A persistent notebook for durable facts, decisions, preferences, and long-lived operational knowledge.
- Draft user story: As an operator, I want MeiMei to write stable facts to durable memory and keep noisy events elsewhere so long-term knowledge remains readable and usable.
- Dependencies: `#5` Business Brain memory architecture, `#23` Daily AI log summarizer.

### 46. Mission control board with AI logs and status
- Transcript basis: The dashboard section shows boards, logs, and operating state as part of the control-center experience.
- Draft shape: A board inside mission control that surfaces agent status, recent runs, failures, and action traces.
- Draft user story: As an operator, I want a live board of MeiMei activity and state so I can see what happened and intervene quickly.
- Dependencies: `#6` Mission control dashboard, `#74` AI log summarizer.

### 47. Integration hub
- Transcript basis: The integrations chapter positions connectors as one system, not scattered one-off hacks.
- Draft shape: A dedicated integration surface where external systems, keys, statuses, and connector health are managed.
- Draft user story: As an operator, I want MeiMei's integrations to live in one visible place so I can connect, audit, and debug them without hunting through settings.
- Dependencies: `#6` Mission control dashboard, `#66` AI agent command center, `#101` Email connector, `#103` GitHub connector, `#104` Calendar connector, `#107` Supabase connector.

### 48. Task management layer
- Transcript basis: The task-management chapter treats tasks as a formal operating layer. Later sections route discovery calls, proposals, and campaigns into task-like work.
- Draft shape: An internal task layer with entities for assignment, status, ownership, source event, and completion proof.
- Draft user story: As an operator, I want MeiMei to turn important events into trackable tasks so work does not vanish inside chat or logs.
- Dependencies: `#16` Task management board, `#79` GitHub auth and repo access layer.

### 49. Builder/orchestrator/executor roles
- Transcript basis: This is the clean conceptual core of the architecture chapter. Builder creates the product surface, orchestrator coordinates, executors do specialized work.
- Draft shape: A reusable operating doctrine that can be applied to any complex MeiMei function or app.
- Draft user story: As a team, I want each AI role to have a narrow responsibility so implementation and supervision stay understandable.
- Dependencies: `#15` Builder / orchestrator / executor guidance, `#88` Cloud Code builder integration, `#89` AI agent code generation workflow.
