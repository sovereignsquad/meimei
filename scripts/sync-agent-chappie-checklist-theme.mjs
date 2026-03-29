#!/usr/bin/env node
/**
 * Copy MeiMei checklist theme into a local clone of moldovancsaba/checklist
 * (consultant-followup-web) and optionally patch app/layout.tsx.
 *
 * Usage:
 *   CHECKLIST_WEB_APP=/path/to/checklist/apps/consultant-followup-web node scripts/sync-agent-chappie-checklist-theme.mjs
 *   CHECKLIST_WEB_APP=... node scripts/sync-agent-chappie-checklist-theme.mjs --patch-layout
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const srcCss = path.join(repoRoot, "integrations/agent-chappie-checklist/meimei-checklist-theme.css");

const targetRoot = String(process.env.CHECKLIST_WEB_APP || "").trim();
const patchLayout = process.argv.includes("--patch-layout");

if (!targetRoot) {
  console.error("Set CHECKLIST_WEB_APP to consultant-followup-web root (e.g. .../checklist/apps/consultant-followup-web)");
  process.exit(1);
}

if (!fs.existsSync(srcCss)) {
  console.error("Missing source CSS:", srcCss);
  process.exit(1);
}

const destCss = path.join(targetRoot, "app", "meimei-checklist-theme.css");
fs.mkdirSync(path.dirname(destCss), { recursive: true });
fs.copyFileSync(srcCss, destCss);
console.log("Wrote", destCss);

if (patchLayout) {
  const layoutPath = path.join(targetRoot, "app", "layout.tsx");
  if (!fs.existsSync(layoutPath)) {
    console.error("No app/layout.tsx at", layoutPath);
    process.exit(1);
  }
  let txt = fs.readFileSync(layoutPath, "utf8");
  if (!txt.includes("meimei-checklist-theme")) {
    txt = txt.replace(
      'import "./globals.css";',
      'import "./globals.css";\nimport "./meimei-checklist-theme.css";'
    );
  }
  if (!txt.includes('data-theme="green"')) {
    txt = txt.replace(
      "<body className={`${display.variable} ${body.variable}`}>",
      '<body data-theme="green" className={`meimei-shell ${display.variable} ${body.variable}`}>'
    );
  }
  fs.writeFileSync(layoutPath, txt);
  console.log("Patched", layoutPath);
} else {
  console.log("\nNext: add to app/layout.tsx after globals.css:\n  import \"./meimei-checklist-theme.css\";\nAnd on <body>: data-theme=\"green\" className={... + \" meimei-shell\"}\nOr re-run with --patch-layout");
}
