# Runbook

## Daily start

1. Read `agent.md`.
2. Read `skills/catalog.md`.
3. Check `tasks.md` for active work.
4. Confirm whether any OC approval is required before execution.
5. Run `./scripts/oc-status` before beginning a session.

## Adding a skill

1. Copy `skills/_template/SKILL.md`.
2. Create a new skill folder.
3. Write a focused `SKILL.md`.
4. Add the skill to `skills/catalog.md`.
5. Verify the skill does not duplicate an existing capability.

## Updating a skill

1. Check whether the change is scope-preserving.
2. Update the skill body and metadata together.
3. Keep the skill description one-line and precise.
4. Re-read the catalog entry to ensure naming still fits.

## Handling large work

If a request is too broad:

- split it into capability clusters
- define the one best next step
- keep the rest in `roadmap.md` or `tasks.md`

## Escalation

Escalate to OC when:

- scope changes
- safety boundaries are unclear
- a skill would need privileged behavior
- execution is blocked by missing product decisions

## Launching OpenClaw

- Use `./scripts/oc-launch` to start the gateway from this repo-local config.
- Use `./scripts/oc-agent --message "..."` for direct agent turns through the repo-local wrapper.
- Add `--channel`, `--task-type`, and `--cost-target` when you want deterministic routing.
- Add `--route-report` to print the selected route and reason.
- Use `./scripts/oc-doctor --non-interactive` when checking the runtime state.
- Use `./scripts/oc-readiness` for a single PASS/FAIL go-live readiness decision.
- Use `npm run adapter:whatsapp:validate` before WhatsApp-facing release changes.
- Use `npm run release:gates -- <artifact.json>` before release decisions to enforce DoD/testing gates.
- Use `npm run policy:validate` before external-channel policy or risk-tier changes.
- Use `npm run audit:validate` to verify audit trail chain integrity after policy/routing work.
- Use `npm run config:seed` when you need to render or refresh the live OpenClaw config from the repo seed.
- Use `npm run bootstrap` when you are bringing up a fresh Mac mini or validating the migration path.

## Local Dashboard

- Run `npm run dashboard` from the repo root.
- Open `http://127.0.0.1:3030` in a browser.
- Use the settings form to update the repo-local OpenClaw config.
- Use the operations panel to run status, skills, doctor, and launch checks.
- Use `npm run setup` for the one-step local domain start/open flow.
