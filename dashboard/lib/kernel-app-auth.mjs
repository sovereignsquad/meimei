/**
 * MM-KERNEL-301 — optional app identity + deployment secret for kernel POST dispatch.
 *
 * Env:
 *   MEIMEI_KERNEL_APP_AUTH=1 — require X-MeiMei-App-Id to match the resolved app (unless manifest.kernel.authExempt).
 *
 * Headers (case-insensitive per Node):
 *   X-MeiMei-App-Id
 *   X-MeiMei-App-Secret — compared to SHA-256 hex stored on registry entry (auth_secret_sha256).
 *
 * @see docs/planning/kernel-app-separation-and-https-program.v1.md
 */
import { createHash, timingSafeEqual } from "node:crypto";

/**
 * @param {import("node:http").IncomingMessage} req
 * @param {string} name
 */
function header(req, name) {
  const h = req.headers;
  if (!h || typeof h !== "object") return "";
  const lower = name.toLowerCase();
  const v = h[lower];
  if (Array.isArray(v)) return String(v[0] || "").trim();
  return String(v || "").trim();
}

function sha256HexUtf8(s) {
  return createHash("sha256").update(String(s), "utf8").digest("hex");
}

/**
 * @param {import("node:http").IncomingMessage} req
 * @param {import("./kernel-app-registry.mjs").KernelRegisteredApp} match
 * @returns {{ ok: true } | { ok: false, status: number, payload: object }}
 */
export function assertKernelAppDispatchAuth(req, match) {
  if (!match.enabled) {
    return {
      ok: false,
      status: 403,
      payload: { ok: false, error: "kernel_app_disabled", code: "FORBIDDEN" }
    };
  }

  const globalAuth = String(process.env.MEIMEI_KERNEL_APP_AUTH || "").trim() === "1";
  const manifestExempt = match.manifest?.kernel?.authExempt === true;
  const expectedSecretHex =
    typeof match.auth_secret_sha256 === "string" ? match.auth_secret_sha256.trim() : "";

  if (expectedSecretHex) {
    const provided = header(req, "x-meimei-app-secret");
    if (!provided) {
      return {
        ok: false,
        status: 401,
        payload: { ok: false, error: "missing_app_secret", code: "UNAUTHORIZED" }
      };
    }
    const gotHex = sha256HexUtf8(provided);
    try {
      if (gotHex.length !== expectedSecretHex.length || !timingSafeEqual(Buffer.from(gotHex, "utf8"), Buffer.from(expectedSecretHex, "utf8"))) {
        return {
          ok: false,
          status: 403,
          payload: { ok: false, error: "invalid_app_secret", code: "FORBIDDEN" }
        };
      }
    } catch {
      return {
        ok: false,
        status: 403,
        payload: { ok: false, error: "invalid_app_secret", code: "FORBIDDEN" }
      };
    }
  }

  if (globalAuth && !manifestExempt) {
    const id = header(req, "x-meimei-app-id");
    if (!id || id !== match.app_id) {
      return {
        ok: false,
        status: 401,
        payload: { ok: false, error: "missing_or_invalid_app_id", code: "UNAUTHORIZED" }
      };
    }
  }

  return { ok: true };
}
