#!/usr/bin/env node
/**
 * Spawns dashboard briefly; asserts app façade routing returns JSON (404 for unknown app).
 */
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

function fail(m) {
  console.error(`FAIL: ${m}`);
  process.exit(1);
}

function ok(m) {
  console.log(`PASS: ${m}`);
}

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.listen(0, "127.0.0.1", () => {
      const addr = s.address();
      const p = typeof addr === "object" && addr ? addr.port : 0;
      s.close(() => resolve(p));
    });
    s.on("error", reject);
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForHttp(url, attempts = 80, delayMs = 100) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return res;
    } catch {
      /* retry */
    }
    await sleep(delayMs);
  }
  throw new Error(`timeout waiting for ${url}`);
}

async function main() {
  const port = await freePort();
  const dash = spawn(process.execPath, ["dashboard/server.mjs"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      PORT: String(port),
      MEIMEI_LOG_PUBLIC_HTTPS_HINT: "0",
      MEIMEI_DASHBOARD_LOOPBACK_ONLY: "1"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let log = "";
  dash.stdout?.on("data", (d) => {
    log += d.toString();
  });
  dash.stderr?.on("data", (d) => {
    log += d.toString();
  });

  const cleanup = async (code = 0) => {
    dash.kill("SIGTERM");
    await sleep(200);
    if (!dash.killed) dash.kill("SIGKILL");
    if (code) process.exit(code);
  };

  try {
    await waitForHttp(`http://127.0.0.1:${port}/api/health`);
    const uuid = "00000000-0000-4000-8000-000000000099";
    const res = await fetch(`http://127.0.0.1:${port}/api/meimei/v1/apps/${uuid}/fs/roots`, {
      signal: AbortSignal.timeout(5000)
    });
    const j = await res.json().catch(() => ({}));
    if (res.status !== 404 || j.error !== "unknown_app") {
      console.error(log.slice(-3000));
      await cleanup(1);
      fail(`expected 404 unknown_app, got ${res.status} ${JSON.stringify(j)}`);
    }
    await cleanup(0);
    ok("kernel-facades-http selftest (unknown app 404)");
  } catch (e) {
    console.error(log.slice(-4000));
    await cleanup(1);
    fail(e instanceof Error ? e.message : String(e));
  }
}

main();
