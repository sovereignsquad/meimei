#!/usr/bin/env node
/**
 * Exercises kernel-external-app-dispatch without starting HTTP (MM-KERNEL-501, MM-KERNEL-301, MM-KERNEL-603).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { clearKernelExternalHandlerCache, tryKernelExternalAppPost } from "../dashboard/lib/kernel-external-app-dispatch.mjs";
import { registerKernelApp, setKernelAppEnabled } from "../dashboard/lib/kernel-app-registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`PASS: ${msg}`);
}

function restoreEnv(key, prev) {
  if (prev === undefined) delete process.env[key];
  else process.env[key] = prev;
}

async function main() {
  const prevExt = process.env.MEIMEI_KERNEL_EXTERNAL_APPS;
  const prevReg = process.env.MEIMEI_KERNEL_APP_REGISTRY;
  const prevAuth = process.env.MEIMEI_KERNEL_APP_AUTH;

  process.env.MEIMEI_KERNEL_EXTERNAL_APPS = "1";

  const base = fs.mkdtempSync(path.join(os.tmpdir(), "meimei-kernel-dispatch-"));
  const regFile = path.join(base, "registry.json");
  process.env.MEIMEI_KERNEL_APP_REGISTRY = regFile;

  const appDir = path.join(base, "app");
  fs.mkdirSync(appDir, { recursive: true });

  const manifest = {
    schemaVersion: 1,
    name: "kernel-dispatch-selftest",
    displayName: "Dispatch selftest",
    description: "MM-KERNEL-501 automated test stub.",
    version: "0.0.1",
    entry: { module: "./index.mjs", export: "handleApi" },
    api: { method: "POST", pathSuffix: "kernel-dispatch-selftest" },
    capabilities: { required: ["inference"] }
  };

  fs.writeFileSync(path.join(appDir, "meimei.app.json"), JSON.stringify(manifest, null, 2), "utf8");

  fs.writeFileSync(
    path.join(appDir, "index.mjs"),
    `export async function handleApi(req, body, repoRoot) {
  return { ok: true, kernel_external_app: true, got: body };
}
`,
    "utf8"
  );

  clearKernelExternalHandlerCache();
  await registerKernelApp(repoRoot, appDir, { registryPath: regFile, audit: false });

  const readJson = async () => ({ ping: 1 });
  const out = await tryKernelExternalAppPost(
    repoRoot,
    "/api/functions/kernel-dispatch-selftest",
    /** @type {import("node:http").IncomingMessage} */ ({}),
    readJson
  );

  if (!out || out.status !== 200 || !out.payload?.ok || !out.payload?.kernel_external_app) {
    fail(`unexpected dispatch result: ${JSON.stringify(out)}`);
  }
  if (out.payload.got?.ping !== 1) fail("body not passed to handler");

  process.env.MEIMEI_KERNEL_EXTERNAL_APPS = "";
  const skipped = await tryKernelExternalAppPost(
    repoRoot,
    "/api/functions/kernel-dispatch-selftest",
    /** @type {import("node:http").IncomingMessage} */ ({}),
    readJson
  );
  if (skipped !== null) fail("expected null when MEIMEI_KERNEL_EXTERNAL_APPS unset and no builtin suffix");

  const emptyReg = path.join(base, "empty-registry.json");
  fs.writeFileSync(emptyReg, `${JSON.stringify({ schemaVersion: 1, apps: [], tombstones: [] }, null, 2)}\n`, "utf8");
  process.env.MEIMEI_KERNEL_APP_REGISTRY = emptyReg;
  process.env.MEIMEI_KERNEL_EXTERNAL_APPS = "";
  clearKernelExternalHandlerCache();

  const explainBody = async () => ({ url: "" });
  const explainOut = await tryKernelExternalAppPost(
    repoRoot,
    "/api/functions/explain-it",
    /** @type {import("node:http").IncomingMessage} */ ({}),
    explainBody
  );
  if (!explainOut || explainOut.status !== 400 || explainOut.payload?.ok !== false) {
    fail(`builtin explain-it dispatch expected 400 missing url: ${JSON.stringify(explainOut)}`);
  }

  process.env.MEIMEI_KERNEL_APP_REGISTRY = regFile;
  process.env.MEIMEI_KERNEL_EXTERNAL_APPS = "1";
  const authDir = path.join(base, "auth-app");
  fs.mkdirSync(authDir, { recursive: true });
  const authManifest = {
    schemaVersion: 1,
    name: "kernel-auth-selftest",
    displayName: "Auth selftest",
    description: "MM-KERNEL-301",
    version: "0.0.1",
    entry: { module: "./index.mjs", export: "handleApi" },
    api: { method: "POST", pathSuffix: "kernel-auth-selftest" },
    capabilities: { required: ["inference"] }
  };
  fs.writeFileSync(path.join(authDir, "meimei.app.json"), JSON.stringify(authManifest, null, 2), "utf8");
  fs.writeFileSync(
    path.join(authDir, "index.mjs"),
    `export async function handleApi() { return { ok: true, auth: true }; }\n`,
    "utf8"
  );
  clearKernelExternalHandlerCache();
  const regAuth = await registerKernelApp(repoRoot, authDir, { registryPath: regFile, audit: false });
  process.env.MEIMEI_KERNEL_APP_AUTH = "1";
  const noId = await tryKernelExternalAppPost(
    repoRoot,
    "/api/functions/kernel-auth-selftest",
    /** @type {import("node:http").IncomingMessage} */ ({ headers: {} }),
    readJson
  );
  if (!noId || noId.status !== 401 || noId.payload?.code !== "UNAUTHORIZED") {
    fail(`expected 401 without app id: ${JSON.stringify(noId)}`);
  }
  const withId = await tryKernelExternalAppPost(
    repoRoot,
    "/api/functions/kernel-auth-selftest",
    /** @type {import("node:http").IncomingMessage} */ ({
      headers: { "x-meimei-app-id": regAuth.app_id }
    }),
    readJson
  );
  if (!withId || withId.status !== 200 || !withId.payload?.ok) {
    fail(`expected 200 with app id: ${JSON.stringify(withId)}`);
  }

  const secretDir = path.join(base, "secret-app");
  fs.mkdirSync(secretDir, { recursive: true });
  const secretManifest = {
    schemaVersion: 1,
    name: "kernel-secret-selftest",
    displayName: "Secret selftest",
    description: "MM-KERNEL-301 secret",
    version: "0.0.1",
    entry: { module: "./index.mjs", export: "handleApi" },
    api: { method: "POST", pathSuffix: "kernel-secret-selftest" },
    capabilities: { required: ["inference"] },
    kernel: { authExempt: true }
  };
  fs.writeFileSync(path.join(secretDir, "meimei.app.json"), JSON.stringify(secretManifest, null, 2), "utf8");
  fs.writeFileSync(
    path.join(secretDir, "index.mjs"),
    `export async function handleApi() { return { ok: true, secret: true }; }\n`,
    "utf8"
  );
  clearKernelExternalHandlerCache();
  await registerKernelApp(repoRoot, secretDir, {
    registryPath: regFile,
    audit: false,
    deploymentSecret: "unit-test-secret"
  });
  process.env.MEIMEI_KERNEL_APP_AUTH = "";
  const noSecret = await tryKernelExternalAppPost(
    repoRoot,
    "/api/functions/kernel-secret-selftest",
    /** @type {import("node:http").IncomingMessage} */ ({ headers: {} }),
    readJson
  );
  if (!noSecret || noSecret.status !== 401) {
    fail(`expected 401 without secret: ${JSON.stringify(noSecret)}`);
  }
  const badSecret = await tryKernelExternalAppPost(
    repoRoot,
    "/api/functions/kernel-secret-selftest",
    /** @type {import("node:http").IncomingMessage} */ ({
      headers: { "x-meimei-app-secret": "wrong" }
    }),
    readJson
  );
  if (!badSecret || badSecret.status !== 403) {
    fail(`expected 403 wrong secret: ${JSON.stringify(badSecret)}`);
  }
  const goodSecret = await tryKernelExternalAppPost(
    repoRoot,
    "/api/functions/kernel-secret-selftest",
    /** @type {import("node:http").IncomingMessage} */ ({
      headers: { "x-meimei-app-secret": "unit-test-secret" }
    }),
    readJson
  );
  if (!goodSecret || goodSecret.status !== 200 || !goodSecret.payload?.secret) {
    fail(`expected 200 good secret: ${JSON.stringify(goodSecret)}`);
  }

  setKernelAppEnabled(repoRoot, regAuth.app_id, false, { registryPath: regFile });
  clearKernelExternalHandlerCache();
  const disabled = await tryKernelExternalAppPost(
    repoRoot,
    "/api/functions/kernel-auth-selftest",
    /** @type {import("node:http").IncomingMessage} */ ({
      headers: { "x-meimei-app-id": regAuth.app_id }
    }),
    readJson
  );
  if (!disabled || disabled.status !== 403 || disabled.payload?.code !== "FORBIDDEN") {
    fail(`expected 403 disabled app: ${JSON.stringify(disabled)}`);
  }

  restoreEnv("MEIMEI_KERNEL_EXTERNAL_APPS", prevExt);
  restoreEnv("MEIMEI_KERNEL_APP_REGISTRY", prevReg);
  restoreEnv("MEIMEI_KERNEL_APP_AUTH", prevAuth);

  clearKernelExternalHandlerCache();
  fs.rmSync(base, { recursive: true, force: true });
  ok("kernel-external-app-dispatch selftest");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
