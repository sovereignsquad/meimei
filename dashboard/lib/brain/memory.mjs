import { readFile, writeFile, readdir, stat, mkdir } from "node:fs/promises";
import path from "node:path";
import { estimateTokens } from "../llm.mjs";
import { inferenceCallOllama } from "../meimei-inference-client.mjs";

const BRAIN_DIR = "brain";
const LAYERS = {
  IDENTITY: "identity",
  USER: "user",
  CONTEXT: "context",
  SKILLS: "skills",
  DURABLE: "durable",
  LOG: "log"
};

const CONFIG = {
  maxLogEntries: 1000,
  maxContextTokens: 4096,
  maxLayerTokens: 2048,
  logCompactionThreshold: 500,
  durableDeduplication: true,
  snapshotOnCompaction: true
};

const DEFAULT_LAYERS = {
  [LAYERS.IDENTITY]: {
    name: "MeiMei",
    product: "agent.meimei",
    vibe: "sharp, dependable, high-throughput",
    symbol: "🧶",
    identity_file: "IDENTITY.md",
    agent_file: "agent.md"
  },
  [LAYERS.USER]: {
    name: "OC",
    role: "human operator",
    preferences: {},
    goals: [],
    constraints: []
  },
  [LAYERS.CONTEXT]: {
    current_project: null,
    active_tasks: [],
    stakeholders: [],
    priorities: []
  },
  [LAYERS.SKILLS]: {
    catalog: [],
    recent_usage: [],
    learned_patterns: []
  },
  [LAYERS.DURABLE]: {
    facts: [],
    decisions: [],
    learned: []
  },
  [LAYERS.LOG]: {
    entries: [],
    max_entries: CONFIG.maxLogEntries
  }
};

// ─── File operations ────────────────────────────────────────

async function ensureBrainDir(repoRoot) {
  const brainPath = path.join(repoRoot, BRAIN_DIR);
  try {
    await stat(brainPath);
  } catch {
    await mkdir(brainPath, { recursive: true });
  }
  // Ensure snapshots dir exists
  const snapshotsPath = path.join(brainPath, "snapshots");
  try {
    await stat(snapshotsPath);
  } catch {
    await mkdir(snapshotsPath, { recursive: true });
  }
  return brainPath;
}

async function getLayerFile(repoRoot, layer) {
  return path.join(repoRoot, BRAIN_DIR, `${layer}.md`);
}

async function readLayer(repoRoot, layer) {
  const filePath = await getLayerFile(repoRoot, layer);
  try {
    const content = await readFile(filePath, "utf-8");
    return { ok: true, content, layer, tokens: estimateTokens(content) };
  } catch {
    return { ok: false, content: null, layer, tokens: 0 };
  }
}

async function writeLayer(repoRoot, layer, content) {
  const filePath = await getLayerFile(repoRoot, layer);
  await writeFile(filePath, content, "utf-8");
  return { ok: true, layer, tokens: estimateTokens(content) };
}

async function readAllLayers(repoRoot) {
  const layers = {};
  for (const layer of Object.values(LAYERS)) {
    const result = await readLayer(repoRoot, layer);
    if (result.ok) {
      layers[layer] = result.content;
    }
  }
  return layers;
}

