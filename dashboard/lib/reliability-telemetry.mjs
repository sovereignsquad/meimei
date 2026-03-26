import { mkdir, appendFile, readFile } from "node:fs/promises";
import path from "node:path";

const TELEMETRY_RELATIVE_PATH = path.join("telemetry", "events.v1.jsonl");

function nowIso() {
  return new Date().toISOString();
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function createReliabilityTelemetry(repoRoot) {
  const logPath = path.join(repoRoot, TELEMETRY_RELATIVE_PATH);

  async function record(event) {
    await mkdir(path.dirname(logPath), { recursive: true });
    const envelope = {
      v: "v1",
      at: nowIso(),
      ...event
    };
    await appendFile(logPath, `${JSON.stringify(envelope)}\n`, "utf8");
    return envelope;
  }

  async function readEvents() {
    try {
      const raw = await readFile(logPath, "utf8");
      return raw
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line))
        .filter((event) => event?.v === "v1");
    } catch {
      return [];
    }
  }

  async function getSummary() {
    const events = await readEvents();
    const routed = events.filter((e) => e.type === "request-completed");
    const total = routed.length;
    const success = routed.filter((e) => e.ok === true).length;
    const blocked = routed.filter((e) => e.state === "blocked").length;
    const failed = routed.filter((e) => e.state === "failed").length;
    const avgLatencyMs = total > 0
      ? Math.round(routed.reduce((acc, e) => acc + toNumber(e.latencyMs), 0) / total)
      : 0;
    const p95LatencyMs = (() => {
      if (total < 1) return 0;
      const values = routed.map((e) => toNumber(e.latencyMs)).sort((a, b) => a - b);
      const idx = Math.min(values.length - 1, Math.floor(values.length * 0.95));
      return values[idx];
    })();
    const successRate = total > 0 ? Number((success / total).toFixed(4)) : 0;
    const byChannel = {};
    for (const e of routed) {
      const channel = String(e.channel || "unknown");
      if (!byChannel[channel]) {
        byChannel[channel] = { total: 0, success: 0, blocked: 0, failed: 0 };
      }
      byChannel[channel].total += 1;
      if (e.ok === true) byChannel[channel].success += 1;
      if (e.state === "blocked") byChannel[channel].blocked += 1;
      if (e.state === "failed") byChannel[channel].failed += 1;
    }
    return {
      v: "v1",
      generatedAt: nowIso(),
      logPath,
      slo: {
        totalRequests: total,
        successRate,
        blockedRate: total > 0 ? Number((blocked / total).toFixed(4)) : 0,
        failureRate: total > 0 ? Number((failed / total).toFixed(4)) : 0,
        avgLatencyMs,
        p95LatencyMs
      },
      byChannel
    };
  }

  return {
    logPath,
    record,
    getSummary
  };
}
