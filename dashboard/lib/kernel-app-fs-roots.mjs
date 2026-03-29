/**
 * MM-KERNEL-303d — read-only view of policy.filesystem.roots (jailed to install_path).
 */
import fs from "node:fs";
import path from "node:path";

const MAX_DIR_ENTRIES = 50;

/**
 * True if `childAbs` is `parentAbs` or a subdirectory thereof (cross-platform).
 * @param {string} parentAbs
 * @param {string} childAbs
 */
export function isPathContainedIn(parentAbs, childAbs) {
  const p = path.resolve(parentAbs);
  const c = path.resolve(childAbs);
  const rel = path.relative(p, c);
  if (rel === "") return true;
  return !rel.split(path.sep).includes("..");
}

/**
 * @param {{ install_path: string, policy?: object }} match
 * @returns {{ ok: true, pairs: { configured: string, resolved: string }[] } | { ok: false, error: string }}
 */
export function resolvePolicyFilesystemRootPairs(match) {
  const rootsRaw = match.policy?.filesystem?.roots;
  if (!Array.isArray(rootsRaw) || rootsRaw.length === 0) {
    return { ok: true, pairs: [] };
  }
  let install = path.resolve(match.install_path);
  try {
    install = fs.realpathSync.native(install);
  } catch {
    /* install missing — still compare using resolved path */
  }
  const pairs = [];
  for (const raw of rootsRaw) {
    if (typeof raw !== "string" || !raw.trim()) continue;
    const r = raw.trim();
    let abs = path.isAbsolute(r) ? path.resolve(r) : path.resolve(install, r);
    abs = path.normalize(abs);
    let checkPath = abs;
    try {
      checkPath = fs.realpathSync.native(abs);
    } catch {
      /* missing — compare using normalized abs against install */
      checkPath = abs;
    }
    if (!isPathContainedIn(install, checkPath)) {
      return { ok: false, error: `root escapes install_path: ${raw}` };
    }
    pairs.push({ configured: r, resolved: abs });
  }
  return { ok: true, pairs };
}

function sampleDirectoryEntries(dirAbs) {
  try {
    const names = fs.readdirSync(dirAbs, { withFileTypes: true });
    const out = [];
    for (let i = 0; i < names.length && out.length < MAX_DIR_ENTRIES; i += 1) {
      const d = names[i];
      const name = d.name;
      if (name === "." || name === "..") continue;
      let type = "other";
      try {
        if (d.isDirectory()) type = "directory";
        else if (d.isFile()) type = "file";
        else if (d.isSymbolicLink()) type = "symlink";
      } catch {
        type = "other";
      }
      out.push({ name, type });
    }
    return { truncated: names.length > MAX_DIR_ENTRIES, entries: out };
  } catch {
    return { truncated: false, entries: [] };
  }
}

/**
 * @param {{ install_path: string, policy?: object }} match
 * @returns {{ statusCode: number, json: object }}
 */
export function buildKernelAppFsRootsPayload(match) {
  const rootsConfigured = match.policy?.filesystem?.roots;
  if (!Array.isArray(rootsConfigured) || rootsConfigured.length === 0) {
    return {
      statusCode: 403,
      json: {
        ok: false,
        error: "filesystem_roots_not_configured",
        code: "FORBIDDEN",
        message:
          "Set policy.filesystem.roots (entries relative to install_path or absolute paths under install_path)."
      }
    };
  }

  const resolved = resolvePolicyFilesystemRootPairs(match);
  if (resolved.ok && resolved.pairs.length === 0) {
    return {
      statusCode: 400,
      json: {
        ok: false,
        error: "invalid_filesystem_roots",
        code: "BAD_REQUEST",
        detail: "No valid root paths after parsing policy.filesystem.roots."
      }
    };
  }
  if (!resolved.ok) {
    return {
      statusCode: 400,
      json: {
        ok: false,
        error: "invalid_filesystem_roots",
        code: "BAD_REQUEST",
        detail: resolved.error
      }
    };
  }

  const roots = [];
  for (const { configured, resolved: abs } of resolved.pairs) {
    try {
      const st = fs.statSync(abs);
      const isDirectory = st.isDirectory();
      let listing = null;
      if (isDirectory) {
        listing = sampleDirectoryEntries(abs);
      }
      roots.push({
        configured,
        resolved: abs,
        exists: true,
        is_directory: isDirectory,
        size: st.size,
        mtime_ms: Math.floor(st.mtimeMs),
        entries_sample: isDirectory ? listing.entries : null,
        entries_truncated: isDirectory ? listing.truncated : false
      });
    } catch {
      roots.push({
        configured,
        resolved: abs,
        exists: false,
        is_directory: false,
        entries_sample: null,
        entries_truncated: false
      });
    }
  }

  return {
    statusCode: 200,
    json: {
      ok: true,
      roots,
      note: "Read-only snapshot; no file read/write API in v1."
    }
  };
}
