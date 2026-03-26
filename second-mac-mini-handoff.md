# Second Mac Mini Handoff

Use this as the copy-paste prompt for the agent on the other Mac mini.

## Prompt

You are setting up `agent.meimei` on a second Mac mini.

Your job is to clone the repo, pull the required cloud secrets from Vercel, render the local OpenClaw config, bootstrap the machine, and verify the product is operational all day.

Follow the repo's hard rules:

- do not invent new product behavior
- do not rename surfaces casually
- do not store secrets in git
- do not mix local-only settings with cloud secrets
- use the existing lifecycle docs for new functions

## Required steps

1. Install the base tools required by the audit.
2. Clone the `agent.meimei` repository to any directory.
3. Make sure the Vercel CLI is authenticated:
   - `npx vercel@50.37.0 whoami`
4. If the repo is not linked to the existing MeiMei Vercel project, link it:
   - `npx vercel@50.37.0 link`
   - choose the existing MeiMei project
   - do not create a new project unless OC explicitly approves it
5. Pull the project environment variables from Vercel:
   - `npx vercel@50.37.0 env pull .env.vercel --environment production`
6. Copy only the MeiMei app secrets from `.env.vercel` into `~/.openclaw/.env`.
7. Do not copy local-only path variables into Vercel.
8. Run the repository bootstrap:
   - `npm run bootstrap`
9. Verify the runtime:
   - `./scripts/oc-status`
   - `./scripts/oc-doctor --non-interactive`
10. Verify the shipped miniapps:
    - `Any-URL summarization in seconds`
    - `Per-channel model routing by task type and cost`
    - `Daily briefing`

## Acceptance criteria

- `~/.openclaw/openclaw.json` is rendered from the repo seed.
- The OpenClaw gateway is loopback-only on the canonical port.
- The dashboard opens at `https://meimei.localhost:8443/dashboard/`.
- The three shipped miniapps load.
- `Daily briefing` writes to Apple Notes and falls back to markdown.
- `Any-URL summarization in seconds` returns a real result.
- Routing preview returns a deterministic route.
- The machine is ready for day-to-day use without manual path edits.

## Helpful commands

```bash
npm run config:seed
npm run bootstrap
./scripts/meimei-domain install
./scripts/meimei-domain status
./scripts/oc-status
./scripts/oc-doctor --non-interactive
```

## Notes

- If Vercel linking is unclear, stop and ask OC before creating a new project.
- The Vercel secrets currently live in the `production` environment only.
- Ignore `VERCEL_*`, `NX_DAEMON`, and `TURBO_*` entries when mirroring `.env.vercel`.
- Keep secrets out of the repo and out of chat logs.
- Keep the bootstrap idempotent; rerunning it should be safe.
