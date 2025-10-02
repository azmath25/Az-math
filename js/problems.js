// js/problems.js
// Problems listing: loads problems (localStorage fallback), sorts by createdAt desc, paginates, renders cards with created date.

const STORE_KEY = "azmath_problems_v1";
const PAGE_SIZE = 50;

document.addEventListener("DOMContentLoaded", () => {
  const listEl = document.getElementById("problems-list");
  const searchInput = document.getElementById("global-problem-search");
  const searchBtn = document.getElementById("global-search-btn");
  const clearBtn = document.getElementById("clear-search-btn");
  const prevBtn = document.getElementById("prev-page");
  const nextBtn = document.getElementById("next-page");
  const pageInfo = document.getElementById("page-info");

  let problems = loadProblemsFromStore();
  let currentPage = 1;
  let filtered = problems.slice();

  // ensure createdAt exists and parseable
  filtered.forEach(p => {
    if (!p.createdAt) p.createdAt = p.createdAt ||= new Date().toISOString();
  });

  // Sort newest first
  filtered.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  function renderPage(page = 1) {
    currentPage = page;
    const start = (page - 1) * PAGE_SIZE;
    const pageItems = filtered.slice(start, start + PAGE_SIZE);
    listEl.innerHTML = "";

    if (!pageItems.length) {
      listEl.innerHTML = `<div style="padding:20px;color:#555">No problems found.</div>`;
    } else {
      pageItems.forEach(p => {
        const card = document.createElement("div");
        card.className = "card";
        const createdPretty = formatDateNice(p.createdAt);
        const snippet = truncate(stripTags(p.statement || ""), 180);
        card.innerHTML = `
          <h3>${escapeHtml(p.title || "(no title)")}</h3>
          <p style="color:#444;margin:8px 0">${escapeHtml(snippet)}</p>
          <div class="meta">📅 Created: ${createdPretty}</div>
          <div style="margin-top:10px;display:flex;gap:8px;align-items:center;">
            <a class="btn" href="problem.html?id=${encodeURIComponent(p.id)}">Open</a>
            <a class="btn" href="admin.html" style="background:#666;">Admin</a>
          </div>
        `;
        listEl.appendChild(card);
      });
    }

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    pageInfo.textContent = `Page ${currentPage} / ${totalPages}`;
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
  }

  // initial render
  renderPage(1);

  // pagination
  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) renderPage(currentPage - 1);
  });
  nextBtn.addEventListener("click", () => {
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (currentPage < totalPages) renderPage(currentPage + 1);
  });

  // search
  function doSearch() {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) {
      filtered = problems.slice();
    } else {
      filtered = problems.filter(p => {
        return (p.title || "").toLowerCase().includes(q)
          || (p.statement || "").toLowerCase().includes(q)
          || (p.tags || []).join(" ").toLowerCase().includes(q);
      });
    }
    filtered.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    renderPage(1);
  }

  searchBtn.addEventListener("click", doSearch);
  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    doSearch();
  });
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doSearch();
  });

  // ----- helpers -----
  function loadProblemsFromStore() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) {
        // seed with example if empty
        const sample = [{
          id: genId(),
          title: "Sample: Eigenvalues of A",
          statement: "Find the eigenvalues of A = [[2,1],[1,2]].",
          solution: "Eigenvalues are 3 and 1.",
          tags: ["linear algebra"],
          createdAt: new Date().toISOString()
        }];
        localStorage.setItem(STORE_KEY, JSON.stringify(sample));
        return sample;
      }
      return JSON.parse(raw);
    } catch (err) {
      console.error("Failed to load problems", err);
      return [];
    }
  }

  function genId() { return 'p_' + Math.random().toString(36).slice(2,10); }
  function truncate(s, n=140){ if(!s) return ""; return s.length>n ? s.slice(0,n-1)+"…" : s; }
  function stripTags(s){ return String(s||"").replace(/<\/?[^>]+(>|$)/g, ""); }
  function escapeHtml(s){ return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  function formatDateNice(iso){
    if(!iso) return "unknown";
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString(undefined, { day:'2-digit', month:'short', year:'numeric' });
  }
});
