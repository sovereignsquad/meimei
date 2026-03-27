#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const registryPath = path.resolve(__dirname, "..", "functions", "registry.v1.json");

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function ok(message) {
  console.log(`PASS: ${message}`);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateFunctionContract(fn, index, seenIds) {
  const prefix = `functions[${index}]`;
  const requiredTop = ["id", "version", "displayName", "route", "api", "input", "output", "safety", "capabilities", "failureModel"];
  for (const field of requiredTop) {
    if (!(field in fn)) fail(`${prefix}.${field} is required`);
  }

  if (!fn.id || typeof fn.id !== "string") fail(`${prefix}.id must be a non-empty string`);
  if (seenIds.has(fn.id)) fail(`${prefix}.id "${fn.id}" is duplicated`);
  seenIds.add(fn.id);

  if (fn.version !== "v1") fail(`${prefix}.version must be "v1"`);
  if (!fn.description || typeof fn.description !== "string" || fn.description.length < 1 || fn.description.length > 480) {
    fail(`${prefix}.description must be a non-empty string (max 480) for dashboard catalog copy`);
  }
  if ("catalogOrder" in fn) {
    if (!Number.isInteger(fn.catalogOrder)) {
      fail(`${prefix}.catalogOrder must be an integer when present`);
    }
  }
  const routeStr = String(fn.route || "");
  if (!/^\/dashboard\/\d+\//.test(routeStr)) {
    fail(`${prefix}.route must be /dashboard/<githubIssueId>/<slug> (issue id is canonical; slug is human-readable only)`);
  }

  if (!isObject(fn.api)) {
    fail(`${prefix}.api must be an object`);
  } else {
    if (fn.api.method !== "POST") fail(`${prefix}.api.method must be POST`);
    if (!String(fn.api.path || "").startsWith("/dashboard/api/functions/")) {
      fail(`${prefix}.api.path must start with /dashboard/api/functions/`);
    }
  }

  if (!isObject(fn.input)) {
    fail(`${prefix}.input must be an object`);
  } else {
    if (!Array.isArray(fn.input.required)) fail(`${prefix}.input.required must be an array`);
    if (!Array.isArray(fn.input.optional)) fail(`${prefix}.input.optional must be an array`);
    if (!Array.isArray(fn.input.examples) || fn.input.examples.length < 1) {
      fail(`${prefix}.input.examples must contain at least one example`);
    }
  }

  if (!isObject(fn.output)) {
    fail(`${prefix}.output must be an object`);
  } else {
    if (!fn.output.statusField || typeof fn.output.statusField !== "string") {
      fail(`${prefix}.output.statusField must be a non-empty string`);
    }
    if (!Array.isArray(fn.output.requiredFields) || fn.output.requiredFields.length < 1) {
      fail(`${prefix}.output.requiredFields must contain at least one field`);
    }
  }

  if (!isObject(fn.safety)) {
    fail(`${prefix}.safety must be an object`);
  } else {
    if (typeof fn.safety.untrustedInput !== "boolean") fail(`${prefix}.safety.untrustedInput must be boolean`);
    if (!Array.isArray(fn.safety.allowedProtocols)) fail(`${prefix}.safety.allowedProtocols must be an array`);
    if (!Array.isArray(fn.safety.notes)) fail(`${prefix}.safety.notes must be an array`);
  }

  if (!isObject(fn.capabilities)) {
    fail(`${prefix}.capabilities must be an object`);
  } else {
    if (!Array.isArray(fn.capabilities.channels) || fn.capabilities.channels.length < 1) {
      fail(`${prefix}.capabilities.channels must contain at least one channel`);
    }
    if (!Array.isArray(fn.capabilities.sideEffects)) fail(`${prefix}.capabilities.sideEffects must be an array`);
    if (typeof fn.capabilities.requiresApproval !== "boolean") {
      fail(`${prefix}.capabilities.requiresApproval must be boolean`);
    }
  }

  if (!isObject(fn.failureModel)) {
    fail(`${prefix}.failureModel must be an object`);
  } else {
    if (typeof fn.failureModel.clearErrorMessages !== "boolean") {
      fail(`${prefix}.failureModel.clearErrorMessages must be boolean`);
    }
    if (!fn.failureModel.fallbackBehavior || typeof fn.failureModel.fallbackBehavior !== "string") {
      fail(`${prefix}.failureModel.fallbackBehavior must be a non-empty string`);
    }
  }
}

async function main() {
  const raw = await readFile(registryPath, "utf8");
  const data = JSON.parse(raw);

  if (!isObject(data)) {
    fail("registry root must be an object");
    return;
  }

  if (data.version !== "v1") fail('registry.version must be "v1"');
  if (!Array.isArray(data.functions) || data.functions.length < 1) {
    fail("registry.functions must contain at least one function");
    return;
  }

  const seenIds = new Set();
  data.functions.forEach((fn, index) => validateFunctionContract(fn, index, seenIds));

  if (process.exitCode) return;
  ok(`Validated ${data.functions.length} function contracts in functions/registry.v1.json`);
}

main().catch((error) => {
  console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
