/**
 * Platform UI — What next, URL summary (explain-it), daily briefing, explain-it settings GET shells.
 * @see docs/architecture/meimei-kernel-completion-plan.v1.md Phase K1c
 * @version 1.0.0
 * @aligned package agent-meimei 0.8.13
 */

export function renderUrlSummaryPage(layoutDoc, d) {
  const topbar = `<div class="topbar">
      <a class="button secondary" href="${d.escapeHtml(d.appsRoute)}">&larr; Back to Apps</a>
      <span class="title">${d.escapeHtml(d.explainItLabel)}</span>
    </div>`;
  const main = `<main class="hero">
      <section class="search-card">
        <h1>${d.escapeHtml(d.explainItLabel)}</h1>
        <p class="lede">Paste a URL or PDF link to get an explanation. Use "Set alarm" to schedule daily briefings.</p>
        <div class="search-form">
          <div class="search-box">
            <input
              data-url-input
              type="text"
              name="url"
              placeholder="https://example.com/article-or-pdf"
              aria-label="URL to explain"
              inputmode="url"
              autocomplete="off"
              autocapitalize="off"
              autocorrect="off"
              spellcheck="false"
              enterkeyhint="go"
              autofocus
            />
            <button type="button" class="good" data-url-submit onclick="return window.__meimeiSummarizeUrl && window.__meimeiSummarizeUrl();">Explain</button>
          </div>
        </div>
        <div class="alarm-section">
          <button type="button" class="button secondary" data-set-alarm onclick="return window.__meimeiSetAlarm && window.__meimeiSetAlarm();">Set alarm</button>
          <input type="time" data-alarm-time value="06:00" aria-label="Alarm time" />
          <span class="alarm-note">Daily briefing at this time</span>
        </div>
      </section>
      <section class="terminal-shell" id="terminalShell" aria-live="polite" aria-atomic="false">
        <div class="terminal-header">
          <span class="terminal-badge">MeiMei progress</span>
          <span class="terminal-dim" id="terminalMeta">Ready</span>
        </div>
        <div class="terminal-body" id="terminalBody">
          <div class="terminal-line"><span class="terminal-prefix">$</span><span class="terminal-current">Waiting for a URL.</span></div>
          <div class="terminal-line"><span class="terminal-prefix">></span><span class="terminal-dim">The result will appear here once processing finishes.</span></div>
          <div class="terminal-line"><span class="terminal-prefix">_</span><span class="terminal-dim">Click Summarize to begin.</span></div>
        </div>
      </section>
      <section class="result-shell" id="resultShell">
        <div class="result-card">
          <p class="muted u-m0">Enter a URL above and press <strong>Summarize</strong>.</p>
        </div>
      </section>
      <div class="footer">The page is intentionally minimal now so we can extend it into more MeiMei functions later.</div>
    </main>`;
  const urlFlow = d.buildLayoutFlowHtml(layoutDoc, d.miniappPageKey("explain-it"), { topbar, main }, d.escapeAttr);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${d.escapeHtml(d.explainItLabel)} - agent.meimei</title>
  <link rel="stylesheet" href="${d.escapeHtml(d.designSystemCssPath)}" />
</head>
<body data-theme="green">
  <div class="shell">
    ${urlFlow}
  </div>
  <script>
    const input = document.querySelector("[data-url-input]");
    const submitButton = document.querySelector("[data-url-submit]");
    const resultShell = document.getElementById("resultShell");
    const terminalShell = document.getElementById("terminalShell");
    const terminalBody = document.getElementById("terminalBody");
    const terminalMeta = document.getElementById("terminalMeta");
    let progressTimer = null;

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function listHtml(items) {
      const values = Array.isArray(items) ? items.filter(Boolean) : [];
      if (!values.length) return '<p class="muted u-m0">None</p>';
      return '<ul>' + values.map((item) => '<li>' + escapeHtml(item) + '</li>').join('') + '</ul>';
    }

    function normalizeUrlInput(value) {
      const raw = String(value || "").trim();
      if (!raw) return "";
      const lower = raw.toLowerCase();
      if (lower.startsWith("http://") || lower.startsWith("https://")) return raw;
      if (raw.startsWith("//")) return "https:" + raw;
      if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return raw;
      return "https://" + raw;
    }

    function setTerminal(lines, meta = "Running") {
      terminalMeta.textContent = meta;
      const content = lines.slice(0, 3).map((line, index) => {
        const prefix = index === 0 ? "$" : index === 1 ? ">" : "_";
        const toneClass = index === 0 ? "terminal-current" : "terminal-dim";
        return '<div class="terminal-line"><span class="terminal-prefix">' + prefix + '</span><span class="' + toneClass + '">' + escapeHtml(line) + (index === 0 ? '<span class="terminal-cursor" aria-hidden="true"></span>' : '') + '</span></div>';
      }).join("");
      terminalBody.innerHTML = content;
    }

    function animateProgress(sourceUrl) {
      const steps = [
        "Validating source URL and preparing the request.",
        "Fetching readable content from " + sourceUrl + ".",
        "Extracting the relevant text and trimming noise.",
        "Summarizing with MeiMei and preparing the result."
      ];
      let index = 0;
      setTerminal(steps.slice(0, 3), "Working");
      if (progressTimer) clearInterval(progressTimer);
      progressTimer = setInterval(() => {
        index = Math.min(index + 1, steps.length - 1);
        const visible = [
          "Step " + (index + 1) + " of " + steps.length + ". " + steps[index],
          index + 1 < steps.length ? "Next: " + steps[index + 1] : "Finalizing the response.",
          "This page stays on one screen so the result appears in place."
        ];
        setTerminal(visible, "Working");
      }, 900);
      return () => {
        if (progressTimer) clearInterval(progressTimer);
        progressTimer = null;
      };
    }

    async function runSummary(rawUrl) {
      const url = normalizeUrlInput(rawUrl);
      if (!url) return;
      input.value = url;

      const stopProgress = animateProgress(url);
      resultShell.innerHTML = [
        '<div class="result-card">',
        '<div class="pill">Working</div>',
        '<p class="muted u-mt12">Fetching and summarizing the source.</p>',
        '</div>'
      ].join('');
      document.body.classList.add("has-result");
      window.scrollTo({ top: 0, behavior: "smooth" });

      try {
        const response = await fetch("${d.explainItApiRoute}", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url })
        });
        const payload = await response.json();
        if (!response.ok || !payload.ok) {
          throw new Error(payload.error || "The summarizer could not process that URL.");
        }
        stopProgress();
        renderSummary(payload);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (error) {
        stopProgress();
        renderError(error instanceof Error ? error.message : String(error));
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }

    window.__meimeiSummarizeUrl = () => {
      runSummary(input.value);
      return false;
    };

    function renderSummary(payload) {
      const result = payload?.result || {};
      const source = payload?.source || {};
      const status = String(result.status || "limited");
      const statusClass = status === "ok" ? "status-ok" : status === "failed" ? "status-failed" : "status-limited";
      const title = result.title || source.title || "Summary";
      const sourceType = source.type || "unknown";
      const sourceUrl = source.url || "";
      const textLength = source.textLength ? String(source.textLength.toLocaleString()) + ' chars' : '';
      terminalMeta.textContent = "Complete";
      terminalBody.innerHTML = [
        '<div class="terminal-line"><span class="terminal-prefix">$</span><span class="terminal-current">Summary complete for ' + escapeHtml(sourceUrl || "the requested URL") + '.</span></div>',
        '<div class="terminal-line"><span class="terminal-prefix">></span><span class="terminal-dim">Rendered below with source metadata and summary sections.</span></div>',
        '<div class="terminal-line"><span class="terminal-prefix">_</span><span class="terminal-dim">You can run another URL anytime.</span></div>'
      ].join("");
      resultShell.innerHTML = [
        '<div class="result-card">',
        '<div class="pill ' + statusClass + ' u-mb12">Status: ' + escapeHtml(status) + '</div>',
        '<h2>' + escapeHtml(title) + '</h2>',
        '<p class="muted u-mt0">' + escapeHtml(sourceUrl) + (textLength ? ' • ' + escapeHtml(textLength) : '') + ' • ' + escapeHtml(sourceType) + '</p>',
        '<div class="grid">',
        '<section class="panel">',
        '<h3>Summary</h3>',
        listHtml(result.summary),
        '</section>',
        '<section class="panel">',
        '<h3>Key Facts</h3>',
        listHtml(result.keyFacts),
        '</section>',
        '<section class="panel">',
        '<h3>Next Steps</h3>',
        listHtml(result.nextSteps),
        '</section>',
        '<section class="panel">',
        '<h3>Caveats</h3>',
        listHtml(result.caveats),
        '</section>',
        '</div>',
        '</div>'
      ].join('');
      document.body.classList.add("has-result");
    }

    function renderError(message) {
      terminalMeta.textContent = "Error";
      terminalBody.innerHTML = [
        '<div class="terminal-line"><span class="terminal-prefix">$</span><span class="terminal-current">The request did not complete successfully.</span></div>',
        '<div class="terminal-line"><span class="terminal-prefix">></span><span class="terminal-dim">' + escapeHtml(message) + '</span></div>',
        '<div class="terminal-line"><span class="terminal-prefix">_</span><span class="terminal-dim">Fix the URL and try again.</span></div>'
      ].join("");
      resultShell.innerHTML = [
        '<div class="result-card">',
        '<div class="pill status-failed u-mb12">Failed</div>',
        '<h2>Could not summarize the URL</h2>',
        '<p class="muted u-m0">' + escapeHtml(message) + '</p>',
        '</div>'
      ].join('');
      document.body.classList.add("has-result");
    }

    submitButton.addEventListener("click", () => {
      runSummary(input.value);
    });

    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      runSummary(input.value);
    });

    const presetUrl = new URLSearchParams(window.location.search).get("url");
    if (presetUrl) {
      input.value = normalizeUrlInput(presetUrl);
      window.__meimeiSummarizeUrl();
    }
    input.focus();

    window.__meimeiSetAlarm = () => {
      const alarmTime = document.querySelector("[data-alarm-time]")?.value || "06:00";
      const alarmNote = document.querySelector(".alarm-note");
      if (alarmNote) {
        alarmNote.textContent = "Daily briefing set for " + alarmTime;
      }
      alert("Alarm set for " + alarmTime + " — scheduling coming soon!");
    };
  </script>
