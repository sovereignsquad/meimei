/**
 * Platform UI — tool surfaces (routing preview, API adapter, SDR analytics, Supabase, env store).
 * Injected deps keep `dashboard/server.mjs` thin (Phase 0).
 *
 * @version 1.0.0
 * @aligned package agent-meimei 0.8.7
 */

export function renderRoutingPage(layoutDoc, d) {
  const topbar = `<div class="topbar">
      <a class="button secondary" href="${d.escapeHtml(d.toolsRoute)}">&larr; Back to Tools</a>
      <span class="title">${d.escapeHtml(d.aiRoutingLabel)}</span>
    </div>`;
  const main = `<main class="hero">
      <section class="route-card">
        <h1>${d.escapeHtml(d.aiRoutingLabel)}</h1>
        <p class="lede">Pick a channel, task type, and cost target. MeiMei will show the recommended route, fallback, and reason. This previews routing only.</p>
        <div class="route-form">
          <div class="route-grid">
            <div class="field">
              <label for="channel">Channel</label>
              <select id="channel" data-channel>
                ${[
                  ["dashboard", "Dashboard"],
                  ["whatsapp", "WhatsApp"],
                  ["imessage", "iMessage"],
                  ["api", "API"],
                  ["internal-ops", "Internal ops"]
                ].map(([value, label]) => `<option value="${d.escapeHtml(value)}">${d.escapeHtml(label)}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label for="taskType">Task type</label>
              <select id="taskType" data-task-type>
                ${[
                  ["chat", "Chat / reply"],
                  ["summary", "Summary / extraction"],
                  ["research", "Research / synthesis"],
                  ["review", "Review / safety"],
                  ["utility", "Deterministic utility"],
                  ["general", "General"]
                ].map(([value, label]) => `<option value="${d.escapeHtml(value)}">${d.escapeHtml(label)}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label for="costTarget">Cost target</label>
              <select id="costTarget" data-cost-target>
                ${[
                  ["low", "Low"],
                  ["medium", "Medium"],
                  ["high", "High"],
                  ["xhigh", "Extra high"]
                ].map(([value, label]) => `<option value="${d.escapeHtml(value)}">${d.escapeHtml(label)}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="route-actions">
            <button type="button" class="good" data-route-submit>Route</button>
          </div>
        </div>
      </section>
      <section class="result-shell" id="resultShell">
        <div class="result-card">
          <p class="muted u-m0">Choose values above and press <strong>Route</strong>.</p>
        </div>
      </section>
      <div class="footer">This page previews the routing policy only. It does not send a message or execute a turn.</div>
    </main>`;
  const routingFlow = d.buildLayoutFlowHtml(layoutDoc, d.miniappPageKey("model-routing"), { topbar, main }, d.escapeAttr);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${d.escapeHtml(d.aiRoutingLabel)} - agent.meimei</title>
  <link rel="stylesheet" href="${d.escapeHtml(d.designSystemCssPath)}" />
</head>
<body data-theme="green">
  <div class="shell">
    ${routingFlow}
  </div>
  <script>
    const channelInput = document.querySelector("[data-channel]");
    const taskTypeInput = document.querySelector("[data-task-type]");
    const costTargetInput = document.querySelector("[data-cost-target]");
    const routeButton = document.querySelector("[data-route-submit]");
    const resultShell = document.getElementById("resultShell");

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function prettyAgent(value) {
      const text = String(value || "");
      if (!text) return "Unknown";
      if (text === "main") return "Writer / main";
      if (text === "drafter") return "Drafter";
      if (text === "judge") return "Judge";
      return text;
    }

    function prettyChannel(value) {
      const text = String(value || "").replace(/[-_]/g, " ");
      return text.charAt(0).toUpperCase() + text.slice(1);
    }

    function renderWorking() {
      resultShell.innerHTML = [
        '<div class="result-card">',
        '<div class="pill">Working</div>',
        '<p class="muted u-mt12">Calculating the routing recommendation.</p>',
        '</div>'
      ].join('');
      document.body.classList.add("has-result");
    }

    function renderRoute(route) {
      const agent = prettyAgent(route.agent);
      const fallbackAgent = prettyAgent(route.fallbackAgent);
      const title = agent + " recommended";
      const statusClass = route.agent === "judge" ? "status-ok" : route.agent === "drafter" ? "status-limited" : "status-ok";
      resultShell.innerHTML = [
        '<div class="result-card">',
        '<div class="pill ' + statusClass + ' u-mb12">Route ready</div>',
        '<h2>' + escapeHtml(title) + '</h2>',
        '<p class="muted u-mt0">' + escapeHtml(route.reason || "Deterministic routing selected the safest fit.") + '</p>',
        '<div class="grid">',
        '<section class="panel">',
        '<h3>Recommended</h3>',
        '<div class="value value-lg">' + escapeHtml(agent) + '</div>',
        '<div class="muted u-mt8">Thinking: ' + escapeHtml(route.thinking || "low") + '</div>',
        '</section>',
        '<section class="panel">',
        '<h3>Fallback</h3>',
        '<div class="value value-lg">' + escapeHtml(fallbackAgent) + '</div>',
        '<div class="muted u-mt8">Fallback thinking: ' + escapeHtml(route.fallbackThinking || "low") + '</div>',
        '</section>',
        '<section class="panel">',
        '<h3>Inputs</h3>',
        '<div class="muted">Channel: ' + escapeHtml(prettyChannel(route.channel)) + '</div>',
        '<div class="muted">Task type: ' + escapeHtml(String(route.taskType || "").replace(/^./, (m) => m.toUpperCase())) + '</div>',
        '<div class="muted">Cost target: ' + escapeHtml(route.costTarget || "low") + '</div>',
        '</section>',
        '<section class="panel">',
        '<h3>Tier</h3>',
        '<div class="value value-lg">' + escapeHtml(route.tier || "tier_local_fast") + '</div>',
        '</section>',
        '</div>',
        '</div>'
      ].join('');
      document.body.classList.add("has-result");
    }

    async function runRouting() {
      const payload = {
        channel: String(channelInput.value || "").trim(),
        taskType: String(taskTypeInput.value || "").trim(),
        costTarget: String(costTargetInput.value || "").trim()
      };
      renderWorking();
      window.scrollTo({ top: 0, behavior: "smooth" });
      try {
        const response = await fetch("${d.routingApiRoute}", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.error || "The router could not calculate a recommendation.");
        }
        renderRoute(data.route);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (error) {
        resultShell.innerHTML = [
          '<div class="result-card">',
          '<div class="pill status-failed u-mb12">Failed</div>',
          '<h2>Could not calculate a route</h2>',
          '<p class="muted u-m0">' + escapeHtml(error instanceof Error ? error.message : String(error)) + '</p>',
          '</div>'
        ].join('');
        document.body.classList.add("has-result");
      }
    }

    routeButton.addEventListener("click", runRouting);
    [channelInput, taskTypeInput, costTargetInput].forEach((input) => {
      input.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        runRouting();
      });
    });

    const params = new URLSearchParams(window.location.search);
    if (params.get("channel")) channelInput.value = params.get("channel");
    if (params.get("taskType")) taskTypeInput.value = params.get("taskType");
    if (params.get("costTarget")) costTargetInput.value = params.get("costTarget");
  </script>
</body>
</html>`;
}



export function renderApiChannelAdapterPage(layoutDoc, d) {
  const topbar = `<div class="topbar">
      <a class="button secondary" href="${d.escapeHtml(d.toolsRoute)}">&larr; Back to Tools</a>
      <span class="title">${d.escapeHtml(d.apiAccessLabel)}</span>
    </div>`;
  const main = `<main class="hero">
      <section class="route-card">
        <h1>${d.escapeHtml(d.apiAdapterLabel)}</h1>
        <p class="lede u-mb12">Issue <strong>#${d.apiAdapterIssueId}</strong> — reference path for <code>dashboard/lib/api-channel-adapter.mjs</code>. Same policy, audit trail, and telemetry hooks that WhatsApp, iMessage, and Discord will reuse. Optional message and approval simulate higher-risk intents.</p>
        <div class="route-form">
          <div class="route-grid">
            <div class="field">
              <label for="channel700">Channel</label>
              <select id="channel700" data-channel>
                ${[
                  ["dashboard", "Dashboard"],
                  ["whatsapp", "WhatsApp"],
                  ["imessage", "iMessage"],
                  ["api", "API"],
                  ["discord", "Discord"],
                  ["internal-ops", "Internal ops"]
                ].map(([value, label]) => `<option value="${d.escapeHtml(value)}">${d.escapeHtml(label)}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label for="taskType700">Task type</label>
              <select id="taskType700" data-task-type>
                ${[
                  ["chat", "Chat / reply"],
                  ["summary", "Summary / extraction"],
                  ["research", "Research / synthesis"],
                  ["review", "Review / safety"],
                  ["utility", "Deterministic utility"],
                  ["general", "General"]
                ].map(([value, label]) => `<option value="${d.escapeHtml(value)}">${d.escapeHtml(label)}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label for="costTarget700">Cost target</label>
              <select id="costTarget700" data-cost-target>
                ${[
                  ["low", "Low"],
                  ["medium", "Medium"],
                  ["high", "High"],
                  ["xhigh", "Extra high"]
                ].map(([value, label]) => `<option value="${d.escapeHtml(value)}">${d.escapeHtml(label)}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="field">
            <label for="message700">Message (optional)</label>
            <textarea id="message700" data-message rows="2" placeholder="Optional text for routing context"></textarea>
          </div>
          <div class="field briefing-sink-field">
            <label>
              <input type="checkbox" id="approved700" data-approved />
              Mark request as <strong>approved</strong> (for policy paths that require explicit approval)
            </label>
          </div>
          <div class="route-actions">
            <button type="button" class="good" data-adapter-submit>Run adapter</button>
          </div>
        </div>
      </section>
      <section class="result-shell" id="resultShell700">
        <div class="result-card">
          <p class="muted u-m0">Set inputs and press <strong>Run adapter</strong> to see lifecycle JSON and routing output.</p>
        </div>
      </section>
      <div class="footer">Preview only: does not send a chat message on WhatsApp, iMessage, or Discord.</div>
    </main>`;
  const adapterFlow = d.buildLayoutFlowHtml(layoutDoc, d.miniappPageKey("api-channel-adapter"), { topbar, main }, d.escapeAttr);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${d.escapeHtml(d.apiAdapterLabel)} - agent.meimei</title>
  <link rel="stylesheet" href="${d.escapeHtml(d.designSystemCssPath)}" />
</head>
<body data-theme="green">
  <div class="shell">
    ${adapterFlow}
  </div>
  <script>
    const channelInput = document.querySelector("[data-channel]");
    const taskTypeInput = document.querySelector("[data-task-type]");
    const costTargetInput = document.querySelector("[data-cost-target]");
    const messageInput = document.querySelector("[data-message]");
    const approvedInput = document.querySelector("[data-approved]");
    const runButton = document.querySelector("[data-adapter-submit]");
    const resultShell = document.getElementById("resultShell700");

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function prettyAgent(value) {
      const text = String(value || "");
      if (!text) return "Unknown";
      if (text === "main") return "Writer / main";
      if (text === "drafter") return "Drafter";
      if (text === "judge") return "Judge";
      return text;
    }

    function prettyChannel(value) {
      const text = String(value || "").replace(/[-_]/g, " ");
      return text.charAt(0).toUpperCase() + text.slice(1);
    }

    function renderAdapterResult(data) {
      const adapterJson = JSON.stringify(data.adapter || {}, null, 2);
      const route = data.route;
      let routeHtml = "";
      if (route && data.ok) {
        const agent = prettyAgent(route.agent);
        const fallbackAgent = prettyAgent(route.fallbackAgent);
        const statusClass = route.agent === "judge" ? "status-ok" : route.agent === "drafter" ? "status-limited" : "status-ok";
        routeHtml = [
          '<h3 class="u-mt12">Routing recommendation</h3>',
          '<div class="pill ' + statusClass + ' u-mb12">Route ready</div>',
          '<p class="muted">' + escapeHtml(route.reason || "") + '</p>',
          '<div class="grid">',
          '<section class="panel"><h3>Recommended</h3><div class="value value-lg">' + escapeHtml(agent) + '</div></section>',
          '<section class="panel"><h3>Fallback</h3><div class="value value-lg">' + escapeHtml(fallbackAgent) + '</div></section>',
          '<section class="panel"><h3>Tier</h3><div class="value value-lg">' + escapeHtml(route.tier || "") + '</div></section>',
          '</div>'
        ].join("");
      }
      resultShell.innerHTML = [
        '<div class="result-card">',
        '<h3>Adapter response</h3>',
        '<p class="muted u-mt0">Lifecycle stages and channel state from <code>routeViaApiAdapter</code>.</p>',
        '<pre class="terminal-shell u-mt12 u-prewrap">' + escapeHtml(adapterJson) + '</pre>',
        routeHtml,
        '</div>'
      ].join("");
      document.body.classList.add("has-result");
    }

    function renderError(message) {
      resultShell.innerHTML = [
        '<div class="result-card">',
        '<div class="pill status-failed u-mb12">Failed</div>',
        '<h2>Adapter run failed</h2>',
        '<p class="muted u-m0">' + escapeHtml(message) + '</p>',
        '</div>'
      ].join("");
      document.body.classList.add("has-result");
    }

    async function runAdapter() {
      resultShell.innerHTML = '<div class="result-card"><div class="pill">Working</div><p class="muted u-mt12">Running reference adapter.</p></div>';
      document.body.classList.add("has-result");
      window.scrollTo({ top: 0, behavior: "smooth" });
      try {
        const response = await fetch("${d.apiAdapterApiRoute}", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            channel: String(channelInput.value || "").trim(),
            taskType: String(taskTypeInput.value || "").trim(),
            costTarget: String(costTargetInput.value || "").trim(),
            message: String(messageInput.value || "").trim(),
            actionIntent: "execute",
            approved: approvedInput.checked === true
          })
        });
        const data = await response.json();
        if (!response.ok || !data.ok) {
          const adapterJson = data.adapter ? JSON.stringify(data.adapter, null, 2) : "";
          const errMsg = data.error || "Policy blocked or request failed.";
          if (adapterJson) {
            resultShell.innerHTML = [
              '<div class="result-card">',
              '<div class="pill status-failed u-mb12">Blocked or failed</div>',
              '<p class="muted u-mt0">' + escapeHtml(errMsg) + '</p>',
              '<h3 class="u-mt12">Adapter response</h3>',
              '<pre class="terminal-shell u-mt12 u-prewrap">' + escapeHtml(adapterJson) + '</pre>',
              '</div>'
            ].join("");
            document.body.classList.add("has-result");
            return;
          }
          throw new Error(errMsg);
        }
        renderAdapterResult(data);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (error) {
        renderError(error instanceof Error ? error.message : String(error));
      }
    }

    runButton.addEventListener("click", runAdapter);
  </script>
</body>
</html>`;
}



export function renderAiSdrAnalyticsPage(layoutDoc, d) {
  const issue651 = d.aiSdrAnalyticsIssueId ?? 651;
  const topbar = `<div class="topbar">
      <a class="button secondary" href="${d.escapeHtml(d.appsRoute)}">&larr; Back to Apps</a>
      <span class="title">${d.escapeHtml(d.aiSdrAnalyticsLabel)}</span>
    </div>`;
  const main = `<main class="hero">
      <section class="route-card">
        <h1>${d.escapeHtml(d.aiSdrAnalyticsLabel)}</h1>
        <p class="lede u-mb12">Issue <strong>#${issue651}</strong> — Outbound + workflow funnel from local logs (<a href="https://github.com/moldovancsaba/mvp-factory-control/issues/651" target="_blank" rel="noopener noreferrer">#651</a>).</p>
        <p class="muted u-mb12">Feeds: SDR events <code>data/sdr-outbound.jsonl</code> (#654) and workflow queue <code>data/lead-enrichment-workflow.v1.json</code> (#650). Both gitignored.</p>
        <p class="muted u-mb12">Apps: <a href="${d.escapeHtml(d.leadOutreachRoute)}">Lead outreach (#653)</a> · <a href="${d.escapeHtml(d.leadEnrichmentRoute)}">Lead Enrichment (#649)</a></p>
        <div class="route-actions u-mb12">
          <button type="button" class="good" id="btn651Refresh">Refresh metrics</button>
        </div>
        <div id="metrics651" class="result-card"><p class="muted u-m0">Loading…</p></div>
      </section>
    </main>`;
  const layout = d.buildLayoutFlowHtml(layoutDoc, d.miniappPageKey("ai-sdr-analytics"), { topbar, main }, d.escapeAttr);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${d.escapeHtml(d.aiSdrAnalyticsLabel)} - agent.meimei</title>
  <link rel="stylesheet" href="${d.escapeHtml(d.designSystemCssPath)}" />
</head>
<body data-theme="green">
  <div class="shell">${layout}</div>
  <script>
    const api651 = "${d.escapeHtml(d.aiSdrAnalyticsApiRoute)}";
    const el = document.getElementById("metrics651");

    function esc(s) {
      return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
    }

    async function loadMetrics() {
      if (!el) return;
      el.innerHTML = "<p class=\\"muted\\">Loading…</p>";
      try {
        const r = await fetch(api651, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "metrics" }) });
        const d = await r.json();
        if (!r.ok || !d.ok) throw new Error(d.error || "metrics failed");
        const s = d.sdr || {};
        const w = d.workflow || {};
        const byCamp = s.byCampaign || {};
        const campRows = Object.keys(byCamp).map(function (k) {
          return "<tr><td>" + esc(k) + "</td><td>" + esc(String(byCamp[k])) + "</td></tr>";
        }).join("");
        const byType = s.byType || {};
        const typeRows = Object.keys(byType).sort().map(function (k) {
          return "<tr><td>" + esc(k) + "</td><td>" + esc(String(byType[k])) + "</td></tr>";
        }).join("");
        const series = s.series14d || [];
        const maxC = Math.max(1, series.reduce(function (m, x) { return Math.max(m, x.count || 0); }, 0));
        const bars = series.map(function (x) {
          const h = Math.round((x.count / maxC) * 100);
          return "<div class=\\"bar651-wrap\\" title=\\"" + esc(x.date + ": " + x.count) + "\\"><div class=\\"bar651\\" style=\\"height:" + h + "%\\"></div><span class=\\"bar651-lbl\\">" + esc((x.date || "").slice(5)) + "</span></div>";
        }).join("");
        const rs = d.recentSdr || [];
        const recentRows = rs.map(function (e) {
          return "<tr><td class=\\"muted\\">" + esc((e.t || "").slice(0, 19)) + "</td><td>" + esc(e.type || "") + "</td><td>" + esc(e.toEmail || "") + "</td><td>" + esc(String(e.note || "").slice(0, 60)) + "</td></tr>";
        }).join("");
        const rw = d.recentWorkflow || [];
        const wfRows = rw.map(function (x) {
          return "<tr><td>" + esc(x.status) + "</td><td>" + esc(x.source) + "</td><td>" + esc(x.label || "—") + "</td><td class=\\"muted\\">" + esc(x.id || "") + "</td></tr>";
        }).join("");
        const ws = w.byStatus || {};
        const wfStat = Object.keys(ws).map(function (k) { return "<strong>" + esc(k) + "</strong>: " + esc(String(ws[k])); }).join(" · ") || "—";
        el.innerHTML = [
          "<div class=\\"stat-grid651\\">",
          "<div class=\\"stat651\\"><span class=\\"stat651-n\\">" + esc(String(s.sendAttempt ?? 0)) + "</span><span class=\\"stat651-l\\">Send attempts</span></div>",
          "<div class=\\"stat651\\"><span class=\\"stat651-n\\">" + esc(String(s.mailDraftOpened ?? 0)) + "</span><span class=\\"stat651-l\\">Mail drafts opened</span></div>",
          "<div class=\\"stat651\\"><span class=\\"stat651-n\\">" + esc(String(s.trackNote ?? 0)) + "</span><span class=\\"stat651-l\\">Track notes</span></div>",
          "<div class=\\"stat651\\"><span class=\\"stat651-n\\">" + esc(String(w.totalItems ?? 0)) + "</span><span class=\\"stat651-l\\">Workflow items</span></div>",
          "</div>",
          "<p class=\\"muted u-mt12\\">Workflow by status: " + wfStat + "</p>",
          "<h3 class=\\"u-mt12\\" style=\\"font-size:1rem;\\">SDR events / day (14d)</h3>",
          "<div class=\\"bars651\\">" + (bars || "<span class=\\"muted\\">No events in window.</span>") + "</div>",
          "<div class=\\"route-grid u-mt12\\" style=\\"display:grid;grid-template-columns:1fr 1fr;gap:1rem;\\">",
          "<div><h4 class=\\"muted\\">By event type</h4><table class=\\"wf-table\\" style=\\"width:100%;font-size:12px;\\"><tbody>" + (typeRows || "<tr><td class=\\"muted\\">—</td></tr>") + "</tbody></table></div>",
          "<div><h4 class=\\"muted\\">By campaign</h4><table class=\\"wf-table\\" style=\\"width:100%;font-size:12px;\\"><tbody>" + (campRows || "<tr><td class=\\"muted\\">—</td></tr>") + "</tbody></table></div>",
          "</div>",
          "<h3 class=\\"u-mt12\\" style=\\"font-size:1rem;\\">Recent SDR events</h3>",
          "<table class=\\"wf-table\\" style=\\"width:100%;font-size:12px;\\"><thead><tr><th>Time</th><th>Type</th><th>To</th><th>Note</th></tr></thead><tbody>" + (recentRows || "<tr><td colspan=4 class=\\"muted\\">None</td></tr>") + "</tbody></table>",
          "<h3 class=\\"u-mt12\\" style=\\"font-size:1rem;\\">Recent workflow rows</h3>",
          "<table class=\\"wf-table\\" style=\\"width:100%;font-size:12px;\\"><thead><tr><th>Status</th><th>Source</th><th>Label</th><th>Id</th></tr></thead><tbody>" + (wfRows || "<tr><td colspan=4 class=\\"muted\\">None</td></tr>") + "</tbody></table>"
        ].join("");
      } catch (e) {
        el.innerHTML = "<p class=\\"muted\\">" + esc(e.message || String(e)) + "</p>";
      }
    }

    document.getElementById("btn651Refresh")?.addEventListener("click", loadMetrics);
    loadMetrics();
  </script>
</body>
</html>`;
}



export function renderSupabaseConnectorPage(layoutDoc, d) {
  const issue631 = d.supabaseConnectorIssueId ?? 631;
  const topbar = `<div class="topbar">
      <a class="button secondary" href="${d.escapeHtml(d.appsRoute)}">&larr; Back to Tools</a>
      <span class="title">${d.escapeHtml(d.supabaseConnectorLabel)}</span>
    </div>`;
  const main = `<main class="hero">
      <section class="route-card">
        <h1>${d.escapeHtml(d.supabaseConnectorLabel)}</h1>
        <p class="lede u-mb12">Issue <strong>#${issue631}</strong> — PostgREST bridge for <a href="${d.escapeHtml(d.leadEnrichmentRoute)}">Lead Enrichment</a> (<code>source: supabase</code>). <a href="https://github.com/moldovancsaba/mvp-factory-control/issues/631" target="_blank" rel="noopener noreferrer">#631</a></p>
        <p class="muted u-mb12">Environment: <code>MEIMEI_SUPABASE_URL</code> and <code>MEIMEI_SUPABASE_SERVICE_ROLE</code> (or <code>MEIMEI_SUPABASE_ANON_KEY</code>). Never commit keys.</p>
        <div id="sbStatus631" class="result-card u-mb12"><p class="muted u-m0">Checking…</p></div>
        <h2 style="font-size:1.05rem;">Health</h2>
        <div class="route-form u-mb12">
          <div class="field">
            <label for="sbTableHealth">Table (optional)</label>
            <input type="text" id="sbTableHealth" placeholder="leads" />
          </div>
          <div class="route-actions">
            <button type="button" class="button secondary" id="btn631Health">Ping REST</button>
          </div>
        </div>
        <h2 style="font-size:1.05rem;">Preview rows</h2>
        <div class="route-form u-mb12">
          <div class="field">
            <label for="sbTable">Table</label>
            <input type="text" id="sbTable" placeholder="leads" />
          </div>
          <div class="field">
            <label for="sbIdCol">ID column</label>
            <input type="text" id="sbIdCol" placeholder="id" value="id" />
          </div>
          <div class="field">
            <label for="sbIdVal">ID value</label>
            <input type="text" id="sbIdVal" placeholder="uuid" />
          </div>
          <div class="route-actions">
            <button type="button" class="good" id="btn631Preview">Fetch</button>
          </div>
        </div>
        <pre id="sbPreview631" class="result-card" style="white-space:pre-wrap;font-size:12px;max-height:320px;overflow:auto;">(no fetch yet)</pre>
      </section>
    </main>`;
  const layout = d.buildLayoutFlowHtml(layoutDoc, d.miniappPageKey("supabase-connector"), { topbar, main }, d.escapeAttr);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${d.escapeHtml(d.supabaseConnectorLabel)} - agent.meimei</title>
  <link rel="stylesheet" href="${d.escapeHtml(d.designSystemCssPath)}" />
</head>
<body data-theme="green">
  <div class="shell">${layout}</div>
  <script>
    const api631 = "${d.escapeHtml(d.supabaseConnectorApiRoute)}";
    const st = document.getElementById("sbStatus631");

    function esc(s) {
      return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
    }

    async function post631(body) {
      const r = await fetch(api631, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json().catch(function () { return { ok: false, error: "Invalid JSON response" }; });
      return { httpOk: r.ok, d: d };
    }

    async function loadOverview() {
      if (!st) return;
      try {
        const { httpOk, d } = await post631({ action: "overview" });
        if (!httpOk || !d.ok) throw new Error(d.error || "overview failed");
        st.innerHTML = "<p><strong>Configured:</strong> " + esc(String(d.configured)) + "</p><p class=\\"muted u-m0\\">" + esc(d.summary || "") + "</p>";
      } catch (e) {
        st.innerHTML = "<p class=\\"muted\\">" + esc(e.message || String(e)) + "</p>";
      }
    }

    document.getElementById("btn631Health")?.addEventListener("click", async function () {
      const table = document.getElementById("sbTableHealth")?.value.trim() || "";
      const pre = document.getElementById("sbPreview631");
      try {
        const { httpOk, d } = await post631({ action: "health", testTable: table });
        if (pre) pre.textContent = JSON.stringify(d, null, 2);
      } catch (e) {
        if (pre) pre.textContent = e.message || String(e);
      }
    });

    document.getElementById("btn631Preview")?.addEventListener("click", async function () {
      const table = document.getElementById("sbTable")?.value.trim();
      const idColumn = document.getElementById("sbIdCol")?.value.trim() || "id";
      const id = document.getElementById("sbIdVal")?.value.trim();
      const pre = document.getElementById("sbPreview631");
      try {
        const { httpOk, d } = await post631({ action: "preview_fetch", table, idColumn, id, limit: 5 });
        if (pre) pre.textContent = JSON.stringify(d, null, 2);
      } catch (e) {
        if (pre) pre.textContent = e.message || String(e);
      }
    });

    loadOverview();
  </script>
</body>
</html>`;
}



export function renderEnvironmentVariablesPage(layoutDoc, d) {
  const issue726 = d.environmentVariablesIssueId ?? 726;
  const envAllowlistJson = JSON.stringify([...d.MEIMEI_ENV_SYSTEM_ALLOWLIST]);
  const topbar = `<div class="topbar">
      <a class="button secondary" href="${d.escapeHtml(d.toolsRoute)}">&larr; Back to Tools</a>
      <span class="title">${d.escapeHtml(d.environmentVariablesLabel)}</span>
    </div>`;
  const main = `<main class="hero">
      <section class="route-card">
        <h1>${d.escapeHtml(d.environmentVariablesLabel)}</h1>
        <p class="lede u-mb12">Issue <strong>#${issue726}</strong> — Vercel-style CRUD for API keys, tokens, URLs, and local OpenClaw / MeiMei settings.</p>
        <p class="muted u-mb12">Storage: <code>data/meimei-environment.v1.json</code> (600 perms, gitignored). Entries with environment checkboxes are applied to <code>process.env</code> when <code>MEIMEI_ENV_PROFILE</code> matches (default <code>development</code>). Empty checkboxes = all three. Optional strict saves: <code>MEIMEI_ENV_STRICT_KEY_NAMES=1</code> (see <code>docs/architecture/meimei-env-ui-contract.v1.md</code>).</p>
        <p class="muted u-mb12">Active profile: <strong id="activeProf726">—</strong> · Suggestions: <code>config/meimei-env-catalog.v1.json</code></p>
        <div id="formCard726" class="result-card u-mb12" style="display:none;">
          <h2 id="formTitle726" style="font-size:1.1rem;">Add</h2>
          <div class="field">
            <label for="envKey726">Name</label>
            <input type="text" id="envKey726" placeholder="OPENAI_API_KEY" autocomplete="off" style="max-width:28rem;width:100%;box-sizing:border-box;" />
            <p id="envKey726warn" class="env726-naming-warn" role="status"></p>
          </div>
          <div class="field">
            <label for="envVal726">Value</label>
            <textarea id="envVal726" rows="4" placeholder="Secret or URL" style="width:100%;max-width:40rem;box-sizing:border-box;font-family:ui-monospace,monospace;font-size:12px;"></textarea>
          </div>
          <p class="muted u-mb8" style="font-size:12px;">Environments</p>
          <div class="u-mb12" style="display:flex;flex-wrap:wrap;gap:12px;">
            <label class="muted"><input type="checkbox" id="envTprod726" checked /> Production</label>
            <label class="muted"><input type="checkbox" id="envTprev726" checked /> Preview</label>
            <label class="muted"><input type="checkbox" id="envTdev726" checked /> Development</label>
          </div>
          <input type="hidden" id="envId726" value="" />
          <div class="route-actions">
            <button type="button" class="good" id="btnSave726">Save</button>
            <button type="button" class="button secondary" id="btnCancel726">Cancel</button>
          </div>
        </div>
        <div class="route-actions u-mb12" style="flex-wrap:wrap;align-items:center;">
          <button type="button" class="good" id="btnAdd726">Add variable</button>
          <span class="muted" style="font-size:13px;">Export</span>
          <select id="exportTarget726" class="button secondary" style="padding:8px 12px;">
            <option value="">All environments</option>
            <option value="production">Production only</option>
            <option value="preview">Preview only</option>
            <option value="development">Development only</option>
          </select>
          <button type="button" class="button secondary" id="btnExport726">Copy .env</button>
        </div>
        <div id="catalog726" class="result-card u-mb12" style="font-size:12px;"></div>
        <div id="table726" class="result-card"><p class="muted u-m0">Loading…</p></div>
        <textarea id="exportOut726" readonly class="u-mt12" style="display:none;width:100%;min-height:100px;box-sizing:border-box;font-family:ui-monospace,monospace;font-size:11px;border-radius:12px;border:1px solid var(--line);background:rgba(4,10,20,0.72);color:var(--text);padding:12px;"></textarea>
      </section>
    </main>`;
  const layout = d.buildLayoutFlowHtml(
    layoutDoc,
    d.miniappPageKey("environment-variables"),
    { topbar, main },
    d.escapeAttr
  );
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${d.escapeHtml(d.environmentVariablesLabel)} - agent.meimei</title>
  <link rel="stylesheet" href="${d.escapeHtml(d.designSystemCssPath)}" />
  <style>
    .env726-naming-warn { margin-top: 6px; font-size: 12px; color: var(--warn); display: none; max-width: 40rem; line-height: 1.35; }
    .env726-key-flag { color: var(--warn); font-size: 11px; margin-left: 6px; font-weight: 600; }
  </style>
</head>
<body data-theme="green">
  <div class="shell">${layout}</div>
  <script>
    var api726 = "${d.escapeHtml(d.environmentVariablesApiRoute)}";
    var env726Rec = /^[A-Z0-9]+_[A-Z0-9_]+$/;
    var env726Allow = ${envAllowlistJson};

    function esc(s) {
      return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
    }

    async function post726(body) {
      var r = await fetch(api726, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      var d = await r.json().catch(function () { return { ok: false, error: "Bad JSON" }; });
      return { httpOk: r.ok, d: d };
    }

    function targetsFromForm() {
      var t = [];
      if (document.getElementById("envTprod726").checked) t.push("production");
      if (document.getElementById("envTprev726").checked) t.push("preview");
      if (document.getElementById("envTdev726").checked) t.push("development");
      return t;
    }

    function env726KeyNeedsWarn(k) {
      k = String(k || "").trim();
      if (!k) return false;
      if (env726Allow.indexOf(k) >= 0) return false;
      return !env726Rec.test(k);
    }

    function env726RefreshKeyNameWarn() {
      var el = document.getElementById("envKey726warn");
      var keyInput = document.getElementById("envKey726");
      if (!el || !keyInput) return;
      var key = keyInput.value.trim();
      if (!key || !env726KeyNeedsWarn(key)) {
        el.style.display = "none";
        el.textContent = "";
        return;
      }
      el.style.display = "block";
      el.textContent =
        "Recommendation: prefix with your app name (e.g. MYAPP_SECRET_KEY). Underscore-separated uppercase names match the platform convention.";
    }

    function setTargetsOnForm(targets) {
      var set = {};
      (targets || []).forEach(function (x) { set[x] = true; });
      document.getElementById("envTprod726").checked = !!set.production;
      document.getElementById("envTprev726").checked = !!set.preview;
      document.getElementById("envTdev726").checked = !!set.development;
      if (!targets || targets.length === 0) {
        document.getElementById("envTprod726").checked = true;
        document.getElementById("envTprev726").checked = true;
        document.getElementById("envTdev726").checked = true;
      }
    }

    function showForm(edit) {
      document.getElementById("formCard726").style.display = "block";
      document.getElementById("formTitle726").textContent = edit ? "Edit variable" : "Add variable";
      document.getElementById("envKey726").readOnly = !!edit;
      if (!edit) {
        document.getElementById("envId726").value = "";
        document.getElementById("envKey726").value = "";
        document.getElementById("envVal726").value = "";
        setTargetsOnForm(["production","preview","development"]);
      }
      env726RefreshKeyNameWarn();
    }

    function hideForm() {
      document.getElementById("formCard726").style.display = "none";
    }

    async function loadCatalog() {
      var el = document.getElementById("catalog726");
      var res = await post726({ action: "catalog" });
      if (!res.httpOk || !res.d.ok || !res.d.catalog || !res.d.catalog.groups) {
        el.innerHTML = "<p class=\\"muted\\">No catalog.</p>";
        return;
      }
      var parts = ["<p class=\\"muted u-m0\\"><strong>Suggested keys</strong> (click to start add)</p>"];
      res.d.catalog.groups.forEach(function (g) {
        parts.push("<p class=\\"muted u-mt8\\"><strong>" + esc(g.label || g.id) + "</strong></p><div>");
        (g.keys || []).forEach(function (k) {
          parts.push("<button type=\\"button\\" class=\\"env726-chip\\" data-suggest-key=\\"" + esc(k.key) + "\\">" + esc(k.key) + "</button>");
        });
        parts.push("</div>");
      });
      el.innerHTML = parts.join("");
      el.querySelectorAll("[data-suggest-key]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          showForm(false);
          document.getElementById("envKey726").value = btn.getAttribute("data-suggest-key") || "";
          env726RefreshKeyNameWarn();
          document.getElementById("envVal726").focus();
        });
      });
    }

    async function loadTable() {
      var el = document.getElementById("table726");
      var res = await post726({ action: "list" });
      if (!res.httpOk || !res.d.ok) {
        el.innerHTML = "<p class=\\"muted\\">" + esc(res.d.error || "Failed to load") + "</p>";
        return;
      }
      document.getElementById("activeProf726").textContent = res.d.activeProfile || "development";
      var rows = (res.d.entries || []).map(function (e) {
        var pills = ["production","preview","development"].map(function (t) {
          var on = (e.targets || []).indexOf(t) >= 0;
          return "<span class=\\"env726-pill" + (on ? "" : " off") + "\\">" + esc(t) + "</span>";
        }).join("");
        var apply = e.appliesNow ? "" : " <span class=\\"muted\\">(not applied to runtime)</span>";
        var flag = env726KeyNeedsWarn(e.key)
          ? "<span class=\\"env726-key-flag\\" title=\\"Does not match APP_IDENTIFIER_VARNAME; see contract doc\\">!</span>"
          : "";
        return "<tr><td><code>" + esc(e.key) + "</code>" + flag + "</td><td><code>" + esc(e.maskedValue) + "</code>" + apply + "</td><td>" + pills + "</td><td class=\\"muted\\">" + esc((e.updatedAt || "").slice(0, 19)) + "</td><td class=\\"env726-actions\\"><button type=\\"button\\" class=\\"button secondary\\" data-edit=\\"" + esc(e.id) + "\\">Edit</button><button type=\\"button\\" class=\\"button secondary\\" data-del=\\"" + esc(e.id) + "\\">Delete</button></td></tr>";
      }).join("");
      el.innerHTML = "<table class=\\"env726-table\\"><thead><tr><th>Name</th><th>Value</th><th>Environments</th><th>Updated</th><th></th></tr></thead><tbody>" + (rows || "<tr><td colspan=5 class=\\"muted\\">No variables yet.</td></tr>") + "</tbody></table>";

      el.querySelectorAll("[data-edit]").forEach(function (btn) {
        btn.addEventListener("click", async function () {
          var id = btn.getAttribute("data-edit");
          var r2 = await post726({ action: "reveal", id: id });
          if (!r2.httpOk || !r2.d.ok) {
            alert(r2.d.error || "Could not load value");
            return;
          }
          showForm(true);
          document.getElementById("envId726").value = r2.d.id;
          document.getElementById("envKey726").value = r2.d.key || "";
          document.getElementById("envVal726").value = r2.d.value || "";
          var orig = res.d.entries.find(function (x) { return x.id === id; });
          setTargetsOnForm(orig ? orig.targets : null);
          env726RefreshKeyNameWarn();
        });
      });
      el.querySelectorAll("[data-del]").forEach(function (btn) {
        btn.addEventListener("click", async function () {
          if (!confirm("Delete this variable?")) return;
          var id = btn.getAttribute("data-del");
          var r2 = await post726({ action: "delete", id: id });
          if (!r2.httpOk || !r2.d.ok) {
            alert(r2.d.error || "Delete failed");
            return;
          }
          loadTable();
        });
      });
    }

    document.getElementById("envKey726").addEventListener("input", env726RefreshKeyNameWarn);
    document.getElementById("btnAdd726").addEventListener("click", function () { showForm(false); });
    document.getElementById("btnCancel726").addEventListener("click", hideForm);
    document.getElementById("btnSave726").addEventListener("click", async function () {
      var id = document.getElementById("envId726").value.trim();
      var key = document.getElementById("envKey726").value.trim();
      var value = document.getElementById("envVal726").value;
      var targets = targetsFromForm();
      if (!key) {
        alert("Name is required.");
        return;
      }
      var body = { action: "upsert", key: key, value: value, targets: targets };
      if (id) body.id = id;
      var r = await post726(body);
      if (!r.httpOk || !r.d.ok) {
        alert(r.d.error || "Save failed");
        return;
      }
      hideForm();
      loadTable();
    });

    document.getElementById("btnExport726").addEventListener("click", async function () {
      var sel = document.getElementById("exportTarget726").value;
      var r = await post726({ action: "export_dotenv", target: sel });
      var ta = document.getElementById("exportOut726");
      if (!r.httpOk || !r.d.ok) {
        alert(r.d.error || "Export failed");
        return;
      }
      ta.style.display = "block";
      ta.value = r.d.text || "";
      ta.select();
      try { document.execCommand("copy"); } catch (e) {}
    });

    loadCatalog();
    loadTable();
  </script>
</body>
</html>`;
}