function parseLayerContent(layer, content) {
  if (!content) return DEFAULT_LAYERS[layer] || {};
  
  const parsed = {};
  const lines = content.split("\n");
  let currentKey = null;
  let currentValue = [];

  for (const line of lines) {
    const keyMatch = line.match(/^#+\s+(.+):?\s*$/);
    if (keyMatch) {
      if (currentKey) {
        parsed[currentKey] = currentValue.join("\n").trim();
      }
      currentKey = keyMatch[1].trim();
      currentValue = [];
    } else if (currentKey) {
      currentValue.push(line);
    }
  }
  
  if (currentKey) {
    parsed[currentKey] = currentValue.join("\n").trim();
  }
  
  return parsed;
}

// ─── Context building with token caps (#614) ────────────────

async function buildContextForLLM(repoRoot, options = {}) {
  const { 
    layers = [LAYERS.IDENTITY, LAYERS.USER, LAYERS.CONTEXT, LAYERS.DURABLE],
    includeLog = false, 
    logLimit = 10,
    maxTokens = CONFIG.maxContextTokens
  } = options;
  
  const allLayers = await readAllLayers(repoRoot);
  let context = "";
  let tokenCount = 0;
  
  // Priority order: identity first, then user, context, durable
  for (const layer of layers) {
    const content = allLayers[layer];
    if (!content) continue;
    
    const layerTokens = estimateTokens(content);
    
    // If this layer would exceed budget, truncate it
    if (tokenCount + layerTokens > maxTokens) {
      const remainingTokens = maxTokens - tokenCount;
      if (remainingTokens > 100) {
        // Rough char estimate: 4 chars per token
        const maxChars = remainingTokens * 4;
        const truncated = content.substring(0, maxChars);
        context += `\n\n## ${layer.toUpperCase()} (truncated)\n\n${truncated}...`;
        tokenCount = maxTokens;
      }
      break; // Stop adding layers
    }
    
    context += `\n\n## ${layer.toUpperCase()}\n\n${content}`;
    tokenCount += layerTokens;
  }
  
  if (includeLog && allLayers[LAYERS.LOG]) {
    const logTokenBudget = Math.min(maxTokens - tokenCount, 500);
    if (logTokenBudget > 50) {
      const logLines = allLayers[LAYERS.LOG].split("\n")
        .filter(l => l.startsWith("["))
        .slice(-logLimit);
      const logText = logLines.join("\n");
      const logTokens = estimateTokens(logText);
      
      if (logTokens <= logTokenBudget) {
        context += `\n\n## RECENT LOG\n\n${logText}`;
        tokenCount += logTokens;
      } else {
        // Take fewer lines to fit
        const fittingLines = logLines.slice(-Math.floor(logLimit / 2));
        context += `\n\n## RECENT LOG\n\n${fittingLines.join("\n")}`;
        tokenCount += estimateTokens(fittingLines.join("\n"));
      }
    }
  }
  
  return context;
}

function getContextStats(repoRoot) {
  return readAllLayers(repoRoot).then(layers => {
    const stats = {};
    let totalTokens = 0;
    for (const [layer, content] of Object.entries(layers)) {
      const tokens = estimateTokens(content);
      stats[layer] = { chars: content.length, tokens, lines: content.split("\n").length };
      totalTokens += tokens;
    }
    return { layers: stats, totalTokens, maxTokens: CONFIG.maxContextTokens, budget: CONFIG.maxContextTokens - totalTokens };
  });
}

// ─── Log with compaction (#564) ─────────────────────────────

async function logActivity(repoRoot, activity) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${activity}`;
  
  let logContent = "";
  try {
    const filePath = await getLayerFile(repoRoot, LAYERS.LOG);
    logContent = await readFile(filePath, "utf-8");
  } catch {
    logContent = "# Activity Log\n\n";
  }
  
  const lines = logContent.split("\n");
  const entries = lines.filter(l => l.startsWith("["));
  
  if (entries.length >= CONFIG.logCompactionThreshold) {
    // Snapshot before compaction
    if (CONFIG.snapshotOnCompaction) {
      await snapshot(repoRoot, LAYERS.LOG, logContent);
    }
    
    // Compact: summarize old entries, keep recent 50
    const oldEntries = entries.slice(0, -50);
    const recentEntries = entries.slice(-50);
    
    try {
      const summaryPrompt = `Summarize these activity log entries into 5-10 key events. Be concise:\n${oldEntries.join("\n")}`;
      const summary = await inferenceCallOllama(summaryPrompt, { model: "qwen3.5:0.8b", maxTokens: 256 });
      
      // Strip thinking tags
      let summaryText = summary.response || "";
      summaryText = summaryText.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
      
      logContent = `# Activity Log\n\n## Compacted Summary (${new Date().toISOString().split("T")[0]})\n${summaryText}\n\n## Recent\n\n${recentEntries.join("\n")}\n${entry}\n`;
    } catch {
      // Fallback: just trim without LLM
      logContent = `# Activity Log\n\n## Recent\n\n${recentEntries.join("\n")}\n${entry}\n`;
    }
  } else {
    logContent += entry + "\n";
  }
  
  const filePath = await getLayerFile(repoRoot, LAYERS.LOG);
  await writeFile(filePath, logContent, "utf-8");
  
  return { ok: true, entry, logSize: entries.length + 1 };
}

// ─── Durable memory with deduplication (#564) ───────────────

