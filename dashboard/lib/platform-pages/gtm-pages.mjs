/**
 * Platform UI — Lead enrichment & lead outreach (main + settings GET shells).
 * @see docs/architecture/meimei-kernel-completion-plan.v1.md Phase K1b
 * @version 1.0.0
 * @aligned package agent-meimei 0.8.14
 */

export function renderLeadEnrichmentPage(layoutDoc, d) {
  const topbar = `<div class="topbar">
      <a class="button secondary" href="${d.escapeHtml(d.appsRoute)}">&larr; Back to Apps</a>
      <span class="title">${d.escapeHtml(d.leadEnrichmentLabel)}</span>
    </div>`;
  const main = `<main class="hero">
      <section class="route-card">
        <h1>${d.escapeHtml(d.leadEnrichmentLabel)}</h1>
        <p class="lede u-mb12">Issue <strong>#${d.leadEnrichmentIssueId}</strong> — Enrich contacts and companies. <strong>CRM</strong> (<a href="https://github.com/moldovancsaba/mvp-factory-control/issues/632" target="_blank" rel="noopener noreferrer">#632</a>) and <strong>Supabase</strong> (<a href="https://github.com/moldovancsaba/mvp-factory-control/issues/631" target="_blank" rel="noopener noreferrer">#631</a>) load connector-shaped seeds into the same pipeline.</p>
        <div class="route-form">
          <div class="route-grid">
            <div class="field">
              <label for="source649">Source Type</label>
              <select id="source649" data-source>
                ${[
                  ["linkedin", "LinkedIn Profile"],
                  ["email", "Email Address"],
                  ["company", "Company Domain"],
                  ["phone", "Phone Number"],
                  ["crm", "CRM / connector record (#632)"],
                  ["supabase", "Supabase row (#631)"]
                ].map(([value, label]) => `<option value="${d.escapeHtml(value)}">${d.escapeHtml(label)}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label for="enrichmentLevel649">Enrichment Level</label>
              <select id="enrichmentLevel649" data-level>
                ${[
                  ["basic", "Basic — Name, title, company"],
                  ["standard", "Standard — + Social, location"],
                  ["full", "Full — + Funding, tech stack"]
                ].map(([value, label]) => `<option value="${d.escapeHtml(value)}">${d.escapeHtml(label)}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label for="priority649">Priority</label>
              <select id="priority649" data-priority>
                ${[
                  ["low", "Low"],
                  ["medium", "Medium"],
                  ["high", "High"]
                ].map(([value, label]) => `<option value="${d.escapeHtml(value)}">${d.escapeHtml(label)}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="field">
            <label for="input649">Input <span id="inputLabel">(Profile URL, Email, Domain, or Phone)</span></label>
            <input type="text" id="input649" data-input placeholder="https://linkedin.com/in/example or john@company.com" />
            <textarea id="crmJson649" rows="8" style="display:none;width:100%;box-sizing:border-box;font-family:ui-monospace,monospace;font-size:12px;border-radius:14px;border:1px solid var(--line);background:rgba(4,10,20,0.72);color:var(--text);padding:12px 14px;" placeholder='{"crmProvider":"hubspot","externalId":"...","email":"...","notes":"...","customFields":{}}'></textarea>
            <textarea id="supabaseJson649" rows="8" style="display:none;width:100%;box-sizing:border-box;font-family:ui-monospace,monospace;font-size:12px;border-radius:14px;border:1px solid var(--line);background:rgba(4,10,20,0.72);color:var(--text);padding:12px 14px;" placeholder='{"table":"leads","id":"uuid","idColumn":"id"} or {"table":"leads","match":{"email":"a@b.com"}}'></textarea>
          </div>
          <div class="route-actions">
            <button type="button" class="good" data-submit>Enrich Lead</button>
          </div>
        </div>
        <h2 class="u-mt12" style="font-size:1.1rem;">Workflow (#650)</h2>
        <p class="muted u-mb12">Queue leads locally (<code>data/lead-enrichment-workflow.v1.json</code>, gitignored). <strong>Run</strong> uses the same enrich pipeline as above; <strong>Outreach</strong> opens Lead outreach with the profile pre-filled.</p>
        <div class="field u-mb12">
          <label for="wfLabel649">Workflow label (optional)</label>
          <input type="text" id="wfLabel649" placeholder="e.g. Acme — webinar" style="width:100%;max-width:28rem;box-sizing:border-box;" />
        </div>
        <div class="route-actions u-mb12">
          <button type="button" class="button secondary" id="wfEnqueue649">Enqueue current form</button>
          <button type="button" class="button secondary" id="wfRefresh649">Refresh queue</button>
        </div>
        <div id="wfTable649" class="result-card u-mb12"><p class="muted u-m0">Loading queue…</p></div>
      </section>
      <section class="result-shell" id="resultShell649">
        <div class="result-card">
          <p class="muted u-m0">Enter a source and input, then press <strong>Enrich Lead</strong> to get enriched data.</p>
        </div>
      </section>
      <div class="footer">After enrichment, open <a href="${d.escapeHtml(d.leadOutreachRoute)}">Lead outreach (#653)</a> for drafts; <strong>#654</strong> SDR logging; <a href="/651/AI_SDR_analytics">AI SDR analytics (#651)</a>. <strong>#650</strong> workflow queue is above.</div>
    </main>`;
  const layout = d.buildLayoutFlowHtml(layoutDoc, d.miniappPageKey("lead-enrichment"), { topbar, main }, d.escapeAttr);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${d.escapeHtml(d.leadEnrichmentLabel)} - agent.meimei</title>
  <link rel="stylesheet" href="${d.escapeHtml(d.designSystemCssPath)}" />
</head>
<body data-theme="green">
  <div class="shell">
    ${layout}
  </div>
  <script>
    const leadApi = "${d.escapeHtml(d.leadEnrichmentApiRoute)}";
    const leadOutreachUrl = "${d.escapeHtml(d.leadOutreachRoute)}";
    const sourceInput = document.getElementById("source649");
    const levelInput = document.getElementById("enrichmentLevel649");
    const priorityInput = document.getElementById("priority649");
    const dataInput = document.getElementById("input649");
    const crmJson = document.getElementById("crmJson649");
    const supabaseJson = document.getElementById("supabaseJson649");
    const submitBtn = document.querySelector("[data-submit]");
    const resultShell = document.getElementById("resultShell649");
    const inputLabel = document.getElementById("inputLabel");
    const wfTable649 = document.getElementById("wfTable649");
    let wfItemsCache = [];

    function syncSourceInputs() {
      const source = sourceInput.value;
      const isCrm = source === "crm";
      const isSupabase = source === "supabase";
      if (dataInput) dataInput.style.display = (isCrm || isSupabase) ? "none" : "block";
      if (crmJson) crmJson.style.display = isCrm ? "block" : "none";
      if (supabaseJson) supabaseJson.style.display = isSupabase ? "block" : "none";
      const placeholders = {
        linkedin: "https://linkedin.com/in/example",
        email: "john@company.com",
        company: "company.com",
        phone: "+1 555 123 4567"
      };
      const labels = {
        linkedin: "Profile URL",
        email: "Email Address",
        company: "Company Domain",
        phone: "Phone Number",
        crm: "CRM JSON (provider, externalId, email, notes, customFields)",
        supabase: "Supabase JSON (table + id, or table + match)"
      };
      if (!isCrm && !isSupabase) {
        dataInput.placeholder = placeholders[source] || "Enter data";
      }
      inputLabel.textContent = "(" + (labels[source] || "Input") + ")";
    }

    sourceInput?.addEventListener("change", syncSourceInputs);
    syncSourceInputs();

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function renderLead(data) {
      const lead = data.lead || {};
      const profile = lead.profile || {};
      const signals = lead.signals || [];
      const audit = data.audit || {};

      let signalsHtml = "";
      if (signals.length > 0) {
        signalsHtml = signals.map(s => 
          '<div class="signal-item"><span class="signal-type">' + escapeHtml(s.type) + '</span><span class="signal-detail">' + escapeHtml(s.detail) + '</span><span class="signal-confidence">' + Math.round(s.confidence * 100) + '%</span></div>'
        ).join("");
      } else {
        signalsHtml = '<p class="muted">No signals detected.</p>';
      }

      resultShell.innerHTML = [
        '<div class="result-card">',
        '<h3>Enriched Lead</h3>',
        '<div class="lead-profile">',
        '<div class="profile-header">',
        '<h4>' + escapeHtml(profile.name || "Unknown") + '</h4>',
        '<span class="priority-badge ' + escapeHtml(lead.priority || "medium") + '">' + escapeHtml(lead.priority || "medium") + '</span>',
        '</div>',
        '<p class="profile-title">' + escapeHtml(profile.title || "") + ' at ' + escapeHtml(profile.company || "") + '</p>',
        '<p class="profile-meta">' + escapeHtml(profile.location || "") + '</p>',
        '<div class="profile-links">',
        profile.linkedin ? '<a href="' + escapeHtml(profile.linkedin) + '" target="_blank">LinkedIn</a>' : '',
        profile.twitter ? '<a href="' + escapeHtml(profile.twitter) + '" target="_blank">Twitter</a>' : '',
        '</div>',
        '</div>',
        '<h4 class="u-mt12">Signals</h4>',
        '<div class="signals-list">' + signalsHtml + '</div>',
        '<div class="audit-info">',
        '<p class="muted">Confidence: ' + Math.round((audit.confidence || 0) * 100) + '% | Sources: ' + (audit.enrichmentSources || []).join(", ") + '</p>',
        '</div>',
        '</div>'
      ].join("");
      document.body.classList.add("has-result");
    }

    function renderError(message) {
      resultShell.innerHTML = [
        '<div class="result-card">',
        '<div class="pill status-failed u-mb12">Failed</div>',
        '<h2>Enrichment failed</h2>',
        '<p class="muted u-m0">' + escapeHtml(message) + '</p>',
        '</div>'
      ].join("");
      document.body.classList.add("has-result");
    }

    function buildSourceDataForApi() {
      const source = sourceInput.value;
      let sourceData = {};
      if (source === "crm") {
        const raw = (crmJson && crmJson.value) ? crmJson.value.trim() : "";
        if (!raw) throw new Error("Paste a JSON object with CRM fields (crmProvider, email, externalId, …).");
        try {
          sourceData = JSON.parse(raw);
        } catch (e) {
          throw new Error("CRM source requires valid JSON: " + (e instanceof Error ? e.message : String(e)));
        }
        if (!sourceData || typeof sourceData !== "object" || Array.isArray(sourceData)) {
          throw new Error("CRM JSON must be an object.");
        }
      } else if (source === "supabase") {
        const raw = (supabaseJson && supabaseJson.value) ? supabaseJson.value.trim() : "";
        if (!raw) throw new Error("Paste JSON with table and id (or match). Configure env on the Supabase connector tool (#631).");
        try {
          sourceData = JSON.parse(raw);
        } catch (e) {
          throw new Error("Supabase source requires valid JSON: " + (e instanceof Error ? e.message : String(e)));
        }
        if (!sourceData || typeof sourceData !== "object" || Array.isArray(sourceData)) {
          throw new Error("Supabase JSON must be an object.");
        }
      } else if (source === "linkedin") sourceData.profileUrl = dataInput.value;
      else if (source === "email") sourceData.email = dataInput.value;
      else if (source === "company") sourceData.domain = dataInput.value;
      else if (source === "phone") sourceData.phone = dataInput.value;
      return { source, sourceData };
    }

    function buildHandoffSummary(item) {
      if (!item.result || !item.result.lead) return "";
      const lead = item.result.lead;
      const p = lead.profile || {};
      const lines = [];
      if (p.name) lines.push("Name: " + p.name);
      if (p.title) lines.push("Title: " + p.title);
      if (p.company) lines.push("Company: " + p.company);
      if (p.location) lines.push("Location: " + p.location);
      if (p.email) lines.push("Email: " + p.email);
      if (lead.signals && lead.signals.length) {
        lines.push("Signals:");
        lead.signals.forEach(function (s) {
          lines.push("- " + s.type + ": " + s.detail);
        });
      }
      return lines.join("\\n");
    }

    async function wfPost(payload) {
      const response = await fetch(leadApi, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Workflow request failed");
      }
      return data;
    }

    function renderWorkflowTable(data) {
      const items = data.items || [];
      wfItemsCache = items;
      if (items.length === 0) {
        wfTable649.innerHTML = "<p class=\\"muted u-m0\\">Queue is empty. Use <strong>Enqueue current form</strong> or enrich a lead first.</p>";
        return;
      }
      const header = "<table class=\\"wf-table\\" style=\\"width:100%;border-collapse:collapse;font-size:13px;\\"><thead><tr><th align=\\"left\\">Status</th><th align=\\"left\\">Source</th><th align=\\"left\\">Label</th><th align=\\"left\\">Updated</th><th align=\\"left\\">Actions</th></tr></thead><tbody>";
      const rows = items.map(function (it) {
        let actions = "";
        if (it.status === "queued" || it.status === "failed") {
          actions += "<button type=\\"button\\" class=\\"button secondary\\" data-wf-action=\\"run\\" data-wf-id=\\"" + escapeHtml(it.id) + "\\">Run</button> ";
        }
        if (it.status !== "skipped") {
          actions += "<button type=\\"button\\" class=\\"button secondary\\" data-wf-action=\\"skip\\" data-wf-id=\\"" + escapeHtml(it.id) + "\\">Skip</button> ";
        }
        actions += "<button type=\\"button\\" class=\\"button secondary\\" data-wf-action=\\"remove\\" data-wf-id=\\"" + escapeHtml(it.id) + "\\">Remove</button>";
        if (it.status === "enriched") {
          actions += " <button type=\\"button\\" class=\\"good\\" data-wf-action=\\"outreach\\" data-wf-id=\\"" + escapeHtml(it.id) + "\\">Outreach</button>";
        }
        const hint = it.lastError ? "<div class=\\"muted\\" style=\\"font-size:11px;margin-top:4px;\\">" + escapeHtml(String(it.lastError).slice(0, 120)) + "</div>" : "";
        return "<tr><td>" + escapeHtml(it.status) + hint + "</td><td>" + escapeHtml(it.source) + "</td><td>" + escapeHtml(it.label || "—") + "</td><td class=\\"muted\\">" + escapeHtml((it.updatedAt || "").slice(0, 19)) + "</td><td style=\\"white-space:normal;\\">" + actions + "</td></tr>";
      }).join("");
      wfTable649.innerHTML = header + rows + "</tbody></table>";
    }

    async function refreshWorkflow() {
      if (!wfTable649) return;
      wfTable649.innerHTML = "<p class=\\"muted\\">Loading…</p>";
      try {
        const data = await wfPost({ action: "workflow_list" });
        renderWorkflowTable(data);
      } catch (e) {
        wfTable649.innerHTML = "<p class=\\"muted\\">" + escapeHtml(e instanceof Error ? e.message : String(e)) + "</p>";
      }
    }

    wfTable649?.addEventListener("click", async function (e) {
      const btn = e.target.closest("button[data-wf-action]");
      if (!btn) return;
      const act = btn.getAttribute("data-wf-action");
      const id = btn.getAttribute("data-wf-id");
      if (!id) return;
      btn.disabled = true;
      try {
        if (act === "run") {
          const data = await wfPost({ action: "workflow_run", workflowId: id });
          const er = data.enrichResult;
          if (er && er.ok) renderLead(er);
          else if (er) renderError(er.error || "Enrichment failed");
          await refreshWorkflow();
        } else if (act === "skip") {
          await wfPost({ action: "workflow_skip", workflowId: id });
          await refreshWorkflow();
        } else if (act === "remove") {
          await wfPost({ action: "workflow_remove", workflowId: id });
          await refreshWorkflow();
        } else if (act === "outreach") {
          const item = wfItemsCache.find(function (x) { return x.id === id; });
          const summary = item ? buildHandoffSummary(item) : "";
          const camp = (item && item.label) ? item.label : "Workflow";
          try {
            sessionStorage.setItem("meimei-lead-outreach-prefill", JSON.stringify({ leadSummary: summary, campaignName: camp }));
          } catch (err) {}
          window.open(leadOutreachUrl, "_blank");
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : String(err));
      } finally {
        btn.disabled = false;
      }
    });

    document.getElementById("wfRefresh649")?.addEventListener("click", refreshWorkflow);

    document.getElementById("wfEnqueue649")?.addEventListener("click", async function () {
      try {
        const { source, sourceData } = buildSourceDataForApi();
        if (source !== "crm" && source !== "supabase") {
          const v = (dataInput && dataInput.value) ? dataInput.value.trim() : "";
          if (!v) throw new Error("Fill the input field before enqueueing.");
        }
        const wfLab = document.getElementById("wfLabel649");
        await wfPost({
          action: "workflow_enqueue",
          source,
          sourceData,
          enrichmentLevel: levelInput.value,
          priority: priorityInput.value,
          label: (wfLab && wfLab.value.trim()) || ""
        });
        await refreshWorkflow();
      } catch (e) {
        alert(e instanceof Error ? e.message : String(e));
      }
    });

    async function runEnrichment() {
      resultShell.innerHTML = '<div class="result-card"><div class="pill">Working</div><p class="muted u-mt12">Enriching lead data...</p></div>';
      document.body.classList.add("has-result");
      window.scrollTo({ top: 0, behavior: "smooth" });
      try {
        const { source, sourceData } = buildSourceDataForApi();
        if (source !== "crm" && source !== "supabase") {
          const v = (dataInput && dataInput.value) ? dataInput.value.trim() : "";
          if (!v) throw new Error("Enter a value for the selected source.");
        }

        const response = await fetch(leadApi, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            source,
            sourceData,
            enrichmentLevel: levelInput.value,
            priority: priorityInput.value
          })
        });
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.error || "Enrichment failed");
        }
        renderLead(data);
      } catch (error) {
        renderError(error instanceof Error ? error.message : String(error));
      }
    }

    submitBtn?.addEventListener("click", runEnrichment);
    dataInput?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") runEnrichment();
    });
    refreshWorkflow();
  </script>
</body>
</html>`;
}

export function renderLeadEnrichmentSettingsPage(layoutDoc, d) {
  const topbar = `<div class="topbar">
      <a class="button secondary" href="${d.escapeHtml(d.appsRoute)}">&larr; Back to Apps</a>
      <span class="title">${d.escapeHtml(d.leadEnrichmentLabel)} Settings</span>
    </div>`;
  const main = `<main class="hero">
      <section class="search-card">
        <h1>${d.escapeHtml(d.leadEnrichmentLabel)} Settings</h1>
        <p class="lede">Configure enrichment providers and data retention.</p>
        
        <div class="settings-form">
          <h3>Enrichment Providers</h3>
          <p class="muted">Configure API keys for enrichment sources.</p>
          
          <div class="field-group">
            <div class="field-row">
              <label for="provider-clearbit">Clearbit:</label>
              <input type="password" id="provider-clearbit" placeholder="API key" />
            </div>
            <div class="field-row">
              <label for="provider-people-data">People Data Labs:</label>
              <input type="password" id="provider-people-data" placeholder="API key" />
            </div>
            <div class="field-row">
              <label for="provider-hunter">Hunter.io:</label>
              <input type="password" id="provider-hunter" placeholder="API key" />
            </div>
          </div>

          <h3>Default Settings</h3>
          <div class="field-group">
            <div class="field-row">
              <label for="default-level">Default enrichment level:</label>
              <select id="default-level">
                <option value="basic">Basic</option>
                <option value="standard" selected>Standard</option>
                <option value="full">Full</option>
              </select>
            </div>
            <div class="field-row">
              <label for="retention-days">Data retention (days):</label>
              <input type="number" id="retention-days" value="30" min="1" max="365" />
            </div>
          </div>

          <h3>Source Priority</h3>
          <p class="muted">Order enrichment sources by preference.</p>
          <div class="field-group">
            <div class="field-row">
              <span>1.</span>
              <select id="source-priority-1">
                <option value="clearbit">Clearbit</option>
                <option value="people-data">People Data Labs</option>
                <option value="hunter">Hunter.io</option>
              </select>
            </div>
            <div class="field-row">
              <span>2.</span>
              <select id="source-priority-2">
                <option value="clearbit">Clearbit</option>
                <option value="people-data" selected>People Data Labs</option>
                <option value="hunter">Hunter.io</option>
              </select>
            </div>
            <div class="field-row">
              <span>3.</span>
              <select id="source-priority-3">
                <option value="clearbit">Clearbit</option>
                <option value="people-data">People Data Labs</option>
                <option value="hunter" selected>Hunter.io</option>
              </select>
            </div>
          </div>
          
          <div class="actions">
            <button type="button" class="good" id="saveBtn">Save settings</button>
          </div>
        </div>
      </section>
    </main>`;
  const layout = d.buildLayoutFlowHtml(layoutDoc, d.miniappPageKey("lead-enrichment"), { topbar, main }, d.escapeAttr);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${d.escapeHtml(d.leadEnrichmentLabel)} Settings - agent.meimei</title>
  <link rel="stylesheet" href="${d.escapeHtml(d.designSystemCssPath)}" />
</head>
<body data-theme="green">
  <div class="shell">
    ${layout}
  </div>
  <script>
    const STORAGE_KEY = 'meimei-lead-enrichment-config';

    function loadConfig() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      } catch {
        return {};
      }
    }

    function saveConfig(config) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }

    function applyConfig(config) {
      document.getElementById('provider-clearbit').value = config.clearbitKey || '';
      document.getElementById('provider-people-data').value = config.peopleDataKey || '';
      document.getElementById('provider-hunter').value = config.hunterKey || '';
      document.getElementById('default-level').value = config.defaultLevel || 'standard';
      document.getElementById('retention-days').value = config.retentionDays || 30;
    }

    function getConfig() {
      return {
        clearbitKey: document.getElementById('provider-clearbit').value,
        peopleDataKey: document.getElementById('provider-people-data').value,
        hunterKey: document.getElementById('provider-hunter').value,
        defaultLevel: document.getElementById('default-level').value,
        retentionDays: parseInt(document.getElementById('retention-days').value) || 30
      };
    }

    applyConfig(loadConfig());

    document.getElementById('saveBtn').addEventListener('click', () => {
      const config = getConfig();
      saveConfig(config);
      alert('Settings saved!');
    });
  </script>
</body>
</html>`;
}

export function renderLeadOutreachPage(layoutDoc, d) {
  const topbar = `<div class="topbar">
      <a class="button secondary" href="${d.escapeHtml(d.appsRoute)}">&larr; Back to Apps</a>
      <span class="title">${d.escapeHtml(d.leadOutreachLabel)}</span>
    </div>`;
  const main = `<main class="hero">
      <section class="route-card">
        <h1>${d.escapeHtml(d.leadOutreachLabel)}</h1>
        <p class="lede u-mb12">Issue <strong>#${d.leadOutreachIssueId}</strong> — Hyper-personalized cold email campaigns. Addon <strong>#654</strong>: SDR layer (Mail draft, outbound log, analytics, tracking).</p>
        <p class="muted u-mb12">Enrich leads first in <a href="${d.escapeHtml(d.leadEnrichmentRoute)}">Lead Enrichment (#649)</a>; use <strong>CRM</strong> source for <a href="https://github.com/moldovancsaba/mvp-factory-control/issues/632" target="_blank" rel="noopener noreferrer">#632</a> connector-shaped records.</p>
        <div id="outreachOverview" class="result-card u-mb12"><p class="muted u-m0">Loading overview…</p></div>
        <h2 class="u-mt12" style="font-size:1.1rem;">Draft one touch</h2>
        <div class="route-form">
          <div class="field">
            <label for="camp653">Campaign name</label>
            <input type="text" id="camp653" placeholder="Q1 outbound" />
          </div>
          <div class="field">
            <label for="lead653">Lead summary</label>
            <textarea id="lead653" rows="5" placeholder="Paste enriched profile bullets or CRM notes…"></textarea>
          </div>
          <div class="field">
            <label for="tone653">Tone</label>
            <input type="text" id="tone653" placeholder="concise, respectful B2B" />
          </div>
          <div class="route-actions">
            <button type="button" class="good" id="draft653">Draft email touch</button>
          </div>
        </div>
        <h2 class="u-mt12" style="font-size:1.1rem;">Send &amp; log (#654)</h2>
        <p class="muted u-mb12">Logs to <code>data/sdr-outbound.jsonl</code> (gitignored). On macOS with Mail, opens a draft for you to review and send.</p>
        <div class="route-form">
          <div class="field">
            <label for="to654">Recipient email</label>
            <input type="email" id="to654" placeholder="lead@company.com" autocomplete="email" />
          </div>
          <div class="field">
            <label for="sub654">Subject</label>
            <input type="text" id="sub654" placeholder="Filled from draft, or type here" />
          </div>
          <div class="field">
            <label for="body654">Body</label>
            <textarea id="body654" rows="8" placeholder="Filled from draft, or paste"></textarea>
          </div>
          <div class="route-actions">
            <button type="button" class="good" id="btnSdrSend">Log &amp; open Mail draft</button>
          </div>
        </div>
        <h2 class="u-mt12" style="font-size:1.1rem;">SDR analytics</h2>
        <div class="route-actions u-mb12">
          <button type="button" class="button secondary" id="btnSdrAnalytics">Refresh analytics</button>
        </div>
        <div id="sdrAnalytics654" class="result-card u-mb12"><p class="muted u-m0">Load to see counts and recent events.</p></div>
        <h2 class="u-mt12" style="font-size:1.1rem;">Track outcome</h2>
        <div class="route-form">
          <div class="field">
            <label for="trackType654">Type (optional)</label>
            <input type="text" id="trackType654" placeholder="replied, bounce, meeting_booked…" />
          </div>
          <div class="field">
            <label for="trackNote654">Note</label>
            <textarea id="trackNote654" rows="3" placeholder="What happened after send?"></textarea>
          </div>
          <div class="field">
            <label for="relatedEvent654">Related event id (optional)</label>
            <input type="text" id="relatedEvent654" placeholder="from last sdr_send response" />
          </div>
          <div class="route-actions">
            <button type="button" class="button secondary" id="btnSdrTrack">Append track event</button>
          </div>
        </div>
      </section>
      <section class="result-shell" id="resultShell653">
        <div class="result-card"><p class="muted u-m0">Draft output appears here.</p></div>
      </section>
    </main>`;
  const layout = d.buildLayoutFlowHtml(layoutDoc, d.miniappPageKey("lead-outreach"), { topbar, main }, d.escapeAttr);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${d.escapeHtml(d.leadOutreachLabel)} - agent.meimei</title>
  <link rel="stylesheet" href="${d.escapeHtml(d.designSystemCssPath)}" />
</head>
<body data-theme="green">
  <div class="shell">${layout}</div>
  <script>
    const api = "${d.escapeHtml(d.leadOutreachApiRoute)}";
    (function applyLeadOutreachPrefill() {
      try {
        var raw = sessionStorage.getItem("meimei-lead-outreach-prefill");
        if (!raw) return;
        var o = JSON.parse(raw);
        sessionStorage.removeItem("meimei-lead-outreach-prefill");
        var leadEl = document.getElementById("lead653");
        var campEl = document.getElementById("camp653");
        if (leadEl && o.leadSummary) leadEl.value = o.leadSummary;
        if (campEl && o.campaignName) campEl.value = o.campaignName;
      } catch (e) {}
    })();
    const ov = document.getElementById("outreachOverview");
    const shell = document.getElementById("resultShell653");
    const to654 = document.getElementById("to654");
    const sub654 = document.getElementById("sub654");
    const body654 = document.getElementById("body654");
    const sdrAnalyticsEl = document.getElementById("sdrAnalytics654");

    function esc(s) {
      return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
    }

    function campaignNameVal() {
      return (document.getElementById("camp653") && document.getElementById("camp653").value.trim()) || "Outbound";
    }

    async function loadOverview() {
      try {
        const r = await fetch(api, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "overview" }) });
        const d = await r.json();
        if (!r.ok || !d.ok) throw new Error(d.error || "overview failed");
        const add = d.addon || {};
        ov.innerHTML = [
          "<h3>Product scope</h3>",
          "<p>" + esc(d.summary || "") + "</p>",
          "<h4>Addon #654</h4>",
          "<p class=\\"muted\\">" + esc(add.title || "") + " — " + esc(add.note || "") + "</p>",
          "<ul class=\\"muted\\">",
          (d.nextSteps || []).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join(""),
          "</ul>"
        ].join("");
      } catch (e) {
        ov.innerHTML = "<p class=\\"muted\\">Could not load overview.</p>";
      }
    }

    document.getElementById("draft653")?.addEventListener("click", async function () {
      const campaignName = document.getElementById("camp653").value.trim() || "Outbound";
      const leadSummary = document.getElementById("lead653").value.trim();
      const tone = document.getElementById("tone653").value.trim();
      shell.innerHTML = "<div class=\\"result-card\\"><p class=\\"muted\\">Drafting…</p></div>";
      document.body.classList.add("has-result");
      try {
        const r = await fetch(api, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "draft_touch", campaignName, leadSummary, tone }) });
        const d = await r.json();
        if (!r.ok || !d.ok) throw new Error(d.error || "draft failed");
        const dr = d.draft || {};
        if (sub654) sub654.value = dr.subjectLine || "";
        if (body654) body654.value = dr.body || "";
        shell.innerHTML = [
          "<div class=\\"result-card\\">",
          "<h3>Draft touch</h3>",
          "<p><strong>Subject:</strong> " + esc(dr.subjectLine || "") + "</p>",
          "<pre style=\\"white-space:pre-wrap;font-size:13px;\\">" + esc(dr.body || "") + "</pre>",
          "<p class=\\"muted u-mt12\\">Subject and body copied to <strong>Send &amp; log</strong> — add recipient, then <strong>Log &amp; open Mail draft</strong>.</p>",
          "</div>"
        ].join("");
      } catch (e) {
        shell.innerHTML = "<div class=\\"result-card\\"><p class=\\"muted\\">" + esc(e.message || String(e)) + "</p></div>";
      }
    });

    document.getElementById("btnSdrSend")?.addEventListener("click", async function () {
      const toEmail = to654 && to654.value.trim();
      const subjectLine = sub654 && sub654.value.trim();
      const body = body654 && body654.value.trim();
      if (!toEmail || !subjectLine) {
        alert("Recipient email and subject are required.");
        return;
      }
      try {
        const r = await fetch(api, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "sdr_send", toEmail, subjectLine, body, campaignName: campaignNameVal() }) });
        const d = await r.json();
        if (!r.ok || !d.ok) throw new Error(d.error || "sdr_send failed");
        const rel = document.getElementById("relatedEvent654");
        if (rel && d.eventId) rel.value = d.eventId;
        alert((d.message || "OK") + (d.eventId ? "\\n\\nEvent id (for track): " + d.eventId : ""));
      } catch (e) {
        alert(e && e.message ? e.message : String(e));
      }
    });

    async function loadSdrAnalytics() {
      if (!sdrAnalyticsEl) return;
      sdrAnalyticsEl.innerHTML = "<p class=\\"muted\\">Loading…</p>";
      try {
        const r = await fetch(api, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "sdr_analytics" }) });
        const d = await r.json();
        if (!r.ok || !d.ok) throw new Error(d.error || "analytics failed");
        const bc = d.byCampaign || {};
        const campRows = Object.keys(bc).map(function (k) { return "<tr><td>" + esc(k) + "</td><td>" + esc(String(bc[k])) + "</td></tr>"; }).join("");
        const recent = (d.recent || []).slice(0, 15).map(function (ev) {
          return "<li><code>" + esc(ev.t || "") + "</code> — " + esc(ev.type || "") + (ev.toEmail ? " → " + esc(ev.toEmail) : "") + (ev.note ? ": " + esc(ev.note) : "") + "</li>";
        }).join("");
        sdrAnalyticsEl.innerHTML = [
          "<h3>Summary</h3>",
          "<p>Total events: <strong>" + esc(String(d.totalEvents || 0)) + "</strong> · send_attempt: " + esc(String(d.sendAttempt || 0)),
          " · mail_draft_opened: " + esc(String(d.mailDraftOpened || 0)) + " · track: " + esc(String(d.trackNote || 0)) + "</p>",
          campRows ? "<h4>By campaign</h4><table class=\\"muted\\"><tbody>" + campRows + "</tbody></table>" : "",
          recent ? "<h4>Recent</h4><ul class=\\"muted\\">" + recent + "</ul>" : "<p class=\\"muted\\">No events yet.</p>"
        ].join("");
      } catch (e) {
        sdrAnalyticsEl.innerHTML = "<p class=\\"muted\\">" + esc(e.message || String(e)) + "</p>";
      }
    }

    document.getElementById("btnSdrAnalytics")?.addEventListener("click", loadSdrAnalytics);

    document.getElementById("btnSdrTrack")?.addEventListener("click", async function () {
      const note = document.getElementById("trackNote654") && document.getElementById("trackNote654").value.trim();
      const trackType = document.getElementById("trackType654") && document.getElementById("trackType654").value.trim();
      const relatedEventId = document.getElementById("relatedEvent654") && document.getElementById("relatedEvent654").value.trim();
      if (!note) {
        alert("Note is required.");
        return;
      }
      try {
        const r = await fetch(api, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "sdr_track", note, trackType: trackType || "note", relatedEventId, campaignName: campaignNameVal() }) });
        const d = await r.json();
        if (!r.ok || !d.ok) throw new Error(d.error || "sdr_track failed");
        alert("Tracked.");
        loadSdrAnalytics();
      } catch (e) {
        alert(e && e.message ? e.message : String(e));
      }
    });

    loadOverview();
  </script>
</body>
</html>`;
}

export function renderLeadOutreachSettingsPage(layoutDoc, d) {
  const topbar = `<div class="topbar">
      <a class="button secondary" href="${d.escapeHtml(d.appsRoute)}">&larr; Back to Apps</a>
      <span class="title">${d.escapeHtml(d.leadOutreachLabel)} Settings</span>
    </div>`;
  const main = `<main class="hero">
      <section class="search-card">
        <h1>${d.escapeHtml(d.leadOutreachLabel)}</h1>
        <p class="lede">Issue <strong>#${d.leadOutreachIssueId}</strong> — Board: <a href="https://github.com/moldovancsaba/mvp-factory-control/issues/653" target="_blank" rel="noopener noreferrer">#653</a></p>
        <p class="muted"><strong>Addon #654</strong> — Delivered on the main Lead outreach page: <a href="https://github.com/moldovancsaba/mvp-factory-control/issues/654" target="_blank" rel="noopener noreferrer">issue</a> (Mail draft, JSONL log, analytics, tracking).</p>
        <p class="muted">Upstream: <a href="${d.escapeHtml(d.leadEnrichmentRoute)}">Lead Enrichment (#649)</a> with optional <strong>CRM</strong> source (<a href="https://github.com/moldovancsaba/mvp-factory-control/issues/632" target="_blank" rel="noopener noreferrer">#632</a>).</p>
      </section>
    </main>`;
  const layout = d.buildLayoutFlowHtml(layoutDoc, d.miniappPageKey("lead-outreach"), { topbar, main }, d.escapeAttr);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${d.escapeHtml(d.leadOutreachLabel)} Settings - agent.meimei</title>
  <link rel="stylesheet" href="${d.escapeHtml(d.designSystemCssPath)}" />
</head>
<body data-theme="green">
  <div class="shell">${layout}</div>
</body>
</html>`;
}