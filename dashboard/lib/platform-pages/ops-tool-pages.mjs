/**
 * Platform UI — Inbox, Memory, Mission Control (main + settings GET shells).
 * @see docs/architecture/meimei-kernel-completion-plan.v1.md Phase K1a
 * @version 1.0.0
 * @aligned package agent-meimei 0.8.7
 */

export function renderInboxPage(layoutDoc, d) {
  const topbar = `<div class="topbar">
      <a class="button secondary" href="${d.escapeHtml(d.appsRoute)}">&larr; Back to Apps</a>
      <span class="title">${d.escapeHtml(d.inboxLabel)}</span>
    </div>`;
  const main = `<main class="hero">
      <section class="route-card">
        <h1>${d.escapeHtml(d.inboxLabel)}</h1>
        <p class="lede u-mb12">Issue <strong>#${d.inboxIssueId}</strong> — MeiMei's email inbox for receiving and acting on messages.</p>
        <div class="route-form">
          <div class="route-grid">
            <div class="field">
              <label for="filter563">Filter</label>
              <select id="filter563" data-filter>
                <option value="all">All Messages</option>
                <option value="unread">Unread</option>
                <option value="flagged">Flagged</option>
              </select>
            </div>
            <div class="field">
              <label for="limit563">Show</label>
              <select id="limit563" data-limit>
                <option value="10">10 messages</option>
                <option value="20" selected>20 messages</option>
                <option value="50">50 messages</option>
              </select>
            </div>
          </div>
          <div class="route-actions">
            <button type="button" class="good" data-refresh>Refresh Inbox</button>
          </div>
        </div>
      </section>
      <section class="result-shell" id="resultShell563">
        <div class="message-list">
          <p class="muted u-m0">Press <strong>Refresh Inbox</strong> to load messages.</p>
        </div>
      </section>
      <div class="footer">Uses AppleScript for macOS Mail. Configure in settings.</div>
    </main>`;
  const layout = d.buildLayoutFlowHtml(layoutDoc, d.miniappPageKey("inbox"), { topbar, main }, d.escapeAttr);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${d.escapeHtml(d.inboxLabel)} - agent.meimei</title>
  <link rel="stylesheet" href="${d.escapeHtml(d.designSystemCssPath)}" />
</head>
<body data-theme="green">
  <div class="shell">
    ${layout}
  </div>
  <script>
    const filterInput = document.getElementById("filter563");
    const limitInput = document.getElementById("limit563");
    const refreshBtn = document.querySelector("[data-refresh]");
    const resultShell = document.getElementById("resultShell563");

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function renderMessages(data) {
      const messages = data.messages || [];
      const total = data.total || 0;
      const unread = data.unread || 0;

      if (messages.length === 0) {
        resultShell.innerHTML = '<div class="message-list"><p class="muted">No messages found.</p></div>';
        document.body.classList.add("has-result");
        return;
      }

      const messagesHtml = messages.map(msg => {
        const unreadClass = msg.read ? "" : "unread";
        const priorityClass = msg.priority === "high" ? "priority-high" : msg.priority === "low" ? "priority-low" : "";
        return '<div class="message-item ' + unreadClass + ' ' + priorityClass + '" data-id="' + d.escapeHtml(msg.id) + '">' +
          '<div class="message-header">' +
            '<span class="message-from">' + d.escapeHtml(msg.from || "Unknown") + '</span>' +
            '<span class="message-date">' + d.escapeHtml(msg.date || "") + '</span>' +
          '</div>' +
          '<div class="message-subject">' + d.escapeHtml(msg.subject || "No subject") + '</div>' +
          '<div class="message-preview">' + d.escapeHtml(msg.preview || "") + '</div>' +
          '<div class="message-actions">' +
            '<button type="button" class="button small" data-read>Read</button>' +
            '<button type="button" class="button small secondary" data-archive>Archive</button>' +
          '</div>' +
        '</div>';
      }).join("");

      resultShell.innerHTML = '<div class="message-list">' +
        '<div class="inbox-stats">' +
          '<span>' + total + ' messages</span>' +
          '<span class="unread-count">' + unread + ' unread</span>' +
        '</div>' +
        messagesHtml +
      '</div>';
      document.body.classList.add("has-result");

      resultShell.querySelectorAll("[data-read]").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.closest(".message-item").dataset.id;
          alert("Reading message: " + id);
        });
      });

      resultShell.querySelectorAll("[data-archive]").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.closest(".message-item").dataset.id;
          alert("Archiving message: " + id);
        });
      });
    }

    function renderError(message) {
      resultShell.innerHTML = '<div class="message-list"><div class="pill status-failed u-mb12">Error</div><p class="muted">' + d.escapeHtml(message) + '</p></div>';
      document.body.classList.add("has-result");
    }

    async function loadInbox() {
      const filter = filterInput.value;
      const limit = parseInt(limitInput.value) || 20;
      resultShell.innerHTML = '<div class="message-list"><div class="pill">Loading...</div></div>';
      document.body.classList.add("has-result");
      window.scrollTo({ top: 0, behavior: "smooth" });

      try {
        const response = await fetch("${d.inboxApiRoute}", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "list", filter, limit })
        });
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.error || "Could not load inbox");
        }
        renderMessages(data);
      } catch (error) {
        renderError(error instanceof Error ? error.message : String(error));
      }
    }

    refreshBtn?.addEventListener("click", loadInbox);
    loadInbox();
  </script>
