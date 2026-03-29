#!/usr/bin/env node
/**
 * MM-KERNEL-603 — forbid static `../apps/<pkg>/` imports in dashboard/server.mjs
 * (miniapps use meimei.app.json + dynamic dispatch). Legacy allowlist empty when fully migrated.
 *
 * @see docs/planning/kernel-app-separation-and-https-program.v1.md
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const serverPath = path.join(repoRoot, "dashboard", "server.mjs");

/** If non-empty, every id must appear as `from "../apps/<id>/…"` in server.mjs (and no others). */
const LEGACY_STATIC_APP_IMPORTS = new Set([]);

const re = /from\s+["']\.\.\/apps\/([^/]+)\//g;
const s = fs.readFileSync(serverPath, "utf8");
const found = new Set();
let m;
while ((m = re.exec(s)) !== null) {
  found.add(m[1]);
}

const unexpected = [...found].filter((id) => !LEGACY_STATIC_APP_IMPORTS.has(id));
if (unexpected.length) {
  console.error("meimei-dashboard-static-apps-import-check: unexpected static apps/* imports in server.mjs:");
  for (const id of unexpected.sort()) console.error(`  ${id}`);
  console.error("Remove static import; add apps/<id>/meimei.app.json and use kernel dispatch.");
  process.exit(1);
}

for (const id of LEGACY_STATIC_APP_IMPORTS) {
  if (!found.has(id)) {
    console.error(
      `meimei-dashboard-static-apps-import-check: allowlist includes "${id}" but server.mjs has no static import — trim LEGACY_STATIC_APP_IMPORTS`
    );
    process.exit(1);
  }
}

if (found.size === 0) {
  console.log("meimei-dashboard-static-apps-import-check: ok (no static apps/* imports in server.mjs)");
} else {
  console.log("meimei-dashboard-static-apps-import-check: ok (legacy static apps allowlist matches server.mjs)");
}
