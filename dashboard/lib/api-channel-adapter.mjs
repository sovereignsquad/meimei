import { evaluateExternalChannelPolicy } from "./external-channel-policy-engine.mjs";
import { createAuditTrail } from "./audit-trail.mjs";
import { createReliabilityTelemetry } from "./reliability-telemetry.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");
const { appendAuditEvent } = createAuditTrail(repoRoot);
const { record } = createReliabilityTelemetry(repoRoot);

function nowIso() {
  return new Date().toISOString();
}

function normalizeRoutingInput(input, method = "POST") {
  return {
    eventId: `api-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    channel: "api",
    direction: "inbound",
    receivedAt: nowIso(),
    actor: {
      userId: "api-client",
      displayName: "API client"
    },
    thread: {
      threadId: "api-request",
      isGroup: false
    },
    payload: {
      text: "",
      attachments: []
    },
    meta: {
      rawProvider: "dashboard-http",
      rawType: `${method}-model-routing`
    },
    input: {
      channel: String(input.channel || "dashboard"),
      taskType: String(input.taskType || "chat"),
      costTarget: String(input.costTarget || "low"),
      message: String(input.message || ""),
      actionIntent: String(input.actionIntent || "execute"),
      approved: input.approved === true
    }
  };
}

function policyCheck(event) {
  return evaluateExternalChannelPolicy(event.input);
}

export async function routeViaApiAdapter(input, { previewModelRouting, method = "POST" }) {
  const startedAt = Date.now();
  const stages = [];
  const event = normalizeRoutingInput(input, method);
  stages.push({ stage: "ingress", at: nowIso() });
  stages.push({ stage: "normalize", at: nowIso(), eventId: event.eventId });

  const policy = policyCheck(event);
  stages.push({ stage: "policy-check", at: nowIso(), allowed: policy.allowed, reason: policy.reason });
  await appendAuditEvent({
    type: "policy-decision",
    channel: event.input.channel,
    eventId: event.eventId,
    outcome: policy.allowed ? "allowed" : "blocked",
    reason: policy.reason,
    riskTier: policy.riskTier,
    requiresApproval: policy.requiresApproval,
    approved: event.input.approved,
    details: {
      taskType: event.input.taskType,
      costTarget: event.input.costTarget,
      actionIntent: event.input.actionIntent
    }
  });

  if (!policy.allowed) {
    await appendAuditEvent({
      type: "delivery-state",
      channel: "api",
      eventId: event.eventId,
      outcome: "blocked",
      reason: policy.reason,
      riskTier: policy.riskTier,
      requiresApproval: policy.requiresApproval,
      approved: event.input.approved,
      details: { state: "blocked" }
    });
    await record({
      type: "request-completed",
      channel: event.input.channel,
      eventId: event.eventId,
      ok: false,
      state: "blocked",
      latencyMs: Date.now() - startedAt,
      riskTier: policy.riskTier,
      requiresApproval: policy.requiresApproval,
      approved: event.input.approved,
      reason: policy.reason
    });
    return {
      ok: false,
      code: 400,
      error: policy.reason,
      adapter: {
        channel: "api",
        lifecycle: stages,
        state: "blocked"
      }
    };
  }

  let route = null;
  try {
    route = await previewModelRouting({
      channel: event.input.channel,
      taskType: event.input.taskType,
      costTarget: event.input.costTarget,
      message: event.input.message
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await record({
      type: "request-completed",
      channel: event.input.channel,
      eventId: event.eventId,
      ok: false,
      state: "failed",
      latencyMs: Date.now() - startedAt,
      riskTier: policy.riskTier,
      requiresApproval: policy.requiresApproval,
      approved: event.input.approved,
      reason: message
    });
    throw error;
  }
  await appendAuditEvent({
    type: "routing-decision",
    channel: event.input.channel,
    eventId: event.eventId,
    outcome: "routed",
    reason: "route selected",
    riskTier: policy.riskTier,
    requiresApproval: policy.requiresApproval,
    approved: event.input.approved,
    details: {
      route
    }
  });
  await record({
    type: "request-completed",
    channel: event.input.channel,
    eventId: event.eventId,
    ok: true,
    state: "delivered",
    latencyMs: Date.now() - startedAt,
    riskTier: policy.riskTier,
    requiresApproval: policy.requiresApproval,
    approved: event.input.approved,
    reason: "adapter flow completed"
  });
  stages.push({ stage: "dispatch", at: nowIso(), ok: true });
  stages.push({ stage: "egress", at: nowIso(), ok: true });
  stages.push({ stage: "delivery-state", at: nowIso(), state: "delivered" });
  await appendAuditEvent({
    type: "delivery-state",
    channel: "api",
    eventId: event.eventId,
    outcome: "delivered",
    reason: "adapter flow completed",
    riskTier: policy.riskTier,
    requiresApproval: policy.requiresApproval,
    approved: event.input.approved,
    details: { state: "delivered" }
  });

  return {
    ok: true,
    code: 200,
    route,
    adapter: {
      channel: "api",
      lifecycle: stages,
      state: "delivered"
    }
  };
}
