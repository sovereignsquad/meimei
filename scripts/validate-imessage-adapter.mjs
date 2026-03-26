#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createImessageAdapter } from "../dashboard/lib/imessage-adapter.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

const adapter = createImessageAdapter({
  runAgentTurn: async (event) => ({
    code: 0,
    signal: null,
    stdout: `echo:${event.payload.text}`,
    stderr: ""
  })
});

const blocked = await adapter.handleInbound({
  eventId: "imsg-test-blocked",
  from: "+15550001111",
  text: "high risk test",
  taskType: "research",
  costTarget: "high",
  actionIntent: "reply",
  approved: false
});
assert(blocked.ok === false, "high-risk unapproved message should be blocked");
assert(blocked.code === 403, "blocked response code should be 403");

const delivered = await adapter.handleInbound({
  eventId: "imsg-test-delivered",
  from: "+15550001111",
  text: "hello meimei",
  taskType: "chat",
  costTarget: "low",
  actionIntent: "reply",
  approved: false
});
assert(delivered.ok === true, "low-risk chat message should be delivered");
assert(delivered.result?.deliveredViaImessage === true, "delivery flag should be true");
assert(delivered.adapter?.state === "delivered", "adapter state should be delivered");

const duplicate = await adapter.handleInbound({
  eventId: "imsg-test-delivered",
  from: "+15550001111",
  text: "hello again",
  taskType: "chat",
  costTarget: "low",
  actionIntent: "reply"
});
assert(duplicate.ok === false, "duplicate event should be blocked");
assert(duplicate.code === 409, "duplicate event code should be 409");

if (process.exitCode) process.exit(1);
pass(`Validated iMessage adapter lifecycle and idempotency in ${repoRoot}`);
