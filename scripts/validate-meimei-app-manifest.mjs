#!/usr/bin/env node
/**
 * Validates a MeiMei external app manifest against schemas/meimei.app.manifest.v1.json.
 *
 * Usage:
 *   node scripts/validate-meimei-app-manifest.mjs
 *   node scripts/validate-meimei-app-manifest.mjs path/to/meimei.app.json
 *
 * @see docs/planning/kernel-app-separation-and-https-program.v1.md (MM-KERNEL-201)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadManifestSchemaSync,
  validateManifestAgainstSchema
} from "../dashboard/lib/meimei-app-manifest-validate.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const defaultManifestPath = path.join(
  repoRoot,
  "docs",
  "planning",
  "examples",
  "meimei.app.example.json"
);

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exitCode = 1;
}

function ok(msg) {
  console.log(`PASS: ${msg}`);
}

function validateOne(schema, manifestPath) {
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (e) {
    fail(`invalid manifest JSON: ${e instanceof Error ? e.message : String(e)}`);
    return false;
  }
  const errors = validateManifestAgainstSchema(schema, manifest, "$");
  if (errors.length) {
    for (const line of errors) console.error(line);
    fail(`meimei app manifest validation: ${errors.length} error(s) for ${manifestPath}`);
    return false;
  }
  ok(`meimei app manifest OK — ${path.relative(repoRoot, manifestPath)}`);
  return true;
}

function collectAppManifests() {
  const out = [];
  for (const rel of ["apps", "packages"]) {
    const base = path.join(repoRoot, rel);
    if (!fs.existsSync(base)) continue;
    for (const name of fs.readdirSync(base, { withFileTypes: true })) {
      if (!name.isDirectory()) continue;
      const p = path.join(base, name.name, "meimei.app.json");
      if (fs.existsSync(p)) out.push(p);
    }
  }
  return out.sort();
}

function main() {
  let schema;
  try {
    schema = loadManifestSchemaSync(repoRoot);
  } catch (e) {
    fail(`schema load failed: ${e instanceof Error ? e.message : String(e)}`);
    return;
  }

  const arg = process.argv[2];
  if (arg) {
    const manifestPath = path.resolve(repoRoot, arg);
    if (!fs.existsSync(manifestPath)) {
      fail(`manifest not found: ${manifestPath}`);
      return;
    }
    validateOne(schema, manifestPath);
    return;
  }

  if (!validateOne(schema, defaultManifestPath)) return;
  for (const p of collectAppManifests()) {
    if (!validateOne(schema, p)) return;
  }
}

main();