</body>
</html>`;
}

export function renderInboxSettingsPage(layoutDoc, d) {
  const topbar = `<div class="topbar">
      <a class="button secondary" href="${d.escapeHtml(d.appsRoute)}">&larr; Back to Apps</a>
      <span class="title">${d.escapeHtml(d.inboxLabel)} Settings</span>
    </div>`;
  const main = `<main class="hero">
      <section class="search-card">
        <h1>${d.escapeHtml(d.inboxLabel)} Settings</h1>
        <p class="lede">Configure MeiMei's email inbox and sync preferences.</p>
        
        <div class="settings-form">
          <h3>Inbox Configuration</h3>
          <div class="field-group">
            <div class="field-row">
              <label for="inbox-name">Inbox name:</label>
              <input type="text" id="inbox-name" value="INBOX" placeholder="INBOX" />
            </div>
            <div class="field-row">
              <label for="email-address">Email address:</label>
              <input type="email" id="email-address" placeholder="meimei@example.com" />
            </div>
          </div>

          <h3>Sync Settings</h3>
          <div class="field-group">
            <label class="field-checkbox">
              <input type="checkbox" id="auto-refresh" checked />
              <span>Auto-refresh on page load</span>
            </label>
            <div class="field-row">
              <label for="sync-interval">Sync interval (minutes):</label>
              <input type="number" id="sync-interval" value="5" min="1" max="60" />
            </div>
          </div>

          <h3>Notifications</h3>
          <div class="field-group">
            <label class="field-checkbox">
              <input type="checkbox" id="notify-unread" checked />
              <span>Show unread count badge</span>
            </label>
            <label class="field-checkbox">
              <input type="checkbox" id="notify-high" checked />
              <span>Alert for high priority messages</span>
            </label>
          </div>

          <h3>Auto-Actions</h3>
          <div class="field-group">
            <label class="field-checkbox">
              <input type="checkbox" id="auto-archive-read" />
              <span>Auto-archive read messages after 7 days</span>
            </label>
          </div>
          
          <div class="actions">
            <button type="button" class="good" id="saveBtn">Save settings</button>
          </div>
        </div>
      </section>
    </main>`;
  const layout = d.buildLayoutFlowHtml(layoutDoc, d.miniappPageKey("inbox"), { topbar, main }, d.escapeAttr);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${d.escapeHtml(d.inboxLabel)} Settings - agent.meimei</title>
  <link rel="stylesheet" href="${d.escapeHtml(d.designSystemCssPath)}" />
</head>
<body data-theme="green">
  <div class="shell">
    ${layout}
  </div>
  <script>
    const STORAGE_KEY = 'meimei-inbox-config';

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
      document.getElementById('inbox-name').value = config.inboxName || 'INBOX';
      document.getElementById('email-address').value = config.emailAddress || '';
      document.getElementById('auto-refresh').checked = config.autoRefresh !== false;
      document.getElementById('sync-interval').value = config.syncInterval || 5;
      document.getElementById('notify-unread').checked = config.notifyUnread !== false;
      document.getElementById('notify-high').checked = config.notifyHigh !== false;
      document.getElementById('auto-archive-read').checked = config.autoArchiveRead || false;
    }

    function getConfig() {
      return {
        inboxName: document.getElementById('inbox-name').value,
        emailAddress: document.getElementById('email-address').value,
        autoRefresh: document.getElementById('auto-refresh').checked,
        syncInterval: parseInt(document.getElementById('sync-interval').value) || 5,
        notifyUnread: document.getElementById('notify-unread').checked,
        notifyHigh: document.getElementById('notify-high').checked,
        autoArchiveRead: document.getElementById('auto-archive-read').checked
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

export function renderMemoryPage(layoutDoc, d) {
  const topbar = `<div class="topbar">
      <a class="button secondary" href="${d.escapeHtml(d.toolsRoute)}">&larr; Back to Tools</a>
      <span class="title">${d.escapeHtml(d.memoryLabel)}</span>
    </div>`;
  const main = `<main class="hero">
      <section class="route-card">
        <h1>${d.escapeHtml(d.memoryLabel)}</h1>
        <p class="lede u-mb12">Issue <strong>#${d.memoryIssueId}</strong> — Business Brain. MeiMei's identity, mission, values, and operating principles.</p>
        <div class="ds-flashcard-grid">
          <div class="ds-flashcard" data-layer="identity" data-view="identity" style="cursor: pointer;">
            <div class="ds-flashcard-kind">Level 1</div>
            <div class="ds-flashcard-title">Identity</div>
            <div class="ds-flashcard-content">Core identity — name, mission, values, tone, operating principles.</div>
          </div>
          <div class="ds-flashcard" data-layer="context" data-view="context" style="cursor: pointer;">
            <div class="ds-flashcard-kind">Level 2</div>
            <div class="ds-flashcard-title">Context</div>
            <div class="ds-flashcard-content">Working context — current projects, priorities, stakeholders.</div>
          </div>
          <div class="ds-flashcard" data-layer="events" data-view="events" style="cursor: pointer;">
            <div class="ds-flashcard-kind">Level 3</div>
            <div class="ds-flashcard-title">Events</div>
            <div class="ds-flashcard-content">Running log — day-to-day events, decisions, outcomes.</div>
          </div>
        </div>
      </section>
      <section class="result-shell" id="resultShell601">
        <div class="memory-content">
          <p class="muted">Select a layer above to view its content.</p>
        </div>
      </section>
      <div class="footer">Memory changes are logged for audit. Identity changes require approval.</div>
    </main>`;
  const layout = d.buildLayoutFlowHtml(layoutDoc, d.miniappPageKey("memory"), { topbar, main }, d.escapeAttr);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${d.escapeHtml(d.memoryLabel)} - agent.meimei</title>
  <link rel="stylesheet" href="${d.escapeHtml(d.designSystemCssPath)}" />
</head>
<body data-theme="blue">
  <div class="shell">
    ${layout}
  </div>
  <script>
    (function() {
      const resultShell = document.getElementById("resultShell601");

      function escapeHtml(value) {
        return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      }

      function simpleMarkdownToHtml(md) {
        if (!md) return "";
        var html = d.escapeHtml(md);
        var lines = html.split("\\n");
        var out = [];
        var inList = false;
        for (var i = 0; i < lines.length; i++) {
          var line = lines[i];
          if (line.indexOf("#### ") === 0) {
            out.push("<h4>" + line.slice(5) + "</h4>");
          } else if (line.indexOf("### ") === 0) {
            out.push("<h3>" + line.slice(4) + "</h3>");
          } else if (line.indexOf("## ") === 0) {
            out.push("<h2>" + line.slice(3) + "</h2>");
          } else if (line.indexOf("# ") === 0) {
            out.push("<h1>" + line.slice(2) + "</h1>");
          } else if (line.indexOf("- ") === 0) {
            if (!inList) { out.push("<ul>"); inList = true; }
            out.push("<li>" + line.slice(2) + "</li>");
          } else if (line.trim() === "") {
            if (inList) { out.push("</ul>"); inList = false; }
          } else {
            if (inList) { out.push("</ul>"); inList = false; }
              line = line.replace(new RegExp("\\\\*\\\\*(.*?)\\\\*\\\\*", "g"), "<strong>$1</strong>");
            line = line.replace(new RegExp("\\\\*(.*?)\\\\*", "g"), "<em>$1</em>");
            line = line.replace(new RegExp(String.fromCharCode(96) + "([^" + String.fromCharCode(96) + "]+)" + String.fromCharCode(96), "g"), "<code>$1</code>");
            out.push("<p>" + line + "</p>");
          }
        }
        if (inList) out.push("</ul>");
        return out.join("");
      }

      function renderLayerContent(data) {
        const content = data.content || {};
        const updatedAt = data.updatedAt || "";
        let contentHtml = "";
        
        if (content && content.content) {
          contentHtml = '<div class="ds-markdown">' + simpleMarkdownToHtml(content.content) + '</div>';
        } else if (typeof content === "object") {
          contentHtml = Object.entries(content).map(([k, v]) => {
            const val = Array.isArray(v) ? v.join(", ") : String(v);
            return '<div class="meta"><div class="label">' + d.escapeHtml(k) + '</div><div class="value">' + d.escapeHtml(val) + '</div></div>';
          }).join("");
        } else {
          contentHtml = '<pre>' + d.escapeHtml(String(content)) + '</pre>';
        }
        
        resultShell.innerHTML = '<div class="result-card">' +
          '<div class="meta"><div class="label">' + d.escapeHtml(data.layer) + '</div><div class="value">Updated: ' + d.escapeHtml(updatedAt) + '</div></div>' +
          '<div class="u-mt16">' + contentHtml + '</div>' +
          '<div class="actions u-mt16"><button type="button" class="button secondary">Edit</button></div>' +
        '</div>';
        document.body.classList.add("has-result");
      }

      function renderError(message) {
        resultShell.innerHTML = '<div class="pill status-failed u-mb12">Error</div><p class="muted">' + d.escapeHtml(message) + '</p>';
      }

      async function loadLayer(layer) {
        resultShell.innerHTML = '<div class="pill">Loading...</div>';
        try {
          const res = await fetch("${d.memoryApiRoute}", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ layer, action: "get" })
          });
          const data = await res.json();
          if (!res.ok || !data.ok) throw new Error(data.error || "Load failed");
          renderLayerContent(data);
        } catch (err) {
          renderError(err.message);
        }
      }

      document.querySelectorAll("[data-view]").forEach(function(card) {
        card.addEventListener("click", function() { loadLayer(card.dataset.view); });
      });
      
      loadLayer("identity");
    })();
  </script>
</body>
</html>`;
}

