// js/problems.js
import {
  db,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs
} from "./firebase.js";

const PAGE_SIZE = 20;
let lastVisible = null;
let currentPage = 1;
const problemsList = document.getElementById("problems-list");
const prevBtn = document.getElementById("prev-page");
const nextBtn = document.getElementById("next-page");
const pageInfo = document.getElementById("page-info");

async function loadPage(next = true) {
  if (!problemsList) return;
  problemsList.innerHTML = "Loading...";
  let q;
  const col = collection(db, "problems");
  // only published
  q = query(col, where("draft", "==", false), orderBy("id"), limit(PAGE_SIZE));
  if (lastVisible && next) {
    q = query(col, where("draft", "==", false), orderBy("id"), startAfter(lastVisible), limit(PAGE_SIZE));
  }
  const snap = await getDocs(q);
  if (snap.empty) {
    problemsList.innerHTML = "<p>No problems found.</p>";
    nextBtn.disabled = true;
    return;
  }
  const rows = [];
  snap.forEach(doc => rows.push(doc.data()));
  // render
  problemsList.innerHTML = "";
  rows.forEach(p => {
    const card = document.createElement("div");
    card.className = "problem-card";
    const title = p.title || `Problem #${p.id}`;
    card.innerHTML = `
      <div class="card-header">
        <strong>${title}</strong>
        <div class="meta">
          <span>${p.category || ""}</span> · <span>${p.difficulty || ""}</span>
        </div>
      </div>
      <div class="card-body">
        ${renderStatementPreview(p.statement)}
      </div>
      <div class="card-footer">
        <a href="problem.html?id=${p.id}" class="btn">View Problem →</a>
      </div>
    `;
    problemsList.appendChild(card);
  });
  lastVisible = snap.docs[snap.docs.length - 1];
  nextBtn.disabled = snap.size < PAGE_SIZE;
  prevBtn.disabled = currentPage === 1;
  pageInfo.textContent = `Page ${currentPage}`;
}

function renderStatementPreview(blocks = []) {
  if (!blocks || !blocks.length) return "<em>No statement</em>";
  const firstText = blocks.find(b => b.type === "text");
  if (firstText) return `<p>${escapeHtml(firstText.content).slice(0, 250)}${firstText.content.length > 250 ? "…" : ""}</p>`;
  const firstImg = blocks.find(b => b.type === "image");
  if (firstImg) return `<p><img src="${escapeHtml(firstImg.url)}" alt="cover" style="max-width:200px" /></p>`;
  return "<em>Statement</em>";
}

function escapeHtml(s = "") {
  return String(s).replace(/[&<>"']/g, (m) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
}

document.addEventListener("DOMContentLoaded", () => {
  if (nextBtn) nextBtn.addEventListener("click", async () => { currentPage++; await loadPage(true); });
  if (prevBtn) prevBtn.addEventListener("click", async () => {
    // simple approach: go back to page 1 (no cursor history). For production keep history stack.
    currentPage = Math.max(1, currentPage - 1);
    lastVisible = null;
    await loadPage(false);
  });
  loadPage(true);
});
