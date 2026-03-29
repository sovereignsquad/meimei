/**
 * Dynamic load for apps/checklist (MM-KERNEL-603 — no static server import).
 */
import path from "node:path";
import { pathToFileURL } from "node:url";

/** @type {{ root: string, fn: Function } | null} */
let cache = null;

export function clearChecklistHandleApiCache() {
  cache = null;
}

/**
 * @param {string} repoRoot
 */
export async function loadChecklistHandleApi(repoRoot) {
  const root = path.resolve(repoRoot);
  if (cache && cache.root === root) return cache.fn;
  const abs = path.join(root, "apps", "checklist", "index.mjs");
  const mod = await import(pathToFileURL(abs).href);
  const fn = mod.handleApi;
  if (typeof fn !== "function") throw new Error("apps/checklist must export handleApi");
  cache = { root, fn };
  return fn;
}