export function renderMemorySettingsPage(layoutDoc, d) {
  const topbar = `<div class="topbar">
      <a class="button secondary" href="${d.escapeHtml(d.toolsRoute)}">&larr; Back to Tools</a>
      <span class="title">${d.escapeHtml(d.memoryLabel)} Settings</span>
    </div>`;
  const main = `<main class="hero">
      <section class="search-card">
        <h1>${d.escapeHtml(d.memoryLabel)} Settings</h1>
        <p class="lede">Configure memory file location and backup preferences.</p>
        <div class="settings-form">
          <h3>File Settings</h3>
          <div class="field-group">
            <div class="field-row"><label for="memory-path">Memory file path:</label><input type="text" id="memory-path" placeholder="memory.md" /></div>
          </div>
          <h3>Backup</h3>
          <div class="field-group">
            <label class="field-checkbox"><input type="checkbox" id="auto-backup" checked /><span>Auto-backup before changes</span></label>
            <div class="field-row"><label for="backup-interval">Backup interval (hours):</label><input type="number" id="backup-interval" value="24" min="1" max="168" /></div>
          </div>
          <h3>Review Reminders</h3>
          <div class="field-group">
            <label class="field-checkbox"><input type="checkbox" id="review-reminder" checked /><span>Remind me to review memory monthly</span></label>
          </div>
          <div class="actions"><button type="button" class="good" id="saveBtn">Save settings</button></div>
        </div>
      </section>
    </main>`;
  const layout = d.buildLayoutFlowHtml(layoutDoc, d.miniappPageKey("memory"), { topbar, main }, d.escapeAttr);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${d.escapeHtml(d.memoryLabel)} Settings - agent.meimei</title>
  <link rel="stylesheet" href="${d.escapeHtml(d.designSystemCssPath)}" />
</head>
<body data-theme="blue">
  <div class="shell">
    ${layout}
  </div>
  <script>
    const STORAGE_KEY = 'meimei-memory-config';
    function loadConfig() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; } }
    function saveConfig(config) { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); }
    function applyConfig(config) {
      document.getElementById('memory-path').value = config.memoryPath || 'memory.md';
      document.getElementById('auto-backup').checked = config.autoBackup !== false;
      document.getElementById('backup-interval').value = config.backupInterval || 24;
      document.getElementById('review-reminder').checked = config.reviewReminder !== false;
    }
    function getConfig() {
      return {
        memoryPath: document.getElementById('memory-path').value,
        autoBackup: document.getElementById('auto-backup').checked,
        backupInterval: parseInt(document.getElementById('backup-interval').value) || 24,
        reviewReminder: document.getElementById('review-reminder').checked
      };
    }
    applyConfig(loadConfig());
    document.getElementById('saveBtn').addEventListener('click', () => { saveConfig(getConfig()); alert('Settings saved!'); });
  </script>
