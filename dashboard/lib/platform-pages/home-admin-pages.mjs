/**
 * Platform UI — Home (dashboard) shell + admin page + admin layout editor section.
 * @see docs/architecture/meimei-kernel-completion-plan.v1.md Phase K1e
 * @version 1.0.0
 * @aligned package agent-meimei 0.8.13
 */

export function renderPage(state, lastResult, layoutDoc, d) {
  const fragments = {
    commandChat: `<section class="card section ds-command-chat">
        <h2>Ask MeiMei</h2>
        <p class="sub">Type a natural-language command. MeiMei routes to apps or answers from context.</p>
        <div class="ds-chat-log" id="home-command-log" aria-live="polite"></div>
        <div class="ds-chat-typing ds-chat-typing--hidden" id="home-command-typing" aria-hidden="true">
          <span class="ds-chat-typing-dot"></span>
          <span class="ds-chat-typing-dot"></span>
          <span class="ds-chat-typing-dot"></span>
        </div>
        <form class="search-form ds-command-search-form" id="home-command-form">
          <div class="search-box ds-command-search-box">
            <input type="text" id="home-command-input" name="query" placeholder="e.g. check my inbox, open memory, what should I do next…" autocomplete="off" />
            <button type="submit" class="button good" id="home-command-send">Send</button>
          </div>
        </form>
      </section>`,
    homeSuggestions: `<section class="card section">
        <h2>Suggestions for you</h2>
        <p class="sub">Brain layers (identity, user, context) plus live dashboard signals — refreshed on each load.</p>
        <div class="ds-flashcard-grid" id="home-suggestions-grid">
          <p class="muted" id="home-suggestions-loading">Loading suggestions…</p>
        </div>
      </section>`,
    functions: `<section class="card section">
        <h2>Welcome</h2>
        <p class="sub">Use <strong>Apps</strong> for everyday tasks and <strong>Tools</strong> to configure the system.</p>
      </section>`
  };
  const mainFlow = d.buildLayoutFlowHtml(layoutDoc, "home", fragments, d.escapeAttr);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>agent.meimei dashboard</title>
  <link rel="stylesheet" href="${d.escapeHtml(d.designSystemCssPath)}" />
</head>
<body data-page="dashboard" data-theme="green">
  <div class="shell">
    <div class="topnav">
      <h1 class="title">MeiMei Operator Dashboard</h1>
      ${d.renderGlobalNav("dashboard")}
    </div>
    ${mainFlow}
  </div>
  <script>
    ${d.renderGlobalNavScript()}
    (function () {
      const form = document.getElementById("home-command-form");
      const input = document.getElementById("home-command-input");
      const logEl = document.getElementById("home-command-log");
      const typingEl = document.getElementById("home-command-typing");
      const loadingEl = document.getElementById("home-suggestions-loading");
      const grid = document.getElementById("home-suggestions-grid");

      function appendBubble(role, inner) {
        if (!logEl) return;
        const row = document.createElement("div");
        row.className = "ds-chat-row ds-chat-row--" + role;
        const bubble = document.createElement("div");
        bubble.className = "ds-chat-bubble ds-chat-bubble--" + role;
        bubble.appendChild(inner);
        row.appendChild(bubble);
        logEl.appendChild(row);
        logEl.scrollTop = logEl.scrollHeight;
      }

      function appendTextBubble(role, text) {
        const p = document.createElement("p");
        p.className = "ds-chat-bubble-text";
        p.textContent = text;
        appendBubble(role, p);
      }

      function setTyping(on) {
        if (!typingEl) return;
        typingEl.classList.toggle("ds-chat-typing--hidden", !on);
        typingEl.setAttribute("aria-hidden", on ? "false" : "true");
      }

      function sleep(ms) {
        return new Promise(function (resolve) {
          setTimeout(resolve, ms);
        });
      }

      async function finishTypingIndicator(typingStartedAt) {
        let remaining = 450 - (Date.now() - typingStartedAt);
        if (remaining > 0) await sleep(remaining);
        setTyping(false);
      }

      function formatAssistant(data) {
        const wrap = document.createElement("div");
        wrap.className = "ds-chat-bubble-body";
        if (data.action === "navigate") {
          const line = document.createElement("p");
          line.className = "ds-chat-bubble-text";
          const target = data.target || "";
          line.appendChild(document.createTextNode("Opening: "));
          const a = document.createElement("a");
          a.href = target || "#";
          a.className = "ds-chat-link";
          a.textContent = target || "Dashboard";
          line.appendChild(a);
          wrap.appendChild(line);
        } else {
          const p = document.createElement("p");
          p.className = "ds-chat-bubble-text";
          p.textContent = data.message || "(no message)";
          wrap.appendChild(p);
          if (data.navigateTo) {
            const a = document.createElement("a");
            a.href = data.navigateTo;
            a.className = "ds-chat-link ds-chat-link--block";
            a.textContent = "Open related page";
            wrap.appendChild(a);
          }
        }
        const meta = document.createElement("p");
        meta.className = "ds-chat-meta";
        const conf = data.confidence != null ? " · confidence " + Number(data.confidence).toFixed(2) : "";
        meta.textContent = "Intent: " + (data.intent || "unknown") + conf;
        wrap.appendChild(meta);
        return wrap;
      }

      if (form && input && logEl) {
        form.addEventListener("submit", async function (e) {
          e.preventDefault();
          const q = input.value.trim();
          if (!q) return;
          appendTextBubble("user", q);
          input.value = "";
          setTyping(true);
          let typingStarted = Date.now();
          try {
            const res = await fetch("/api/command", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ query: q })
            });
            const data = await res.json().catch(function () { return {}; });
            await finishTypingIndicator(typingStarted);
            if (!res.ok || data.ok === false) {
              appendTextBubble("assistant", data.error || "Request failed.");
              return;
            }
            appendBubble("assistant", formatAssistant(data));
          } catch (err) {
            await finishTypingIndicator(typingStarted);
            appendTextBubble("assistant", err instanceof Error ? err.message : String(err));
          }
        });
      }

      if (grid) {
        fetch("/api/command/suggestions")
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (loadingEl) loadingEl.remove();
            grid.innerHTML = "";
            if (!data.ok || !Array.isArray(data.suggestions) || data.suggestions.length === 0) {
              const p = document.createElement("p");
              p.className = "muted";
              p.textContent = (data && data.error) || "Suggestions unavailable.";
              grid.appendChild(p);
              return;
            }
            data.suggestions.forEach(function (s) {
              const btn = document.createElement("button");
              btn.type = "button";
              btn.className = "ds-flashcard ds-flashcard--suggestion";
              const kind = document.createElement("span");
              kind.className = "ds-flashcard-kind";
              kind.textContent = "Try";
              const title = document.createElement("h3");
              title.className = "ds-flashcard-title";
              title.textContent = s.title || "Suggestion";
              const content = document.createElement("div");
              content.className = "ds-flashcard-content";
              content.textContent = s.detail || "";
              btn.appendChild(kind);
              btn.appendChild(title);
              btn.appendChild(content);
              if (s.exampleQuery) {
                const hint = document.createElement("div");
                hint.className = "ds-flashcard-hint";
                hint.textContent = s.exampleQuery;
                btn.appendChild(hint);
              }
              btn.addEventListener("click", function () {
                if (!input) return;
                input.value = s.exampleQuery || s.title || "";
                input.focus();
              });
              grid.appendChild(btn);
            });
          })
          .catch(function () {
            if (loadingEl) loadingEl.remove();
            grid.innerHTML = "";
            const p = document.createElement("p");
            p.className = "muted";
            p.textContent = "Could not load suggestions.";
            grid.appendChild(p);
          });
      }
    })();
  </script>
