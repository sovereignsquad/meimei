/**
 * Platform UI — GET HTML for **Apps**, **Tools**, and **knowmore** catalog surfaces.
 * Injected dependencies keep `dashboard/server.mjs` thin for these routes (Phase 0).
 *
 * @version 1.0.0
 * @aligned package agent-meimei 0.8.13
 */

/**
 * @param {unknown} layoutDoc
 * @param {object} d registry, flashcards, layout helpers, and surface (from `server.mjs`)
 */
export function renderAppsPage(layoutDoc, d) {
  const apps = d.miniappRuntimeConfig(d.loadRegistrySync()).catalog.filter((c) => c.category === "apps");
  const cardsHtml = apps
    .map((app) =>
      d.renderFlashcard({
        kind: `APP #${app.issueId}`,
        title: app.name,
        content: d.toSummary160(app.description),
        href: app.route,
        settingsHref: app.id === "checklist" ? "" : `${app.route}/settings`
      })
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Apps - agent.meimei</title>
  <link rel="stylesheet" href="${d.escapeHtml(d.designSystemCssPath)}" />
</head>
<body data-page="apps" data-theme="green">
  <div class="shell">
    <div class="topnav">
      <h1 class="title">Apps</h1>
      ${d.renderGlobalNav("apps")}
    </div>
    <section class="card section">
      <h2>Your tools</h2>
      <p class="sub">Everyday tasks at your fingertips.</p>
      <div class="ds-flashcard-grid">${cardsHtml}</div>
    </section>
  </div>
  <script>
    ${d.renderGlobalNavScript()}
  </script>
</body>
</html>`;
}

/**
 * @param {unknown} layoutDoc
 * @param {object} d registry, flashcards, layout helpers, and surface (from `server.mjs`)
 */
export function renderToolsPage(layoutDoc, d) {
  const tools = d.miniappRuntimeConfig(d.loadRegistrySync()).catalog.filter((c) => c.category === "tools");
  const systemMonitorCard = d.renderFlashcard({
    kind: "PLATFORM",
    title: "System monitor",
    content: "Live read-only Queue Explorer for meimei_jobs — trace lineage and Claim Check artifact paths.",
    href: d.browserPathForNormalized(d.systemMonitorRoute),
    settingsHref: ""
  });
  const cardsHtml = tools
    .map((app) =>
      d.renderFlashcard({
        kind: `TOOL #${app.issueId}`,
        title: app.name,
        content: d.toSummary160(app.description),
        href: app.route,
        settingsHref: `${app.route}/settings`
      })
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Tools - agent.meimei</title>
  <link rel="stylesheet" href="${d.escapeHtml(d.designSystemCssPath)}" />
</head>
<body data-page="tools" data-theme="blue">
  <div class="shell">
    <div class="topnav">
      <h1 class="title">Tools</h1>
      ${d.renderGlobalNav("tools")}
    </div>
    <section class="card section">
      <h2>System configuration</h2>
      <p class="sub">Configure and manage the system.</p>
      <div class="ds-flashcard-grid">${systemMonitorCard}${cardsHtml}</div>
    </section>
  </div>
  <script>
    ${d.renderGlobalNavScript()}
  </script>