</body>
</html>`;
}

export function renderMissionControlPage(layoutDoc, d) {
  const topbar = `<div class="topbar">
      <a class="button secondary" href="${d.escapeHtml(d.toolsRoute)}">&larr; Back to Tools</a>
      <span class="title">${d.escapeHtml(d.missionControlLabel)}</span>
    </div>`;
  const main = `<main class="hero">
      <section class="route-card">
        <h1>${d.escapeHtml(d.missionControlLabel)}</h1>
        <p class="lede u-mb12">Issue <strong>#${d.missionControlIssueId}</strong> — Live board of MeiMei activity and state.</p>
        <div class="route-form">
          <div class="route-grid">
            <div class="field">
              <label for="filter635">Show</label>
              <select id="filter635" data-filter>
                <option value="all">All Activity</option>
                <option value="runs">Recent Runs</option>
                <option value="errors">Errors Only</option>
                <option value="agents">Agent Status</option>
              </select>
            </div>
            <div class="field">
              <label for="timeRange635">Time Range</label>
              <select id="timeRange635" data-time>
                <option value="1h">Last Hour</option>
                <option value="6h" selected>Last 6 Hours</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
              </select>
            </div>
          </div>
          <div class="route-actions">
            <button type="button" class="good" data-refresh>Refresh</button>
          </div>
        </div>
      </section>
      <section class="result-shell" id="resultShell635">
        <div class="mission-overview">
          <div class="stat-card"><div class="stat-value" data-stat="totalRuns">--</div><div class="stat-label">Total Runs</div></div>
          <div class="stat-card"><div class="stat-value" data-stat="successRate">--</div><div class="stat-label">Success Rate</div></div>
          <div class="stat-card"><div class="stat-value" data-stat="avgDuration">--</div><div class="stat-label">Avg Duration</div></div>
          <div class="stat-card"><div class="stat-value" data-stat="activeAgents">--</div><div class="stat-label">Active Agents</div></div>
        </div>
        <div class="runs-list"></div>
      </section>
      <div class="footer">Read-only surface. No execution from this tool.</div>
    </main>`;
  const layout = d.buildLayoutFlowHtml(layoutDoc, d.miniappPageKey("mission-control"), { topbar, main }, d.escapeAttr);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${d.escapeHtml(d.missionControlLabel)} - agent.meimei</title>
  <link rel="stylesheet" href="${d.escapeHtml(d.designSystemCssPath)}" />
</head>
<body data-theme="blue">
  <div class="shell">
    ${layout}
  </div>
  <script>
    const filterInput = document.getElementById("filter635");
    const timeInput = document.getElementById("timeRange635");
    const refreshBtn = document.querySelector("[data-refresh]");
    const resultShell = document.getElementById("resultShell635");

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function renderDashboard(data) {
      const overview = data.overview || {};

      const runs = data.recentRuns || [];
      const errors = data.errors || [];
      const filter = filterInput.value;

      let runsHtml = "";
      if (filter === "errors" || filter === "all") {
        const displayRuns = filter === "errors" ? errors : runs;
        if (displayRuns.length === 0) {
          runsHtml = '<p class="muted">' + (filter === "errors" ? "No errors in this time range." : "No runs recorded.") + '</p>';
        } else {
          runsHtml = displayRuns.map(run => {
            const statusClass = run.status === "success" ? "status-ok" : run.status === "failed" ? "status-failed" : "status-pending";
            return '<div class="run-item"><div class="run-header">' +
              '<span class="run-id">' + d.escapeHtml(run.id || "") + '</span>' +
              '<span class="pill ' + statusClass + '">' + d.escapeHtml(run.status || "") + '</span>' +
              '</div>' +
              '<div class="run-details">' +
              '<span>Type: ' + d.escapeHtml(run.type || "") + '</span>' +
              '<span>Duration: ' + d.escapeHtml(run.duration || "") + '</span>' +
              '<span>' + d.escapeHtml(run.timestamp || "") + '</span>' +
              '</div></div>';
          }).join("");
        }
      } else if (filter === "agents") {
        const agents = data.agentStatus || [];
        runsHtml = agents.map(agent => {
          const statusClass = agent.status === "active" ? "status-ok" : agent.status === "idle" ? "status-pending" : "status-failed";
          return '<div class="run-item"><div class="run-header">' +
            '<span class="run-id">' + d.escapeHtml(agent.agent || "") + '</span>' +
            '<span class="pill ' + statusClass + '">' + d.escapeHtml(agent.status || "") + '</span>' +
            '</div>' +
            '<div class="run-details"><span>Last run: ' + d.escapeHtml(agent.lastRun || "Never") + '</span></div></div>';
        }).join("");
      }

      resultShell.innerHTML = '<div class="mission-overview">' +
        '<div class="stat-card"><div class="stat-value" data-stat="totalRuns">' + (overview.totalRuns || 0) + '</div><div class="stat-label">Total Runs</div></div>' +
        '<div class="stat-card"><div class="stat-value" data-stat="successRate">' + ((overview.successRate || 0).toFixed(1)) + '%</div><div class="stat-label">Success Rate</div></div>' +
        '<div class="stat-card"><div class="stat-value" data-stat="avgDuration">' + d.escapeHtml(overview.avgDuration || "0s") + '</div><div class="stat-label">Avg Duration</div></div>' +
        '<div class="stat-card"><div class="stat-value" data-stat="activeAgents">' + (overview.activeAgents || 0) + '</div><div class="stat-label">Active Agents</div></div>' +
        '</div><div class="runs-list">' + runsHtml + '</div>';
      document.body.classList.add("has-result");
    }

    function renderError(message) {
      resultShell.innerHTML = '<div class="mission-overview"><div class="pill status-failed u-mb12">Error</div><p class="muted">' + d.escapeHtml(message) + '</p></div>';
      document.body.classList.add("has-result");
    }

    async function loadDashboard() {
      const filter = filterInput.value;
      const timeRange = timeInput.value;
      resultShell.innerHTML = '<div class="mission-overview"><div class="pill">Loading...</div></div>';
      document.body.classList.add("has-result");
      try {
        const response = await fetch("${d.missionControlApiRoute}", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ filter, timeRange })
        });
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.error || "Could not load mission control");
        renderDashboard(data);
      } catch (error) {
        renderError(error instanceof Error ? error.message : String(error));
      }
    }

    refreshBtn?.addEventListener("click", loadDashboard);
    filterInput?.addEventListener("change", loadDashboard);
    timeInput?.addEventListener("change", loadDashboard);
    loadDashboard();
  </script>
</body>
</html>`;
}

