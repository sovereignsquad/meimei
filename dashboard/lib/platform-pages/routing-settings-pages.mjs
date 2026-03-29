/**
 * Platform UI — AI routing & API access tool **settings** GET shells (main tool pages stay in tool-surface-pages.mjs).
 * @see docs/architecture/meimei-kernel-completion-plan.v1.md Phase K1d
 * @version 1.0.0
 * @aligned package agent-meimei 0.8.13
 */

export function renderAIRoutingSettingsPage(layoutDoc, d) {
  const topbar = `<div class="topbar">
      <a class="button secondary" href="${d.escapeHtml(d.toolsRoute)}">&larr; Back to Tools</a>
      <span class="title">${d.escapeHtml(d.aiRoutingLabel)} Settings</span>
    </div>`;
  const main = `<main class="hero">
      <section class="search-card">
        <h1>${d.escapeHtml(d.aiRoutingLabel)} Settings</h1>
        <p class="lede">Configure how requests route to different AI models.</p>
        
        <div class="settings-form">
          <h3>Default Cost Target</h3>
          <p class="muted">Set the default cost target for routing decisions.</p>
          <div class="field-group">
            <div class="field-row">
              <label for="default-cost">Default cost:</label>
              <select id="default-cost" style="padding:0.5rem;border:1px solid var(--color-border,#e5e7eb);border-radius:0.25rem">
                <option value="low">Low — cheaper models, faster responses</option>
                <option value="medium" selected>Medium — balanced cost/quality</option>
                <option value="high">High — best quality, higher cost</option>
                <option value="xhigh">Extra High — most capable models</option>
              </select>
            </div>
          </div>

          <h3>Channel Preferences</h3>
          <p class="muted">Set preferred model tier per channel.</p>
          <div class="field-group">
            <div class="field-row">
              <label for="channel-dashboard">Dashboard:</label>
              <select id="channel-dashboard" style="padding:0.5rem;border:1px solid var(--color-border,#e5e7eb);border-radius:0.25rem">
                <option value="low">Low</option>
                <option value="medium" selected>Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div class="field-row">
              <label for="channel-api">API:</label>
              <select id="channel-api" style="padding:0.5rem;border:1px solid var(--color-border,#e5e7eb);border-radius:0.25rem">
                <option value="low">Low</option>
                <option value="medium" selected>Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <h3>Task Type Defaults</h3>
          <p class="muted">Configure default cost targets per task type.</p>
          <div class="field-group">
            <label class="field-checkbox">
              <input type="checkbox" id="override-chat" checked />
              <span>Chat / reply</span>
              <small>Override with custom cost target</small>
            </label>
            <label class="field-checkbox">
              <input type="checkbox" id="override-summary" checked />
              <span>Summary / extraction</span>
              <small>Override with custom cost target</small>
            </label>
            <label class="field-checkbox">
              <input type="checkbox" id="override-research" />
              <span>Research / synthesis</span>
              <small>Use default cost target</small>
            </label>
          </div>
          
          <div class="actions">
            <button type="button" class="good" id="saveBtn">Save settings</button>
          </div>
        </div>
      </section>
    </main>`;
  const layout = d.buildLayoutFlowHtml(layoutDoc, d.miniappPageKey("ai-routing"), { topbar, main }, d.escapeAttr);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${d.escapeHtml(d.aiRoutingLabel)} Settings - agent.meimei</title>
  <link rel="stylesheet" href="${d.escapeHtml(d.designSystemCssPath)}" />
</head>
<body data-theme="blue">
  <div class="shell">
    ${layout}
  </div>
  <script>
    const STORAGE_KEY = 'meimei-ai-routing-config';

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
      document.getElementById('default-cost').value = config.defaultCost || 'medium';
      document.getElementById('channel-dashboard').value = config.channelDashboard || 'medium';
      document.getElementById('channel-api').value = config.channelApi || 'medium';
      document.getElementById('override-chat').checked = config.overrideChat !== false;
      document.getElementById('override-summary').checked = config.overrideSummary !== false;
      document.getElementById('override-research').checked = config.overrideResearch || false;
    }

    function getConfig() {
      return {
        defaultCost: document.getElementById('default-cost').value,
        channelDashboard: document.getElementById('channel-dashboard').value,
        channelApi: document.getElementById('channel-api').value,
        overrideChat: document.getElementById('override-chat').checked,
        overrideSummary: document.getElementById('override-summary').checked,
        overrideResearch: document.getElementById('override-research').checked
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

export function renderApiAccessSettingsPage(layoutDoc, d) {
  const topbar = `<div class="topbar">
      <a class="button secondary" href="${d.escapeHtml(d.toolsRoute)}">&larr; Back to Tools</a>
      <span class="title">${d.escapeHtml(d.apiAccessLabel)} Settings</span>
    </div>`;
  const main = `<main class="hero">
      <section class="search-card">
        <h1>${d.escapeHtml(d.apiAccessLabel)} Settings</h1>
        <p class="lede">Manage API policies, audit trail, and telemetry.</p>
        
        <div class="settings-form">
          <h3>API Policy</h3>
          <p class="muted">Configure how external API requests are handled.</p>
          
          <div class="field-group">
            <label class="field-checkbox">
              <input type="checkbox" id="require-approval" checked />
              <span>Require approval for high-risk requests</span>
              <small>API calls with cost targets above threshold need explicit approval</small>
            </label>
            
            <label class="field-checkbox">
              <input type="checkbox" id="audit-enabled" checked />
              <span>Enable audit trail</span>
              <small>Log all API requests and responses</small>
            </label>
            
            <label class="field-checkbox">
              <input type="checkbox" id="telemetry-enabled" checked />
              <span>Enable telemetry</span>
              <small>Track usage patterns and performance metrics</small>
            </label>
          </div>

          <h3>Allowed Channels</h3>
          <p class="muted">Select which channels can make API requests.</p>
          <div class="field-group">
            <label class="field-checkbox">
              <input type="checkbox" id="channel-whatsapp" value="whatsapp" checked />
              <span>WhatsApp</span>
            </label>
            <label class="field-checkbox">
              <input type="checkbox" id="channel-imessage" value="imessage" checked />
              <span>iMessage</span>
            </label>
            <label class="field-checkbox">
              <input type="checkbox" id="channel-discord" value="discord" />
              <span>Discord</span>
            </label>
            <label class="field-checkbox">
              <input type="checkbox" id="channel-api" value="api" checked />
              <span>Direct API</span>
            </label>
          </div>

          <h3>Rate Limiting</h3>
          <div class="field-group">
            <div class="field-row">
              <label for="rate-limit">Max requests per minute:</label>
              <input type="number" id="rate-limit" value="60" min="1" max="1000" />
            </div>
          </div>
          
          <div class="actions">
            <button type="button" class="good" id="saveBtn">Save settings</button>
          </div>
        </div>
      </section>
    </main>`;
  const layout = d.buildLayoutFlowHtml(layoutDoc, d.miniappPageKey("api-access"), { topbar, main }, d.escapeAttr);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${d.escapeHtml(d.apiAccessLabel)} Settings - agent.meimei</title>
  <link rel="stylesheet" href="${d.escapeHtml(d.designSystemCssPath)}" />
</head>
<body data-theme="blue">
  <div class="shell">
    ${layout}
  </div>
  <script>
    const STORAGE_KEY = 'meimei-api-access-config';

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
      document.getElementById('require-approval').checked = config.requireApproval !== false;
      document.getElementById('audit-enabled').checked = config.auditEnabled !== false;
      document.getElementById('telemetry-enabled').checked = config.telemetryEnabled !== false;
      const channels = config.channels || ['whatsapp', 'imessage', 'api'];
      document.getElementById('channel-whatsapp').checked = channels.includes('whatsapp');
      document.getElementById('channel-imessage').checked = channels.includes('imessage');
      document.getElementById('channel-discord').checked = channels.includes('discord');
      document.getElementById('channel-api').checked = channels.includes('api');
      document.getElementById('rate-limit').value = config.rateLimit || 60;
    }

    function getConfig() {
      const channels = [];
      if (document.getElementById('channel-whatsapp').checked) channels.push('whatsapp');
      if (document.getElementById('channel-imessage').checked) channels.push('imessage');
      if (document.getElementById('channel-discord').checked) channels.push('discord');
      if (document.getElementById('channel-api').checked) channels.push('api');
      return {
        requireApproval: document.getElementById('require-approval').checked,
        auditEnabled: document.getElementById('audit-enabled').checked,
        telemetryEnabled: document.getElementById('telemetry-enabled').checked,
        channels,
        rateLimit: parseInt(document.getElementById('rate-limit').value) || 60
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