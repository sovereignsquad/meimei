#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createReliabilityTelemetry } from "../dashboard/lib/reliability-telemetry.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

const { getSummary } = createReliabilityTelemetry(repoRoot);
const summary = await getSummary();

if (summary?.v !== "v1") fail("summary.v must be v1");
if (typeof summary?.slo?.totalRequests !== "number") fail("slo.totalRequests must be a number");
if (typeof summary?.slo?.successRate !== "number") fail("slo.successRate must be a number");
if (typeof summary?.slo?.avgLatencyMs !== "number") fail("slo.avgLatencyMs must be a number");
if (typeof summary?.slo?.p95LatencyMs !== "number") fail("slo.p95LatencyMs must be a number");
if (typeof summary?.byChannel !== "object" || summary.byChannel === null) fail("byChannel must be an object");

if (process.exitCode) process.exit(1);
pass(`telemetry summary validated (${summary.slo.totalRequests} requests)`);