</body>
</html>`;
}

export function renderDailyBriefingPage(layoutDoc, d) {
  const topbar = `<div class="topbar">
      <a class="button secondary" href="${d.escapeHtml(d.appsRoute)}">&larr; Back to Apps</a>
      <span class="title">${d.escapeHtml(d.explainItLabel)}</span>
    </div>`;
  const main = `<main class="hero">
      <section class="briefing-card">
        <h1>${d.escapeHtml(d.dailyBriefingLabel)}</h1>
        <p class="lede">Create a short daily briefing for MeiMei. Apple Notes is the default sink on macOS, and markdown is the fallback if Notes automation is unavailable.</p>
        <div class="field briefing-sink-field">
          <label for="briefingSink">Sink</label>
          <select id="briefingSink" data-briefing-sink>
            <option value="apple-notes" selected>Apple Notes</option>
            <option value="markdown">Markdown</option>
          </select>
        </div>
        <div class="route-actions">
          <button type="button" class="good" data-briefing-run>Create briefing</button>
        </div>
      </section>
      <section class="terminal-shell" id="terminalShell">
        <div class="terminal-line"><span class="terminal-prefix">$</span><span class="terminal-current">Ready to create today’s briefing.</span></div>
        <div class="terminal-line"><span class="terminal-prefix">&gt;</span><span class="terminal-dim">Apple Notes is the default sink.</span></div>
        <div class="terminal-line"><span class="terminal-prefix">_</span><span class="terminal-dim">Markdown fallback is available.</span></div>
      </section>
      <section class="result-shell" id="resultShell">
        <div class="result-card">
          <p class="muted u-m0">Press <strong>Create briefing</strong> to generate the note.</p>
        </div>
      </section>
      <div class="footer">The function writes to Apple Notes first and falls back to markdown for portability.</div>
    </main>`;
  const briefingFlow = d.buildLayoutFlowHtml(layoutDoc, d.miniappPageKey("daily-briefing"), { topbar, main }, d.escapeAttr);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${d.escapeHtml(d.dailyBriefingLabel)} - agent.meimei</title>
  <link rel="stylesheet" href="${d.escapeHtml(d.designSystemCssPath)}" />
</head>
<body data-theme="green">
  <div class="shell">
    ${briefingFlow}
  </div>
  <script>
    const runButton = document.querySelector("[data-briefing-run]");
    const sinkInput = document.querySelector("[data-briefing-sink]");
    const terminalShell = document.getElementById("terminalShell");
    const resultShell = document.getElementById("resultShell");

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function prettySink(value) {
      return value === "apple-notes" ? "Apple Notes" : value === "markdown" ? "Markdown fallback" : String(value || "Unknown");
    }

    function renderTerminal(lines) {
      terminalShell.innerHTML = lines.map((line, index) => {
        const prefix = index === 0 ? "$" : index === 1 ? ">" : "_";
        return '<div class="terminal-line"><span class="terminal-prefix">' + prefix + '</span><span class="terminal-dim">' + escapeHtml(line) + '</span></div>';
      }).join("");
      document.body.classList.add("has-result");
    }

    async function openResult(target, markdownPath = "") {
      const response = await fetch("${d.dailyBriefingOpenApiRoute}", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ target, markdownPath })
      });
      return await response.json();
    }

    function renderLoading() {
      const sinkLabel = prettySink(sinkInput.value);
      renderTerminal([
        "Collecting daily context.",
        "Building the briefing body.",
        "Writing to " + sinkLabel + "."
      ]);
      resultShell.innerHTML = [
        '<div class="result-card">',
        '<div class="pill">Working</div>',
        '<p class="muted u-mt12">The briefing is being assembled now.</p>',
        '</div>'
      ].join("");
    }

    function renderError(message) {
      renderTerminal([
        "The briefing did not complete.",
        message || "Apple Notes could not be reached.",
        "Markdown fallback remains available."
      ]);
      resultShell.innerHTML = [
        '<div class="result-card">',
        '<div class="pill status-failed u-mb12">Failed</div>',
        '<h2>Could not create the briefing</h2>',
        '<p class="muted u-m0">' + escapeHtml(message || "The briefing did not complete.") + '</p>',
        '</div>'
      ].join("");
    }

    function renderBriefing(data) {
      const sink = prettySink(data.sink);
      const sinkClass = data.sink === "apple-notes" ? "status-ok" : "status-limited";
      renderTerminal([
        "Briefing ready.",
        "Sink: " + sink,
        "Markdown: " + (data.markdownPath || "not written")
      ]);
      resultShell.innerHTML = [
        '<div class="result-card">',
        '<div class="pill ' + sinkClass + ' u-mb12">' + escapeHtml(sink) + '</div>',
        '<h2>' + escapeHtml(data.title || "MeiMei Daily Briefing") + '</h2>',
        '<p class="muted u-mt0">' + escapeHtml(data.noteError || "The briefing was created successfully.") + '</p>',
        '<div class="grid">',
        '<section class="panel">',
        '<h3>Priorities</h3>',
        '<ul>' + (Array.isArray(data.priorities) && data.priorities.length ? data.priorities.map((item) => '<li>' + escapeHtml(item) + '</li>').join("") : "<li>None</li>") + '</ul>',
        '</section>',
        '<section class="panel">',
        '<h3>Next up</h3>',
        '<ul>' + (Array.isArray(data.nextItems) && data.nextItems.length ? data.nextItems.map((item) => '<li>' + escapeHtml(item) + '</li>').join("") : "<li>None</li>") + '</ul>',
        '</section>',
        '<section class="panel">',
        '<h3>High-ICE focus</h3>',
        '<ul>' + (Array.isArray(data.focusItems) && data.focusItems.length ? data.focusItems.map((item) => '<li>' + escapeHtml(item) + '</li>').join("") : "<li>None</li>") + '</ul>',
        '</section>',
        '<section class="panel">',
        '<h3>Reminders</h3>',
        '<ul>' + (Array.isArray(data.reminders) && data.reminders.length ? data.reminders.map((item) => '<li>' + escapeHtml(item) + '</li>').join("") : "<li>None</li>") + '</ul>',
        '</section>',
        '</div>',
        '<div class="panel u-mt12">',
        '<h3>Workspace</h3>',
        '<div class="muted u-prewrap">' + escapeHtml(data.workspaceStatus || "No extra workspace changes detected.") + '</div>',
        '</div>',
        '<div class="panel u-mt12">',
        '<h3>Storage</h3>',
        '<div class="muted">Notes account: ' + escapeHtml(data.appleNotes?.accountName || "(default)") + '</div>',
        '<div class="muted">Apple Notes folder: ' + escapeHtml(data.folderName || "MeiMei") + '</div>',
        '<div class="muted">Notes target folder: ' + escapeHtml(data.appleNotes?.folderName || data.folderName || "MeiMei") + '</div>',
        '<div class="muted">Markdown fallback: ' + escapeHtml(data.markdownPath || "none") + '</div>',
        '</div>',
        '<div class="route-actions u-mt12">',
        '<button type="button" class="button secondary" data-open-markdown>Open markdown</button>',
        '<button type="button" class="button secondary" data-open-notes>Open Notes</button>',
        '</div>',
        '</div>'
      ].join("");
      document.body.classList.add("has-result");

      const openMarkdown = resultShell.querySelector("[data-open-markdown]");
      const openNotes = resultShell.querySelector("[data-open-notes]");
      openMarkdown?.addEventListener("click", async () => {
        const opened = await openResult("markdown", data.markdownPath || "");
        if (!opened?.ok) renderError(opened?.error || "Could not open markdown file.");
      });
      openNotes?.addEventListener("click", async () => {
        const opened = await openResult("notes", data.markdownPath || "");
        if (!opened?.ok) renderError(opened?.error || "Could not open Notes.");
      });
    }

    async function createBriefing() {
      renderLoading();
      window.scrollTo({ top: 0, behavior: "smooth" });
      try {
        const response = await fetch("${d.dailyBriefingApiRoute}", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sink: String(sinkInput.value || "apple-notes") })
        });
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.error || "The daily briefing could not be created.");
        }
        renderBriefing(data);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (error) {
        renderError(error instanceof Error ? error.message : String(error));
      }
    }

    runButton.addEventListener("click", createBriefing);
  </script>
</body>
</html>`;
}