async function learn(repoRoot, fact, source = "inferred") {
  let durableContent = "";
  try {
    const filePath = await getLayerFile(repoRoot, LAYERS.DURABLE);
    durableContent = await readFile(filePath, "utf-8");
  } catch {
    durableContent = "# Durable Memory\n\n## Facts\n\n";
  }
  
  // Deduplication: check if substantially similar fact already exists
  if (CONFIG.durableDeduplication) {
    const existingFacts = durableContent.split("\n")
      .filter(l => l.startsWith("- "))
      .map(l => l.replace(/^- \[\d{4}-\d{2}-\d{2}\] /, "").replace(/ \*\(source:.*\)\*$/, "").toLowerCase().trim());
    
    const factLower = fact.toLowerCase().trim();
    for (const existing of existingFacts) {
      // Exact or near-exact match
      if (existing === factLower || existing.includes(factLower) || factLower.includes(existing)) {
        return { ok: true, fact, source, deduplicated: true, message: "Similar fact already known" };
      }
    }
  }
  
  const timestamp = new Date().toISOString();
  const entry = `- [${timestamp.split("T")[0]}] ${fact} *(source: ${source})*`;
  
  durableContent += entry + "\n";
  const filePath = await getLayerFile(repoRoot, LAYERS.DURABLE);
  await writeFile(filePath, durableContent, "utf-8");
  
  await logActivity(repoRoot, `Learned: ${fact}`);
  
  return { ok: true, fact, source, deduplicated: false };
}

// ─── Snapshots (#564) ───────────────────────────────────────