</body>
</html>`;
}

/**
 * @param {unknown} layoutDoc
 * @param {object} d registry, flashcards, layout helpers, and surface (from `server.mjs`)
 */
export function renderKnowmorePage(layoutDoc, d) {
  const releases = d.knowmoreReleases.map((item) => ({
    ...item,
    state: item.state === "closed" ? "closed" : "open",
    summary: d.toSummary160(item.summary),
    issueUrl: d.resolveIssueUrl(d.surface, item.issue)
  }));
  const releaseJson = JSON.stringify(releases).replace(/</g, "\\u003c");

  const knowFlow = d.buildLayoutFlowHtml(layoutDoc, "knowmore", {
    flashcards: `<section class="card section">
      <h2>Issue flashcards</h2>
      <p class="sub">Foundation spine for <strong>agent.meimei</strong> on the unified repo board — <a href="${d.escapeHtml(d.knowmoreBoardUrl)}" target="_blank" rel="noopener noreferrer">MVP Factory Project 1</a> (filter product in GitHub). Issue numbers match <code>mvp-factory-control</code>. <strong>Open</strong> / <strong>Done</strong> on cards reflects the last sync in <code>config/knowmore-releases.v1.json</code>; verify on GitHub before planning sprints.</p>
      <p class="sub muted">Click a card for details and operator steps.</p>
      <div class="ds-flashcard-grid" id="cards"></div>
    </section>`
  }, d.escapeAttr);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>knowmore - release cards</title>
  <link rel="stylesheet" href="${d.escapeHtml(d.designSystemCssPath)}" />
</head>
<body data-page="knowmore" data-theme="blue">
  <div class="shell">
    <div class="topnav">
      <h1 class="title">knowmore</h1>
      ${d.renderGlobalNav("knowmore")}
    </div>
    ${knowFlow}
  </div>

  <div class="modal-backdrop" id="modalBackdrop" role="dialog" aria-modal="true">
    <div class="modal">
      <div class="head">
        <h2 id="mTitle">Issue</h2>
        <button class="button secondary" id="mClose" type="button">Close</button>
      </div>
      <p id="mSummary"></p>
      <p id="mState" class="knowmore-issue-state" aria-live="polite"></p>
      <div class="actions">
        <a id="mIssue" class="button secondary" href="#" target="_blank" rel="noopener noreferrer">Open related issue</a>
      </div>
      <p id="mIssueUrl" class="issue-url"></p>
      <h3>Details</h3>
      <p id="mDetails"></p>
      <h3>User manual</h3>
      <ul id="mManual"></ul>
    </div>
  </div>

  <script>
    ${d.renderGlobalNavScript()}
    const releases = ${releaseJson};
    const cards = document.getElementById('cards');
    const backdrop = document.getElementById('modalBackdrop');
    const closeBtn = document.getElementById('mClose');
    const mTitle = document.getElementById('mTitle');
    const mSummary = document.getElementById('mSummary');
    const mState = document.getElementById('mState');
    const mIssue = document.getElementById('mIssue');
    const mIssueUrl = document.getElementById('mIssueUrl');
    const mDetails = document.getElementById('mDetails');
    const mManual = document.getElementById('mManual');

    function openModal(item) {
      mTitle.textContent = '#' + item.issue + ' - ' + item.title;
      mSummary.textContent = item.summary;
      if (mState) {
        mState.textContent = item.state === 'closed'
          ? 'GitHub state (synced): closed — confirm on issue before treating as done.'
          : 'GitHub state (synced): open';
      }
      mIssue.href = item.issueUrl;
      mIssue.textContent = 'Related issue #' + item.issue;
      mIssueUrl.textContent = item.issueUrl;
      mDetails.textContent = item.details;
      mManual.innerHTML = '';
      (item.manual || []).forEach((step) => {
        const li = document.createElement('li');
        li.textContent = step;
        mManual.appendChild(li);
      });
      backdrop.classList.add('is-open');
    }

    function closeModal() {
      backdrop.classList.remove('is-open');
    }

    function createIssueCard(item) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'ds-flashcard';

      const kind = document.createElement('span');
      kind.className = 'ds-flashcard-kind' + (item.state === 'closed' ? ' ds-flashcard-kind--done' : '');
      kind.textContent = 'ISSUE #' + item.issue + (item.state === 'closed' ? ' · Done' : ' · Open');

      const title = document.createElement('h3');
      title.className = 'ds-flashcard-title';
      title.textContent = item.title;

      const content = document.createElement('div');
      content.className = 'ds-flashcard-content';
      content.textContent = item.summary;

      button.appendChild(kind);
      button.appendChild(title);
      button.appendChild(content);
      button.addEventListener('click', () => openModal(item));
      return button;
    }

    releases.forEach((item) => {
      cards.appendChild(createIssueCard(item));
    });

    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) closeModal();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeModal();
    });
  </script>
</body>
</html>`;
}
