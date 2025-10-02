// js/problem.js
// Load one problem from Firestore by document id (URL param 'id')
// Show createdAt, updatedAt, statement (typeset with MathJax), solution hidden until 'Show Solution' click.

import { db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const docId = params.get("id"); // this is Firestore document id (not numeric id)
  const titleEl = document.getElementById("problem-title");
  const metaEl = document.getElementById("problem-meta");
  const statementEl = document.getElementById("problem-statement");
  const showBtn = document.getElementById("show-solution");
  const solutionEl = document.getElementById("solution-container");

  if (!docId) {
    titleEl.textContent = "Problem not found";
    statementEl.textContent = "Missing ?id= in URL.";
    return;
  }

  try {
    const ref = doc(db, "problems", docId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      titleEl.textContent = "Problem not found";
      statementEl.textContent = `No problem with id=${docId}`;
      return;
    }
    const data = snap.data();
    titleEl.textContent = data.title || "(no title)";

    const created = data.createdAt;
    const updated = data.updatedAt;
    metaEl.textContent = `📅 Created: ${formatDateNice(created)}${updated ? " — Updated: " + formatDateNice(updated) : ""}`;

    // statement may contain math in $$...$$ or \( ... \)
    statementEl.innerHTML = (data.statement || "").replace(/\n/g, "<br>");

    // images (if any)
    if (Array.isArray(data.images) && data.images.length) {
      for (const u of data.images) {
        const img = document.createElement("img");
        img.src = u;
        img.style.maxWidth = "100%";
        img.style.marginTop = "12px";
        statementEl.appendChild(img);
      }
    }

    if (data.solution && String(data.solution).trim()) {
      showBtn.style.display = "inline-block";
      showBtn.addEventListener("click", () => {
        solutionEl.style.display = "block";
        solutionEl.innerHTML = `<div class="card"><strong>Solution</strong><div style="margin-top:8px">${(data.solution || "").replace(/\n/g,"<br>")}</div></div>`;
        showBtn.style.display = "none";
        // after injecting solution, typeset math
        if (window.MathJax && window.MathJax.typesetPromise) {
          MathJax.typesetPromise();
        }
      });
    }

    // typeset initial content (statement/title)
    if (window.MathJax && window.MathJax.typesetPromise) {
      await MathJax.typesetPromise();
    }

  } catch (err) {
    console.error(err);
    titleEl.textContent = "Error loading problem";
    statementEl.textContent = String(err);
  }

  // helper: format Firestore timestamp or fallback
  function toMillis(ts) {
    if (!ts) return 0;
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
});
