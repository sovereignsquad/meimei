import brain from "./brain/index.mjs";
import { parseJsonResponse, DEFAULT_MODELS } from "./llm.mjs";
import { inferenceCallOllama } from "./meimei-inference-client.mjs";
import { getUnreadCount, isMailAvailable } from "./mail-adapter.mjs";

function truncate(s, max) {
  const t = String(s || "").trim();
  if (!t) return "";
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

function normalizeSuggestion(entry, index) {
  if (!entry || typeof entry !== "object") return null;
  const rawTitle = String(entry.title || entry.headline || "").trim();
  const title = truncate(rawTitle || `Suggestion ${index + 1}`, 120);
  const detail = truncate(String(entry.detail || entry.description || entry.body || ""), 400);
  const exampleQuery = truncate(String(entry.exampleQuery || entry.query || entry.prompt || ""), 200);
  if (!detail && !exampleQuery && !rawTitle) return null;
  return {
    title,
    detail: detail || exampleQuery || "Try this from the command bar on the dashboard.",
    exampleQuery
  };
}

async function buildDashboardSignals() {
  const lines = [];
  try {
    const mailUp = await isMailAvailable();
    if (mailUp) {
      const unread = await getUnreadCount();
      lines.push(
        `- Apple Mail: available. Inbox unread count = ${unread}. When unread > 0, at least one suggestion title or detail should mention this exact number (e.g. "You have ${unread} unread emails"). When unread is 0, you may suggest triage habits or checking inbox anyway.`
      );
    } else {
      lines.push(
        "- Apple Mail: not available on this host. Do not claim specific unread counts; you may still suggest opening the Inbox miniapp."
      );
    }
  } catch {
    lines.push("- Apple Mail: status unknown. Do not invent unread counts.");
  }
  lines.push(
    "- Checklist (#727): MeiMei Node engine by default (SQLite in data/checklist + Ollama). HTTP bridge for the deployed Next app; set MEIMEI_CHECKLIST_ENGINE=python + MEIMEI_CHECKLIST_ROOT for the checklist-repo worker. What next (#724) is MeiMei AI-ranked suggestions. Lead enrichment, AI SDR analytics (#651), Memory, Mission control, and Explain URL are also under Apps; Tools include Supabase connector and Environment variables."
  );
  return lines.join("\n");
}

/**
 * Proactive dashboard suggestions: Brain layers (same data as /api/functions/memory readLayers) + live signals, via Ollama.
 */
export async function generateHomeSuggestions(repoRoot) {
  let brainContext = "";
  try {
    const layers = await brain.readLayers(repoRoot);
    const parts = ["identity", "user", "context"].map((key) => {
      const raw = layers?.[key];
      const text = typeof raw === "string" ? raw.trim() : "";
      return text ? `## ${key.toUpperCase()}\n${text}` : `## ${key.toUpperCase()}\n(empty)`;
    });
    brainContext = parts.join("\n\n");
  } catch {
    brainContext = "";
  }

  const snippet =
    truncate(brainContext, 4500) ||
    "(Brain identity/user/context layers are empty — still output three useful, accurate dashboard suggestions.)";

  const signals = await buildDashboardSignals();

  const prompt = `You are MeiMei, the operator dashboard assistant. Using the Brain layer text and the dashboard signals below, return exactly 3 proactive suggestions.

Rules:
- The "suggestions" array MUST have length 3.
- Each item maps to dashboard actions: checklist, inbox, lead enrichment, memory, mission control, explain URL, what next (MeiMei AI suggestions), or teaching a fact.
- Use ONLY the provided unread count from signals for email numbers; never invent counts.
- Titles can be punchy (e.g. "You have 5 unread emails" when the signal says so).
- exampleQuery must be a short phrase for the command bar.

Dashboard signals (facts):
${signals}

Brain layers (identity, user, context):
${snippet}

Return ONLY valid JSON (no markdown):
{"suggestions":[{"title":"short headline","detail":"one sentence why this helps","exampleQuery":"short command phrase"}]}`;

  const result = await inferenceCallOllama(prompt, {
    model: DEFAULT_MODELS.fast,
    temperature: 0.35,
    maxTokens: 700
  });

  const parsed = parseJsonResponse(result.response);
  const rawList = Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];
  const suggestions = [];
  for (let i = 0; i < rawList.length && suggestions.length < 3; i += 1) {
    const n = normalizeSuggestion(rawList[i], suggestions.length);
    if (n) suggestions.push(n);
  }

  if (suggestions.length === 0) {
    return {
      ok: false,
      error: "Could not parse suggestions from the model.",
      suggestions: [],
      model: result.model || null
    };
  }

  return {
    ok: true,
    suggestions,
    model: result.model || null
  };
}
