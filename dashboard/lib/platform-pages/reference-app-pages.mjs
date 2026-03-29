/**
 * Platform UI — Reference app 1 & 2 GET shells (queue + inter-app bus demo).
 * @version 1.0.0
 * @aligned package agent-meimei 0.8.13
 */

export function renderReferenceApp1Page(layoutDoc, d) {
  const issue790 = d.referenceApp1IssueId ?? 790;
  const topbar = `<div class="topbar">
      <a class="button secondary" href="${d.escapeHtml(d.appsRoute)}">&larr; Back to Apps</a>
      <span class="title">${d.escapeHtml(d.referenceApp1Label)}</span>
    </div>`;
  const main = `<main class="hero">
      <section class="route-card">
        <h1>${d.escapeHtml(d.referenceApp1Label)}</h1>
        <p class="lede u-mb12">Issue <strong>#${issue790}</strong> — Phase 4 reference app: configuration from the env store, inference only via the <code>meimei_jobs</code> queue (no direct LLM calls from this page’s API).</p>
        <p class="muted u-mb12">Enable with <code>REFAPP_FEATURE_TOGGLE=1</code> in <a href="${d.escapeHtml(d.toolsRoute)}">Tools</a> → Environment variables. Optional: <code>REFAPP_MAX_PROMPT_CHARS</code> (default 8000).</p>
        <div id="refAppDisabled790" class="result-card u-mb12" style="display:none;">
          <p class="u-m0"><strong>Disabled.</strong> Set <code>REFAPP_FEATURE_TOGGLE</code> to <code>1</code>, <code>true</code>, <code>yes</code>, or <code>on</code>, then refresh.</p>
        </div>
        <div id="refAppForm790" class="result-card u-mb12" style="display:none;">
          <p class="muted u-mb12" style="font-size:13px;">Ask a question — the dashboard enqueues an <code>inference_v1</code> job; the in-process worker calls <code>POST /api/meimei/route</code> (Ollama). This UI polls job status until complete.</p>
          <div class="field">
            <label for="refPrompt790">Prompt</label>
            <textarea id="refPrompt790" rows="5" placeholder="e.g. Summarize the MeiMei queue contract in one sentence." style="width:100%;max-width:40rem;box-sizing:border-box;font-family:ui-monospace,monospace;font-size:13px;"></textarea>
          </div>
          <div class="route-actions u-mt12">
            <button type="button" class="good" id="refSubmit790">Enqueue &amp; run</button>
          </div>
          <p id="refStatus790" class="muted u-mt12 u-mb0" style="font-size:13px;min-height:1.25em;"></p>
          <div id="refResult790" class="result-card u-mt12" style="display:none;background:rgba(4,10,20,0.55);">
            <p class="muted u-mt0" style="font-size:12px;">Assistant</p>
            <pre id="refResultPre790" class="u-m0" style="white-space:pre-wrap;font-family:ui-monospace,monospace;font-size:13px;line-height:1.45;"></pre>
          </div>
        </div>
        <div id="refMas790" class="result-card u-mb12" style="display:none;">
          <h2 class="u-mt0" style="font-size:1.1rem;">Milestone G — inter-app bus (SQLite only)</h2>
          <p class="muted u-mb12" style="font-size:13px;">No HTTP between apps. <strong>Ping/pong</strong> proves <code>app_task</code> routing. <strong>Standup digest</strong> enqueues inference with <code>meimei_correlation</code> (§5); large bodies use Claim Check under <code>data/meimei/artifacts/</code>. Peer inbox: <a href="../791/Reference_app_2">Reference app 2</a>. Live queue: <a href="${d.escapeHtml(d.browserPathForNormalized(d.systemMonitorRoute))}">System monitor</a>.</p>
          <div class="route-actions u-mb12" style="flex-wrap:wrap;gap:8px;">
            <button type="button" class="good" id="refPing790">Send ping to App 2</button>
          </div>
          <p id="refMasStatus790" class="muted u-mb8" style="font-size:13px;min-height:1.25em;"></p>
          <div class="field u-mb8">
            <label for="refStandupDate790">Standup date (YYYY-MM-DD)</label>
            <input type="text" id="refStandupDate790" placeholder="2026-04-12" style="max-width:14rem;width:100%;box-sizing:border-box;font-family:ui-monospace,monospace;" />
          </div>
          <div class="field u-mb12">
            <label for="refStandupScope790">Scope</label>
            <input type="text" id="refStandupScope790" value="open_checklist_items" style="max-width:28rem;width:100%;box-sizing:border-box;" />
          </div>
          <div class="route-actions u-mb12">
            <button type="button" class="button secondary" id="refStandup790">Request standup digest</button>
          </div>
          <pre id="refMasOut790" class="u-m0" style="display:none;white-space:pre-wrap;font-family:ui-monospace,monospace;font-size:12px;background:rgba(4,10,20,0.45);padding:12px;border-radius:12px;border:1px solid var(--line);max-height:280px;overflow:auto;"></pre>
        </div>
      </section>
    </main>`;
  const layout = d.buildLayoutFlowHtml(
    layoutDoc,
    d.miniappPageKey("reference-app-1"),
    { topbar, main },
    d.escapeAttr
  );
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${d.escapeHtml(d.referenceApp1Label)} - agent.meimei</title>
  <link rel="stylesheet" href="${d.escapeHtml(d.designSystemCssPath)}" />
</head>
<body data-theme="green">
  <div class="shell">${layout}</div>
  <script>
    var apiRef790 = "${d.escapeHtml(d.referenceApp1ApiRoute)}";

    function esc(s) {
      return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
    }

    async function postRef790(body) {
      var r = await fetch(apiRef790, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      var d = await r.json().catch(function () { return { ok: false, error: "Bad JSON" }; });
      return { httpOk: r.ok, d: d };
    }

    async function refreshConfig790() {
      var res = await postRef790({ action: "config" });
      var on = res.d && res.d.ok && res.d.enabled;
      document.getElementById("refAppDisabled790").style.display = on ? "none" : "block";
      document.getElementById("refAppForm790").style.display = on ? "block" : "none";
      document.getElementById("refMas790").style.display = on ? "block" : "none";
      var dEl = document.getElementById("refStandupDate790");
      if (dEl && !dEl.value) dEl.value = new Date().toISOString().slice(0, 10);
    }

    function masInnerIntent(entry) {
      var p = entry.payload;
      if (!p || !p.payload || typeof p.payload !== "object") return "";
      return String(p.payload.intent || "").toLowerCase();
    }

    function masNonce(entry) {
      var p = entry.payload && entry.payload.payload;
      return p ? String(p.nonce || "") : "";
    }

    async function pollTrace790(traceId, intentMatch, matchExtra, timeoutMs) {
      var delay = 650;
      var max = Math.ceil((timeoutMs || 120000) / delay);
      for (var i = 0; i < max; i++) {
        var res = await postRef790({ action: "trace", traceId: traceId });
        if (!res.d || !res.d.ok) return { ok: false, error: res.d && res.d.error ? res.d.error : "trace failed" };
        var entries = res.d.entries || [];
        for (var j = 0; j < entries.length; j++) {
          var e = entries[j];
          if (masInnerIntent(e) !== String(intentMatch).toLowerCase()) continue;
          if (matchExtra && !matchExtra(e)) continue;
          return { ok: true, entry: e };
        }
        await new Promise(function (r) { setTimeout(r, delay); });
      }
      return { ok: false, error: "timeout waiting for " + intentMatch };
    }

    function setStatus790(t) {
      var el = document.getElementById("refStatus790");
      if (el) el.textContent = t || "";
    }

    async function pollJob790(jobId) {
      var max = 150;
      var delay = 700;
      for (var i = 0; i < max; i++) {
        var res = await postRef790({ action: "status", jobId: jobId });
        if (!res.d || !res.d.ok) {
          setStatus790(res.d && res.d.error ? res.d.error : "Status failed");
          return;
        }
        var st = res.d.status || "";
        if (st === "pending" || st === "processing") {
          setStatus790("Job #" + jobId + " — " + st + "…");
          await new Promise(function (r) { setTimeout(r, delay); });
          continue;
        }
        if (st === "failed") {
          setStatus790("Job #" + jobId + " failed.");
          document.getElementById("refResult790").style.display = "block";
          document.getElementById("refResultPre790").textContent = res.d.errorMessage || "(no message)";
          return;
        }
        if (st === "completed") {
          setStatus790("Job #" + jobId + " completed.");
          document.getElementById("refResult790").style.display = "block";
          document.getElementById("refResultPre790").textContent = res.d.assistantText || "(empty response)";
          return;
        }
        setStatus790("Unknown status: " + st);
        return;
      }
      setStatus790("Timed out waiting for job #" + jobId + ".");
    }

    document.getElementById("refSubmit790").addEventListener("click", async function () {
      var prompt = document.getElementById("refPrompt790").value.trim();
      if (!prompt) {
        alert("Enter a prompt.");
        return;
      }
      document.getElementById("refResult790").style.display = "none";
      setStatus790("Enqueueing…");
      var res = await postRef790({ action: "enqueue", prompt: prompt });
      if (!res.d || !res.d.ok) {
        setStatus790("");
        alert(res.d && res.d.error ? res.d.error : "Enqueue failed");
        return;
      }
      setStatus790("Job #" + res.d.jobId + " enqueued. Waiting for worker…");
      await pollJob790(res.d.jobId);
    });

    document.getElementById("refPing790").addEventListener("click", async function () {
      var st = document.getElementById("refMasStatus790");
      var out = document.getElementById("refMasOut790");
      out.style.display = "none";
      st.textContent = "Sending ping…";
      var res = await postRef790({ action: "ping" });
      if (!res.d || !res.d.ok) {
        st.textContent = (res.d && res.d.error) ? res.d.error : "Ping failed";
        return;
      }
      var traceId = res.d.traceId;
      var nonce = res.d.nonce;
      st.textContent = "Waiting for pong (trace " + traceId + ")…";
      var pr = await pollTrace790(traceId, "pong", function (e) { return masNonce(e) === String(nonce); }, 90000);
      if (!pr.ok) {
        st.textContent = pr.error || "No pong";
        return;
      }
      st.textContent = "Pong received (inbox job #" + pr.entry.id + ").";
      out.style.display = "block";
      out.textContent = JSON.stringify(pr.entry, null, 2);
    });

    document.getElementById("refStandup790").addEventListener("click", async function () {
      var st = document.getElementById("refMasStatus790");
      var out = document.getElementById("refMasOut790");
      out.style.display = "none";
      var date = document.getElementById("refStandupDate790").value.trim();
      var scope = document.getElementById("refStandupScope790").value.trim();
      st.textContent = "Enqueueing standup request…";
      var res = await postRef790({ action: "standup", date: date, scope: scope });
      if (!res.d || !res.d.ok) {
        st.textContent = (res.d && res.d.error) ? res.d.error : "Standup enqueue failed";
        return;
      }
      var traceId = res.d.traceId;
      st.textContent = "Waiting for digest (trace " + traceId + ")…";
      var pr = await pollTrace790(traceId, "standup_digest_ready", null, 180000);
      if (!pr.ok) {
        st.textContent = pr.error || "No digest";
        return;
      }
      var pay = pr.entry.payload && pr.entry.payload.payload;
      var text = "";
      if (pay && pay.summary_text) text = String(pay.summary_text);
      if (pay && pay.artifact_path) text += (text ? "\\n\\n" : "") + "artifact: " + pay.artifact_path;
      st.textContent = "Digest delivered to inbox.";
      out.style.display = "block";
      out.textContent = text || JSON.stringify(pr.entry, null, 2);
    });

    refreshConfig790();
  </script>
</body>
</html>`;
}



export function renderReferenceApp2Page(layoutDoc, d) {
  const issue791 = d.referenceApp2IssueId ?? 791;
  const topbar = `<div class="topbar">
      <a class="button secondary" href="${d.escapeHtml(d.appsRoute)}">&larr; Back to Apps</a>
      <span class="title">${d.escapeHtml(d.referenceApp2Label)}</span>
    </div>`;
  const main = `<main class="hero">
      <section class="route-card">
        <h1>${d.escapeHtml(d.referenceApp2Label)}</h1>
        <p class="lede u-mb12">Issue <strong>#${issue791}</strong> — Milestone G <strong>sovereign inbox</strong>. Consumes <code>app_task</code> rows targeted at <code>reference-app-2</code> inside the dashboard process. No HTTP calls to Reference App 1.</p>
        <p class="muted u-mb12">Uses <code>REFAPP_FEATURE_TOGGLE</code>. Pair with <a href="../790/Reference_app_1">Reference app 1</a> for ping/pong and standup digest.</p>
        <div id="ref2Disabled" class="result-card u-mb12" style="display:none;">
          <p class="u-m0"><strong>Disabled.</strong> Set <code>REFAPP_FEATURE_TOGGLE=1</code> and refresh.</p>
        </div>
        <div id="ref2Main" class="result-card" style="display:none;">
          <p class="muted u-mb12" style="font-size:13px;">Latest <code>app_task</code> rows for this inbox (newest first).</p>
          <button type="button" class="button secondary u-mb12" id="ref2Refresh">Refresh</button>
          <pre id="ref2Out" class="u-m0" style="white-space:pre-wrap;font-family:ui-monospace,monospace;font-size:12px;max-height:360px;overflow:auto;"></pre>
        </div>
      </section>
    </main>`;
  const layout = d.buildLayoutFlowHtml(
    layoutDoc,
    d.miniappPageKey("reference-app-2"),
    { topbar, main },
    d.escapeAttr
  );
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${d.escapeHtml(d.referenceApp2Label)} - agent.meimei</title>
  <link rel="stylesheet" href="${d.escapeHtml(d.designSystemCssPath)}" />
</head>
<body data-theme="green">
  <div class="shell">${layout}</div>
  <script>
    var apiRef2 = "${d.escapeHtml(d.referenceApp2ApiRoute)}";
    async function postRef2(body) {
      var r = await fetch(apiRef2, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      var d = await r.json().catch(function () { return { ok: false, error: "Bad JSON" }; });
      return { httpOk: r.ok, d: d };
    }
    async function loadRef2() {
      var res = await postRef2({ action: "config" });
      var on = res.d && res.d.ok && res.d.enabled;
      document.getElementById("ref2Disabled").style.display = on ? "none" : "block";
      document.getElementById("ref2Main").style.display = on ? "block" : "none";
      if (!on) return;
      var inbox = await postRef2({ action: "inbox" });
      document.getElementById("ref2Out").textContent = inbox.d && inbox.d.ok
        ? JSON.stringify(inbox.d.entries, null, 2)
        : (inbox.d && inbox.d.error) || "Failed";
    }
    document.getElementById("ref2Refresh").addEventListener("click", loadRef2);
    loadRef2();
  </script>
</body>
</html>`;
}


