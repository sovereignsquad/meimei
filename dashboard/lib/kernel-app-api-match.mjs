/**
 * Map POST /api/functions/<suffix> to manifest entry export (primary pathSuffix + optional subroutes).
 * @see schemas/meimei.app.manifest.v1.json — api.subroutes
 */

/**
 * @param {object} manifest
 * @param {string} suffix path after /api/functions/ (may contain one slash, e.g. daily-briefing/open)
 * @returns {string|null} export name, or null
 */
export function exportNameForApiPathSuffix(manifest, suffix) {
  const api = manifest?.api;
  if (!api || typeof api !== "object") return null;
  const main = api.pathSuffix;
  if (main === suffix) {
    const ex = manifest?.entry?.export;
    return typeof ex === "string" && ex ? ex : "handleApi";
  }
  const subs = api.subroutes;
  if (!Array.isArray(subs)) return null;
  for (const s of subs) {
    if (!s || typeof s !== "object") continue;
    if (s.pathSuffix === suffix) {
      const ex = s.export;
      return typeof ex === "string" && ex ? ex : "handleApi";
    }
  }
  return null;
}
