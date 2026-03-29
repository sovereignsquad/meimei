#!/usr/bin/env node
/**
 * MM-KERNEL-303d — kernel-app-fs-roots resolution + payload (no HTTP).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadKernelAppRegistrySync,
  registerKernelApp,
  saveKernelAppRegistrySync
} from "../dashboard/lib/kernel-app-registry.mjs";
import { findKernelAppMatchByAppId } from "../dashboard/lib/kernel-app-resolve.mjs";
import {
  buildKernelAppFsRootsPayload,
  isPathContainedIn,
  resolvePolicyFilesystemRootPairs
} from "../dashboard/lib/kernel-app-fs-roots.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

function fail(m) {
  console.error(`FAIL: ${m}`);
  process.exit(1);
}

function ok(m) {
  console.log(`PASS: ${m}`);
}

if (!isPathContainedIn("/a/b", "/a/b/c")) fail("expected /a/b/c inside /a/b");
if (isPathContainedIn("/a/b", "/a/c")) fail("expected /a/c outside /a/b");
if (!isPathContainedIn("/a/b", "/a/b")) fail("expected equal path inside");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "meimei-kernel-fs-"));
const regPath = path.join(tmp, "registry.json");
const appDir = path.join(tmp, "app");
fs.mkdirSync(path.join(appDir, "sub"), { recursive: true });
fs.writeFileSync(path.join(appDir, "sub", "x.txt"), "hi\n");

const manifest = {
  schemaVersion: 1,
  name: "fsrootsst",
  displayName: "FS roots selftest",
  description: "CI fixture",
  version: "1.0.0",
  entry: { module: "./index.mjs", export: "handleApi" },
  api: { method: "POST", pathSuffix: "fsrootsst" },
  capabilities: { required: ["filesystem.scoped"] },
  kernel: { authExempt: true }
};
fs.writeFileSync(path.join(appDir, "meimei.app.json"), `${JSON.stringify(manifest, null, 2)}\n`);
fs.writeFileSync(
  path.join(appDir, "index.mjs"),
  `export async function handleApi() { return { ok: true }; }\n`
);

let appId = "";
try {
  const reg = await registerKernelApp(repoRoot, appDir, { registryPath: regPath, audit: false });
  appId = reg.app_id;

  const state = loadKernelAppRegistrySync(repoRoot, regPath);
  const row = state.apps.find((a) => a.app_id === appId);
  if (!row) fail("registered row missing");
  row.policy = {
    schemaVersion: 1,
    capabilities: { allow: ["filesystem.scoped"] },
    filesystem: { roots: [".", "sub"] }
  };
  saveKernelAppRegistrySync(repoRoot, state, regPath);

  process.env.MEIMEI_KERNEL_APP_REGISTRY = regPath;
  const match = findKernelAppMatchByAppId(repoRoot, appId);
  if (!match) fail("findKernelAppMatchByAppId");

  const empty = buildKernelAppFsRootsPayload({
    install_path: appDir,
    policy: { schemaVersion: 1, capabilities: { allow: ["filesystem.scoped"] }, filesystem: { roots: [] } }
  });
  if (empty.statusCode !== 403) fail("empty roots -> 403");

  const bad = resolvePolicyFilesystemRootPairs({
    install_path: appDir,
    policy: {
      schemaVersion: 1,
      capabilities: { allow: ["filesystem.scoped"] },
      filesystem: { roots: [".."] }
    }
  });
  if (bad.ok) fail("expected .. root rejected");

  const out = buildKernelAppFsRootsPayload(match);
  if (out.statusCode !== 200 || !out.json.ok) fail(`expected 200 ok, got ${out.statusCode} ${JSON.stringify(out.json)}`);
  const roots = out.json.roots;
  if (!Array.isArray(roots) || roots.length !== 2) fail("expected two roots");
  const sub = roots.find((r) => r.configured === "sub");
  if (!sub?.exists || !sub.is_directory) fail("sub root should exist as directory");
  const names = (sub.entries_sample || []).map((e) => e.name);
  if (!names.includes("x.txt")) fail(`expected x.txt in listing, got ${names.join(",")}`);
} finally {
  delete process.env.MEIMEI_KERNEL_APP_REGISTRY;
  try {
    fs.rmSync(tmp, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

ok("kernel-app-fs-roots selftest");