async function snapshot(repoRoot, layer, content) {
  const brainPath = path.join(repoRoot, BRAIN_DIR, "snapshots");
  try {
    await stat(brainPath);
  } catch {
    await mkdir(brainPath, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `${layer}-${timestamp}.md`;
  await writeFile(path.join(brainPath, filename), content || "", "utf-8");
  
  // Keep only last 10 snapshots per layer
  try {
    const files = await readdir(brainPath);
    const layerSnapshots = files.filter(f => f.startsWith(`${layer}-`)).sort();
    if (layerSnapshots.length > 10) {
      const toDelete = layerSnapshots.slice(0, layerSnapshots.length - 10);
      const { unlink } = await import("node:fs/promises");
      for (const f of toDelete) {
        await unlink(path.join(brainPath, f));
      }
    }
  } catch {
    // Best-effort cleanup
  }
  
  return { ok: true, snapshot: filename };
}

// ─── User context ───────────────────────────────────────────

async function updateUserContext(repoRoot, context) {
  let userContent = "";
  try {
    const filePath = await getLayerFile(repoRoot, LAYERS.USER);
    userContent = await readFile(filePath, "utf-8");
  } catch {
    userContent = "# User Context\n\n";
  }
  
  for (const [key, value] of Object.entries(context)) {
    const keyPattern = new RegExp(`^${key}:.*$`, "gm");
    const newLine = `${key}: ${JSON.stringify(value)}`;
    
    if (keyPattern.test(userContent)) {
      userContent = userContent.replace(keyPattern, newLine);
    } else {
      userContent += `${newLine}\n`;
    }
  }
  
  const filePath = await getLayerFile(repoRoot, LAYERS.USER);
  await writeFile(filePath, userContent, "utf-8");
  
  return { ok: true };
}

// ─── Query with context ─────────────────────────────────────

async function getContext(repoRoot, query) {
  const context = await buildContextForLLM(repoRoot, { maxTokens: 2048 });
  const prompt = `Based on the context, answer: ${query}\n\nContext:\n${context}`;

  try {
    const result = await inferenceCallOllama(prompt, {
      model: "qwen3.5:0.8b",
      system: "You are MeiMei's memory assistant. Answer based on the provided context. Be concise.",
      maxTokens: 512
    });
    
    // Strip thinking tags
    let response = result.response || "";
    response = response.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    
    return { ok: true, response };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

// ─── Sync from project files ────────────────────────────────

async function syncFromProjectFiles(repoRoot) {
  const files = {
    "IDENTITY.md": LAYERS.IDENTITY,
    "agent.md": LAYERS.IDENTITY,
    "USER.md": LAYERS.USER,
    "skills/catalog.md": LAYERS.SKILLS
  };
  
  const results = [];
  
  for (const [file, layer] of Object.entries(files)) {
    try {
      const content = await readFile(path.join(repoRoot, file), "utf-8");
      const layerFile = await getLayerFile(repoRoot, layer);
      const existing = await readFile(layerFile, "utf-8").catch(() => "");
      
      if (content !== existing) {
        await writeFile(layerFile, content, "utf-8");
        results.push({ file, layer, synced: true });
      }
    } catch {
      results.push({ file, layer, synced: false, error: "Not found" });
    }
  }
  
  return results;
}

// ─── Think with context budget (#614) ───────────────────────

async function think(repoRoot, question, options = {}) {
  const { includeHistory = true, depth = "medium" } = options;
  
  // Budget context tokens based on depth
  const contextBudget = depth === "deep" ? 3072 : depth === "fast" ? 1024 : 2048;
  
  const context = await buildContextForLLM(repoRoot, {
    includeLog: includeHistory,
    logLimit: depth === "deep" ? 50 : 10,
    maxTokens: contextBudget
  });
  
  const prompt = `Question: ${question}

Context:
${context}

Think through this step by step, considering:
1. Who am I (identity)?
2. What does OC (the user) need?
3. What is the current project/context?
4. What have I learned before?
5. What skills are available?`;

  try {
    const result = await inferenceCallOllama(prompt, {
      model: depth === "deep" ? "llama3:latest" : "gemma3:1b",
      system: "You are MeiMei, a sharp, dependable AI agent. Think deeply and provide actionable insights.",
      temperature: 0.5,
      maxTokens: 1024
    });
    
    // Strip thinking tags
    let response = result.response || "";
    response = response.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    
    await logActivity(repoRoot, `Thought about: ${question.substring(0, 50)}...`);
    
    return { ok: true, response, meta: result };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

// ─── Compaction/curation (#564) ─────────────────────────────

async function compactLog(repoRoot) {
  const logResult = await readLayer(repoRoot, LAYERS.LOG);
  if (!logResult.ok) return { ok: false, error: "No log to compact" };
  
  const entries = logResult.content.split("\n").filter(l => l.startsWith("["));
  if (entries.length < 50) return { ok: true, message: "Log too small to compact", entries: entries.length };
  
  // Snapshot before compaction
  await snapshot(repoRoot, LAYERS.LOG, logResult.content);
  
  const oldEntries = entries.slice(0, -30);
  const recentEntries = entries.slice(-30);
  
  try {
    const result = await inferenceCallOllama(
      `Summarize these log entries into 5-10 key events:\n${oldEntries.join("\n")}`,
      { model: "qwen3.5:0.8b", maxTokens: 256 }
    );
    
    let summaryText = (result.response || "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    
    const compacted = `# Activity Log\n\n## Compacted Summary (${new Date().toISOString().split("T")[0]})\n${summaryText}\n\n## Recent\n\n${recentEntries.join("\n")}\n`;
    await writeLayer(repoRoot, LAYERS.LOG, compacted);
    
    return { ok: true, compacted: oldEntries.length, kept: recentEntries.length };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function curateDurable(repoRoot) {
  const durableResult = await readLayer(repoRoot, LAYERS.DURABLE);
  if (!durableResult.ok) return { ok: false, error: "No durable memory" };
  
  // Check if durable is getting large
  if (durableResult.tokens < CONFIG.maxLayerTokens) {
    return { ok: true, message: "Durable memory within budget", tokens: durableResult.tokens };
  }
  
  // Snapshot before curation
  await snapshot(repoRoot, LAYERS.DURABLE, durableResult.content);
  
  // Ask LLM to consolidate
  try {
    const result = await inferenceCallOllama(
      `Consolidate this durable memory file. Remove redundant entries, merge similar facts, keep the most important items. Return the cleaned markdown:\n\n${durableResult.content}`,
      { model: "gemma3:1b", maxTokens: 2048 }
    );
    
    let curated = (result.response || "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    if (curated.length > 100) {
      await writeLayer(repoRoot, LAYERS.DURABLE, curated);
      return { ok: true, beforeTokens: durableResult.tokens, afterTokens: estimateTokens(curated) };
    }
  } catch (error) {
    return { ok: false, error: error.message };
  }
  
  return { ok: true, message: "Curation skipped" };
}

export {
  LAYERS,
  DEFAULT_LAYERS,
  CONFIG,
  ensureBrainDir,
  getLayerFile,
  readLayer,
  writeLayer,
  readAllLayers,
  parseLayerContent,
  buildContextForLLM,
  getContextStats,
  logActivity,
  learn,
  updateUserContext,
  getContext,
  syncFromProjectFiles,
  think,
  snapshot,
  compactLog,
  curateDurable
};
