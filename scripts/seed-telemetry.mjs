#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const logPath = path.join(repoRoot, "telemetry", "events.v1.jsonl");

const events = [
  {
    v: "v1",
    at: "2026-03-26T19:00:00.000Z",
    type: "request-completed",
    channel: "dashboard",
    eventId: "evt-1",
    ok: true,
    state: "delivered",
    latencyMs: 40,
    riskTier: "low",
    requiresApproval: false,
    approved: false,
    reason: "ok"
  },
  {
    v: "v1",
    at: "2026-03-26T19:00:01.000Z",
    type: "request-completed",
    channel: "email",
    eventId: "evt-2",
    ok: false,
    state: "blocked",
    latencyMs: 20,
    riskTier: "high",
    requiresApproval: true,
    approved: false,
    reason: "approval required"
  },
  {
    v: "v1",
    at: "2026-03-26T19:00:02.000Z",
    type: "request-completed",
    channel: "api",
    eventId: "evt-3",
    ok: true,
    state: "delivered",
    latencyMs: 80,
    riskTier: "medium",
    requiresApproval: false,
    approved: false,
    reason: "ok"
  },
  {
    v: "v1",
    at: "2026-03-26T19:00:03.000Z",
    type: "request-completed",
    channel: "discord",
    eventId: "evt-4",
    ok: false,
    state: "failed",
    latencyMs: 120,
    riskTier: "medium",
    requiresApproval: false,
    approved: false,
    reason: "provider timeout"
  }
];

await mkdir(path.dirname(logPath), { recursive: true });
await writeFile(logPath, `${events.map((e) => JSON.stringify(e)).join("\n")}\n`, "utf8");
console.log(`PASS: seeded telemetry events at ${logPath}`);