</body>
</html>`;
}


export function renderAdminLayoutEditorSection(layoutDoc, d) {
  const keys = d.allPageKeys(d.miniappCfg.registry);
  const meta = d.pageBoxMeta(d.miniappCfg.registry);
  const pageOpts = keys
    .map((k) => `<option value="${d.escapeAttr(k)}">${d.escapeHtml(meta[k]?.label || k)}</option>`)
    .join("");
  const colOpts = [3, 4, 5, 6, 7, 8, 9, 10]
    .map((n) => `<option value="${n}"${n === layoutDoc.desktopColumnCount ? " selected" : ""}>${n}</option>`)
    .join("");
  return `<section class="card section">
    <h2>Page layout</h2>
    <p class="sub">Small screens use 1 column, tablet 2, desktop uses N columns (below). Drag ⋮⋮ to reorder, pick max width in units, add <strong>New line</strong> to force the next block onto a new row. Persists to <code>config/page-layout.v1.json</code>.</p>
    <div class="row layout-editor-tools">
      <div class="field">
        <label for="meimei-layout-desktop-cols">Desktop columns</label>
        <select id="meimei-layout-desktop-cols">${colOpts}</select>
      </div>
      <div class="field">
        <label for="meimei-layout-page">Page</label>
        <select id="meimei-layout-page">${pageOpts}</select>
      </div>
    </div>
    <ul class="layout-editor-list" id="meimei-layout-rows" aria-label="Layout block order"></ul>
    <div class="actions">
      <button type="button" class="button secondary" id="meimei-layout-add-break">New line</button>
      <button type="button" class="good" id="meimei-layout-save">Save layout</button>
    </div>
    <p class="muted u-mt8" id="meimei-layout-status"></p>
  </section>`;
}

export function renderAdminPage(state, lastResult, layoutDoc, d) {
  const config = state.config;
  const workspace = d.configValue(config, ["agents", "defaults", "workspace"]);
  const gatewayMode = d.configValue(config, ["gateway", "mode"]);
  const gatewayBind = d.configValue(config, ["gateway", "bind"]);
  const defaultModel = d.configValue(config, ["agents", "defaults", "model", "primary"]);
  const imageModel = d.configValue(config, ["agents", "defaults", "imageModel", "primary"]);
  const memoryProvider = d.configValue(config, ["agents", "defaults", "memorySearch", "provider"]);
  const whatsappGroupPolicy = d.configValue(config, ["channels", "whatsapp", "groupPolicy"]);
  const whatsappGroupAllowFrom = Array.isArray(d.configValue(config, ["channels", "whatsapp", "groupAllowFrom"]))
    ? d.configValue(config, ["channels", "whatsapp", "groupAllowFrom"]).join(", ")
    : String(d.configValue(config, ["channels", "whatsapp", "groupAllowFrom"]) || "");
  const controlOrigins = Array.isArray(d.configValue(config, ["gateway", "controlUi", "allowedOrigins"]))
    ? d.configValue(config, ["gateway", "controlUi", "allowedOrigins"]).join("\n")
    : String(d.configValue(config, ["gateway", "controlUi", "allowedOrigins"]) || "");
  const modelOptions = d.collectModelOptions(config);
  const imageModelOptions = modelOptions.filter((option) => option.input.includes("image"));
  const statusText = lastResult?.stdout || "";
  const statusError = lastResult?.stderr || "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>agent.meimei admin/settings</title>
  <link rel="stylesheet" href="${d.escapeHtml(d.designSystemCssPath)}" />
</head>
<body data-page="admin" data-theme="orange">
  <div class="shell">
    <div class="topnav">
      <h1 class="title">Admin / Settings</h1>
      ${d.renderGlobalNav("admin")}
    </div>

    ${d.buildLayoutFlowHtml(layoutDoc, "admin", {
      metadata: `<section class="card section">
        <h2>Runtime metadata</h2>
        <p class="sub">Moved from operator page for cleaner daily operation.</p>
        <div class="meta-grid">
          <div class="meta">
            <div class="label">Config path</div>
            <div class="value">${d.escapeHtml(state.configPath)}</div>
          </div>
          <div class="meta">
            <div class="label">Workspace</div>
            <div class="value">${d.escapeHtml(workspace || "(unset)")}</div>
          </div>
          <div class="meta">
            <div class="label">Gateway</div>
            <div class="value">${d.escapeHtml(gatewayMode || "(unset)")} / ${d.escapeHtml(gatewayBind || "(unset)")}</div>
          </div>
          <div class="meta">
            <div class="label">Default model</div>
            <div class="value">${d.escapeHtml(defaultModel || "(unset)")}</div>
          </div>
          <div class="meta">
            <div class="label">Memory</div>
            <div class="value">${d.escapeHtml(memoryProvider || "(unset)")}</div>
          </div>
        </div>
      </section>`,
      settings: `<section class="card section">
        <h2>Settings</h2>
        <p class="sub">Update the values that control how OpenClaw uses this workspace.</p>
        <form class="form" method="post" action="${d.escapeHtml(d.apiConfigRoute)}" data-config-form>
          <div class="field">
            <label for="workspace">Workspace</label>
            <input id="workspace" name="workspace" value="${d.escapeHtml(workspace || "")}" placeholder="/Users/you/Projects/agent.meimei" />
          </div>
          <div class="field">
            <label for="defaultModel">Default model</label>
            <input id="defaultModel" name="defaultModel" value="${d.escapeHtml(defaultModel || "")}" placeholder="openrouter/openrouter/free" list="modelOptions" />
          </div>
          <div class="field">
            <label for="imageModel">Image model</label>
            <input id="imageModel" name="imageModel" value="${d.escapeHtml(imageModel || "")}" placeholder="openrouter/nvidia/nemotron-nano-12b-v2-vl:free" list="imageModelOptions" />
          </div>
          <datalist id="modelOptions">
            ${modelOptions.map((option) => `<option value="${d.escapeHtml(option.ref)}">${d.escapeHtml(option.label)}</option>`).join("")}
          </datalist>
          <datalist id="imageModelOptions">
            ${imageModelOptions.map((option) => `<option value="${d.escapeHtml(option.ref)}">${d.escapeHtml(option.label)}</option>`).join("")}
          </datalist>
          <div class="field">
            <label for="memoryProvider">Memory provider</label>
            <select id="memoryProvider" name="memoryProvider">
              ${["", "ollama", "local"].map((value) => {
                const label = value || "(unset)";
                return `<option value="${d.escapeHtml(value)}" ${value === memoryProvider ? "selected" : ""}>${label}</option>`;
              }).join("")}
            </select>
          </div>
          <div class="row">
            <div class="field">
              <label for="gatewayMode">Gateway mode</label>
              <select id="gatewayMode" name="gatewayMode">
                ${["local", "remote"].map((mode) => `<option value="${mode}" ${mode === gatewayMode ? "selected" : ""}>${mode}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label for="gatewayBind">Gateway bind</label>
              <select id="gatewayBind" name="gatewayBind">
                ${["loopback", "lan", "tailnet", "auto", "custom"].map((mode) => `<option value="${mode}" ${mode === gatewayBind ? "selected" : ""}>${mode}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="field">
            <label for="controlOrigins">Control UI origins</label>
            <textarea id="controlOrigins" name="controlOrigins" placeholder="http://${d.escapeHtml(d.listenHost)}:${d.port}">${d.escapeHtml(controlOrigins)}</textarea>
          </div>
          <div class="row">
            <div class="field">
              <label for="whatsappGroupPolicy">WhatsApp group policy</label>
              <select id="whatsappGroupPolicy" name="whatsappGroupPolicy">
                ${["allowlist", "open", "disabled"].map((mode) => `<option value="${mode}" ${mode === whatsappGroupPolicy ? "selected" : ""}>${mode}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label for="whatsappGroupAllowFrom">WhatsApp group allow from</label>
              <input id="whatsappGroupAllowFrom" name="whatsappGroupAllowFrom" value="${d.escapeHtml(whatsappGroupAllowFrom)}" placeholder="*, +15551234567" />
            </div>
          </div>
          <div class="actions">
            <button type="submit" class="good">Save settings</button>
            <a class="button secondary" href="${d.escapeHtml(d.apiConfigRoute)}">View raw config</a>
          </div>
        </form>
      </section>`,
      operations: `<section class="card section">
        <h2>Operations</h2>
        <p class="sub">Use the built-in CLI wrappers without leaving the browser.</p>
        <div class="actions">
          <form method="post" action="${d.escapeHtml(d.apiRunRoute)}" class="inline-form" data-run-form>
            <input type="hidden" name="cmd" value="status" />
            <button type="submit">Status</button>
          </form>
          <form method="post" action="${d.escapeHtml(d.apiRunRoute)}" class="inline-form" data-run-form>
            <input type="hidden" name="cmd" value="skills" />
            <button type="submit">Skills</button>
          </form>
          <form method="post" action="${d.escapeHtml(d.apiRunRoute)}" class="inline-form" data-run-form>
            <input type="hidden" name="cmd" value="doctor" />
            <button type="submit" class="warn">Doctor</button>
          </form>
          <form method="post" action="${d.escapeHtml(d.apiRunRoute)}" class="inline-form" data-run-form>
            <input type="hidden" name="cmd" value="launch" />
            <button type="submit" class="good">Launch</button>
          </form>
        </div>
        <div class="footer">OpenClaw gateway is already present locally if you want to use it immediately.</div>
      </section>`,
      output: `<section class="card section">
        <h2>Latest output</h2>
        <p class="sub">Last operation result returned by the dashboard server.</p>
        <pre>${d.escapeHtml(statusText || statusError || "No command has been run yet.")}</pre>
      </section>`,
      agent: `<section class="card section">
        <h2>Quick agent turn</h2>
        <p class="sub">Send a message through the repo-local wrapper.</p>
        <form class="form" method="post" action="${d.escapeHtml(d.apiRunRoute)}" data-agent-form>
          <input type="hidden" name="cmd" value="agent" />
          <div class="field">
            <label for="message">Message</label>
            <textarea id="message" name="message" placeholder="Summarize the current workspace status."></textarea>
          </div>
          <div class="actions">
            <button type="submit" class="good">Send to agent</button>
          </div>
        </form>
      </section>`,
      search: `<section class="card section">
        <h2>Web search</h2>
        <p class="sub">Use the local DuckDuckGo fallback with no external API keys.</p>
        <form class="form" method="post" action="${d.escapeHtml(d.apiRunRoute)}" data-search-form>
          <input type="hidden" name="cmd" value="search" />
          <div class="field">
            <label for="query">Query</label>
            <input id="query" name="query" placeholder="agent.meimei issue 516" />
          </div>
          <div class="row">
            <div class="field">
              <label for="count">Results</label>
              <input id="count" name="count" type="number" min="1" max="10" value="5" />
            </div>
          </div>
          <div class="actions">
            <button type="submit">Search</button>
          </div>
        </form>
      </section>`,
      layoutEditor: renderAdminLayoutEditorSection(layoutDoc, d)
    }, d.escapeAttr)}
  </div>
  <script>
    ${d.renderGlobalNavScript()}
    ${d.buildAdminLayoutEditorScript(layoutDoc, d.pageLayoutApiRoute, d.miniappCfg.registry)}
    const output = document.querySelector('pre');
    async function postForm(form) {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form).entries()))
      });
      const data = await response.json();
      output.textContent = JSON.stringify(data, null, 2);
      return data;
    }
    document.querySelectorAll('[data-config-form], [data-agent-form], [data-search-form], [data-run-form]').forEach((form) => {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const data = await postForm(form);
        if (form.matches('[data-config-form]') && data.ok) {
          window.location.reload();
        }
      });
    });
  </script>
</body>
</html>`;
}
