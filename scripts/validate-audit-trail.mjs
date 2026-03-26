#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

async function main() {
  const rel = process.argv[2] || "audit/decision-action-trail.v1.jsonl";
  const target = path.isAbsolute(rel) ? rel : path.resolve(repoRoot, rel);

  let raw = "";
  try {
    raw = await readFile(target, "utf8");
  } catch {
    fail(`audit log not found: ${target}`);
    return;
  }
  const lines = raw.split("\n").filter(Boolean);
  if (lines.length < 1) {
    fail("audit log has no records");
    return;
  }

  let prevHash = "GENESIS";
  lines.forEach((line, idx) => {
    let parsed = null;
    try {
      parsed = JSON.parse(line);
    } catch {
      fail(`line ${idx + 1}: invalid JSON`);
      return;
    }
    if (parsed.v !== "v1") fail(`line ${idx + 1}: v must be v1`);
    if (typeof parsed.type !== "string" || parsed.type.trim() === "") fail(`line ${idx + 1}: missing type`);
    if (typeof parsed.at !== "string" || parsed.at.trim() === "") fail(`line ${idx + 1}: missing at`);
    if (parsed.prevHash !== prevHash) fail(`line ${idx + 1}: prevHash chain mismatch`);
    const { hash, ...withoutHash } = parsed;
    const recomputed = sha256(JSON.stringify(withoutHash));
    if (hash !== recomputed) fail(`line ${idx + 1}: hash mismatch`);
    prevHash = hash;
  });

  if (process.exitCode) return;
  pass(`Validated ${lines.length} hash-chained audit records`);
}

main().catch((error) => {
  console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
