/**
 * MeiMei inference plane — blocking OpenAI-shaped router → Ollama (v1).
 * Contract: docs/api/inference-route.v1.md
 */

const OLLAMA_CHAT_URL = `${(process.env.OLLAMA_HOST || "http://127.0.0.1:11434").replace(/\/$/, "")}/v1/chat/completions`;

const ROUTER_AUTO = "router-auto";

const DEFAULT_MAX_CONTEXT = Math.max(
  512,
  Number.parseInt(String(process.env.MEIMEI_INFERENCE_MAX_CONTEXT || "8192"), 10) || 8192
);

/** When model is router-auto, map taskCategory → Ollama model id. */
const TASK_CATEGORY_TO_MODEL = {
  summarize: "qwen3.5:0.8b",
  extract: "qwen3.5:0.8b",
  classify: "qwen3.5:0.8b",
  enrich: "gemma3:1b",
  generate: "gemma3:1b",
  reason: "llama3:latest",
  analyze: "llama3:latest",
  creative: "llama3:latest",
  default: "gemma3:1b"
};

/**
 * Rough heuristic: ~4 characters per token (English-heavy text).
 * @param {unknown[]} messages
 * @returns {number}
 */
export function estimateTokensFromMessages(messages) {
  if (!Array.isArray(messages)) return 0;
  let chars = 0;
  for (const m of messages) {
    if (!m || typeof m !== "object") continue;
    const c = m.content;
    if (typeof c === "string") {
      chars += c.length;
    } else if (Array.isArray(c)) {
      for (const part of c) {
        if (typeof part === "string") chars += part.length;
        else if (part && typeof part === "object" && typeof part.text === "string") {
          chars += part.text.length;
        }
      }
    }
  }
  return Math.ceil(chars / 4);
}

/**
 * @param {object} body
 * @returns {string}
 */
function resolveOllamaModel(body) {
  const model = body.model;
  const meimei = body.meimei && typeof body.meimei === "object" ? body.meimei : {};
  if (typeof model !== "string" || !model.trim()) {
    return TASK_CATEGORY_TO_MODEL.default;
  }
  if (model.trim() === ROUTER_AUTO) {
    const cat = typeof meimei.taskCategory === "string" ? meimei.taskCategory : "default";
    return TASK_CATEGORY_TO_MODEL[cat] || TASK_CATEGORY_TO_MODEL.default;
  }
  return model.trim();
}

/**
 * Build JSON body for Ollama OpenAI-compatible API (no stream, no meimei).
 * @param {object} body
 * @param {string} resolvedModel
 */
function buildOllamaRequestBody(body, resolvedModel) {
  const out = {
    model: resolvedModel,
    messages: body.messages,
    stream: false
  };
  if (typeof body.temperature === "number" && Number.isFinite(body.temperature)) {
    out.temperature = body.temperature;
  }
  if (typeof body.max_tokens === "number" && Number.isFinite(body.max_tokens) && body.max_tokens > 0) {
    out.max_tokens = Math.floor(body.max_tokens);
  }
  return out;
}

/**
 * Normalize runner payload to contract + meimei_meta.
 * @param {object} raw — Ollama OpenAI-style response
 * @param {{ resolvedModel: string, latencyMs: number, traceId: string }} meta
 */
function wrapResponse(raw, meta) {
  const created =
    typeof raw.created === "number" && Number.isFinite(raw.created)
      ? raw.created
      : Math.floor(Date.now() / 1000);
  const id = typeof raw.id === "string" && raw.id ? raw.id : `chatcmpl-${created}`;
  const choices = Array.isArray(raw.choices) ? raw.choices : [];
  const usageIn = raw.usage && typeof raw.usage === "object" ? raw.usage : {};

  let promptTokens = Number(usageIn.prompt_tokens);
  let completionTokens = Number(usageIn.completion_tokens);
  let totalTokens = Number(usageIn.total_tokens);
  if (!Number.isFinite(promptTokens)) promptTokens = 0;
  if (!Number.isFinite(completionTokens)) completionTokens = 0;
  if (!Number.isFinite(totalTokens)) totalTokens = promptTokens + completionTokens;

  if (totalTokens === 0 && choices.length > 0) {
    const msg = choices[0]?.message?.content;
    const outChars = typeof msg === "string" ? msg.length : 0;
    completionTokens = Math.ceil(outChars / 4);
    totalTokens = promptTokens + completionTokens;
  }

  return {
    id,
    object: raw.object || "chat.completion",
    created,
    model: typeof raw.model === "string" && raw.model ? raw.model : `ollama/${meta.resolvedModel}`,
    choices,
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens
    },
    meimei_meta: {
      backend_used: "ollama",
      latency_ms: meta.latencyMs,
      trace_id: meta.traceId,
      ollama_model_requested: meta.resolvedModel
    }
  };
}

