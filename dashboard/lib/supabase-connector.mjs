/**
 * Supabase PostgREST reads for Lead Enrichment (#631). No npm client — fetch + env.
 * Set MEIMEI_SUPABASE_URL and MEIMEI_SUPABASE_SERVICE_ROLE (or MEIMEI_SUPABASE_ANON_KEY).
 */

const TABLE_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const COL_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export function getSupabaseEnv() {
  const url = String(process.env.MEIMEI_SUPABASE_URL || "").trim().replace(/\/$/, "");
  const key = String(
    process.env.MEIMEI_SUPABASE_SERVICE_ROLE || process.env.MEIMEI_SUPABASE_ANON_KEY || ""
  ).trim();
  return { url, key, configured: Boolean(url && key) };
}

function assertTable(table) {
  const t = String(table || "").trim();
  if (!TABLE_RE.test(t)) throw new Error("Invalid or missing table name (use letters, numbers, underscore).");
  return t;
}

function assertColumn(col, fallback) {
  const c = String(col || fallback || "id").trim();
  if (!COL_RE.test(c)) throw new Error("Invalid column name.");
  return c;
}

/**
 * Fetch up to `limit` rows. Prefer id + idColumn, else first key in `match` object.
 */
export async function supabaseSelectRows(sourceData) {
  const { url, key } = getSupabaseEnv();
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set MEIMEI_SUPABASE_URL and MEIMEI_SUPABASE_SERVICE_ROLE (or MEIMEI_SUPABASE_ANON_KEY)."
    );
  }
  const table = assertTable(sourceData.table);
  const limit = Math.min(Math.max(Number(sourceData.limit) || 1, 1), 50);
  const idColumn = assertColumn(sourceData.idColumn, "id");
  let filter = "";
  if (sourceData.id != null && sourceData.id !== "") {
    const v = encodeURIComponent(String(sourceData.id));
    filter = `${idColumn}=eq.${v}`;
  } else if (sourceData.match && typeof sourceData.match === "object" && !Array.isArray(sourceData.match)) {
    const keys = Object.keys(sourceData.match);
    if (keys.length === 0) throw new Error("supabase source requires id or match.{column:value}.");
    const col = assertColumn(keys[0], null);
    const val = encodeURIComponent(String(sourceData.match[keys[0]]));
    filter = `${col}=eq.${val}`;
  } else {
    throw new Error("supabase source requires table and (id or match).");
  }

  const q = `${url}/rest/v1/${table}?select=*&${filter}&limit=${limit}`;
  const res = await fetch(q, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json"
    }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase REST ${res.status}: ${text.slice(0, 300)}`);
  }
  const rows = await res.json();
  if (!Array.isArray(rows)) throw new Error("Unexpected Supabase response shape.");
  return rows;
}

/** Ping PostgREST (empty select) — table optional; uses provided table or _prisma_migrations hack skip. */
export async function supabaseHealthPing(testTable) {
  const { url, key, configured } = getSupabaseEnv();
  if (!configured) {
    return { ok: false, configured: false, message: "URL or key missing in environment." };
  }
  const table = testTable && TABLE_RE.test(String(testTable).trim()) ? String(testTable).trim() : null;
  if (!table) {
    return { ok: true, configured: true, message: "Credentials present. Pass a table name for a row-level ping." };
  }
  const q = `${url}/rest/v1/${table}?select=*&limit=0`;
  const res = await fetch(q, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
      Prefer: "count=exact"
    }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return {
      ok: false,
      configured: true,
      status: res.status,
      message: text.slice(0, 200)
    };
  }
  return { ok: true, configured: true, table, message: "REST reachable for this table." };
}
