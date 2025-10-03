// js/problems.js
import { db } from "./firebase.js";
import { collection, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const PAGE_SIZE = 50;
let problems = [];
let filtered = [];
let currentPage = 1;

document.addEventListener("DOMContentLoaded", async () => {
  const listEl = document.getElementById("problems-list");
  const searchInput = document.getElementById("global-problem-search");
  const searchBtn = document.getElementById("global-search-btn");
  const prevBtn = document.getElementById("prev-page");
  const nextBtn = document.getElementById("next-page");
  const pageInfo = document.getElementById("page-info");

  await loadProblems();
  filtered = problems.slice();
  renderPage(1);

  searchBtn.addEventListener("click", doSearch);
  searchInput.addEventListener("keydown", (e) => { if (e.key === "Enter") doSearch(); });
  prevBtn.addEventListener("click", () => { if (currentPage > 1) renderPage(currentPage - 1); });
  nextBtn.addEventListener("click", () => { const tot = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)); if (currentPage < tot) renderPage(currentPage + 1); });

  async function loadProblems() {
    listEl.innerHTML = "Loading...";
    try {
      const q = query(collection(db, "problems"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      problems = snap.docs.map(d => ({ _docId: d.id, ...d.data() }));
    } catch (err) {
      console.error("Load failed:", err);
      listEl.innerHTML = `<div style="padding:20px;color:#a00">Failed to load problems</div>`;
    }
  }

  function doSearch() {
    const q = (searchInput.value || "").trim().toLowerCase();
    if (!q) filtered = problems.slice();
    else filtered = problems.filter(p => (p.title||"").toLowerCase().includes(q) || (p.statement||"").toLowerCase().includes(q) || (p.tags||[]).join(" ").toLowerCase().includes(q));
    renderPage(1);
  }

  function renderPage(page = 1) {
    currentPage = page;
    const start = (page - 1) * PAGE_SIZE;
    const items = filtered.slice(start, start + PAGE_SIZE);
    listEl.innerHTML = "";
    if (!items.length) {
      listEl.innerHTML = `<div style="padding:20px;color:#666">No problems found.</div>`;
    } else {
      for (const p of items) {
        const createdPretty = formatDate(p.createdAt);
        const snippet = truncate(stripTags(p.statement || ""), 220);
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <h3>${escapeHtml(p.title || "(no title)")}</h3>
          <p>${escapeHtml(snippet)}</p>
          <div class="meta">ID: ${p.id ?? "(no id)"} • 📅 ${createdPretty}</div>
          <div class="actions">
            <a class="btn" href="problem.html?id=${encodeURIComponent(p._docId)}">Open</a>
            <a class="btn" href="admin.html" style="background:#666;">Admin</a>
          </div>
        `;
        listEl.appendChild(card);
      }
    }
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    pageInfo.textContent = `Page ${currentPage} / ${totalPages}`;
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;

    if (window.MathJax && window.MathJax.typesetPromise) MathJax.typesetPromise();
  }

  function formatDate(ts) {
    if (!ts) return "unknown";
    try {
      if (typeof ts.toDate === "function") return ts.toDate().toLocaleDateString();
      if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString();
      return new Date(ts).toLocaleDateString();
    } catch(e) { return String(ts); }
  }
  function truncate(s,n=140){ if(!s) return ""; return s.length>n ? s.slice(0,n-1)+"…" : s; }
  function stripTags(s){ return String(s||"").replace(/<\/?[^>]+(>|$)/g,""); }
  function escapeHtml(s){ return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
});