export function renderWhatNextPage(layoutDoc, d) {
  const topbar = `<div class="topbar">
      <a class="button secondary" href="${d.escapeHtml(d.appsRoute)}">&larr; Back to Apps</a>
      <span class="title">${d.escapeHtml(d.whatNextLabel)}</span>
    </div>`;

  const main = `<main class="hero">
      <section class="search-card">
        <h1>${d.escapeHtml(d.whatNextLabel)}</h1>
        <p class="lede">Your daily guide — get prioritized recommendations based on your sources and AI analysis.</p>
        
        <div class="schedule-section">
          <h3>Schedule</h3>
          <div class="schedule-row">
            <label class="toggle-label">
              <input type="checkbox" data-schedule-toggle id="scheduleToggle" />
              <span>Daily briefing</span>
            </label>
            <input type="time" data-schedule-time value="06:00" aria-label="Briefing time" />
            <span class="schedule-label" id="scheduleLabel">Daily at 06:00</span>
          </div>
        </div>

        <div class="sources-section">
          <h3>Sources</h3>
          <div class="sources-grid">
            <label class="source-chip">
              <input type="checkbox" data-source="tasks" checked />
              <span>Tasks</span>
            </label>
            <label class="source-chip">
              <input type="checkbox" data-source="calendar" checked />
              <span>Calendar</span>
            </label>
            <label class="source-chip">
              <input type="checkbox" data-source="news" />
              <span>News</span>
            </label>
            <label class="source-chip">
              <input type="checkbox" data-source="email" />
              <span>Email</span>
            </label>
          </div>
        </div>

        <div class="action-row">
          <button type="button" class="good" data-run-briefing onclick="return window.__meimeiRunBriefing && window.__meimeiRunBriefing();">
            What's next?
          </button>
        </div>
      </section>

      <section class="terminal-shell" id="terminalShell" aria-live="polite" aria-atomic="false">
        <div class="terminal-header">
          <span class="terminal-badge">MeiMei thinking</span>
          <span class="terminal-dim" id="terminalMeta">Ready</span>
        </div>
        <div class="terminal-body" id="terminalBody">
          <div class="terminal-line"><span class="terminal-prefix">$</span><span class="terminal-current">Analyzing your sources...</span></div>
          <div class="terminal-line"><span class="terminal-prefix">></span><span class="terminal-dim">Click "What's next?" to get your daily recommendations.</span></div>
        </div>
      </section>

      <section class="result-shell" id="resultShell">
        <div class="result-card">
          <p class="muted u-m0">Click "What's next?" to get your prioritized recommendations for today.</p>
        </div>
      </section>

      <div class="footer">Powered by AI routing and your configured sources.</div>
    </main>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${d.escapeHtml(d.whatNextLabel)} - agent.meimei</title>
  <link rel="stylesheet" href="${d.escapeHtml(d.designSystemCssPath)}" />
</head>
<body data-theme="green">
  <div class="shell">
    <div class="layout-flow" style="--layout-cols-sm:1;--layout-cols-md:2;--layout-cols-lg:3">
      <div class="layout-box layout-span-md-2 layout-span-lg-3" data-layout-box="topbar">${topbar}</div>
      <div class="layout-box layout-span-md-2 layout-span-lg-3" data-layout-box="main">${main}</div>
    </div>
  </div>
  <script>
    const scheduleToggle = document.getElementById("scheduleToggle");
    const scheduleTime = document.querySelector("[data-schedule-time]");
    const scheduleLabel = document.getElementById("scheduleLabel");
    const runButton = document.querySelector("[data-run-briefing]");
    const resultShell = document.getElementById("resultShell");
    const terminalBody = document.getElementById("terminalBody");
    const terminalMeta = document.getElementById("terminalMeta");
    let progressTimer = null;

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function updateScheduleLabel() {
      const time = scheduleTime?.value || "06:00";
      const enabled = scheduleToggle?.checked;
      scheduleLabel.textContent = enabled ? "Daily at " + time : "Not scheduled";
    }

    scheduleToggle?.addEventListener("change", updateScheduleLabel);
    scheduleTime?.addEventListener("change", updateScheduleLabel);
    updateScheduleLabel();

    function setTerminal(lines, meta = "Analyzing") {
      terminalBody.innerHTML = lines.map((l) =>
        '<div class="terminal-line"><span class="terminal-prefix">$</span><span class="terminal-current">' + escapeHtml(l) + '</span></div>'
      ).join('');
      terminalMeta.textContent = meta;
    }

    function renderWorking() {
      setTerminal(["Gathering sources...", "Analyzing priorities...", "Generating recommendations..."], "Working");
      resultShell.innerHTML = [
        '<div class="result-card">',
        '<div class="pill">Thinking...</div>',
        '<p class="muted u-mt12">Analyzing your sources and generating recommendations.</p>',
        '</div>'
      ].join('');
      document.body.classList.add("has-result");
    }

    function renderRecommendations(data) {
      const recs = data.recommendations || [];
      if (recs.length === 0) {
        resultShell.innerHTML = [
          '<div class="result-card">',
          '<h2>No recommendations yet</h2>',
          '<p class="muted">Configure your sources and try again.</p>',
          '</div>'
        ].join('');
        return;
      }

      const cards = recs.map((r) => {
        const urgencyClass = r.urgency === "high" ? "status-failed" : r.urgency === "medium" ? "status-limited" : "status-ok";
        return '<div class="rec-card">' +
          '<div class="rec-rank">#' + r.rank + '</div>' +
          '<div class="rec-content">' +
            '<h3>' + escapeHtml(r.title) + '</h3>' +
            '<p class="rec-reasoning">' + escapeHtml(r.reasoning) + '</p>' +
            '<div class="rec-meta">' +
              '<span class="pill ' + urgencyClass + '">' + escapeHtml(r.urgency) + '</span>' +
              '<span class="rec-source">from ' + escapeHtml(r.source) + '</span>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');

      resultShell.innerHTML = [
        '<div class="result-card">',
        '<h2>Today\'s priorities</h2>',
        '<p class="muted u-mb12">Based on ' + escapeHtml((data.sources || []).join(", ")) + '</p>',
        cards,
        '</div>'
      ].join('');

      setTerminal(["Analysis complete.", recs.length + " recommendations generated."], "Done");
      document.body.classList.add("has-result");
    }

    function renderError(message) {
      setTerminal(["Error occurred.", escapeHtml(message)], "Failed");
      resultShell.innerHTML = [
        '<div class="result-card">',
        '<div class="pill status-failed u-mb12">Failed</div>',
        '<h2>Could not generate recommendations</h2>',
        '<p class="muted u-m0">' + escapeHtml(message) + '</p>',
        '</div>'
      ].join('');
      document.body.classList.add("has-result");
    }

    window.__meimeiRunBriefing = async () => {
      const sources = [];
      document.querySelectorAll("[data-source]:checked").forEach((el) => {
        sources.push(el.dataset.source);
      });

      if (sources.length === 0) {
        renderError("Select at least one source");
        return;
      }

      renderWorking();

      try {
        const response = await fetch("${d.whatNextApiRoute}", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sources, priority: "high" })
        });
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.error || "Could not generate recommendations");
        }
        renderRecommendations(data);
      } catch (error) {
        renderError(error instanceof Error ? error.message : String(error));
      }
    };

    runButton?.addEventListener("click", () => {
      window.__meimeiRunBriefing && window.__meimeiRunBriefing();
    });
  </script>
</body>
</html>`;
}

