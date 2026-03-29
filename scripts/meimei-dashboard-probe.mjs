#!/usr/bin/env node
/**
 * Check whether the MeiMei dashboard is listening (reads port from config/dashboard-surface.v1.json or PORT).
 */
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  readSurfaceJsonSync,
  normalizeDashboardListenCandidate
} from "../config/dashboard-listen-normalize.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const surface = readSurfaceJsonSync(root);
const bindHost = surface.server?.bindHost || "127.0.0.1";
const port = normalizeDashboardListenCandidate(surface, process.env.PORT);

const url = `http://${bindHost}:${port}/`;
const req = http.request(
  { hostname: bindHost, port, path: "/", method: "GET", timeout: 3000 },
  (res) => {
    console.log(`OK — dashboard responded ${res.statusCode} at ${url}`);
    process.exit(0);
  }
);
req.on("timeout", () => {
  req.destroy();
  console.error(`FAIL — no response from ${url} (timeout)`);
  console.error(`Start the server:  cd ${root} && npm run dashboard`);
  console.error(`Or LaunchAgent:      ./scripts/meimei-domain install`);
  process.exit(1);
});
req.on("error", (e) => {
  console.error(`FAIL — ${url} — ${e.message}`);
  console.error(`Start the server:  cd ${root} && npm run dashboard`);
  console.error(`Check logs:         tail -50 ~/.meimei/logs/dashboard-ui.err`);
  process.exit(1);
});
req.end();
