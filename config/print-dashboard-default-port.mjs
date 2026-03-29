#!/usr/bin/env node
/**
 * Prints migrated defaults.port for shell scripts (LaunchAgent install, probes).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  readSurfaceJsonSync,
  effectiveCanonicalListenPort
} from "./dashboard-listen-normalize.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
try {
  const data = readSurfaceJsonSync(root);
  process.stdout.write(String(effectiveCanonicalListenPort(data)));
} catch (e) {
  console.error(e?.message || e);
  process.exit(1);
}
