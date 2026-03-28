import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

export function loadDashboardSurfaceSync() {
  const filePath = path.join(repoRoot, "config", "dashboard-surface.v1.json");
  const data = JSON.parse(readFileSync(filePath, "utf8"));
  if (data.version !== "v1") {
    throw new Error(`dashboard-surface.v1.json: expected version "v1", got ${JSON.stringify(data.version)}`);
  }
  return data;
}

export function loadKnowmoreReleasesSync() {
  const filePath = path.join(repoRoot, "config", "knowmore-releases.v1.json");
  const data = JSON.parse(readFileSync(filePath, "utf8"));
  if (data.version !== "v1") {
    throw new Error(`knowmore-releases.v1.json: expected version "v1", got ${JSON.stringify(data.version)}`);
  }
  if (!Array.isArray(data.releases)) {
    throw new Error("knowmore-releases.v1.json: missing releases array");
  }
  return {
    releases: data.releases,
    boardUrl: typeof data.boardUrl === "string" ? data.boardUrl : "https://github.com/users/moldovancsaba/projects/1",
    repo: typeof data.repo === "string" ? data.repo : "https://github.com/moldovancsaba/mvp-factory-control",
    note: typeof data.note === "string" ? data.note : "",
    syncedFromGithub: typeof data.syncedFromGithub === "string" ? data.syncedFromGithub : ""
  };
}

export function resolveIssueUrl(surface, issue) {
  const tpl = surface.githubIssues?.issueUrlTemplate;
  if (!tpl || !tpl.includes("{issue}")) {
    throw new Error("dashboard-surface: githubIssues.issueUrlTemplate must contain {issue}");
  }
  return tpl.replaceAll("{issue}", String(issue));
}

export function pathStartsWithStaticPrefix(pathname, staticPrefixes) {
  return staticPrefixes.some((p) => pathname.startsWith(p));
}

export function resolveOperatorScripts(surface, root) {
  const map = surface.operatorScripts || {};
  const out = {};
  for (const [key, rel] of Object.entries(map)) {
    out[key] = path.join(root, rel);
  }
  return out;
}
