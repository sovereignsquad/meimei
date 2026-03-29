/**
 * Platform UI — System monitor (queue explorer) GET HTML.
 * @version 1.0.0
 * @aligned package agent-meimei 0.8.10
 */

/**
 * @param {unknown} layoutDoc
 * @param {object} d toolsRoute, monitor feed API path, layout + escape helpers
 */
export function renderSystemMonitorPage(layoutDoc, d) {
  const backHref = d.toolsRoute;
  const topbar = `<div class="topbar">
      <a class="button secondary" href="${d.escapeHtml(backHref)}">&larr; Back to Tools</a>
      <span class="title">System monitor</span>
    </div>`;
  const main = `<main class="hero">
      <section class="route-card">
        <h1 class="u-mt0">Queue explorer</h1>
        <p class="lede u-mb12">Read-only <strong>Milestone H</strong> view of <code>meimei_jobs</code> — <code>app_task</code> and <code>inference_v1</code> in one stream. Click a row to show the full <code>trace_id</code> lineage (request → inference → reply). Large Claim Check bodies are <strong>not</strong> loaded; only the artifact path is shown.</p>
        <p class="muted u-mb12" style="font-size:13px;">Polls <code>${d.escapeHtml(d.meimeiMonitorFeedApiRoute)}</code> every ~2.5s. No mutations.</p>
        <div class="route-actions u-mb12" style="flex-wrap:wrap;gap:10px;align-items:center;">
          <span id="smFilterLabel" class="muted" style="font-size:13px;">Newest jobs (global).</span>
          <button type="button" class="button secondary" id="smClearTrace" style="display:none;">Clear trace filter</button>
        </div>
        <div id="smError" class="result-card u-mb12" style="display:none;border-color:#b91c1c;"></div>
        <div id="smFeed" class="sm-feed"></div>
      </section>
    </main>
    <style>
      .sm-feed { max-height:70vh; overflow-y:auto; border:1px solid var(--line, #334155); border-radius:12px; padding:8px; background:rgba(4,10,20,0.35); }
      .sm-line-wrap { margin:6px 0; }
      .sm-line { padding:8px 10px; border-radius:8px; cursor:pointer; border:1px solid transparent; font-family:ui-monospace,monospace;font-size:13px;line-height:1.45; }
      .sm-line:hover { background:rgba(255,255,255,0.06); }
      .sm-line--focus { outline:1px solid rgba(59,130,246,0.55); }
      .sm-artifact { margin:2px 0 0 8px; font-size:12px; color:var(--muted,#94a3b8); font-family:ui-monospace,monospace; }
    </style>`;
  const layout = d.buildLayoutFlowHtml(
    layoutDoc,
    d.miniappPageKey("system-monitor"),
    { topbar, main },
    d.escapeAttr
  );
  const feedPathJson = JSON.stringify(d.meimeiMonitorFeedApiRoute);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>System monitor - agent.meimei</title>
  <link rel="stylesheet" href="${d.escapeHtml(d.designSystemCssPath)}" />
</head>
<body data-theme="green" data-page="system-monitor">
  <div class="shell">${layout}</div>
  <script>
    (function () {
      var feedPath = ${feedPathJson};
      function apiDashPrefix() {
        var p = window.location.pathname || "";
        return (p === "/dashboard" || p.indexOf("/dashboard/") === 0) ? "/dashboard" : "";
      }
      var traceFilter = null;
      var focusJobId = null;
      var feedEl = document.getElementById("smFeed");
      var errEl = document.getElementById("smError");
      var lblEl = document.getElementById("smFilterLabel");
      var clearBtn = document.getElementById("smClearTrace");

      function setError(msg) {
        if (!errEl) return;
        if (!msg) {
          errEl.style.display = "none";
          errEl.textContent = "";
          return;
        }
        errEl.style.display = "block";
        errEl.textContent = msg;
      }

      function renderItems(items) {
        if (!feedEl) return;
        feedEl.innerHTML = "";
        if (!items || items.length === 0) {
          feedEl.textContent = "(no rows)";
          return;
        }
        for (var i = 0; i < items.length; i++) {
          var it = items[i];
          var wrap = document.createElement("div");
          wrap.className = "sm-line-wrap";
          var line = document.createElement("div");
          line.className = "sm-line" + (focusJobId && Number(it.id) === focusJobId ? " sm-line--focus" : "");
          line.textContent = it.display_line || "";
          line.setAttribute("data-trace-id", it.trace_id || "");
          line.setAttribute("data-job-id", String(it.id));
          line.setAttribute("role", "button");
          line.setAttribute("tabindex", "0");
          line.addEventListener("click", function (ev) {
            var el = ev.currentTarget;
            traceFilter = el.getAttribute("data-trace-id") || null;
            focusJobId = Number(el.getAttribute("data-job-id")) || null;
            if (lblEl) {
              lblEl.textContent = traceFilter
                ? ("Trace lineage: " + traceFilter)
                : "Newest jobs (global).";
            }
            if (clearBtn) clearBtn.style.display = traceFilter ? "inline-block" : "none";
            loadFeed();
          });
          line.addEventListener("keydown", function (ev) {
            if (ev.key === "Enter" || ev.key === " ") {
              ev.preventDefault();
              line.click();
            }
          });
          wrap.appendChild(line);
          if (it.artifact_path) {
            var art = document.createElement("div");
            art.className = "sm-artifact";
            art.textContent = "\u{1F4CE} Artifact generated: " + it.artifact_path;
            wrap.appendChild(art);
          }
          feedEl.appendChild(wrap);
        }
      }

      async function loadFeed() {
        try {
          setError("");
          var q = new URLSearchParams();
          q.set("limit", traceFilter ? "400" : "120");
          if (traceFilter) q.set("trace_id", traceFilter);
          var url = apiDashPrefix() + feedPath + "?" + q.toString();
          var res = await fetch(url, { cache: "no-store" });
          var data = await res.json().catch(function () { return null; });
          if (!data || !data.ok) {
            setError((data && data.error) ? String(data.error) : "Feed request failed.");
            return;
          }
          renderItems(data.items || []);
        } catch (e) {
          setError(String(e && e.message ? e.message : e));
        }
      }

      if (clearBtn) {
        clearBtn.addEventListener("click", function () {
          traceFilter = null;
          focusJobId = null;
          if (lblEl) lblEl.textContent = "Newest jobs (global).";
          clearBtn.style.display = "none";
          loadFeed();
        });
      }

      loadFeed();
      setInterval(loadFeed, 2500);
    })();
  </script>
</body>
</html>`;
}
