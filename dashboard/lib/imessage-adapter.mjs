import path from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateExternalChannelPolicy } from "./external-channel-policy-engine.mjs";
import { createAuditTrail } from "./audit-trail.mjs";
import { createReliabilityTelemetry } from "./reliability-telemetry.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");
const { appendAuditEvent } = createAuditTrail(repoRoot);
const { record } = createReliabilityTelemetry(repoRoot);

function nowIso() {
  return new Date().toISOString();
}

function toImessageEvent(input) {
  const from = String(input.from || input.userId || "").trim();
  const text = String(input.text || input.message || "").trim();
  const threadId = String(input.threadId || from || "imessage-thread").trim();
  const explicitEventId = String(input.eventId || "").trim();
  return {
    eventId: explicitEventId || `imessage-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    channel: "imessage",
    direction: "inbound",
    receivedAt: nowIso(),
    actor: {
      userId: from || "unknown-imessage-peer",
      displayName: String(input.displayName || from || "iMessage peer")
    },
    thread: {
      threadId,
      isGroup: input.isGroup === true
    },
    payload: {
      text,
      attachments: Array.isArray(input.attachments) ? input.attachments : []
    },
    meta: {
      rawProvider: String(input.rawProvider || "imessage-webhook"),
      rawType: String(input.rawType || "incoming-message")
    },
    input: {
      channel: "imessage",
      taskType: String(input.taskType || "chat"),
      costTarget: String(input.costTarget || "low"),
      actionIntent: String(input.actionIntent || "reply"),
      approved: input.approved === true
    }
  };
}

function resultText(stdout) {
  const text = String(stdout || "").trim();
  if (!text) return "Processed.";
  return text.length > 2000 ? `${text.slice(0, 2000)}...` : text;
}

export function createImessageAdapter({ runAgentTurn }) {
  const seenEventIds = new Set();

  async function handleInbound(input) {
    const startedAt = Date.now();
    const event = toImessageEvent(input);
    const lifecycle = [];
    lifecycle.push({ stage: "ingress", at: nowIso() });
    lifecycle.push({ stage: "normalize", at: nowIso(), eventId: event.eventId });

    if (seenEventIds.has(event.eventId)) {
      lifecycle.push({ stage: "delivery-state", at: nowIso(), state: "blocked", reason: "duplicate eventId" });
      return {
        ok: false,
        code: 409,
        error: `Duplicate eventId: ${event.eventId}`,
        adapter: { channel: "imessage", lifecycle, state: "blocked" }
      };
    }
    seenEventIds.add(event.eventId);

    const policy = evaluateExternalChannelPolicy(event.input);
    lifecycle.push({
      stage: "policy-check",
      at: nowIso(),
      allowed: policy.allowed,
      reason: policy.reason,
      riskTier: policy.riskTier,
      requiresApproval: policy.requiresApproval
    });

    await appendAuditEvent({
      type: "policy-decision",
      channel: "imessage",
      eventId: event.eventId,
      outcome: policy.allowed ? "allowed" : "blocked",
      reason: policy.reason,
      riskTier: policy.riskTier,
      requiresApproval: policy.requiresApproval,
      approved: event.input.approved,
      details: {
        from: event.actor.userId,
        threadId: event.thread.threadId,
        taskType: event.input.taskType,
        costTarget: event.input.costTarget
      }
    });

    if (!policy.allowed) {
      await record({
        type: "request-completed",
        channel: "imessage",
        eventId: event.eventId,
        ok: false,
        state: "blocked",
        latencyMs: Date.now() - startedAt,
        riskTier: policy.riskTier,
        requiresApproval: policy.requiresApproval,
        approved: event.input.approved,
        reason: policy.reason
      });
      lifecycle.push({ stage: "delivery-state", at: nowIso(), state: "blocked", reason: policy.reason });
      return {
        ok: false,
        code: 403,
        error: policy.reason,
        adapter: { channel: "imessage", lifecycle, state: "blocked" }
      };
    }

    const turn = await runAgentTurn(event);
    const ok = turn.code === 0;
    const summary = resultText(turn.stdout);
    lifecycle.push({ stage: "dispatch", at: nowIso(), ok });
    lifecycle.push({ stage: "egress", at: nowIso(), ok });
    lifecycle.push({ stage: "delivery-state", at: nowIso(), state: ok ? "delivered" : "failed" });

    await appendAuditEvent({
      type: "delivery-state",
      channel: "imessage",
      eventId: event.eventId,
      outcome: ok ? "delivered" : "failed",
      reason: ok ? "agent turn completed" : String(turn.stderr || "agent turn failed"),
      riskTier: policy.riskTier,
      requiresApproval: policy.requiresApproval,
      approved: event.input.approved,
      details: {
        code: turn.code,
        signal: turn.signal,
        preview: summary
      }
    });

    await record({
      type: "request-completed",
      channel: "imessage",
      eventId: event.eventId,
      ok,
      state: ok ? "delivered" : "failed",
      latencyMs: Date.now() - startedAt,
      riskTier: policy.riskTier,
      requiresApproval: policy.requiresApproval,
      approved: event.input.approved,
      reason: ok ? "agent turn completed" : String(turn.stderr || "agent turn failed")
    });

    return {
      ok,
      code: ok ? 200 : 502,
      error: ok ? null : String(turn.stderr || "iMessage delivery failed"),
      result: {
        eventId: event.eventId,
        from: event.actor.userId,
        threadId: event.thread.threadId,
        deliveredViaImessage: input.deliver !== false,
        outputPreview: summary
      },
      adapter: {
        channel: "imessage",
        lifecycle,
        state: ok ? "delivered" : "failed"
      }
    };
  }

  return { handleInbound };
}
