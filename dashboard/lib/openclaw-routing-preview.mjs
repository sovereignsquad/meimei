/**
 * Deterministic OpenClaw routing preview — parity with `scripts/oc-agent --route-only`.
 * No LLM, no `openclaw` binary. Used by `previewModelRouting` in `server.mjs` (kernel R2 closure).
 * @see scripts/oc-agent (select_route, infer_task_type, infer_cost_target, select_fallback)
 * @aligned package agent-meimei 0.8.14
 */

function lowercase(s) {
  return String(s ?? "").trim().toLowerCase();
}

const MESSAGING_CHANNELS = new Set([
  "whatsapp",
  "imessage",
  "telegram",
  "discord",
  "irc",
  "slack",
  "signal",
  "line",
  "feishu",
  "matrix",
  "bluebubbles",
  "zalo",
  "zalouser",
  "synology-chat",
  "tlon"
]);

export function inferTaskType(message) {
  const text = lowercase(message);
  if (/(audit|review|verify|verification|judge|safety|policy)/.test(text)) return "review";
  if (/(research|synth|synthesis|analysis|analyz|investig|plan|roadmap)/.test(text)) return "research";
  if (/(summar|extract|url|pdf|article|document)/.test(text)) return "summary";
  if (/(reply|chat|message|hi|hello|thanks|status update|quick)/.test(text)) return "chat";
  return "general";
}

export function inferCostTarget(channel, taskType) {
  const ch = lowercase(channel);
  const task = lowercase(taskType);

  if (MESSAGING_CHANNELS.has(ch)) {
    if (task === "chat" || task === "general" || task === "summary") return "low";
    return "medium";
  }
  if (ch === "api") {
    if (task === "research" || task === "review") return "medium";
    return "low";
  }
  if (ch === "dashboard" || ch === "last" || ch === "") {
    if (task === "research" || task === "review") return "medium";
    return "low";
  }
  return "medium";
}

/**
 * @returns {{ agent: string, thinking: string, reason: string }}
 */
export function selectRoute(channel, taskType, costTarget) {
  const ch = lowercase(channel);
  const task = lowercase(taskType);
  const cost = lowercase(costTarget);

  if (/^(review|audit|verify|verification|safety|policy)$/.test(task)) {
    return {
      agent: "judge",
      thinking: "medium",
      reason: "review and safety checks should use the judge path"
    };
  }
  if (/^(research|synthesis|analysis|plan|roadmap)$/.test(task)) {
    if (cost === "high" || cost === "xhigh") {
      return {
        agent: "main",
        thinking: "high",
        reason: "deep work requested for a research or planning task"
      };
    }
    return {
      agent: "main",
      thinking: "medium",
      reason: "research and synthesis need balanced reasoning"
    };
  }
  if (/^(summary|extract|document|url|pdf)$/.test(task)) {
    if (cost === "low") {
      return {
        agent: "drafter",
        thinking: "minimal",
        reason: "keep simple extraction cheap and fast"
      };
    }
    return {
      agent: "main",
      thinking: "low",
      reason: "summary and extraction stay on the balanced path"
    };
  }
  if (/^(chat|reply|general)$/.test(task)) {
    if (MESSAGING_CHANNELS.has(ch)) {
      return {
        agent: "drafter",
        thinking: "minimal",
        reason: "messaging channels use the fast drafting path"
      };
    }
    if (cost === "low") {
      return {
        agent: "drafter",
        thinking: "minimal",
        reason: "simple general work stays cheap"
      };
    }
    return {
      agent: "main",
      thinking: "low",
      reason: "defaulting to the balanced general path"
    };
  }

  if (cost === "low") {
    return { agent: "drafter", thinking: "minimal", reason: "default low-cost route" };
  }
  if (cost === "high" || cost === "xhigh") {
    return { agent: "main", thinking: "high", reason: "default high-confidence route" };
  }
  return { agent: "main", thinking: "low", reason: "default balanced route" };
}

export function selectFallback(routeAgent) {
  const agent = lowercase(routeAgent);
  if (agent === "judge") return { agent: "main", thinking: "low" };
  if (agent === "drafter") return { agent: "main", thinking: "low" };
  return { agent: "drafter", thinking: "minimal" };
}

export function routeTier(routeAgent, costTarget) {
  const agent = lowercase(routeAgent);
  const cost = lowercase(costTarget);
  if (agent === "judge") return "tier_local_reasoning";
  if (agent === "drafter") return "tier_local_fast";
  if (cost === "high" || cost === "xhigh") return "tier_openrouter_strong";
  return "tier_openrouter_free";
}

/**
 * Same JSON shape as `oc-agent --route-only` (jq / printf).
 * @param {{ channel?: string, taskType?: string, costTarget?: string, message?: string, thinkingOverride?: string }} opts
 */
export function buildOpenclawRoutingPreview(opts = {}) {
  const { channel, taskType, costTarget, message, thinkingOverride } = opts;

  const chOut =
    channel != null && String(channel).trim() !== "" ? String(channel).trim() : "last";

  let task = taskType != null && String(taskType).trim() !== "" ? String(taskType).trim() : "";
  if (!task) task = inferTaskType(message || "");

  let cost = costTarget != null && String(costTarget).trim() !== "" ? String(costTarget).trim() : "";
  if (!cost) cost = inferCostTarget(chOut === "last" ? "" : chOut, task);

  const route = selectRoute(chOut, task, cost);
  let thinking = route.thinking;
  if (thinkingOverride != null && String(thinkingOverride).trim() !== "") {
    thinking = String(thinkingOverride).trim();
  }

  const fb = selectFallback(route.agent);
  const tier = routeTier(route.agent, cost);

  return {
    channel: chOut,
    taskType: task,
    costTarget: cost,
    agent: route.agent,
    thinking,
    tier,
    fallbackAgent: fb.agent,
    fallbackThinking: fb.thinking,
    reason: route.reason
  };
}
