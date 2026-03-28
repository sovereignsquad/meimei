import fs from "node:fs";
import fsp from "node:fs/promises";
import https from "node:https";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const dashboardPort = Number(process.env.MEIMEI_DASHBOARD_PORT || 3030);
const gatewayPort = Number(process.env.OPENCLAW_GATEWAY_PORT || 18789);
const publicHost = process.env.MEIMEI_PUBLIC_HOST || "meimei.localhost";
const publicPrefix = process.env.MEIMEI_PUBLIC_PREFIX || "/dashboard";
const certDir = path.join(process.env.HOME || "", ".openclaw", "certs");
const keyPath = path.join(certDir, "meimei.localhost.key");
const certPath = path.join(certDir, "meimei.localhost.crt");
const launchAgentPath = path.join(process.env.HOME || "", "Library", "LaunchAgents", "ai.openclaw.meimei.dashboard-proxy.plist");

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
  if (pathname.startsWith("/api/functions/")) return false;
  if (pathname.startsWith("/api/command")) return false;
  if (pathname.startsWith("/api/page-layout")) return false;
  if (pathname.startsWith("/api/llm")) return false;
  if (pathname.startsWith("/api/brain")) return false;
  
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
  const targetPort = isGatewayPath(incomingUrl.pathname) ? gatewayPort : dashboardPort;

  const proxiedPath = targetPort === dashboardPort
    ? stripPrefix(incomingUrl.pathname) + incomingUrl.search
    : incomingUrl.pathname + incomingUrl.search;
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
    res.end(`Upstream dashboard unavailable: ${error.message}`);
  });

  req.pipe(upstream);
}

async function main() {
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
