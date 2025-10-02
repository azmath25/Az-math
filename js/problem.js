// js/problem.js
// Load single problem by id (localStorage fallback). Show created date and hide solution until button click.

const STORE_KEY = "azmath_problems_v1";

document.addEventListener("DOMContentLoaded", () => {
  const titleEl = document.getElementById("problem-title");
  const metaEl = document.getElementById("problem-meta");
  const statementEl = document.getElementById("problem-statement");
  const showBtn = document.getElementById("show-solution");
  const solutionEl = document.getElementById("solution-container");

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) {
    titleEl.textContent = "Problem not found";
    statementEl.textContent = "Missing problem id in URL.";
    return;
  }

  const problems = loadProblemsFromStore();
  const p = problems.find(x => x.id === id);
  if (!p) {
    titleEl.textContent = "Problem not found";
    statementEl.textContent = `No problem with id="${id}"`;
    return;
  }

  titleEl.textContent = p.title || "(no title)";
  const created = formatDateNice(p.createdAt);
  metaEl.textContent = `📅 Created: ${created}${p.updatedAt ? ` — Updated: ${formatDateNice(p.updatedAt)}` : ""}`;

  // render statement (basic support for HTML)
  statementEl.innerHTML = (p.statement || "").replace(/\n/g, "<br>");

  if (p.solution && p.solution.trim()) {
    showBtn.style.display = "inline-block";
    showBtn.addEventListener("click", () => {
      solutionEl.style.display = "block";
      solutionEl.innerHTML = `<div class="card"><strong>Solution</strong><div style="margin-top:8px">${escapeHtml(p.solution).replace(/\n/g,"<br>")}</div></div>`;
      showBtn.style.display = "none";
    });
  }

  // images
  if (p.images && p.images.length) {
    p.images.forEach(u => {
      const img = document.createElement("img");
      img.src = u;
      img.style.maxWidth = "100%";
      img.style.marginTop = "12px";
      statementEl.appendChild(img);
    });
  }

  // helpers
  function loadProblemsFromStore() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (err) { return []; }
  }
  function formatDateNice(iso){
    if(!iso) return "unknown";
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString(undefined, { day:'2-digit', month:'short', year:'numeric' });
  }
  function escapeHtml(s){ return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
});
