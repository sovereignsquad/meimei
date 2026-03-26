import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const briefingDir = process.env.MEIMEI_BRIEFING_DIR || path.join(os.homedir(), ".openclaw", "briefings");
const briefingFolderName = process.env.MEIMEI_BRIEFING_FOLDER || "MeiMei";
const briefingSink = process.env.MEIMEI_BRIEFING_SINK || "apple-notes";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      env: { ...process.env },
      shell: false
    });

    let stdout = "";
    let stderr = "";
    const timeoutMs = Number(options.timeoutMs || 0);
    let timer = null;

    if (timeoutMs > 0) {
      timer = setTimeout(() => {
        child.kill("SIGTERM");
        setTimeout(() => child.kill("SIGKILL"), 2000).unref?.();
      }, timeoutMs);
      timer.unref?.();
    }

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("close", (code, signal) => {
      if (timer) clearTimeout(timer);
      resolve({ code, signal, stdout, stderr });
    });
  });
}

async function readTextFile(relPath) {
  const fullPath = path.join(repoRoot, relPath);
  try {
    return await readFile(fullPath, "utf8");
  } catch {
    return "";
  }
}

function extractSectionBullets(markdown, heading) {
  const lines = String(markdown || "").split(/\r?\n/);
  const startIndex = lines.findIndex((line) => line.trim().toLowerCase() === `## ${heading}`.toLowerCase());
  if (startIndex < 0) return [];
  const values = [];
  for (let i = startIndex + 1; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (line.startsWith("## ")) break;
    if (!line.startsWith("- ")) continue;
    const item = line.replace(/^-\s+/, "").trim();
    if (item) values.push(item);
  }
  return values;
}

function parseIceTopItems(markdown, limit = 3) {
  const rows = [];
  for (const line of String(markdown || "").split(/\r?\n/)) {
    const match = line.match(/^\|\s*(\d+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|/);
    if (!match) continue;
    rows.push({
      rank: Number(match[1]),
      useCase: match[2].trim(),
      category: match[3].trim(),
      ice: Number(match[7])
    });
    if (rows.length >= limit) break;
  }
  return rows;
}

function buildMarkdownList(items) {
  const values = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!values.length) return "- None";
  return values.map((item) => `- ${item}`).join("\n");
}

function formatWorkspaceStatus(gitStatus) {
  const lines = String(gitStatus || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) {
    return "- Workspace is clean.";
  }

  const visible = lines.slice(0, 6).map((line) => `  - ${line}`);
  const remaining = lines.length - visible.length;
  if (remaining > 0) {
    visible.push(`  - ...and ${remaining} more changed items.`);
  }
  return `- Dirty workspace (${lines.length} items):\n${visible.join("\n")}`;
}

function buildBriefingMarkdown({ dateLabel, priorities, nextItems, focusItems, reminders, workspaceStatus }) {
  const lines = [
    "# MeiMei Daily Briefing",
    "",
    `Date: ${dateLabel}`,
    "",
    "## Priorities",
    buildMarkdownList(priorities),
    "",
    "## Next Up",
    buildMarkdownList(nextItems),
    "",
    "## High-ICE Focus",
    buildMarkdownList(focusItems),
    "",
    "## Reminders",
    buildMarkdownList(reminders),
    "",
    "## Workspace",
    workspaceStatus || "- No extra workspace changes detected."
  ];
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

function buildBriefingHtml({ dateLabel, priorities, nextItems, focusItems, reminders, workspaceStatus }) {
  const list = (items) => {
    const values = Array.isArray(items) ? items.filter(Boolean) : [];
    if (!values.length) return "<li>None</li>";
    return values.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  };

  return `<!doctype html>
<html>
<body>
  <h1>MeiMei Daily Briefing</h1>
  <p><strong>Date:</strong> ${escapeHtml(dateLabel)}</p>
  <h2>Priorities</h2>
  <ul>${list(priorities)}</ul>
  <h2>Next Up</h2>
  <ul>${list(nextItems)}</ul>
  <h2>High-ICE Focus</h2>
  <ul>${list(focusItems)}</ul>
  <h2>Reminders</h2>
  <ul>${list(reminders)}</ul>
  <h2>Workspace</h2>
  <p>${escapeHtml(workspaceStatus || "No extra workspace changes detected.")}</p>
</body>
</html>`;
}

function formatDateLabel(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "full",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  }).format(date);
}

