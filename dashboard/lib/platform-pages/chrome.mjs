/**
 * Shared dashboard chrome — global nav, flashcards, list helper.
 * @see docs/architecture/meimei-kernel-completion-plan.v1.md Phase K2
 * @version 1.0.0
 * @aligned package agent-meimei 0.8.13
 */

/**
 * @param {unknown[]} items
 * @param {{ escapeHtml: (s: string) => string }} d
 */
export function renderList(items, d) {
  const list = Array.isArray(items) ? items.map((item) => String(item).trim()).filter(Boolean) : [];
  if (!list.length) return "<li class=\"muted\">None</li>";
  return list.map((item) => `<li>${d.escapeHtml(item)}</li>`).join("");
}

/**
 * @param {{ kind: string, title: string, content: string, href?: string, button?: boolean, attrs?: string, settingsHref?: string }} opts
 * @param {{ escapeHtml: (s: string) => string }} d
 */
export function renderFlashcard(
  { kind, title, content, href = "", button = false, attrs = "", settingsHref = "" },
  d
) {
  const cardHtml = `<span class="ds-flashcard-kind">${d.escapeHtml(kind)}</span><h3 class="ds-flashcard-title">${d.escapeHtml(title)}</h3><div class="ds-flashcard-content">${d.escapeHtml(content)}</div>`;
  if (button) {
    return `<button type="button" class="ds-flashcard"${attrs ? ` ${attrs}` : ""}>${cardHtml}</button>`;
  }
  const settingsLink = settingsHref
    ? `<a class="ds-flashcard-settings" href="${d.escapeHtml(settingsHref)}" title="Settings" onclick="event.stopPropagation();">⚙️</a>`
    : "";
  return `<a class="ds-flashcard" href="${d.escapeHtml(href)}">${cardHtml}${settingsLink}</a>`;
}

/**
 * @param {string} activePage
 * @param {{
 *   escapeHtml: (s: string) => string,
 *   openclawChatUrl: string,
 *   openclawLogoPath: string,
 *   dashboardLogoPath: string,
 *   knowmoreLogoPath: string,
 *   adminLogoPath: string,
 *   appsRoute: string,
 *   toolsRoute: string,
 *   homeRoute: string,
 *   knowmoreRoute: string,
 *   adminRoute: string
 * }} d
 */
export function renderGlobalNav(activePage, d) {
  const navId = "global-nav-actions";
  const toggleId = "global-nav-toggle";
  return `
      <button
        id="${toggleId}"
        class="nav-toggle"
        type="button"
        aria-expanded="false"
        aria-controls="${navId}"
      >
        Menu
      </button>
      <div id="${navId}" class="nav-actions" data-nav-actions>
        <a class="nav-chip openclaw" href="${d.escapeHtml(d.openclawChatUrl)}">
          <img src="${d.escapeHtml(d.openclawLogoPath)}" alt="OpenClaw logo" />
          <span>OpenClaw</span>
        </a>
        <a class="nav-chip ${activePage === "apps" ? "active" : ""}" href="${d.escapeHtml(d.appsRoute)}">
          <img src="${d.escapeHtml(d.dashboardLogoPath)}" alt="Apps logo" />
          <span>Apps</span>
        </a>
        <a class="nav-chip ${activePage === "tools" ? "active" : ""}" href="${d.escapeHtml(d.toolsRoute)}">
          <img src="${d.escapeHtml(d.dashboardLogoPath)}" alt="Tools logo" />
          <span>Tools</span>
        </a>
        <a class="nav-chip ${activePage === "dashboard" ? "active" : ""}" href="${d.escapeHtml(d.homeRoute)}">
          <img src="${d.escapeHtml(d.dashboardLogoPath)}" alt="Dashboard logo" />
          <span>Dashboard</span>
        </a>
        <a class="nav-chip ${activePage === "knowmore" ? "active" : ""}" href="${d.escapeHtml(d.knowmoreRoute)}">
          <img src="${d.escapeHtml(d.knowmoreLogoPath)}" alt="knowmore logo" />
          <span>knowmore</span>
        </a>
        <a class="nav-chip ${activePage === "admin" ? "active" : ""}" href="${d.escapeHtml(d.adminRoute)}">
          <img src="${d.escapeHtml(d.adminLogoPath)}" alt="Admin logo" />
          <span>Admin</span>
        </a>
      </div>`;
}

export function renderGlobalNavScript() {
  return `
    (function initGlobalNav() {
      const nav = document.querySelector('[data-nav-actions]');
      const toggle = document.getElementById('global-nav-toggle');
      if (!nav || !toggle) return;

      function closeNav() {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }

      function openNav() {
        nav.classList.add('is-open');
        toggle.setAttribute('aria-expanded', 'true');
      }

      function syncForViewport() {
        if (window.matchMedia('(min-width: 901px)').matches) {
          openNav();
        } else {
          closeNav();
        }
      }

      toggle.addEventListener('click', () => {
        if (nav.classList.contains('is-open')) {
          closeNav();
          return;
        }
        openNav();
      });

      window.addEventListener('resize', syncForViewport);
      syncForViewport();
    })();
  `;
}
