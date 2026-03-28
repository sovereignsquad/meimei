const OLLAMA_URL = "http://localhost:11434";

const DEFAULT_MODELS = {
  fast: "qwen3.5:0.8b",
  medium: "gemma3:1b",
  reasoning: "llama3:latest",
  default: "llama3:latest"
};

const TASK_MODELS = {
  summarize: "fast",
  extract: "fast",
  classify: "fast",
  enrich: "medium",
  generate: "medium",
  reason: "reasoning",
  analyze: "reasoning",
  creative: "reasoning",
  default: "default"
};

class LLMError extends Error {
  constructor(message, statusCode, rawResponse) {
    super(message);
    this.name = "LLMError";
    this.statusCode = statusCode;
    this.rawResponse = rawResponse;
  }
}

async function checkOllamaHealth() {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    if (response.ok) {
      const data = await response.json();
      return { healthy: true, models: data.models || [] };
    }
    return { healthy: false, error: `HTTP ${response.status}` };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
}

async function listModels() {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.models || [];
  } catch (error) {
    return [];
  }
}

/** First balanced `{...}` object in text (handles nested braces; respects strings). */
function extractFirstJsonObject(text) {
  const start = text.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i += 1) {
    const c = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (c === "\\" && inString) {
      escape = true;
      continue;
    }
    if (c === "\"" && !escape) {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (c === "{") depth += 1;
    else if (c === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function parseJsonResponse(text) {
  if (!text) return null;
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    /* fall through */
  }

  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      /* fall through */
    }
  }

  const balanced = extractFirstJsonObject(trimmed);
  if (balanced) {
    try {
      return JSON.parse(balanced);
    } catch {
      /* fall through */
    }
  }

  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      return null;
    }
  }

  return null;
}

function extractCleanText(text) {
  if (!text) return "";
  
  let cleaned = text
    .replace(/```(?:json|text)?\n?/gi, "")
    .replace(/```$/gm, "")
    .trim();
  
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = cleaned.replace(/\{[\s\S]*\}/, "").trim();
  }
  
  return cleaned.trim();
}

async function callOllama(prompt, options = {}) {
  const {
    model = DEFAULT_MODELS.default,
    system = null,
    stream = false,
    temperature = 0.7,
    maxTokens = 2048,
    retries = 2,
    retryDelay = 1000,
    timeout = 120000,
    /** When `"json"`, Ollama constrains output to valid JSON (see Ollama generate API). */
    responseFormat = null
  } = options;

  const fullPrompt = system ? `${system}\n\n${prompt}` : prompt;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const payload = {
        model: model,
        prompt: fullPrompt,
        stream: stream,
        options: {
          temperature,
          num_predict: maxTokens
        }
      };
      if (system) payload.system = system;
      if (responseFormat === "json") payload.format = "json";

      const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new LLMError(`Ollama error: ${response.status}`, response.status);
      }

      const data = await response.json();
      // Some models (qwen3.5) put JSON in `thinking` when using format: "json"
      const responseText = data.response || data.thinking || "";
      return {
        response: responseText,
        done: data.done,
        model: data.model,
        totalDuration: data.total_duration,
        evalCount: data.eval_count,
        promptEvalCount: data.prompt_eval_count,
        context: data.context
      };
    } catch (error) {
      if (error.name === "AbortError") {
        throw new LLMError("Request timeout", 408);
      }
      
      if (attempt === retries) {
        throw new LLMError(
          `Failed after ${retries + 1} attempts: ${error.message}`,
          null,
          error.message
        );
      }
      
      await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
    }
  }
}

