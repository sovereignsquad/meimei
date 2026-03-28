import { readFile, writeFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { callOllama, callOllamaJson, summarize } from "../llm.mjs";

const BRAIN_DIR = "brain";
const LAYERS = {
  IDENTITY: "identity",
  USER: "user",
  CONTEXT: "context",
  SKILLS: "skills",
  DURABLE: "durable",
  LOG: "log"
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
    max_entries: 1000
  }
};

async function ensureBrainDir(repoRoot) {
  const brainPath = path.join(repoRoot, BRAIN_DIR);
  try {
    await stat(brainPath);
  } catch {
    await writeFile(path.join(brainPath, ".gitkeep"), "");
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
    return { ok: true, content, layer };
  } catch {
    return { ok: false, content: null, layer };
  }
}

async function writeLayer(repoRoot, layer, content) {
  const filePath = await getLayerFile(repoRoot, layer);
  await writeFile(filePath, content, "utf-8");
  return { ok: true, layer };
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

async function buildContextForLLM(repoRoot, options = {}) {
  const { layers = Object.values(LAYERS), includeLog = false, logLimit = 10 } = options;
  
  const allLayers = await readAllLayers(repoRoot);
  let context = "";
  
  for (const layer of layers) {
    const content = allLayers[layer];
    if (content) {
      context += `\n\n## ${layer.toUpperCase()}\n\n${content}`;
    }
  }
  
  if (includeLog && allLayers[LAYERS.LOG]) {
    const logLines = allLayers[LAYERS.LOG].split("\n").slice(-logLimit);
    context += `\n\n## RECENT LOG\n\n${logLines.join("\n")}`;
  }
  
  return context;
}

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
  
  if (entries.length >= DEFAULT_LAYERS[LAYERS.LOG].max_entries) {
    const summaryPrompt = `Summarize these log entries into key events:\n${entries.slice(-100).join("\n")}`;
    try {
      const summary = await summarize(summaryPrompt);
      logContent = `# Activity Log\n\n## Summary (${new Date().toISOString().split("T")[0]})\n${summary.response}\n\n${entry}\n`;
    } catch {
      logContent = entries.slice(-500).join("\n") + "\n" + entry + "\n";
    }
  } else {
    logContent += entry + "\n";
  }
  
  const filePath = await getLayerFile(repoRoot, LAYERS.LOG);
  await writeFile(filePath, logContent, "utf-8");
  
  return { ok: true, entry };
}

async function learn(repoRoot, fact, source = "inferred") {
  let durableContent = "";
  try {
    const filePath = await getLayerFile(repoRoot, LAYERS.DURABLE);
    durableContent = await readFile(filePath, "utf-8");
  } catch {
    durableContent = "# Durable Memory\n\n## Facts\n\n";
  }
  
  const timestamp = new Date().toISOString();
  const entry = `- [${timestamp.split("T")[0]}] ${fact} *(source: ${source})*`;
  
  if (!durableContent.includes(entry)) {
    durableContent += entry + "\n";
    const filePath = await getLayerFile(repoRoot, LAYERS.DURABLE);
    await writeFile(filePath, durableContent, "utf-8");
  }
  
  await logActivity(repoRoot, `Learned: ${fact}`);
  
  return { ok: true, fact, source };
}

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

async function getContext(repoRoot, query) {
  const prompt = `Based on the context, answer: ${query}

Context:
${await buildContextForLLM(repoRoot)}`;

  try {
    const result = await callOllama(prompt, {
      model: "qwen3.5:0.8b",
      system: "You are MeiMei's memory assistant. Answer based on the provided context.",
      maxTokens: 512
    });
    
    return { ok: true, response: result.response };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

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

async function think(repoRoot, question, options = {}) {
  const { includeHistory = true, depth = "medium" } = options;
  
  const context = await buildContextForLLM(repoRoot, {
    includeLog: includeHistory,
    logLimit: depth === "deep" ? 50 : 10
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
    const result = await callOllama(prompt, {
      model: depth === "deep" ? "llama3:latest" : "gemma3:1b",
      system: "You are MeiMei, a sharp, dependable AI agent. Think deeply and provide actionable insights.",
      temperature: 0.5,
      maxTokens: 1024
    });
    
    await logActivity(repoRoot, `Thought about: ${question.substring(0, 50)}...`);
    
    return { ok: true, response: result.response, meta: result };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export {
  LAYERS,
  DEFAULT_LAYERS,
  ensureBrainDir,
  getLayerFile,
  readLayer,
  writeLayer,
  readAllLayers,
  parseLayerContent,
  buildContextForLLM,
  logActivity,
  learn,
  updateUserContext,
  getContext,
  syncFromProjectFiles,
  think
};
