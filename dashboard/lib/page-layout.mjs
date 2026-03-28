/**
 * Simple responsive layout: 1 col mobile, 2 tablet, N desktop (N configurable 3–10).
 * Per-page ordered boxes + optional row breaks; persisted in config/page-layout.v1.json.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

export const LAYOUT_VERSION = "v1";

export function pageLayoutFile(repoRoot) {
  return path.join(repoRoot, "config", "page-layout.v1.json");
}

export function clampDesktopCols(n) {
  const x = Number(n);
  if (!Number.isFinite(x) || !Number.isInteger(x)) return 3;
  return Math.min(10, Math.max(3, x));
}

export function clampSpanMax(n) {
  const x = Number(n);
  if (!Number.isFinite(x) || !Number.isInteger(x)) return 1;
  return Math.min(10, Math.max(1, x));
}

export function allPageKeys(registry) {
  return ["home", "admin", "knowmore", ...registry.functions.map((f) => `miniapp:${f.id}`)];
}

export function miniappPageKey(fnId) {
  return `miniapp:${fnId}`;
}

export function pageBoxMeta(registry) {
  const meta = {
    home: {
      label: "Operator dashboard",
      boxes: {
        commandChat: "AI command",
        homeSuggestions: "Suggestions",
        functions: "Welcome"
      }
    },
    admin: {
      label: "Admin",
      boxes: {
        metadata: "Runtime metadata",
        settings: "Settings",
        operations: "Operations",
        output: "Latest output",
        agent: "Quick agent turn",
        search: "Web search",
        layoutEditor: "Page layout"
      }
    },
    knowmore: { label: "knowmore", boxes: { flashcards: "Issue flashcards" } }
  };
  for (const fn of registry.functions) {
    const k = miniappPageKey(fn.id);
    meta[k] = {
      label: fn.displayName,
      boxes: {
        topbar: "Top bar",
        main: "Main content"
      }
    };
  }
  return meta;
}

export function defaultItemsForPage(pageKey) {
  if (pageKey === "home") {
    return [
      { id: "commandChat", spanMax: 3 },
      { id: "homeSuggestions", spanMax: 3 },
      { id: "functions", spanMax: 3 }
    ];
  }
  if (pageKey === "admin") {
    return [
      { id: "metadata", spanMax: 2 },
      { id: "settings", spanMax: 2 },
      { id: "operations", spanMax: 1 },
      { id: "output", spanMax: 2 },
      { id: "agent", spanMax: 1 },
      { id: "search", spanMax: 1 },
      { id: "layoutEditor", spanMax: 3 }
    ];
  }
  if (pageKey === "knowmore") return [{ id: "flashcards", spanMax: 3 }];
  if (pageKey.startsWith("miniapp:")) {
    return [
      { id: "topbar", spanMax: 3 },
      { id: "main", spanMax: 3 }
    ];
  }
  return [];
}

function allowedIdsForPage(pageKey, registry) {
  const meta = pageBoxMeta(registry)[pageKey];
  if (!meta) return new Set();
  return new Set(Object.keys(meta.boxes));
}

export function sanitizeItemsForPage(pageKey, items, registry) {
  const allowed = allowedIdsForPage(pageKey, registry);
  if (!Array.isArray(items)) return defaultItemsForPage(pageKey);
  const out = [];
  for (const row of items) {
    if (!row || typeof row !== "object") continue;
    if (row.type === "break") {
      out.push({ type: "break" });
      continue;
    }
    if (row.id && allowed.has(String(row.id))) {
      out.push({ id: String(row.id), spanMax: clampSpanMax(row.spanMax) });
    }
  }
  if (out.length === 0) return defaultItemsForPage(pageKey);
  return out;
}

function mergeMissingBoxes(pageKey, items, registry) {
  const allowed = allowedIdsForPage(pageKey, registry);
  const seen = new Set();
  for (const row of items) {
    if (row.type === "break") continue;
    if (row.id) seen.add(row.id);
  }
  const extra = [];
  for (const id of allowed) {
    if (!seen.has(id)) extra.push({ id, spanMax: 1 });
  }
  return items.concat(extra);
}

const HOME_LAYOUT_ORDER = ["commandChat", "homeSuggestions", "functions"];

function sortHomeLayoutItems(items) {
  const rank = (id) => {
    const i = HOME_LAYOUT_ORDER.indexOf(String(id || ""));
    return i === -1 ? 100 : i;
  };
  return [...items].sort((a, b) => {
    if (a.type === "break" && b.type === "break") return 0;
    if (a.type === "break") return 1;
    if (b.type === "break") return -1;
    return rank(a.id) - rank(b.id);
  });
}

/**
 * @param {string} repoRoot
 * @param {object} registry parsed registry.v1.json
 */
export function loadPageLayoutMerged(repoRoot, registry) {
  const p = pageLayoutFile(repoRoot);
  let raw;
  try {
    raw = JSON.parse(readFileSync(p, "utf8"));
  } catch {
    raw = {};
  }
  const desktopColumnCount = clampDesktopCols(raw.desktopColumnCount ?? 3);
  const pages = {};
  for (const key of allPageKeys(registry)) {
    const stored = raw.pages?.[key];
    let items = sanitizeItemsForPage(key, stored?.items, registry);
    items = mergeMissingBoxes(key, items, registry);
    if (key === "home") {
      items = sortHomeLayoutItems(items);
    }
    pages[key] = { items };
  }
  return {
    version: LAYOUT_VERSION,
    desktopColumnCount,
    pages
  };
}

/**
 * @param {object} layoutDoc from loadPageLayoutMerged
 * @param {string} pageKey
 * @param {Record<string, string>} fragments box id -> inner HTML (no wrapper)
 * @param {(s: string) => string} escapeHtmlAttr attribute escaper for data-layout-box
 */
export function buildLayoutFlowHtml(layoutDoc, pageKey, fragments, escapeHtmlAttr) {
  const desktopCols = layoutDoc.desktopColumnCount;
  const items = layoutDoc.pages[pageKey]?.items ?? defaultItemsForPage(pageKey);
  const style = `--layout-cols-sm:1;--layout-cols-md:2;--layout-cols-lg:${desktopCols}`;
  const parts = [`<div class="layout-flow" style="${style}">`];
  for (const item of items) {
    if (item.type === "break") {
      parts.push('<div class="layout-break" aria-hidden="true"></div>');
      continue;
    }
    const html = fragments[item.id];
    if (html == null || html === "") continue;
    const spanClass = spanClasses(item.spanMax, desktopCols);
    const idEsc = escapeHtmlAttr(item.id);
    parts.push(`<div class="layout-box ${spanClass}" data-layout-box="${idEsc}">${html}</div>`);
  }
  parts.push("</div>");
  return parts.join("");
}

export function spanClasses(spanMax, desktopCols) {
  const md = Math.min(clampSpanMax(spanMax), 2);
  const lg = Math.min(clampSpanMax(spanMax), desktopCols);
  return `layout-span-md-${md} layout-span-lg-${lg}`;
}
