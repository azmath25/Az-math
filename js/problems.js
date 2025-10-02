// js/problems.js
// Loads problems from Firestore (collection "problems"), sorts by createdAt desc,
// paginates, renders cards showing title, snippet, and created date.
// Requires firebase.js to export `db`.

import { db } from "./firebase.js";
import {
  collection, query, orderBy, getDocs
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const PAGE_SIZE = 50;
let problems = []; // in-memory array of loaded problems (objects include _docId)
let filtered = [];
let currentPage = 1;

document.addEventListener("DOMContentLoaded", async () => {
  const listEl = document.getElementById("problems-list");
  const searchInput = document.getElementById("global-problem-search");
  const searchBtn = document.getElementById("global-search-btn");
  const clearBtn = document.getElementById("clear-search-btn");
  const prevBtn = document.getElementById("prev-page");
  const nextBtn = document.getElementById("next-page");
  const pageInfo = document.getElementById("page-info");

  await loadProblemsFromFirestore();
  applySort();
  filtered = problems.slice();
  renderPage(1);

  searchBtn.addEventListener("click", () => {
    doSearch();
  });
  searchInput.addEventListener("keydown", (e) => { if (e.key === "Enter") doSearch(); });
  clearBtn.addEventListener("click", () => { searchInput.value = ""; filtered = problems.slice(); renderPage(1); });

  prevBtn.addEventListener("click", () => { if (currentPage > 1) renderPage(currentPage - 1); });
  nextBtn.addEventListener("click", () => {
    const tot = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (currentPage < tot) renderPage(currentPage + 1);
  });

  // ----- functions -----
  async function loadProblemsFromFirestore() {
    try {
      const q = query(collection(db, "problems"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      problems = snap.docs.map(d => {
        const data = d.data();
        return {
          _docId: d.id,
          id: data.id ?? null,
          title: data.title ?? "",
          statement: data.statement ?? "",
          solution: data.solution ?? "",
          tags: data.tags ?? [],
          images: data.images ?? [],
          createdAt: data.createdAt ?? null,
          updatedAt: data.updatedAt ?? null
        };
      });
    } catch (err) {
      console.error("Failed to load problems from Firestore:", err);
      problems = [];
    }
  }

  function applySort() {
    // Sort by createdAt (server timestamp) descending; if missing, fallback to createdAt string
    problems.sort((a,b) => {
      const at = toMillis(a.createdAt);
      const bt = toMillis(b.createdAt);
      return bt - at;
    });
  }

  function doSearch() {
    const q = (searchInput.value || "").trim().toLowerCase();
    if (!q) {
      filtered = problems.slice();
    } else {
      filtered = problems.filter(p => {
        return (p.title || "").toLowerCase().includes(q)
          || (p.statement || "").toLowerCase().includes(q)
          || (p.tags || []).join(" ").toLowerCase().includes(q);
      });
    }
    renderPage(1);
  }

  function renderPage(page = 1) {
    currentPage = page;
    const start = (page - 1) * PAGE_SIZE;
    const items = filtered.slice(start, start + PAGE_SIZE);
    listEl.innerHTML = "";

    if (!items.length) {
      listEl.innerHTML = `<div style="padding:20px;color:#555">No problems found.</div>`;
    } else {
      for (const p of items) {
        const createdPretty = formatDateNice(p.createdAt);
        const snippet = truncate(stripTags(p.statement || ""), 220);
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <h3>${escapeHtml(p.title || "(no title)")}</h3>
          <p>${escapeHtml(snippet)}</p>
          <div class="meta">📅 Created: ${createdPretty}</div>
          <div class="actions">
            <a class="btn" href="problem.html?id=${encodeURIComponent(p._docId)}">Open</a>
            <button class="btn" onclick="window.location.href='admin.html'">Admin</button>
          </div>
        `;
        listEl.appendChild(card);
      }
    }

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    pageInfo.textContent = `Page ${currentPage} / ${totalPages}`;
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;

    // after HTML updated, run MathJax to typeset content (if any math in titles/snippets)
    if (window.MathJax && window.MathJax.typesetPromise) {
      MathJax.typesetPromise && MathJax.typesetPromise();
    }
  }

  // ----- helpers -----
  function toMillis(ts) {
    if (!ts) return 0;
    // Firestore serverTimestamp is an object with toDate() in client SDK. If it's a number, return it.
    try {
      if (typeof ts.toDate === "function") return ts.toDate().getTime();
      if (ts.seconds) return ts.seconds * 1000 + (ts.nanoseconds || 0) / 1e6;
      if (typeof ts === "string") return new Date(ts).getTime();
      if (typeof ts === "number") return ts;
    } catch (e) {}
    return 0;
  }
  function formatDateNice(ts) {
    if (!ts) return "unknown";
    const ms = toMillis(ts);
    if (!ms) return "unknown";
    const d = new Date(ms);
    return d.toLocaleDateString(undefined, { day:'2-digit', month:'short', year:'numeric' });
  }
  function truncate(s,n=140) { if(!s) return ""; return s.length>n ? s.slice(0,n-1)+"…" : s; }
  function stripTags(s) { return String(s||"").replace(/<\/?[^>]+(>|$)/g,""); }
  function escapeHtml(s) { return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
});
