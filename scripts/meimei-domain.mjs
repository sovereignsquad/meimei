import fs from "node:fs";
import fsp from "node:fs/promises";
import https from "node:https";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  migrateSurfaceDefaultsPortInPlace,
  normalizeDashboardListenCandidate
} from "../config/dashboard-listen-normalize.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const surfaceConfigPath = path.join(repoRoot, "config", "dashboard-surface.v1.json");

let surfaceTextCache = { mtimeMs: -1, text: null };

function parseSurfaceForProxy() {
  const st = fs.statSync(surfaceConfigPath);
  if (surfaceTextCache.mtimeMs !== st.mtimeMs) {
    surfaceTextCache = { mtimeMs: st.mtimeMs, text: fs.readFileSync(surfaceConfigPath, "utf8") };
  }
  const data = JSON.parse(surfaceTextCache.text);
  migrateSurfaceDefaultsPortInPlace(data);
  return data;
}

function resolveDashboardUpstreamPort() {
  const data = parseSurfaceForProxy();
  const canonical = Number(data.defaults.port);
  const envRaw = String(process.env.MEIMEI_DASHBOARD_PORT || "").trim();
  const resolved = normalizeDashboardListenCandidate(data, envRaw || undefined);
  if (envRaw) {
    const envNum = Number(envRaw);
    const reject = Array.isArray(data.deprecatedDashboardListenPorts) ? data.deprecatedDashboardListenPorts : [];
    if (Number.isFinite(envNum) && envNum > 0 && reject.includes(envNum)) {
      console.warn(
        `meimei-domain: MEIMEI_DASHBOARD_PORT matches deprecatedDashboardListenPorts; using ${resolved}. Update ~/.openclaw/.env or run: cd ${repoRoot} && ./scripts/meimei-domain install`
      );
    } else if (Number.isFinite(envNum) && envNum > 0 && resolved !== canonical) {
      console.warn(`meimei-domain: MEIMEI_DASHBOARD_PORT=${resolved} overrides canonical listen port ${canonical}`);
    }
  }
  return resolved;
}

const dashboardPortBoot = resolveDashboardUpstreamPort();
const gatewayPort = Number(process.env.OPENCLAW_GATEWAY_PORT || 18789);
const publicHost = process.env.MEIMEI_PUBLIC_HOST || "meimei.localhost";
const publicPrefix = process.env.MEIMEI_PUBLIC_PREFIX || "/dashboard";
const certDir = path.join(process.env.HOME || "", ".openclaw", "certs");
const keyPath = path.join(certDir, "meimei.localhost.key");
const certPath = path.join(certDir, "meimei.localhost.crt");
const launchAgentPath = path.join(process.env.HOME || "", "Library", "LaunchAgents", "com.agent.meimei.dashboard-proxy.plist");

async function ensureCert() {
  await fsp.mkdir(certDir, { recursive: true });
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) return;

  const san = [
    "DNS:meimei.localhost",
    "DNS:localhost",
    "IP:127.0.0.1",
    "IP:::1"
  ].join(",");

  const { execFileSync } = await import("node:child_process");
  execFileSync("openssl", [
    "req",
    "-x509",
    "-newkey",
    "rsa:2048",
    "-nodes",
    "-keyout",
    keyPath,
    "-out",
    certPath,
    "-days",
    "825",
    "-subj",
    "/CN=meimei.localhost",
    "-addext",
    `subjectAltName=${san}`
  ], { stdio: "inherit" });
}

function readSocketFd() {
  if (process.env.MEIMEI_LAUNCHD_SOCKET === "1") return 3;
  return null;
}

function stripPrefix(urlPath) {
  if (!urlPath.startsWith(publicPrefix)) return urlPath;
  const suffix = urlPath.slice(publicPrefix.length);
  return suffix.startsWith("/") ? suffix : `/${suffix}`;
}

function isGatewayPath(pathname) {
  // Dashboard APIs — not gateway
  if (pathname === "/api/health") return false;
  if (pathname.startsWith("/api/functions/")) return false;
  if (pathname.startsWith("/api/command")) return false;
  if (pathname.startsWith("/api/page-layout")) return false;
  if (pathname.startsWith("/api/llm")) return false;
  if (pathname.startsWith("/api/brain")) return false;
  if (pathname.startsWith("/api/agent-chappie/")) return false;
  if (pathname.startsWith("/api/meimei/")) return false;

  return pathname === "/chat"
    || pathname.startsWith("/chat/")
    || pathname === "/api"
    || pathname.startsWith("/api/")
    || pathname === "/favicon.ico"
    || pathname === "/robots.txt";
}

function proxyRequest(req, res) {
  const incomingUrl = new URL(req.url || "/", `https://${req.headers.host || publicHost}`);
  if (incomingUrl.pathname === "/" || incomingUrl.pathname === "") {
    res.statusCode = 302;
    res.setHeader("location", `${publicPrefix}/`);
    res.end();
    return;
  }
  if (incomingUrl.pathname === publicPrefix) {
    res.statusCode = 302;
    res.setHeader("location", `${publicPrefix}/`);
    res.end();
    return;
  }
  const toGateway = isGatewayPath(incomingUrl.pathname);
  const dashboardUpstream = resolveDashboardUpstreamPort();
  const targetPort = toGateway ? gatewayPort : dashboardUpstream;
  const proxiedPath = toGateway
    ? incomingUrl.pathname + incomingUrl.search
    : stripPrefix(incomingUrl.pathname) + incomingUrl.search;
  const upstream = http.request({
    host: "127.0.0.1",
    port: targetPort,
    method: req.method,
    path: proxiedPath,
    headers: {
      ...req.headers,
      host: `127.0.0.1:${targetPort}`,
      connection: "close"
    }
  }, (upstreamRes) => {
    res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
    upstreamRes.pipe(res);
  });

  upstream.on("error", (error) => {
    res.statusCode = 502;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    const hint = toGateway
      ? ""
      : `\nProxy tried http://127.0.0.1:${targetPort}. Start UI: cd ${repoRoot} && npm run dashboard`;
    res.end(`Upstream unavailable: ${error.message}${hint}`);
  });

  req.pipe(upstream);
}

async function main() {
  console.log(
    `meimei-domain: proxy → dashboard http://127.0.0.1:${dashboardPortBoot} (re-reads ${path.relative(repoRoot, surfaceConfigPath)} on change) · gateway ${gatewayPort}`
  );
  await ensureCert();
  const socketFd = readSocketFd();
  const server = https.createServer({
    key: await fsp.readFile(keyPath, "utf8"),
    cert: await fsp.readFile(certPath, "utf8")
  }, proxyRequest);

  server.on("error", (error) => {
    console.error(`proxy server error: ${error.stack || error.message || error}`);
  });
  process.on("uncaughtException", (error) => {
    console.error(`uncaught exception: ${error.stack || error.message || error}`);
    process.exit(1);
  });
  process.on("unhandledRejection", (reason) => {
    console.error(`unhandled rejection: ${reason instanceof Error ? reason.stack || reason.message : String(reason)}`);
    process.exit(1);
  });

  if (socketFd !== null) {
    console.log(`starting launchd socket proxy on fd ${socketFd}`);
    server.listen({ fd: socketFd }, () => {
      console.log(`meimei.localhost proxy listening on https://${publicHost}${publicPrefix}`);
    });
    return;
  }

  console.log("starting fallback proxy on 127.0.0.1:8443");
  server.listen(8443, "127.0.0.1", () => {
    console.log(`meimei.localhost proxy listening on https://${publicHost}:8443${publicPrefix}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
