/**
 * Single source for dashboard miniapp routes, API paths, and catalog cards.
 * Data: functions/registry.v1.json — do not duplicate catalog strings in server.mjs.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const registryPath = path.join(repoRoot, "functions", "registry.v1.json");

/** @param {string} contractRoute e.g. /dashboard/516/Any-URL_... */
export function parseContractRoute(contractRoute) {
  const m = String(contractRoute).match(/^\/dashboard\/(\d+)(\/[^?#]*)?$/);
  if (!m) {
    throw new Error(`Invalid registry route (expected /dashboard/<issueId>/<slug>): ${contractRoute}`);
  }
  const issueId = Number(m[1]);
  const internal = m[2] || "/";
  return {
    issueId,
    internalPath: internal,
    cardHref: `/${issueId}${internal}`
  };
}

/** Strip /dashboard prefix from contract API path for the local server. */
export function serverApiPath(contractApiPath) {
  const s = String(contractApiPath || "");
  if (!s.startsWith("/dashboard")) return s;
  return s.slice("/dashboard".length) || s;
}

export function loadRegistrySync() {
  const raw = fs.readFileSync(registryPath, "utf8");
  return JSON.parse(raw);
}

/** @param {object} registry parsed registry.v1.json */
export function buildMiniappIssueRoute(registry) {
  const map = new Map();
  for (const fn of registry.functions) {
    const { issueId, internalPath } = parseContractRoute(fn.route);
    map.set(issueId, internalPath);
  }
  return map;
}

/** @param {object} registry parsed registry.v1.json */
export function buildDashboardCatalog(registry) {
  const cards = registry.functions.map((fn) => {
    const { issueId, cardHref, internalPath } = parseContractRoute(fn.route);
    return {
      issueId,
      name: fn.displayName,
      route: cardHref,
      description: fn.description,
      catalogOrder: typeof fn.catalogOrder === "number" ? fn.catalogOrder : 999,
      internalPath,
      id: fn.id
    };
  });
  cards.sort((a, b) => {
    if (a.catalogOrder !== b.catalogOrder) return a.catalogOrder - b.catalogOrder;
    return a.issueId - b.issueId;
  });
  return cards;
}

/** @param {object} registry parsed registry.v1.json */
export function miniappRuntimeConfig(registry) {
  const routes = {};
  for (const fn of registry.functions) {
    const { issueId, internalPath, cardHref } = parseContractRoute(fn.route);
    routes[fn.id] = {
      fn,
      issueId,
      internalPath,
      cardHref,
      apiPath: serverApiPath(fn.api.path),
      displayName: fn.displayName,
      description: fn.description
    };
  }
  return {
    registry,
    routes,
    catalog: buildDashboardCatalog(registry),
    miniappIssueRoute: buildMiniappIssueRoute(registry)
  };
}
