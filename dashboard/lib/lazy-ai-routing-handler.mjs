/**
 * Dynamic load for apps/ai-routing — GET/POST /api/llm/routing only.
 * POST /api/functions/ai-routing is handled by routeViaApiAdapter in server.mjs (tool preview), so this app has no meimei.app.json pathSuffix.
 */
import path from "node:path";
import { pathToFileURL } from "node:url";

/** @type {{ root: string, fn: Function } | null} */
let cache = null;

export function clearAiRoutingHandleApiCache() {
  cache = null;
}

/**
 * @param {string} repoRoot
 */
export async function loadAiRoutingHandleApi(repoRoot) {
  const root = path.resolve(repoRoot);
  if (cache && cache.root === root) return cache.fn;
  const abs = path.join(root, "apps", "ai-routing", "index.mjs");
  const mod = await import(pathToFileURL(abs).href);
  const fn = mod.handleApi;
  if (typeof fn !== "function") throw new Error("apps/ai-routing must export handleApi");
  cache = { root, fn };
  return fn;
}