/**
 * @param {unknown} body
 * @param {{ traceId: string }} ctx
 * @returns {Promise<{ statusCode: number, json: object }>}
 */
export async function handleMeimeiInferenceRoute(body, ctx) {
  const traceId = ctx.traceId;

  if (!body || typeof body !== "object") {
    return {
      statusCode: 400,
      json: {
        error: { code: "invalid_request", message: "JSON body required" }
      }
    };
  }

  if (body.stream === true) {
    return {
      statusCode: 501,
      json: {
        error: {
          code: "sse_not_implemented",
          message: "stream: true is not implemented in v1; use stream: false (blocking)."
        }
      }
    };
  }

  const meimei = body.meimei && typeof body.meimei === "object" ? body.meimei : {};
  if (meimei.localOnly === false) {
    return {
      statusCode: 501,
      json: {
        error: {
          code: "non_local_not_implemented",
          message: "meimei.localOnly: false has no cloud runner in v1."
        }
      }
    };
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return {
      statusCode: 400,
      json: {
        error: { code: "invalid_request", message: "messages must be a non-empty array" }
      }
    };
  }

  for (const m of body.messages) {
    if (!m || typeof m !== "object" || typeof m.role !== "string") {
      return {
        statusCode: 400,
        json: {
          error: { code: "invalid_request", message: "Each message must have a string role" }
        }
      };
    }
    if (typeof m.content !== "string") {
      return {
        statusCode: 400,
        json: {
          error: {
            code: "invalid_request",
            message: "v1 requires string message.content (array/multimodal not supported)"
          }
        }
      };
    }
  }

  const estimated = estimateTokensFromMessages(body.messages);
  if (estimated > DEFAULT_MAX_CONTEXT) {
    return {
      statusCode: 413,
      json: {
        error: "context_too_large",
        message: `Estimated tokens (${estimated}) exceed backend limit of ${DEFAULT_MAX_CONTEXT}.`
      }
    };
  }

  const resolvedModel = resolveOllamaModel(body);
  const ollamaBody = buildOllamaRequestBody(body, resolvedModel);

  const t0 = Date.now();
  let res;
  try {
    res = await fetch(OLLAMA_CHAT_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(ollamaBody)
    });
  } catch (err) {
    return {
      statusCode: 503,
      json: {
        error: {
          code: "runner_unreachable",
          message: err instanceof Error ? err.message : String(err)
        },
        meimei_meta: {
          backend_used: "ollama",
          latency_ms: Date.now() - t0,
          trace_id: traceId
        }
      }
    };
  }

  const latencyMs = Date.now() - t0;
  let rawJson;
  try {
    rawJson = await res.json();
  } catch {
    return {
      statusCode: 502,
      json: {
        error: { code: "invalid_runner_response", message: "Runner returned non-JSON" },
        meimei_meta: {
          backend_used: "ollama",
          latency_ms: latencyMs,
          trace_id: traceId
        }
      }
    };
  }

  if (!res.ok) {
    const msg =
      rawJson?.error?.message ||
      rawJson?.message ||
      (typeof rawJson?.error === "string" ? rawJson.error : null) ||
      `HTTP ${res.status}`;
    return {
      statusCode: 502,
      json: {
        error: { code: "runner_error", message: msg, status: res.status },
        meimei_meta: {
          backend_used: "ollama",
          latency_ms: latencyMs,
          trace_id: traceId
        }
      }
    };
  }

  return {
    statusCode: 200,
    json: wrapResponse(rawJson, { resolvedModel, latencyMs, traceId })
  };
}

export { DEFAULT_MAX_CONTEXT, ROUTER_AUTO, OLLAMA_CHAT_URL };

/** Thin handle for tests and future dependency injection. */
export class RouteEngine {
  /**
   * @param {unknown} body
   * @param {{ traceId: string }} ctx
   * @returns {Promise<{ statusCode: number, json: object }>}
   */
  route(body, ctx) {
    return handleMeimeiInferenceRoute(body, ctx);
  }
}
