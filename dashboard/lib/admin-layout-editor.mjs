import { pageBoxMeta } from "./page-layout.mjs";

/**
 * Inline script for Admin → Page layout (drag reorder, span radios, save).
 * @param {object} layoutDoc merged layout from loadPageLayoutMerged
 * @param {string} pageLayoutApiRoute e.g. /api/page-layout
 * @param {object} registry parsed registry
 */
export function buildAdminLayoutEditorScript(layoutDoc, pageLayoutApiRoute, registry) {
  const meta = pageBoxMeta(registry);
  const metaJson = JSON.stringify(meta).replace(/</g, "\\u003c");
  const layoutJson = JSON.stringify(layoutDoc).replace(/</g, "\\u003c");
  const apiJson = JSON.stringify(pageLayoutApiRoute);

  return `
    (function meimeiLayoutEditor() {
      const LME_META = JSON.parse(${JSON.stringify(metaJson)});
      let LME_WORKING = JSON.parse(${JSON.stringify(layoutJson)});
      const LME_API = ${apiJson};

      const listEl = document.getElementById("meimei-layout-rows");
      const pageSel = document.getElementById("meimei-layout-page");
      const colsSel = document.getElementById("meimei-layout-desktop-cols");
      const statusEl = document.getElementById("meimei-layout-status");
      if (!listEl || !pageSel || !colsSel) return;

      function maxSpan() {
        return Math.min(10, parseInt(colsSel.value, 10) || 3);
      }

      function boxLabel(pageKey, id) {
        const m = LME_META[pageKey];
        return (m && m.boxes && m.boxes[id]) || id;
      }

      function renderRows() {
        const pk = pageSel.value;
        if (!LME_WORKING.pages[pk]) LME_WORKING.pages[pk] = { items: [] };
        const items = LME_WORKING.pages[pk].items;
        listEl.innerHTML = "";
        items.forEach((item, index) => {
          const li = document.createElement("li");
          li.className = "layout-editor-row";
          li.draggable = true;
          li.dataset.index = String(index);

          if (item.type === "break") {
            li.dataset.kind = "break";
            const h = document.createElement("span");
            h.className = "layout-editor-handle";
            h.textContent = "⋮⋮";
            const mid = document.createElement("div");
            const t = document.createElement("strong");
            t.textContent = "New line";
            const p = document.createElement("p");
            p.className = "muted u-m0";
            p.textContent = "Next block starts on a new row.";
            mid.appendChild(t);
            mid.appendChild(p);
            const rm = document.createElement("button");
            rm.type = "button";
            rm.className = "button secondary";
            rm.textContent = "Remove";
            rm.addEventListener("click", () => {
              items.splice(index, 1);
              renderRows();
            });
            li.appendChild(h);
            li.appendChild(mid);
            li.appendChild(rm);
          } else {
            li.dataset.kind = "box";
            li.dataset.boxId = item.id;
            const h = document.createElement("span");
            h.className = "layout-editor-handle";
            h.textContent = "⋮⋮";
            const mid = document.createElement("div");
            const t = document.createElement("strong");
            t.textContent = boxLabel(pk, item.id);
            const spanWrap = document.createElement("div");
            spanWrap.className = "layout-editor-span";
            const ms = maxSpan();
            const sm = Math.min(Math.max(1, parseInt(item.spanMax, 10) || 1), ms);
            const gname = "lme-span-" + pk.replace(/[^a-z0-9]/gi, "_") + "-" + index;
            for (let s = 1; s <= ms; s++) {
              const lab = document.createElement("label");
              lab.className = "layout-span-opt";
              const inp = document.createElement("input");
              inp.type = "radio";
              inp.name = gname;
              inp.value = String(s);
              if (s === sm) inp.checked = true;
              inp.addEventListener("change", () => {
                if (inp.checked) items[index].spanMax = parseInt(inp.value, 10);
              });
              lab.appendChild(inp);
              lab.appendChild(document.createTextNode(" " + s + " unit" + (s > 1 ? "s" : "")));
              spanWrap.appendChild(lab);
            }
            mid.appendChild(t);
            mid.appendChild(spanWrap);
            const rm = document.createElement("button");
            rm.type = "button";
            rm.className = "button secondary";
            rm.textContent = "Remove";
            rm.addEventListener("click", () => {
              items.splice(index, 1);
              renderRows();
            });
            li.appendChild(h);
            li.appendChild(mid);
            li.appendChild(rm);
          }
          listEl.appendChild(li);
        });
      }

      let dragFrom = null;
      listEl.addEventListener("dragstart", (e) => {
        const row = e.target.closest(".layout-editor-row");
        if (!row) return;
        dragFrom = parseInt(row.dataset.index, 10);
        e.dataTransfer.effectAllowed = "move";
      });
      listEl.addEventListener("dragover", (e) => e.preventDefault());
      listEl.addEventListener("drop", (e) => {
        e.preventDefault();
        const row = e.target.closest(".layout-editor-row");
        if (!row || dragFrom == null) return;
        const to = parseInt(row.dataset.index, 10);
        if (Number.isNaN(to) || dragFrom === to) return;
        const pk = pageSel.value;
        const arr = LME_WORKING.pages[pk].items;
        const [moved] = arr.splice(dragFrom, 1);
        arr.splice(to, 0, moved);
        dragFrom = null;
        renderRows();
      });

      pageSel.addEventListener("change", () => renderRows());
      colsSel.addEventListener("change", () => {
        LME_WORKING.desktopColumnCount = parseInt(colsSel.value, 10) || 3;
        renderRows();
      });

      const addBreak = document.getElementById("meimei-layout-add-break");
      if (addBreak) {
        addBreak.addEventListener("click", () => {
          const pk = pageSel.value;
          if (!LME_WORKING.pages[pk]) LME_WORKING.pages[pk] = { items: [] };
          LME_WORKING.pages[pk].items.push({ type: "break" });
          renderRows();
        });
      }

      const saveBtn = document.getElementById("meimei-layout-save");
      if (saveBtn) {
        saveBtn.addEventListener("click", async () => {
          const pk = pageSel.value;
          const rows = [...listEl.querySelectorAll(".layout-editor-row")];
          const items = [];
          rows.forEach((row) => {
            if (row.dataset.kind === "break") items.push({ type: "break" });
            else {
              const id = row.dataset.boxId;
              const checked = row.querySelector(".layout-editor-span input[type=radio]:checked");
              const spanMax = checked ? parseInt(checked.value, 10) : 1;
              if (id) items.push({ id, spanMax });
            }
          });
          statusEl.textContent = "Saving…";
          try {
            const res = await fetch(LME_API, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                pageKey: pk,
                desktopColumnCount: parseInt(colsSel.value, 10) || 3,
                items
              })
            });
            const data = await res.json();
            if (!data.ok) throw new Error(data.error || "Save failed");
            LME_WORKING = data.layout;
            statusEl.textContent = "Saved.";
          } catch (err) {
            statusEl.textContent = err instanceof Error ? err.message : String(err);
          }
        });
      }

      renderRows();
    })();
  `;
}
