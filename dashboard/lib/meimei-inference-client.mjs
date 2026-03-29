/**
 * In-process client for the MeiMei inference plane (`handleMeimeiInferenceRoute`).
 * Use instead of `callOllama` / `callOllamaJson` on miniapp hot paths (kernel K3).
 * @see docs/api/inference-route.v1.md
 * @aligned package agent-meimei 0.8.14
 */

import crypto from "node:crypto";
import { handleMeimeiInferenceRoute } from "./inference-route.mjs";
import { parseJsonResponse, LLMError } from "./llm.mjs";

const TASK_TYPE_TO_CATEGORY = {
  summarize: "summarize",
  extract: "extract",
  classify: "classify",
  enrich: "enrich",
  generate: "generate",
  reason: "reason",
  analyze: "analyze",
  default: "default"
};

export function newMeimeiTraceId() {
  return crypto.randomUUID();
}

/**
 * @param {string} prompt
 * @param {object} [options]
 * @param {string|null} [options.model] — explicit Ollama id, or omit / null for `router-auto`
 * @param {string|null} [options.system]
 * @param {number} [options.temperature]
 * @param {number} [options.maxTokens]
 * @param {string|null} [options.taskType] — when using router-auto, maps to `meimei.taskCategory`
 * @param {string|null} [options.traceId]
 * @param {string|null} [options.channel] — echoed in `_meta` only
 */
export async function inferenceCallOllama(prompt, options = {}) {
  const {
    model: explicitModel = null,
    system = null,
    temperature = 0.7,
    maxTokens = 2048,
    taskType = null,
    traceId: tidIn,
    channel = null
  } = options;

  const traceId = tidIn || newMeimeiTraceId();
  const messages = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: prompt });

  const trimmed = explicitModel != null ? String(explicitModel).trim() : "";
  const useRouter = !trimmed;
  const model = useRouter ? "router-auto" : trimmed;
  const taskCategory =
    taskType && TASK_TYPE_TO_CATEGORY[String(taskType)]
      ? TASK_TYPE_TO_CATEGORY[String(taskType)]
      : "default";

  const meimei = {
    localOnly: true,
    traceId,
    ...(useRouter ? { taskCategory } : {})
  };

  const body = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: false,
    meimei
  };

  const out = await handleMeimeiInferenceRoute(body, { traceId });

  if (out.statusCode !== 200) {
    const err = out.json?.error;
    const msg =
      (err && typeof err === "object" && err.message) ||
      (typeof out.json?.message === "string" ? out.json.message : null) ||
      (typeof out.json?.error === "string" ? out.json.error : null) ||
      JSON.stringify(out.json);
    throw new LLMError(String(msg), out.statusCode);
  }

  const content = out.json?.choices?.[0]?.message?.content;
  const text = typeof content === "string" ? content : "";

  return {
    response: text,
    done: true,
    model: out.json?.model,
    totalDuration: null,
    evalCount: null,
    promptEvalCount: null,
    context: null,
    _meta: {
      modelUsed: out.json?.meimei_meta?.ollama_model_requested,
      taskType,
      channel,
      trace_id: out.json?.meimei_meta?.trace_id
    }
  };
}

/**
 * JSON-shaped assistant output (same contract as `callOllamaJson` from llm.mjs).
 * @param {string} prompt
 * @param {object} [options]
 */
export async function inferenceCallOllamaJson(prompt, options = {}) {
  const { schema = null, ...rest } = options;
  let systemPrompt = "You are a precise AI assistant. Respond ONLY with valid JSON.";
  if (schema) {
    systemPrompt += ` The JSON must match this schema: ${JSON.stringify(schema, null, 2)}`;
  }
  const result = await inferenceCallOllama(prompt, {
    ...rest,
    system: systemPrompt,
    temperature: typeof rest.temperature === "number" ? rest.temperature : 0.2
  });
  const parsed = parseJsonResponse(result.response);
  if (!parsed) {
    throw new LLMError(
      "Failed to parse JSON from LLM response",
      null,
      result.response.substring(0, 500)
    );
  }
  return { data: parsed, raw: result.response, meta: result._meta };
}

/** Same role as `summarize()` in llm.mjs — uses inference plane. */
export async function inferenceSummarize(text, options = {}) {
  return inferenceCallOllama(text, {
    taskType: "summarize",
    system: "You are a concise summarizer. Provide a clear, brief summary.",
    maxTokens: 256,
    ...options
  });
}
