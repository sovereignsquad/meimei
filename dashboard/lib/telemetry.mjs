/**
 * OpenClaw telemetry for Mission Control and health surfaces.
 *
 * `getOpenClawHealth` / `getTelemetry` use the real `openclaw` CLI on PATH:
 * `gateway status`, `agents list`, `skills check`. Log-derived fields read
 * `~/.openclaw/workspace[-agent]/logs` only — no random or placeholder rows.
 */
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const execAsync = promisify(exec);

async function runOpenClawCommand(args, timeout = 30000) {
  try {
    const { stdout, stderr } = await execAsync(`openclaw ${args}`, { timeout });
    return { ok: true, stdout, stderr };
  } catch (error) {
    return { ok: false, stdout: error.stdout || "", stderr: error.stderr || error.message };
  }
}

async function getGatewayStatus() {
  const result = await runOpenClawCommand("gateway status");
  if (!result.ok) {
    return { running: false, error: result.stderr };
  }
  
  const running = result.stdout.includes("Runtime: running");
  const pidMatch = result.stdout.match(/pid (\d+)/);
  
  return {
    running,
    pid: pidMatch ? parseInt(pidMatch[1]) : null,
    details: result.stdout
  };
}

async function getAgentsList() {
  const result = await runOpenClawCommand("agents list");
  if (!result.ok) {
    return { agents: [], error: result.stderr };
  }
  
  const agents = [];
  const agentBlocks = result.stdout.split(/(?=- )/);
  
  for (const block of agentBlocks) {
    const lines = block.split("\n");
    const nameMatch = lines[0]?.match(/^- (.+?) \(/);
    if (nameMatch) {
      const name = nameMatch[1];
      const modelMatch = block.match(/Model: (.+)/);
      const identityMatch = block.match(/Identity: (.+?) \(/);
      
      agents.push({
        name,
        model: modelMatch ? modelMatch[1].trim() : "unknown",
        identity: identityMatch ? identityMatch[1].trim() : name,
        status: "active"
      });
    }
  }
  
  return { agents };
}

async function getSkillStatus() {
  const result = await runOpenClawCommand("skills check");
  if (!result.ok) {
    return { skills: [], error: result.stderr };
  }
  
  const skills = [];
  const readyMatch = result.stdout.match(/Ready to use:\n([\s\S]+?)(?=\nMissing|$)/);
  
  if (readyMatch) {
    const lines = readyMatch[1].split("\n").filter(l => l.includes("📝") || l.includes("⏰") || l.includes("📦"));
    for (const line of lines) {
      const nameMatch = line.match(/[\u{1F4DD}\u{23F0}\u{1F4E6}]\s+(.+)/u);
      if (nameMatch) {
        skills.push({ name: nameMatch[1], status: "ready" });
      }
    }
  }
  
  const disabledMatch = result.stdout.match(/⏸ Disabled: (\d+)/);
  const blockedMatch = result.stdout.match(/🚫 Blocked by allowlist: (\d+)/);
  const missingMatch = result.stdout.match(/✗ Missing requirements: (\d+)/);
  
  return {
    skills,
    summary: {
      total: parseInt(disabledMatch?.[1] || 0) + parseInt(blockedMatch?.[1] || 0) + parseInt(missingMatch?.[1] || 0) + skills.length,
      ready: skills.length,
      disabled: parseInt(disabledMatch?.[1] || 0),
      blocked: parseInt(blockedMatch?.[1] || 0),
      missing: parseInt(missingMatch?.[1] || 0)
    }
  };
}

async function getAgentLogs(agentId = "main", limit = 20) {
  const logDir = path.join(os.homedir(), ".openclaw", "workspace" + (agentId !== "main" ? `-${agentId}` : ""), "logs");

  try {
    const files = await readdir(logDir);
    const logFiles = files.filter((f) => f.endsWith(".log")).sort().slice(-5);

    const logs = [];
    for (const file of logFiles) {
      const content = await readFile(path.join(logDir, file), "utf-8");
      const lines = content.split("\n").slice(-Math.max(1, Math.ceil(limit / Math.max(1, logFiles.length))));
      logs.push(...lines);
    }

    return { logs: logs.slice(-limit), source: "workspace", agentId };
  } catch {
    return { logs: [], source: "workspace", agentId, error: "No logs found" };
  }
}

/** ISO-like timestamp substring in a log line, or null */
function extractLogTimestamp(line) {
  const m = line.match(/\d{4}-\d{2}-\d{2}(?:T| )\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?/);
  if (!m) return null;
  return m[0].replace(" ", "T");
}

function logLineToRun(agentId, line, lineIndexInTail) {
  const trimmed = line.trim();
  const isError = /error|fail|exception|critical|fatal/i.test(trimmed);
  return {
    id: `log:${agentId}:${lineIndexInTail}`,
    type: "agent-log",
    agentId,
    status: isError ? "failed" : "success",
    message: trimmed.substring(0, 400),
    timestamp: extractLogTimestamp(trimmed),
    duration: null
  };
}

/**
 * Recent activity from real workspace logs (main, judge, drafter). No synthetic rows.
 * @param {{ maxTotal?: number, perAgent?: number }} opts
 */
async function buildRecentRunsFromLogs(opts = {}) {
  const maxTotal = opts.maxTotal ?? 15;
  const perAgent = opts.perAgent ?? 8;
  const agentIds = ["main", "judge", "drafter"];
  const runs = [];
  const errorEvents = [];

  for (const agentId of agentIds) {
    const { logs } = await getAgentLogs(agentId, perAgent * 3);
    const lines = (logs || []).filter((l) => l.trim()).slice(-perAgent);
    for (let i = lines.length - 1; i >= 0; i -= 1) {
      const run = logLineToRun(agentId, lines[i], i);
      runs.push(run);
      if (run.status === "failed") {
        errorEvents.push({
          id: `err:${run.id}`,
          type: "agent-log",
          agentId,
          status: "failed",
          error: run.message.substring(0, 200),
          timestamp: run.timestamp
        });
      }
    }
  }

  return {
    recentRuns: runs.slice(0, maxTotal),
    errors: errorEvents.slice(0, maxTotal)
  };
}

async function getOpenClawHealth() {
  const [gateway, agents, skills] = await Promise.all([
    getGatewayStatus(),
    getAgentsList(),
    getSkillStatus()
  ]);
  
  return {
    ok: gateway.running,
    gateway,
    agents: agents.agents,
    skills: skills.summary,
    timestamp: new Date().toISOString()
  };
}

async function getTelemetry() {
  const health = await getOpenClawHealth();
  const { recentRuns, errors } = await buildRecentRunsFromLogs({ maxTotal: 20, perAgent: 10 });

  const failCount = recentRuns.filter((r) => r.status === "failed").length;
  const successRate =
    recentRuns.length === 0
      ? null
      : Math.round(((recentRuns.length - failCount) / recentRuns.length) * 100);

  return {
    ok: true,
    timestamp: new Date().toISOString(),
    health,
    overview: {
      totalRuns: recentRuns.length,
      successRate,
      activeAgents: health.agents?.length ?? 0,
      gatewayStatus: health.gateway.running ? "running" : "stopped"
    },
    recentRuns,
    errors,
    agentStatus: health.agents || []
  };
}

export {
  getGatewayStatus,
  getAgentsList,
  getSkillStatus,
  getAgentLogs,
  getOpenClawHealth,
  getTelemetry,
  runOpenClawCommand
};
