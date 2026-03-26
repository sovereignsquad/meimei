#!/usr/bin/env node
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const homeDir = os.homedir();
const openclawHome = path.join(homeDir, ".openclaw");
const configPath = process.env.OPENCLAW_CONFIG_PATH || path.join(openclawHome, "openclaw.json");
const seedPath = path.join(repoRoot, "openclaw.config.json");
const envPath = path.join(openclawHome, ".env");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function note(message) {
  process.stdout.write(`${message}\n`);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

async function writeJson(filePath, value) {
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  await fsp.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function replacePlaceholders(value, replacements) {
  if (typeof value === "string") {
    return Object.entries(replacements).reduce((acc, [needle, replacement]) => {
      if (acc.includes(needle)) {
        return acc.split(needle).join(replacement);
      }
      return acc;
    }, value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => replacePlaceholders(item, replacements));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, replacePlaceholders(item, replacements)])
    );
  }
  return value;
}

function generateGatewayToken() {
  try {
    return execFileSync("openssl", ["rand", "-hex", "24"], { encoding: "utf8" }).trim();
  } catch (error) {
    fail(`Unable to generate gateway token: ${error.message || error}`);
  }
}

function liveReplacementMap() {
  return {
    [repoRoot]: "__MEIMEI_REPO_ROOT__",
    [openclawHome]: "__MEIMEI_OPENCLAW_HOME__",
    [homeDir]: "__MEIMEI_HOME__"
  };
}

function renderReplacementMap({ gatewayToken }) {
  return {
    "__MEIMEI_REPO_ROOT__": repoRoot,
    "__MEIMEI_OPENCLAW_HOME__": openclawHome,
    "__MEIMEI_HOME__": homeDir,
    "__MEIMEI_GATEWAY_TOKEN__": gatewayToken
  };
}

function sanitizeForTemplate(config) {
  const replacements = liveReplacementMap();
  const seeded = replacePlaceholders(config, replacements);
  if (seeded?.gateway?.auth) {
    seeded.gateway.auth.token = "__MEIMEI_GATEWAY_TOKEN__";
  }
  return seeded;
}

async function ensureEnvFile() {
  await fsp.mkdir(openclawHome, { recursive: true });
  if (!fs.existsSync(envPath)) {
    await fsp.writeFile(
      envPath,
      [
        "# MeiMei secrets live here.",
        "# Required:",
        "# OPENROUTER_API_KEY=..."
      ].join("\n") + "\n",
      "utf8"
    );
  }
  await fsp.chmod(envPath, 0o600).catch(() => {});
}

async function seedLiveConfig({ force = false } = {}) {
  if (fs.existsSync(configPath) && !force) {
    note(`OpenClaw config already exists: ${configPath}`);
    return;
  }
  if (!fs.existsSync(seedPath)) {
    fail(`Seed template not found: ${seedPath}`);
  }
  const seed = readJson(seedPath);
  const gatewayToken = fs.existsSync(configPath) && force
    ? (readJson(configPath)?.gateway?.auth?.token || generateGatewayToken())
    : generateGatewayToken();
  const rendered = replacePlaceholders(seed, renderReplacementMap({ gatewayToken }));
  await fsp.mkdir(path.dirname(configPath), { recursive: true });
  await writeJson(configPath, rendered);
  await fsp.chmod(configPath, 0o600).catch(() => {});
  note(`Wrote OpenClaw config: ${configPath}`);
}

async function exportSeedTemplate() {
  if (!fs.existsSync(configPath)) {
    fail(`Live config not found: ${configPath}`);
  }
  const live = readJson(configPath);
  const template = sanitizeForTemplate(live);
  process.stdout.write(`${JSON.stringify(template, null, 2)}\n`);
}

async function ensureWorkspacePaths() {
  const directories = [
    openclawHome,
    path.join(openclawHome, "workspace"),
    path.join(openclawHome, "workspace-judge"),
    path.join(openclawHome, "workspace-drafter"),
    path.join(openclawHome, "agents", "main", "sessions"),
    path.join(openclawHome, "agents", "judge", "agent"),
    path.join(openclawHome, "agents", "drafter", "agent"),
    path.join(openclawHome, "briefings"),
    path.join(openclawHome, "certs")
  ];
  for (const directory of directories) {
    await fsp.mkdir(directory, { recursive: true });
  }
}

async function main() {
  const command = process.argv[2] || "seed";
  const force = process.argv.includes("--force");
  switch (command) {
    case "seed":
      await ensureEnvFile();
      await ensureWorkspacePaths();
      await seedLiveConfig({ force });
      break;
    case "export-template":
      await exportSeedTemplate();
      break;
    case "path":
      process.stdout.write(`${configPath}\n`);
      break;
    default:
      fail(`Usage: ${path.basename(process.argv[1])} [seed|export-template|path] [--force]`);
  }
}

main().catch((error) => {
  fail(error?.stack || error?.message || String(error));
});