export function renderWhatNextSettingsPage(layoutDoc, d) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${d.escapeHtml(d.whatNextLabel)} Settings - agent.meimei</title>
  <link rel="stylesheet" href="${d.escapeHtml(d.designSystemCssPath)}" />
</head>
<body data-theme="green">
  <div class="shell">
    <div class="topbar">
      <a class="button secondary" href="${d.escapeHtml(d.appsRoute)}">&larr; Back to Apps</a>
      <span class="title">${d.escapeHtml(d.whatNextLabel)} Settings</span>
    </div>
    <main class="hero">
      <section class="search-card">
        <h1>${d.escapeHtml(d.whatNextLabel)} Settings</h1>
        <p class="lede">Configure your sources and preferences for daily recommendations.</p>
        
        <div class="settings-form">
          <h3>Data Sources</h3>
          <p class="muted">Select which sources to include in your daily recommendations.</p>
          
          <div class="field-group">
            <label class="field-checkbox">
              <input type="checkbox" id="source-tasks" value="tasks" checked />
              <span>Tasks</span>
              <small>Reads from your tasks.md file</small>
            </label>
            
            <label class="field-checkbox">
              <input type="checkbox" id="source-calendar" value="calendar" checked />
              <span>Calendar</span>
              <small>Upcoming events and meetings</small>
            </label>
            
            <label class="field-checkbox">
              <input type="checkbox" id="source-news" value="news" />
              <span>News</span>
              <small>RSS feeds and industry updates (coming soon)</small>
            </label>
            
            <label class="field-checkbox">
              <input type="checkbox" id="source-email" value="email" />
              <span>Email</span>
              <small>Unread messages from Apple Mail</small>
            </label>
          </div>

          <h3>Schedule</h3>
          <div class="field-group">
            <label class="field-checkbox">
              <input type="checkbox" id="schedule-enabled" />
              <span>Enable daily briefing</span>
            </label>
            <div class="field-row">
              <label for="schedule-time">Time:</label>
              <input type="time" id="schedule-time" value="06:00" />
            </div>
          </div>

          <h3>Connected Services</h3>
          <div class="services-grid">
            <div class="service-card">
              <span class="service-icon">&#128196;</span>
              <span class="service-name">Tasks</span>
              <span class="service-status connected">Connected</span>
            </div>
            <div class="service-card">
              <span class="service-icon">&#128197;</span>
              <span class="service-name">Calendar</span>
              <span class="service-status connected">Connected</span>
            </div>
            <div class="service-card">
              <span class="service-icon">&#128240;</span>
              <span class="service-name">News</span>
              <span class="service-status">Not configured</span>
            </div>
            <div class="service-card">
              <span class="service-icon">&#9993;</span>
              <span class="service-name">Email</span>
              <span class="service-status">Not configured</span>
            </div>
          </div>
          
          <div class="actions">
            <button type="button" class="good" id="saveBtn">Save settings</button>
          </div>
        </div>
      </section>
    </main>
  </div>
  <script>
    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    const STORAGE_KEY = 'meimei-what-next-config';

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
      const sources = config.sources || ['tasks', 'calendar'];
      document.getElementById('source-tasks').checked = sources.includes('tasks');
      document.getElementById('source-calendar').checked = sources.includes('calendar');
      document.getElementById('source-news').checked = sources.includes('news');
      document.getElementById('source-email').checked = sources.includes('email');
      document.getElementById('schedule-enabled').checked = config.scheduleEnabled || false;
      document.getElementById('schedule-time').value = config.scheduleTime || '06:00';
    }

    function getConfig() {
      const sources = [];
      if (document.getElementById('source-tasks').checked) sources.push('tasks');
      if (document.getElementById('source-calendar').checked) sources.push('calendar');
      if (document.getElementById('source-news').checked) sources.push('news');
      if (document.getElementById('source-email').checked) sources.push('email');
      return {
        sources,
        scheduleEnabled: document.getElementById('schedule-enabled').checked,
        scheduleTime: document.getElementById('schedule-time').value
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


export function renderExplainItSettingsPage(layoutDoc, d) {
  const topbar = `<div class="topbar">
      <a class="button secondary" href="${d.escapeHtml(d.appsRoute)}">&larr; Back to Apps</a>
      <span class="title">${d.escapeHtml(d.explainItLabel)} Settings</span>
    </div>`;
  const main = `<main class="hero">
      <section class="search-card">
        <h1>${d.escapeHtml(d.explainItLabel)} Settings</h1>
        <p class="lede">Configure how Explain it fetches and summarizes content.</p>
        
        <div class="settings-form">
          <h3>Default Sources</h3>
          <p class="muted">Set which sources to check by default.</p>
          
          <div class="field-group">
            <label class="field-checkbox">
              <input type="checkbox" id="source-rss" value="rss" checked />
              <span>RSS Feeds</span>
              <small>Fetch articles from configured feed URLs</small>
            </label>
            
            <label class="field-checkbox">
              <input type="checkbox" id="source-web" value="web" checked />
              <span>Web Pages</span>
              <small>Summarize URLs you paste or link</small>
            </label>
          </div>

          <h3>RSS Feeds</h3>
          <p class="muted">Add your favorite news and blog feeds.</p>
          <div class="field-group">
            <div class="field-row">
              <label for="rss-url">Feed URL:</label>
              <input type="url" id="rss-url" placeholder="https://example.com/feed.xml" style="flex:1" />
            </div>
          </div>

          <h3>Summary Preferences</h3>
          <div class="field-group">
            <label class="field-checkbox">
              <input type="checkbox" id="include-key-facts" checked />
              <span>Include key facts</span>
              <small>Extract names, dates, numbers, decisions</small>
            </label>
            
            <label class="field-checkbox">
              <input type="checkbox" id="include-next-steps" />
              <span>Include next steps</span>
              <small>Suggest action items from the content</small>
            </label>
          </div>
          
          <div class="actions">
            <button type="button" class="good" id="saveBtn">Save settings</button>
          </div>
        </div>
      </section>
    </main>`;
  const layout = d.buildLayoutFlowHtml(layoutDoc, d.miniappPageKey("explain-it"), { topbar, main }, d.escapeAttr);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${d.escapeHtml(d.explainItLabel)} Settings - agent.meimei</title>
  <link rel="stylesheet" href="${d.escapeHtml(d.designSystemCssPath)}" />
</head>
<body data-theme="green">
  <div class="shell">
    ${layout}
  </div>
  <script>
    const STORAGE_KEY = 'meimei-explain-it-config';

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
      const sources = config.sources || ['rss', 'web'];
      document.getElementById('source-rss').checked = sources.includes('rss');
      document.getElementById('source-web').checked = sources.includes('web');
      document.getElementById('include-key-facts').checked = config.includeKeyFacts !== false;
      document.getElementById('include-next-steps').checked = config.includeNextSteps || false;
      document.getElementById('rss-url').value = config.rssUrl || '';
    }

    function getConfig() {
      const sources = [];
      if (document.getElementById('source-rss').checked) sources.push('rss');
      if (document.getElementById('source-web').checked) sources.push('web');
      return {
        sources,
        includeKeyFacts: document.getElementById('include-key-facts').checked,
        includeNextSteps: document.getElementById('include-next-steps').checked,
        rssUrl: document.getElementById('rss-url').value
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
