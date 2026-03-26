#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.resolve(__dirname, "..", "openclaw.config.json");

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exitCode = 1;
}

function pass(msg) {
  console.log(`PASS: ${msg}`);
}

function jsonEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function requiredArray(value, pathLabel) {
  if (!Array.isArray(value) || value.length === 0) {
    fail(`${pathLabel} must be a non-empty array`);
    return false;
  }
  return true;
}

async function main() {
  const raw = await readFile(configPath, "utf8");
  const config = JSON.parse(raw);

  const whatsapp = config?.channels?.whatsapp;
  if (!whatsapp || typeof whatsapp !== "object") {
    fail("channels.whatsapp is required");
    return;
  }

  if (whatsapp.enabled !== true) fail("channels.whatsapp.enabled must be true");
  if (whatsapp.dmPolicy !== "disabled") fail('channels.whatsapp.dmPolicy must be "disabled"');
  if (whatsapp.groupPolicy !== "allowlist") fail('channels.whatsapp.groupPolicy must be "allowlist"');
  requiredArray(whatsapp.groupAllowFrom, "channels.whatsapp.groupAllowFrom");

  const pluginAllow = config?.plugins?.allow;
  if (!Array.isArray(pluginAllow) || !pluginAllow.includes("whatsapp")) {
    fail('plugins.allow must include "whatsapp"');
  }

  const pluginEnabled = config?.plugins?.entries?.whatsapp?.enabled;
  if (pluginEnabled !== true) fail("plugins.entries.whatsapp.enabled must be true");

  const defaultAccount = whatsapp?.accounts?.default;
  if (!defaultAccount || typeof defaultAccount !== "object") {
    fail("channels.whatsapp.accounts.default is required");
    return;
  }

  if (defaultAccount.enabled !== true) fail("channels.whatsapp.accounts.default.enabled must be true");
  if (defaultAccount.dmPolicy !== whatsapp.dmPolicy) {
    fail("default account dmPolicy must match top-level channels.whatsapp.dmPolicy");
  }
  if (defaultAccount.groupPolicy !== whatsapp.groupPolicy) {
    fail("default account groupPolicy must match top-level channels.whatsapp.groupPolicy");
  }
  if (!jsonEqual(defaultAccount.groupAllowFrom, whatsapp.groupAllowFrom)) {
    fail("default account groupAllowFrom must match top-level channels.whatsapp.groupAllowFrom");
  }

  if (process.exitCode) return;
  pass("WhatsApp adapter parity checks passed");
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
