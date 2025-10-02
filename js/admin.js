// js/admin.js
// Admin panel for Problems: list, search, add, edit, delete, import/export.
// Uses Firestore collection "problems" and "meta"/"counters" doc for numeric id assignment.
// MathJax is used for rendering math in statements/solutions.

import { db } from "./firebase.js";
import {
  collection, query, orderBy, getDocs, addDoc, doc, getDoc,
  runTransaction, updateDoc, deleteDoc, serverTimestamp, setDoc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  // Tabs
  const tabs = document.querySelectorAll(".tabs button");
  const sections = document.querySelectorAll(".section");
  tabs.forEach(tab => tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    sections.forEach(s => s.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(`${tab.dataset.tab}-section`).classList.add("active");
  }));

  // Elements
  const problemsListEl = document.getElementById("problems-list");
  const addBtn = document.getElementById("add-problem-btn");
  const searchBtn = document.getElementById("search-problem-btn");
  const searchInput = document.getElementById("problem-search");
  const exportBtn = document.getElementById("export-problems-btn");
  const importBtn = document.getElementById("import-problems-btn");
  const importFileInput = document.getElementById("import-problems-file");

  // Modal/editor elements
  const modal = document.getElementById("editor-modal");
  const form = document.getElementById("editor-form");
  const titleField = document.getElementById("problem-title");
  const tagsField = document.getElementById("problem-tags");
  const statementField = document.getElementById("problem-statement");
  const solutionField = document.getElementById("problem-solution");
  const imagesField = document.getElementById("problem-images");
  const editorTitle = document.getElementById("editor-title");
  const closeEditorBtn = document.getElementById("close-editor");
  const deleteBtn = document.getElementById("delete-problem-btn");

  // In-memory list
  let problems = []; // objects: { _docId, id (numeric), title, statement, ... }
  let filtered = [];

  // Initial load
  (async () => {
    await loadProblems();
    sortProblems();
    filtered = problems.slice();
    renderProblems(filtered);
  })();

  // Event handlers
  searchBtn.addEventListener("click", () => {
    const q = (searchInput.value || "").trim().toLowerCase();
    if (!q) { filtered = problems.slice(); renderProblems(filtered); return; }
    filtered = problems.filter(p => {
      return (p.title||"").toLowerCase().includes(q)
        || (p.statement||"").toLowerCase().includes(q)
        || (p.tags||[]).join(" ").toLowerCase().includes(q);
    });
    renderProblems(filtered);
  });
  searchInput.addEventListener("keydown", (e) => { if (e.key === "Enter") searchBtn.click(); });

  addBtn.addEventListener("click", () => openEditor(null));

  exportBtn.addEventListener("click", async () => {
    // export all problems as JSON (with fields)
    try {
      const snap = await getDocs(query(collection(db, "problems"), orderBy("createdAt", "desc")));
      const arr = snap.docs.map(d => ({ _docId: d.id, ...d.data() }));
      const blob = new Blob([JSON.stringify(arr, null, 2)], { type:"application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `azmath_problems_export_${(new Date()).toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Export failed: " + err.message);
    }
  });

  importBtn.addEventListener("click", () => importFileInput.click());
  importFileInput.addEventListener("change", async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const txt = await f.text();
      const imported = JSON.parse(txt);
      if (!Array.isArray(imported)) throw new Error("Expected array of problem objects");
      // Import each problem: assign new numeric id via transaction, and create doc with serverTimestamp
      for (const p of imported) {
        // build data to save (we don't trust incoming ids)
        const data = {
          title: p.title || "",
          statement: p.statement || "",
          solution: p.solution || "",
          tags: Array.isArray(p.tags) ? p.tags : (p.tags ? String(p.tags).split(",").map(s=>s.trim()) : []),
          images: Array.isArray(p.images) ? p.images : (p.images ? String(p.images).split("\n").map(s=>s.trim()).filter(Boolean) : []),
          createdAt: serverTimestamp()
        };
        const newNumericId = await getNextProblemNumericId();
        data.id = newNumericId;
        await addDoc(collection(db, "problems"), data);
      }
      alert("Import finished. Refreshing list...");
      await loadProblems();
      sortProblems();
      filtered = problems.slice();
      renderProblems(filtered);
    } catch (err) {
      alert("Import failed: " + err.message);
    } finally {
      e.target.value = "";
    }
  });

  // Editor logic
  closeEditorBtn.addEventListener("click", () => closeModal());
  deleteBtn.addEventListener("click", async () => {
    if (!editingDocId) return;
    if (!confirm("Delete this problem?")) return;
    try {
      await deleteDoc(doc(db, "problems", editingDocId));
      await loadProblems();
      sortProblems();
      filtered = problems.slice();
      renderProblems(filtered);
    } catch (err) {
      alert("Delete failed: " + err.message);
    } finally {
      closeModal();
    }
  });

  let editingDocId = null; // Firestore document id being edited (null means create)

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = titleField.value.trim();
    const statement = statementField.value.trim();
    const solution = solutionField.value.trim();
    const tags = (tagsField.value || "").split(",").map(s => s.trim()).filter(Boolean);
    const images = (imagesField.value || "").split("\n").map(s => s.trim()).filter(Boolean);

    if (!title) { alert("Please provide a title."); return; }

    try {
      if (editingDocId) {
        // Update existing doc (preserve existing numeric id field)
        const ref = doc(db, "problems", editingDocId);
        await updateDoc(ref, {
          title, statement, solution, tags, images, updatedAt: serverTimestamp()
        });
      } else {
        // Create: get numeric id from counters (transaction) and create doc with serverTimestamp
        const numericId = await getNextProblemNumericId();
        await addDoc(collection(db, "problems"), {
          id: numericId,
          title, statement, solution, tags, images,
          createdAt: serverTimestamp()
        });
      }
      // refresh
      await loadProblems();
      sortProblems();
      filtered = problems.slice();
      renderProblems(filtered);
      closeModal();
    } catch (err) {
      alert("Save failed: " + err.message);
    }
  });

  // open editor helper
  function openEditor(docId) {
    editingDocId = docId || null;
    if (docId) {
      const p = problems.find(x => x._docId === docId);
      if (!p) { alert("Problem not found"); return; }
      editorTitle.textContent = "Edit Problem";
      titleField.value = p.title || "";
      tagsField.value = (p.tags || []).join(", ");
      statementField.value = p.statement || "";
      solutionField.value = p.solution || "";
      imagesField.value = (p.images || []).join("\n");
      deleteBtn.style.display = "inline-block";
    } else {
      editorTitle.textContent = "Add Problem";
      form.reset();
      imagesField.value = "";
      deleteBtn.style.display = "none";
    }
    modal.style.display = "flex";
    // run MathJax on editor content if needed (editor is plain textarea, so not required)
  }

  function closeModal() { editingDocId = null; modal.style.display = "none"; }

  // load problems into `problems` array
  async function loadProblems() {
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
      console.error("Failed to load problems:", err);
      problems = [];
    }
  }

  function sortProblems() {
    problems.sort((a,b) => {
      return toMillis(b.createdAt) - toMillis(a.createdAt);
    });
  }

  function renderProblems(list) {
    problemsListEl.innerHTML = "";
    if (!list.length) {
      problemsListEl.innerHTML = `<div style="padding:20px;color:#555">No problems found.</div>`;
      return;
    }

    for (const p of list) {
      const createdPretty = formatDateNice(p.createdAt);
      const snippet = truncate(stripTags(p.statement || ""), 200);
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <h3>${escapeHtml(p.title || "(no title)")}</h3>
        <p>${escapeHtml(snippet)}</p>
        <div class="meta">ID: ${p.id ?? "(no id)"} &nbsp;•&nbsp; 📅 Created: ${createdPretty}</div>
        <div class="actions">
          <button class="btn edit-btn" data-doc="${p._docId}">Edit</button>
          <button class="btn view-btn" data-doc="${p._docId}" style="background:#555;">View</button>
        </div>
      `;
      problemsListEl.appendChild(card);
    }

    // bind actions
    problemsListEl.querySelectorAll(".edit-btn").forEach(b => {
      b.addEventListener("click", (e) => {
        const id = e.currentTarget.dataset.doc;
        openEditor(id);
      });
    });
    problemsListEl.querySelectorAll(".view-btn").forEach(b => {
      b.addEventListener("click", (e) => {
        const id = e.currentTarget.dataset.doc;
        window.open(`problem.html?id=${encodeURIComponent(id)}`, "_blank");
      });
    });

    // typeset math for any math in titles/snippets
    if (window.MathJax && window.MathJax.typesetPromise) {
      MathJax.typesetPromise();
    }
  }

  // Transaction helper to atomically increment meta/counters.problems and return new value
  async function getNextProblemNumericId() {
    const counterRef = doc(db, "meta", "counters");
    const next = await runTransaction(db, async (tx) => {
      const snap = await tx.get(counterRef);
      if (!snap.exists()) {
        // If no counters doc, create it with problems:1 and return 1
        tx.set(counterRef, { problems: 1 }, { merge: true });
        return 1;
      }
      const cur = (snap.data().problems || 0);
      const nxt = cur + 1;
      tx.update(counterRef, { problems: nxt });
      return nxt;
    });
    return next;
  }

  // utility helpers
  function toMillis(ts) {
    if (!ts) return 0;
    try {
      if (typeof ts.toDate === "function") return ts.toDate().getTime();
      if (ts.seconds) return ts.seconds * 1000 + (ts.nanoseconds || 0)/1e6;
      if (typeof ts === "string") return new Date(ts).getTime();
      if (typeof ts === "number") return ts;
    } catch(e){}
    return 0;
  }
  function formatDateNice(ts) {
    if (!ts) return "unknown";
    const ms = toMillis(ts);
    if (!ms) return "unknown";
    const d = new Date(ms);
    return d.toLocaleDateString(undefined, { day:'2-digit', month:'short', year:'numeric' });
  }
  function truncate(s,n=140){ if(!s) return ""; return s.length>n ? s.slice(0,n-1)+"…" : s; }
  function stripTags(s){ return String(s||"").replace(/<\/?[^>]+(>|$)/g,""); }
  function escapeHtml(s){ return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
});
