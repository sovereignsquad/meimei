/**
 * @meimei/sdk — kernel HTTP façades for external apps (no dashboard/lib imports).
 * Base URL should be the public HTTPS origin + optional path prefix (e.g. https://meimei.localhost:8443/dashboard).
 */

function trimSlash(u) {
  return String(u || "").replace(/\/+$/, "");
}

/**
 * @typedef {{ baseUrl: string, appId: string, appSecret?: string }} MeiMeiKernelClientOpts
 */
export class MeiMeiKernelClient {
  /**
   * @param {MeiMeiKernelClientOpts} opts
   */
  constructor(opts) {
    this.baseUrl = trimSlash(opts.baseUrl);
    this.appId = String(opts.appId || "").trim();
    this.appSecret = opts.appSecret != null ? String(opts.appSecret) : undefined;
    if (!this.appId) throw new Error("MeiMeiKernelClient: appId is required");
  }

  /**
   * @param {{ jsonBody?: boolean } & Record<string, string>} [opts]
   * @returns {Record<string, string>}
   */
  _headers(opts = {}) {
    const { jsonBody = true, ...extra } = opts;
    const h = { ...extra };
    if (jsonBody) h["content-type"] = "application/json";
    h["x-meimei-app-id"] = this.appId;
    if (this.appSecret) h["x-meimei-app-secret"] = this.appSecret;
    return h;
  }

  _appPath(suffix) {
    const id = encodeURIComponent(this.appId);
    return `${this.baseUrl}/api/meimei/v1/apps/${id}/${suffix}`;
  }

  /**
   * OpenAI-shaped body; same contract as POST /api/meimei/route.
   * @param {object} body
   * @param {{ traceId?: string }} [opts]
   */
  async inference(body, opts = {}) {
    const headers = this._headers();
    const tid = opts.traceId && String(opts.traceId).trim();
    if (tid) headers["x-meimei-trace-id"] = tid;
    const r = await fetch(this._appPath("inference"), {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });
    const json = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, json };
  }

  /**
   * @param {{ adapterName: string, payload: object, traceId?: string, direction?: "ingress"|"egress" }} job
   */
  async enqueueJob(job) {
    const r = await fetch(this._appPath("jobs/enqueue"), {
      method: "POST",
      headers: this._headers(),
      body: JSON.stringify({
        adapterName: job.adapterName,
        payload: job.payload,
        traceId: job.traceId,
        direction: job.direction
      })
    });
    const json = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, json };
  }

  /**
   * @param {string[]} keys
   */
  async readEnvKeys(keys) {
    const q = new URLSearchParams({ keys: keys.join(",") });
    const r = await fetch(`${this._appPath("env")}?${q}`, {
      method: "GET",
      headers: this._headers({ jsonBody: false })
    });
    const json = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, json };
  }

  /** `GET …/fs/roots` — requires `policy.filesystem.roots` + `filesystem.scoped` capability. */
  async readFilesystemRoots() {
    const r = await fetch(this._appPath("fs/roots"), {
      method: "GET",
      headers: this._headers({ jsonBody: false })
    });
    const json = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, json };
  }
}
