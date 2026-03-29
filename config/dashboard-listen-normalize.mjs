import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function defaultRepoRoot() {
  return path.resolve(__dirname, "..");
}

export function readSurfaceJsonSync(repoRoot = defaultRepoRoot()) {
  const p = path.join(repoRoot, "config", "dashboard-surface.v1.json");
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

/**
 * If defaults.port is listed in deprecatedDashboardListenPorts, replace it with migrationCanonicalListenPort.
 */
export function migrateSurfaceDefaultsPortInPlace(data) {
  const reject = Array.isArray(data.deprecatedDashboardListenPorts) ? data.deprecatedDashboardListenPorts : [];
  const d = Number(data.defaults?.port);
  if (!Number.isFinite(d) || d <= 0) return data;
  if (!reject.includes(d)) return data;
  const m = Number(data.migrationCanonicalListenPort);
  if (!Number.isFinite(m) || m <= 0) {
    throw new Error(
      "dashboard-surface.v1.json: defaults.port matches deprecatedDashboardListenPorts; set migrationCanonicalListenPort"
    );
  }
  console.warn(
    "dashboard-surface: defaults.port is listed in deprecatedDashboardListenPorts; using migrationCanonicalListenPort."
  );
  data.defaults = { ...data.defaults, port: m };
  return data;
}

/**
 * Resolve HTTP listen port: env/candidate wins if valid and not deprecated; else defaults.port (after migration).
 */
export function normalizeDashboardListenCandidate(data, candidate) {
  migrateSurfaceDefaultsPortInPlace(data);
  const reject = Array.isArray(data.deprecatedDashboardListenPorts) ? data.deprecatedDashboardListenPorts : [];
  const canonical = Number(data.defaults.port);
  const trimmed = candidate === undefined || candidate === null ? "" : String(candidate).trim();
  const raw = trimmed === "" ? NaN : Number(trimmed);
  if (!Number.isFinite(raw) || raw <= 0) {
    if (!Number.isFinite(canonical) || canonical <= 0) {
      throw new Error("dashboard-surface.v1.json: invalid defaults.port");
    }
    return canonical;
  }
  if (reject.includes(raw)) {
    if (!Number.isFinite(canonical) || canonical <= 0) {
      throw new Error("dashboard-surface.v1.json: invalid defaults.port");
    }
    return canonical;
  }
  return raw;
}

export function effectiveCanonicalListenPort(data) {
  migrateSurfaceDefaultsPortInPlace(data);
  const canonical = Number(data.defaults?.port);
  if (!Number.isFinite(canonical) || canonical <= 0) {
    throw new Error("dashboard-surface.v1.json: invalid defaults.port");
  }
  return canonical;
}