export function renderMissionControlSettingsPage(layoutDoc, d) {
  const topbar = `<div class="topbar">
      <a class="button secondary" href="${d.escapeHtml(d.toolsRoute)}">&larr; Back to Tools</a>
      <span class="title">${d.escapeHtml(d.missionControlLabel)} Settings</span>
    </div>`;
  const main = `<main class="hero">
      <section class="search-card">
        <h1>${d.escapeHtml(d.missionControlLabel)} Settings</h1>
        <p class="lede">Configure refresh and notification preferences.</p>
        <div class="settings-form">
          <h3>Refresh</h3>
          <div class="field-group">
            <div class="field-row"><label for="refresh-interval">Auto-refresh (seconds):</label><input type="number" id="refresh-interval" value="30" min="5" max="300" /></div>
            <label class="field-checkbox"><input type="checkbox" id="auto-refresh" checked /><span>Enable auto-refresh</span></label>
          </div>
          <h3>Defaults</h3>
          <div class="field-group">
            <div class="field-row"><label for="default-time">Default time range:</label><select id="default-time"><option value="1h">Last Hour</option><option value="6h" selected>Last 6 Hours</option><option value="24h">Last 24 Hours</option></select></div>
            <div class="field-row"><label for="default-filter">Default filter:</label><select id="default-filter"><option value="all">All Activity</option><option value="runs">Recent Runs</option><option value="errors">Errors Only</option></select></div>
          </div>
          <h3>Notifications</h3>
          <div class="field-group">
            <label class="field-checkbox"><input type="checkbox" id="notify-errors" checked /><span>Notify on new errors</span></label>
            <label class="field-checkbox"><input type="checkbox" id="notify-slow" /><span>Notify on slow runs (>10s)</span></label>
          </div>
          <div class="actions"><button type="button" class="good" id="saveBtn">Save settings</button></div>
        </div>
      </section>
    </main>`;
  const layout = d.buildLayoutFlowHtml(layoutDoc, d.miniappPageKey("mission-control"), { topbar, main }, d.escapeAttr);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${d.escapeHtml(d.missionControlLabel)} Settings - agent.meimei</title>
  <link rel="stylesheet" href="${d.escapeHtml(d.designSystemCssPath)}" />
</head>
<body data-theme="blue">
  <div class="shell">
    ${layout}
  </div>
  <script>
    const STORAGE_KEY = 'meimei-mission-control-config';
    function loadConfig() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; } }
    function saveConfig(config) { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); }
    function applyConfig(config) {
      document.getElementById('refresh-interval').value = config.refreshInterval || 30;
      document.getElementById('auto-refresh').checked = config.autoRefresh !== false;
      document.getElementById('default-time').value = config.defaultTime || '6h';
      document.getElementById('default-filter').value = config.defaultFilter || 'all';
      document.getElementById('notify-errors').checked = config.notifyErrors !== false;
      document.getElementById('notify-slow').checked = config.notifySlow || false;
    }
    function getConfig() {
      return {
        refreshInterval: parseInt(document.getElementById('refresh-interval').value) || 30,
        autoRefresh: document.getElementById('auto-refresh').checked,
        defaultTime: document.getElementById('default-time').value,
        defaultFilter: document.getElementById('default-filter').value,
        notifyErrors: document.getElementById('notify-errors').checked,
        notifySlow: document.getElementById('notify-slow').checked
      };
    }
    applyConfig(loadConfig());
    document.getElementById('saveBtn').addEventListener('click', () => { saveConfig(getConfig()); alert('Settings saved!'); });
  </script>
</body>
</html>`;
}

