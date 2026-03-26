# Vercel Environment Inventory

This file separates the secrets that belong in Vercel from the local-only settings that must stay on each Mac mini.

## Store in Vercel

These are the variables the next agent should pull from Vercel and mirror into the target machine's `~/.openclaw/.env` when needed:

- `OPENROUTER_API_KEY` - required for the current remote free-model setup.
- `OLLAMA_API_KEY` - optional; keep only if a future wrapper expects it.
- `OPENAI_API_KEY` - optional for future skills.
- `GEMINI_API_KEY` - optional for future skills.
- `NOTION_API_KEY` - optional for future skills.
- `TRELLO_API_KEY` - optional for future skills.
- `TRELLO_TOKEN` - optional for future skills.
- `ELEVENLABS_API_KEY` - optional for future skills.
- `GOOGLE_PLACES_API_KEY` - optional for future skills.
- `SHERPA_ONNX_RUNTIME_DIR` - optional for future speech tooling.
- `SHERPA_ONNX_MODEL_DIR` - optional for future speech tooling.

## Keep Local Only

These should stay machine-specific and should not be stored in Vercel:

- `OPENCLAW_CONFIG_PATH`
- `OPENCLAW_BIN`
- `OPENCLAW_GATEWAY_PORT`
- `MEIMEI_PUBLIC_URL`
- `MEIMEI_PUBLIC_HOST`
- `MEIMEI_PUBLIC_PREFIX`
- `MEIMEI_DASHBOARD_PORT`
- `MEIMEI_LAUNCHD_SOCKET`
- `MEIMEI_SETUP_COMMAND`
- `MEIMEI_BRIEFING_DIR`
- `MEIMEI_BRIEFING_FOLDER`
- `MEIMEI_BRIEFING_SINK`
- `OPENCLAW_CHANNEL`
- `OPENCLAW_TASK_TYPE`
- `OPENCLAW_COST_TARGET`
- `OPENCLAW_ROUTE_REPORT`
- `OPENCLAW_ROUTE_ONLY`
- `OPENCLAW_AGENT`

## Local Pull Rule

Use Vercel as the cloud secret source of truth, then pull those values into the Mac mini during bootstrap.

Recommended local fetch command:

```bash
npx vercel@50.37.0 env pull .env.vercel --environment production
```

Then copy the required values from `.env.vercel` into:

- `~/.openclaw/.env`

Do not copy machine-path settings into Vercel.
Do not mirror `VERCEL_*`, `NX_DAEMON`, or `TURBO_*` into `~/.openclaw/.env`; they are Vercel/runtime boilerplate, not MeiMei secrets.