async function callOllamaJson(prompt, options = {}) {
  const { schema = null, model = DEFAULT_MODELS.medium, temperature = 0.2, ...rest } = options;

  let systemPrompt = "You are a precise AI assistant. Respond ONLY with valid JSON. No markdown, no commentary.";
  if (schema) {
    systemPrompt += ` The JSON must match this schema: ${JSON.stringify(schema, null, 2)}`;
  }

  const result = await callOllama(prompt, {
    model,
    system: systemPrompt,
    temperature,
    ...rest,
    responseFormat: "json"
  });

  const parsed = parseJsonResponse(result.response);
  
  if (!parsed) {
    throw new LLMError(
      "Failed to parse JSON from LLM response",
      null,
      result.response.substring(0, 500)
    );
  }

  return { data: parsed, raw: result.response, meta: result };
}

async function callOllamaStream(prompt, options = {}) {
  const {
    model = DEFAULT_MODELS.default,
    system = null,
    temperature = 0.7,
    maxTokens = 2048,
    onChunk = null
  } = options;

  const fullPrompt = system ? `${system}\n\n${prompt}` : prompt;

  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: model,
      prompt: fullPrompt,
      system: system,
      stream: true,
      options: {
        temperature,
        num_predict: maxTokens
      }
    })
  });

  if (!response.ok) {
    throw new LLMError(`Ollama error: ${response.status}`, response.status);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullResponse = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n").filter(line => line.trim());

    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        fullResponse += data.response;
        if (onChunk) onChunk(data.response, data);
      } catch {
        // Skip invalid JSON lines
      }
    }
  }

  return { response: fullResponse, done: true };
}

function selectModelForTask(taskType) {
  const modelKey = TASK_MODELS[taskType] || TASK_MODELS.default;
  return DEFAULT_MODELS[modelKey];
}

async function summarize(text, options = {}) {
  return callOllama(text, {
    model: selectModelForTask("summarize"),
    system: "You are a concise summarizer. Provide a clear, brief summary.",
    maxTokens: 256,
    ...options
  });
}

async function extractStructured(text, schema, options = {}) {
  const schemaDesc = Object.entries(schema)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
  
  const prompt = `Extract the following fields from the text:\n${schemaDesc}\n\nText:\n${text}`;
  
  return callOllamaJson(prompt, {
    model: selectModelForTask("extract"),
    schema,
    ...options
  });
}

async function classify(text, categories, options = {}) {
  const prompt = `Classify this text into ONE of these categories: ${categories.join(", ")}.\n\nText: ${text}`;
  
  const result = await callOllama(prompt, {
    model: selectModelForTask("classify"),
    system: "Respond with ONLY the category name, nothing else.",
    maxTokens: 50,
    temperature: 0.1,
    ...options
  });
  
  return result.response.trim();
}

async function generate(prompt, options = {}) {
  return callOllama(prompt, {
    model: selectModelForTask("generate"),
    ...options
  });
}

async function reason(prompt, options = {}) {
  return callOllama(prompt, {
    model: selectModelForTask("reasoning"),
    system: "You are a logical reasoning assistant. Think step by step.",
    temperature: 0.3,
    ...options
  });
}

async function analyze(text, options = {}) {
  return callOllama(text, {
    model: selectModelForTask("analyze"),
    system: "You are an analytical assistant. Provide insights and analysis.",
    ...options
  });
}

function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

function formatCost(tokens, model) {
  const costs = {
    "llama3:latest": 0,
    "qwen3.5:0.8b": 0,
    "gemma3:1b": 0
  };
  
  const costPerToken = costs[model] || 0;
  return {
    inputTokens: tokens,
    outputTokens: 0,
    costUSD: (tokens * costPerToken).toFixed(6),
    isLocal: true
  };
}

export {
  LLMError,
  checkOllamaHealth,
  listModels,
  callOllama,
  callOllamaJson,
  callOllamaStream,
  selectModelForTask,
  parseJsonResponse,
  extractCleanText,
  summarize,
  extractStructured,
  classify,
  generate,
  reason,
  analyze,
  estimateTokens,
  formatCost,
  DEFAULT_MODELS,
  TASK_MODELS,
  OLLAMA_URL
};
