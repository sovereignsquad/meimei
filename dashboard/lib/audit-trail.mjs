import { createHash } from "node:crypto";
import { mkdir, readFile, appendFile } from "node:fs/promises";
import path from "node:path";

const AUDIT_RELATIVE_PATH = path.join("audit", "decision-action-trail.v1.jsonl");

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function nowIso() {
  return new Date().toISOString();
}

async function readLastHash(logPath) {
  try {
    const raw = await readFile(logPath, "utf8");
    const lines = raw.trim().split("\n").filter(Boolean);
    if (lines.length < 1) return "GENESIS";
    const last = JSON.parse(lines[lines.length - 1]);
    return typeof last.hash === "string" && last.hash.trim() ? last.hash : "GENESIS";
  } catch {
    return "GENESIS";
  }
}

export function createAuditTrail(repoRoot) {
  const logPath = path.join(repoRoot, AUDIT_RELATIVE_PATH);

  async function appendAuditEvent({
    type,
    channel = "api",
    eventId = "",
    outcome = "",
    reason = "",
    riskTier = "",
    requiresApproval = false,
    approved = false,
    details = {}
  }) {
    await mkdir(path.dirname(logPath), { recursive: true });
    const prevHash = await readLastHash(logPath);
    const record = {
      v: "v1",
      at: nowIso(),
      type: String(type || "unknown"),
      channel: String(channel || "unknown"),
      eventId: String(eventId || ""),
      outcome: String(outcome || ""),
      reason: String(reason || ""),
      riskTier: String(riskTier || ""),
      requiresApproval: requiresApproval === true,
      approved: approved === true,
      details,
      prevHash
    };
    const material = JSON.stringify(record);
    const hash = sha256(material);
    const envelope = { ...record, hash };
    await appendFile(logPath, `${JSON.stringify(envelope)}\n`, "utf8");
    return { logPath, hash };
  }

  return {
    logPath,
    appendAuditEvent
  };
}
