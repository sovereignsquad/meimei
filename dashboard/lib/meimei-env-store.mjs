import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir, writeFile } from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRootDefault = path.resolve(__dirname, "../..");

const STORE_FILE = "meimei-environment.v1.json";
export const VALID_TARGETS = ["production", "preview", "development"];
const KEY_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** Regex-exception allowlist: single-segment POSIX / shell keys that must not require APP_PREFIX. */
export const MEIMEI_ENV_SYSTEM_ALLOWLIST = Object.freeze([
  "PORT",
  "HOME",
  "USER",
  "LOGNAME",
  "TMPDIR",
  "PATH",
  "SHELL",
  "LANG",
  "CI"
]);

/** Recommended new keys: <APPIDENTIFIER>_<REST> (uppercase segments). */
export const MEIMEI_ENV_RECOMMENDED_KEY_RE = /^[A-Z0-9]+_[A-Z0-9_]+$/;

export function meimeiEnvStrictNamesEnabled() {
  const v = String(process.env.MEIMEI_ENV_STRICT_KEY_NAMES || "")
    .trim()
    .toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function meimeiEnvKeyMeetsStrictConvention(key) {
  const k = String(key || "").trim();
  if (!k) return false;
  if (MEIMEI_ENV_SYSTEM_ALLOWLIST.includes(k)) return true;
  return MEIMEI_ENV_RECOMMENDED_KEY_RE.test(k);
}

export function meimeiEnvKeyNamingMeta() {
  return {
    recommendedPattern: String(MEIMEI_ENV_RECOMMENDED_KEY_RE).slice(1, -1),
    systemAllowlist: [...MEIMEI_ENV_SYSTEM_ALLOWLIST],
    strictNamesEnabled: meimeiEnvStrictNamesEnabled()
  };
}

export function meimeiEnvStorePath(repoRoot) {
  return path.join(repoRoot, "data", STORE_FILE);
}

export function loadCatalogSync(repoRoot = repoRootDefault) {
  const p = path.join(repoRoot, "config", "meimei-env-catalog.v1.json");
  try {
    const raw = fs.readFileSync(p, "utf8");
    const d = JSON.parse(raw);
    if (!d || d.version !== "v1" || !Array.isArray(d.groups)) {
      return { version: "v1", groups: [] };
    }
    return d;
  } catch {
    return { version: "v1", groups: [] };
  }
}

export function loadStoreSync(repoRoot) {
  try {
    const raw = fs.readFileSync(meimeiEnvStorePath(repoRoot), "utf8");
    const d = JSON.parse(raw);
    if (!d || d.version !== 1 || !Array.isArray(d.entries)) {
      return { version: 1, entries: [] };
    }
    return d;
  } catch {
    return { version: 1, entries: [] };
  }
}

export function getActiveProfile() {
  const p = String(process.env.MEIMEI_ENV_PROFILE || "development").toLowerCase();
  return VALID_TARGETS.includes(p) ? p : "development";
}

export function entryAppliesToRuntime(entry, profile = getActiveProfile()) {
  const t = entry.targets;
  if (!t || !Array.isArray(t) || t.length === 0) return true;
  return t.includes(profile);
}

export function maskEnvValue(v) {
  if (v == null || v === "") return "(empty)";
  const s = String(v);
  if (s.length <= 4) return "••••••••";
  return "••••••••" + s.slice(-4);
}

/**
 * Apply store entries to process.env (scoped by MEIMEI_ENV_PROFILE).
 * Applies MEIMEI_ENV_PROFILE first (using shell profile), then re-reads profile for remaining keys.
 */
export function applyStoreToProcessEnv(store) {
  const entries = (store.entries || []).filter((e) => e?.key && KEY_RE.test(e.key));
  const shellProfile = getActiveProfile();

  for (const e of entries) {
    if (e.key !== "MEIMEI_ENV_PROFILE") continue;
    if (entryAppliesToRuntime(e, shellProfile)) {
      process.env[e.key] = String(e.value ?? "");
    }
  }

  const profileAfter = getActiveProfile();
  for (const e of entries) {
    if (e.key === "MEIMEI_ENV_PROFILE") continue;
    if (entryAppliesToRuntime(e, profileAfter)) {
      process.env[e.key] = String(e.value ?? "");
    }
  }
}

export function loadSyncAndApplyMeimeiEnv(repoRoot) {
  const s = loadStoreSync(repoRoot);
  applyStoreToProcessEnv(s);
}

export async function saveStore(repoRoot, store) {
  const p = meimeiEnvStorePath(repoRoot);
  await mkdir(path.dirname(p), { recursive: true });
  await writeFile(p, JSON.stringify(store, null, 2), "utf8");
  try {
    fs.chmodSync(p, 0o600);
  } catch {
    /* ignore */
  }
}

function normalizeTargets(body) {
  if (!Array.isArray(body.targets)) return [...VALID_TARGETS];
  const t = body.targets.filter((x) => VALID_TARGETS.includes(String(x).toLowerCase()));
  return t.length > 0 ? t : [...VALID_TARGETS];
}

function newEntryId() {
  return "env_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
}

/**
 * API for Environment variables miniapp (Vercel-style CRUD).
 */
export async function handleMeimeiEnvApiRequest(body, repoRoot) {
  const action = String(body?.action || "list");

  if (action === "catalog") {
    return {
      ok: true,
      catalog: loadCatalogSync(repoRoot),
      activeProfile: getActiveProfile(),
      keyNaming: meimeiEnvKeyNamingMeta()
    };
  }

  if (action === "list") {
    const store = loadStoreSync(repoRoot);
    const entries = store.entries.map((e) => ({
      id: e.id,
      key: e.key,
      targets: Array.isArray(e.targets) ? e.targets : [...VALID_TARGETS],
      updatedAt: e.updatedAt || "",
      maskedValue: maskEnvValue(e.value),
      hasValue: Boolean(e.value != null && String(e.value).length > 0),
      appliesNow: entryAppliesToRuntime(e, getActiveProfile())
    }));
    return {
      ok: true,
      activeProfile: getActiveProfile(),
      storePath: `data/${STORE_FILE}`,
      entries,
      keyNaming: meimeiEnvKeyNamingMeta()
    };
  }

  if (action === "reveal") {
    const id = String(body.id || "").trim();
    if (!id) return { ok: false, error: "reveal requires id." };
    const store = loadStoreSync(repoRoot);
    const e = store.entries.find((x) => x.id === id);
    if (!e) return { ok: false, error: "Variable not found." };
    return { ok: true, id: e.id, key: e.key, value: e.value ?? "" };
  }

  if (action === "delete") {
    const id = String(body.id || "").trim();
    if (!id) return { ok: false, error: "delete requires id." };
    const store = loadStoreSync(repoRoot);
    const before = store.entries.length;
    store.entries = store.entries.filter((x) => x.id !== id);
    if (store.entries.length === before) return { ok: false, error: "Variable not found." };
    await saveStore(repoRoot, store);
    applyStoreToProcessEnv(store);
    return { ok: true };
  }

  if (action === "upsert") {
    const store = loadStoreSync(repoRoot);
    const id = body.id ? String(body.id).trim() : "";
    const keyRaw = String(body.key || "").trim();
    const targets = normalizeTargets(body);

    if (id) {
      const entry = store.entries.find((x) => x.id === id);
      if (!entry) return { ok: false, error: "Variable not found." };
      if (keyRaw && keyRaw !== entry.key) {
        if (!KEY_RE.test(keyRaw)) return { ok: false, error: "Invalid key name." };
        if (
          meimeiEnvStrictNamesEnabled() &&
          !meimeiEnvKeyMeetsStrictConvention(keyRaw)
        ) {
          return {
            ok: false,
            error:
              "Key must match APP_IDENTIFIER_VARNAME (e.g. MYAPP_SECRET_KEY) or be a POSIX allowlist name (PORT, HOME, …). Disable with MEIMEI_ENV_STRICT_KEY_NAMES=0."
          };
        }
        if (store.entries.some((x) => x.key === keyRaw && x.id !== id)) {
          return { ok: false, error: "Another variable already uses this key." };
        }
        entry.key = keyRaw;
      }
      entry.targets = targets;
      if ("value" in body) entry.value = String(body.value ?? "");
      entry.updatedAt = new Date().toISOString();
    } else {
      if (!KEY_RE.test(keyRaw)) return { ok: false, error: "Invalid key name (use A-Z, 0-9, _)." };
      if (
        meimeiEnvStrictNamesEnabled() &&
        !meimeiEnvKeyMeetsStrictConvention(keyRaw)
      ) {
        return {
          ok: false,
          error:
            "Key must match APP_IDENTIFIER_VARNAME (e.g. MYAPP_SECRET_KEY) or be a POSIX allowlist name (PORT, HOME, …). Disable with MEIMEI_ENV_STRICT_KEY_NAMES=0."
        };
      }
      let entry = store.entries.find((x) => x.key === keyRaw);
      if (!entry) {
        entry = {
          id: newEntryId(),
          key: keyRaw,
          value: "value" in body ? String(body.value ?? "") : "",
          targets,
          updatedAt: new Date().toISOString()
        };
        store.entries.push(entry);
      } else {
        entry.targets = targets;
        if ("value" in body) entry.value = String(body.value ?? "");
        entry.updatedAt = new Date().toISOString();
      }
    }

    await saveStore(repoRoot, store);
    applyStoreToProcessEnv(store);
    return { ok: true };
  }

  if (action === "export_dotenv") {
    const target = String(body.target || "").toLowerCase();
    const filterTarget = VALID_TARGETS.includes(target) ? target : null;
    const store = loadStoreSync(repoRoot);
    const lines = [];
    for (const e of store.entries) {
      if (!e?.key) continue;
      const t = Array.isArray(e.targets) && e.targets.length > 0 ? e.targets : [...VALID_TARGETS];
      if (filterTarget && !t.includes(filterTarget)) continue;
      const v = String(e.value ?? "");
      const escaped = v.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
      lines.push(`${e.key}="${escaped}"`);
    }
    return {
      ok: true,
      format: "dotenv",
      target: filterTarget || "all",
      text: lines.join("\n") + (lines.length ? "\n" : "")
    };
  }

  return {
    ok: false,
    error:
      "Unknown action. Use list, catalog, upsert, delete, reveal, or export_dotenv."
  };
}
