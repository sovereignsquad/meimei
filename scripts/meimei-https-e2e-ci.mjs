#!/usr/bin/env node
/**
 * TLS-060 — End-to-end HTTPS smoke in CI (no meimei.localhost / keychain).
 *
 * 1. Generates a temp self-signed cert (openssl) for 127.0.0.1
 * 2. Spawns dashboard on a free loopback port
 * 3. Starts a minimal TLS reverse proxy (same shape as meimei-domain: /dashboard prefix strip)
 * 4. GET https://127.0.0.1:<proxy>/dashboard/api/health with the temp CA
 * 5. Asserts JSON shape (public_https, termination, listen)
 *
 * Requires: openssl on PATH, Node fetch or https (uses https module for CA pinning).
 *
 * Usage: node scripts/meimei-https-e2e-ci.mjs
 */
import { spawn, execFileSync } from "node:child_process";
import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const publicPrefix = String(process.env.MEIMEI_PUBLIC_PREFIX || "/dashboard").replace(/\/+$/, "") || "/dashboard";

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`PASS: ${msg}`);
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

function ensureOpenSsl() {
  try {
    execFileSync("openssl", ["version"], { stdio: "pipe" });
  } catch {
    fail("openssl not found on PATH (required for TLS-060)");
  }
}

function writeTempCerts(dir) {
  const key = path.join(dir, "e2e.key");
  const cert = path.join(dir, "e2e.crt");
  execFileSync(
    "openssl",
    [
      "req",
      "-x509",
      "-newkey",
      "rsa:2048",
      "-nodes",
      "-keyout",
      key,
      "-out",
      cert,
      "-days",
      "1",
      "-subj",
      "/CN=127.0.0.1",
      "-addext",
      "subjectAltName=IP:127.0.0.1"
    ],
    { stdio: "pipe" }
  );
  return { key, cert, ca: fs.readFileSync(cert) };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForHttp(url, attempts = 150, delayMs = 200) {
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

function httpsGet(urlStr, ca) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const req = https.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: "GET",
        ca,
        rejectUnauthorized: true
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          resolve({
            status: res.statusCode || 0,
            body: Buffer.concat(chunks).toString("utf8")
          });
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

function startMiniTlsProxy({ key, cert, dashPort, proxyPort }) {
  const server = https.createServer({ key: fs.readFileSync(key, "utf8"), cert: fs.readFileSync(cert, "utf8") }, (req, res) => {
    const incomingUrl = new URL(req.url || "/", `https://${req.headers.host || "127.0.0.1"}`);
    const pathname = incomingUrl.pathname;
    if (!pathname.startsWith(publicPrefix)) {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("not found");
      return;
    }
    const suffix = pathname.slice(publicPrefix.length);
    const proxiedPath = (suffix.startsWith("/") ? suffix : `/${suffix}`) + incomingUrl.search;
    const upstream = http.request(
      {
        host: "127.0.0.1",
        port: dashPort,
        method: req.method,
        path: proxiedPath,
        headers: {
          ...req.headers,
          host: `127.0.0.1:${dashPort}`,
          connection: "close"
        }
      },
      (upRes) => {
        res.writeHead(upRes.statusCode || 502, upRes.headers);
        upRes.pipe(res);
      }
    );
    upstream.on("error", (e) => {
      res.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
      res.end(`upstream: ${e.message}`);
    });
    req.pipe(upstream);
  });

  return new Promise((resolve, reject) => {
    server.listen(proxyPort, "127.0.0.1", () => resolve(server));
    server.on("error", reject);
  });
}

async function main() {
  ensureOpenSsl();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "meimei-https-e2e-"));
  const { key, cert, ca } = writeTempCerts(tmp);

  const dashPort = await freePort();
  const proxyPort = await freePort();

  const dash = spawn(process.execPath, ["dashboard/server.mjs"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      PORT: String(dashPort),
      MEIMEI_LOG_PUBLIC_HTTPS_HINT: "0"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  let dashLog = "";
  dash.stdout?.on("data", (d) => {
    dashLog += d.toString();
  });
  dash.stderr?.on("data", (d) => {
    dashLog += d.toString();
  });

  const cleanup = async (server, exitCode = 0) => {
    try {
      server?.close();
    } catch {
      /* ignore */
    }
    dash.kill("SIGTERM");
    await sleep(300);
    if (!dash.killed) dash.kill("SIGKILL");
    try {
      fs.rmSync(tmp, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    if (exitCode) process.exit(exitCode);
  };

  try {
    await waitForHttp(`http://127.0.0.1:${dashPort}/api/health`);
    const proxy = await startMiniTlsProxy({ key, cert, dashPort, proxyPort });
    const url = `https://127.0.0.1:${proxyPort}${publicPrefix}/api/health`;
    const { status, body } = await httpsGet(url, ca);
    if (status !== 200) {
      console.error(dashLog.slice(-4000));
      await cleanup(null, 1);
      fail(`HTTPS GET expected 200, got ${status}`);
    }
    let json;
    try {
      json = JSON.parse(body);
    } catch {
      await cleanup(null, 1);
      fail("health body is not JSON");
    }
    if (!json.ok || !json.public_https?.operator_url || !json.public_https?.termination) {
      await cleanup(null, 1);
      fail(`health JSON missing expected fields: ${body.slice(0, 500)}`);
    }
    if (json.transport !== "node-http" || !json.listen?.url) {
      await cleanup(null, 1);
      fail("health JSON missing transport or listen.url");
    }
    await cleanup(proxy, 0);
    ok(`HTTPS E2E — ${url} (temp CA, mini proxy, dashboard :${dashPort})`);
  } catch (e) {
    console.error(dashLog.slice(-4000));
    await cleanup(null, 1);
    fail(e instanceof Error ? e.message : String(e));
  }
}

main();
