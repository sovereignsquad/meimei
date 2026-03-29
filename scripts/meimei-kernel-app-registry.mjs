#!/usr/bin/env node
/**
 * CLI for the kernel external-app registry (MM-KERNEL-202).
 *
 * Usage:
 *   node scripts/meimei-kernel-app-registry.mjs list
 *   node scripts/meimei-kernel-app-registry.mjs register <installDir> [--secret <value>]
 *   node scripts/meimei-kernel-app-registry.mjs disable <app_id>
 *   node scripts/meimei-kernel-app-registry.mjs enable <app_id>
 *   node scripts/meimei-kernel-app-registry.mjs remove <app_id> [reason]
 *
 * Env:
 *   MEIMEI_KERNEL_APP_REGISTRY — override registry JSON path (default data/kernel/apps/registry.json)
 *
 * @see docs/planning/kernel-app-separation-and-https-program.v1.md
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  defaultKernelAppRegistryPath,
  listKernelApps,
  registerKernelApp,
  removeKernelApp,
  setKernelAppEnabled
} from "../dashboard/lib/kernel-app-registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

function registryPath() {
  const env = String(process.env.MEIMEI_KERNEL_APP_REGISTRY || "").trim();
  return env || defaultKernelAppRegistryPath(repoRoot);
}

async function main() {
  const [, , cmd, ...rest] = process.argv;
  const regPath = registryPath();

  if (!cmd || cmd === "help" || cmd === "-h") {
    console.log(`Usage:
  node scripts/meimei-kernel-app-registry.mjs list
  node scripts/meimei-kernel-app-registry.mjs register <installDir> [--secret <value>]
  node scripts/meimei-kernel-app-registry.mjs disable <app_id>
  node scripts/meimei-kernel-app-registry.mjs enable <app_id>
  node scripts/meimei-kernel-app-registry.mjs remove <app_id> [reason]
Registry file: ${regPath}`);
    process.exit(cmd ? 0 : 1);
    return;
  }

  if (cmd === "list") {
    const apps = listKernelApps(repoRoot, regPath);
    if (apps.length === 0) {
      console.log("(no registered apps)");
      return;
    }
    for (const a of apps) {
      const en = a.enabled ? "enabled" : "disabled";
      console.log(`${a.app_id}\t${en}\t${a.manifest?.name ?? "?"}\t${a.install_path}`);
    }
    return;
  }

  if (cmd === "register") {
    let dir = "";
    let deploymentSecret;
    for (let i = 0; i < rest.length; i++) {
      if (rest[i] === "--secret" && rest[i + 1] !== undefined) {
        deploymentSecret = rest[i + 1];
        i++;
        continue;
      }
      if (!dir && rest[i] !== "--secret") {
        dir = rest[i];
      }
    }
    if (!dir) {
      console.error("register requires <installDir>");
      process.exit(1);
    }
    const out = await registerKernelApp(repoRoot, dir, {
      registryPath: regPath,
      audit: true,
      ...(deploymentSecret !== undefined ? { deploymentSecret } : {})
    });
    console.log(
      JSON.stringify({ ok: true, app_id: out.app_id, created: out.created }, null, 2)
    );
    return;
  }

  if (cmd === "disable") {
    const id = rest[0];
    if (!id) {
      console.error("disable requires <app_id>");
      process.exit(1);
    }
    setKernelAppEnabled(repoRoot, id, false, { registryPath: regPath });
    console.log(JSON.stringify({ ok: true, app_id: id, enabled: false }));
    return;
  }

  if (cmd === "enable") {
    const id = rest[0];
    if (!id) {
      console.error("enable requires <app_id>");
      process.exit(1);
    }
    setKernelAppEnabled(repoRoot, id, true, { registryPath: regPath });
    console.log(JSON.stringify({ ok: true, app_id: id, enabled: true }));
    return;
  }

  if (cmd === "remove") {
    const id = rest[0];
    if (!id) {
      console.error("remove requires <app_id>");
      process.exit(1);
    }
    const reason = rest.slice(1).join(" ") || "removed";
    await removeKernelApp(repoRoot, id, { registryPath: regPath, reason, audit: true });
    console.log(JSON.stringify({ ok: true, app_id: id, removed: true }));
    return;
  }

  console.error(`Unknown command: ${cmd}`);
  process.exit(1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