async function writeAppleNotesNote({ title, bodyHtml, folderName }) {
  const appleScript = `
on run argv
  set noteTitle to item 1 of argv
  set noteBody to item 2 of argv
  set targetFolderName to item 3 of argv
  tell application "Notes"
    activate
    set targetAccount to first account
    set targetFolder to missing value
    try
      set targetFolder to folder targetFolderName of targetAccount
    on error
      try
        set targetFolder to make new folder at targetAccount with properties {name:targetFolderName}
      on error
        set targetFolder to targetAccount
      end try
    end try
    make new note at targetFolder with properties {name:noteTitle, body:noteBody}
  end tell
end run`.trim();

  return runCommand("osascript", ["-e", appleScript, title, bodyHtml, folderName], {
    timeoutMs: 20000
  });
}

async function main() {
  const date = new Date();
  const dateLabel = formatDateLabel(date);
  const title = `MeiMei Daily Briefing - ${date.toISOString().slice(0, 10)}`;
  const tasks = await readTextFile("tasks.md");
  const ice = await readTextFile("ice_meimei.md");
  const learnings = await readTextFile("learnings.md");
  const gitStatus = await runCommand("git", ["status", "--short"], { timeoutMs: 8000 });

  const priorities = extractSectionBullets(tasks, "Active");
  const nextItems = extractSectionBullets(tasks, "Next");
  const focusItems = parseIceTopItems(ice, 3).map((item) => `${item.useCase} (${item.category}, ICE ${item.ice})`);
  const reminders = [
    "Read `agent.md` before starting the day.",
    "Run `./scripts/oc-status` if the agent stack needs a health check.",
    "Keep the briefing short enough to scan in one sitting."
  ];
  const workspaceStatus = formatWorkspaceStatus(gitStatus.stdout);

  const markdown = buildBriefingMarkdown({
    dateLabel,
    priorities,
    nextItems,
    focusItems,
    reminders: reminders.concat(["Review current learnings: markdown-first documentation and a clear approval boundary."]),
    workspaceStatus
  });
  const bodyHtml = buildBriefingHtml({
    dateLabel,
    priorities,
    nextItems,
    focusItems,
    reminders: reminders.concat(["Review current learnings: markdown-first documentation and a clear approval boundary."]),
    workspaceStatus
  });

  await mkdir(briefingDir, { recursive: true });
  const markdownPath = path.join(briefingDir, `${date.toISOString().slice(0, 10)}.md`);
  await writeFile(markdownPath, markdown, "utf8");

  let appleNotesResult = null;
  let sink = briefingSink;
  let noteError = "";

  if (briefingSink === "apple-notes") {
    const result = await writeAppleNotesNote({
      title,
      bodyHtml,
      folderName: briefingFolderName
    });
    appleNotesResult = result;
    if (result.code !== 0) {
      sink = "markdown";
      noteError = result.stderr || "Could not write to Apple Notes.";
    }
  } else {
    sink = "markdown";
  }

  const payload = {
    ok: true,
    title,
    sink,
    folderName: briefingFolderName,
    markdownPath,
    dateLabel,
    priorities,
    nextItems,
    focusItems,
    reminders,
    workspaceStatus,
    markdown,
    bodyHtml,
    noteError
  };

  if (appleNotesResult) {
    payload.appleNotes = {
      code: appleNotesResult.code,
      signal: appleNotesResult.signal,
      stderr: appleNotesResult.stderr
    };
  }

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

main().catch((error) => {
  process.stdout.write(
    `${JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }, null, 2)}\n`
  );
  process.exitCode = 1;
});
