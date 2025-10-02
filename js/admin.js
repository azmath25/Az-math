// js/admin.js
// Admin Problems CRUD (localStorage fallback). Preserves createdAt, sets updatedAt when editing.
// Includes import/export and modal editor.

const STORE_KEY = "azmath_problems_v1";

document.addEventListener("DOMContentLoaded", () => {
  // tabs
  const tabs = document.querySelectorAll(".tabs button");
  const sections = document.querySelectorAll(".section");
  tabs.forEach(tab => tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    sections.forEach(s => s.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(`${tab.dataset.tab}-section`).classList.add("active");
  }));

  // elements
  const problemsList = document.getElementById("problems-list");
  const addBtn = document.getElementById("add-problem-btn");
  const searchBtn = document.getElementById("search-problem-btn");
  const searchInput = document.getElementById("problem-search");
  const exportBtn = document.getElementById("export-problems-btn");
  const importBtn = document.getElementById("import-problems-btn");
  const importFileInput = document.getElementById("import-problems-file");

  // modal
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

  let problems = loadProblemsFromStore();
  let editingId = null;

  // ensure createdAt exists
  problems.forEach(p => { if (!p.createdAt) p.createdAt = new Date().toISOString(); });
  problems.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  renderProblems(problems);

  // search
  searchBtn.addEventListener("click", () => {
    const q = searchInput.value.trim().toLowerCase();
    const res = problems.filter(p => {
      return (p.title||"").toLowerCase().includes(q)
        || (p.statement||"").toLowerCase().includes(q)
        || (p.tags||[]).join(" ").toLowerCase().includes(q);
    });
    renderProblems(res);
  });

  searchInput.addEventListener("keydown", (e) => { if (e.key === "Enter") searchBtn.click(); });

  // add
  addBtn.addEventListener("click", () => openEditor(null));

  // export / import
  exportBtn.addEventListener("click", () => {
    const data = JSON.stringify(problems, null, 2);
    const blob = new Blob([data], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `azmath_problems_${(new Date()).toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  importBtn.addEventListener("click", () => importFileInput.click());
  importFileInput.addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (!Array.isArray(imported)) throw new Error("Expected an array of problems");
        imported.forEach(p => { if (!p.id) p.id = genId(); if (!p.createdAt) p.createdAt = new Date().toISOString(); });
        // Merge: naive replace; you can modify to merge by id
        problems = imported.concat(problems.filter(p => !imported.find(i => i.id === p.id)));
        saveProblemsToStore(problems);
        problems.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        renderProblems(problems);
        alert("Imported " + imported.length + " problems.");
      } catch (err) {
        alert("Import failed: " + err.message);
      }
    };
    reader.readAsText(f);
    e.target.value = "";
  });

  // editor open
  function openEditor(id) {
    editingId = id;
    if (id) {
      const p = problems.find(x => x.id === id);
      if (!p) { alert("Problem not found"); return; }
      editorTitle.textContent = "Edit Problem";
      titleField.value = p.title || "";
      tagsField.value = (p.tags||[]).join(", ");
      statementField.value = p.statement || "";
      solutionField.value = p.solution || "";
      imagesField.value = (p.images||[]).join("\n");
      deleteBtn.style.display = "inline-block";
    } else {
      editorTitle.textContent = "Add Problem";
      form.reset();
      imagesField.value = "";
      deleteBtn.style.display = "none";
    }
    modal.style.display = "flex";
  }

  closeEditorBtn.addEventListener("click", () => closeModal());

  deleteBtn.addEventListener("click", () => {
    if (!editingId) return;
    if (!confirm("Delete this problem?")) return;
    problems = problems.filter(p => p.id !== editingId);
    saveProblemsToStore(problems);
    renderProblems(problems);
    closeModal();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = titleField.value.trim();
    const statement = statementField.value.trim();
    const solution = solutionField.value.trim();
    const tags = tagsField.value.split(",").map(s => s.trim()).filter(Boolean);
    const images = imagesField.value.split("\n").map(s => s.trim()).filter(Boolean);

    if (!title) { alert("Please add a title"); return; }

    if (editingId) {
      // update
      const idx = problems.findIndex(p => p.id === editingId);
      if (idx === -1) { alert("Problem not found"); return; }
      const existing = problems[idx];
      problems[idx] = {
        ...existing,
        title, statement, solution, tags, images,
        updatedAt: new Date().toISOString()
      };
      // Todo: Firestore update hook here
    } else {
      // create
      const newProblem = {
        id: genId(),
        title, statement, solution, tags, images,
        createdAt: new Date().toISOString()
      };
      problems.unshift(newProblem);
      // Todo: Firestore addDoc hook here
    }

    saveProblemsToStore(problems);
    renderProblems(problems);
    closeModal();
  });

  function closeModal() {
    editingId = null;
    modal.style.display = "none";
  }

  function renderProblems(list) {
    // sort newest first
    list.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    problemsList.innerHTML = "";
    if (!list.length) {
      problemsList.innerHTML = `<div style="padding:20px;color:#555">No problems found.</div>`;
      return;
    }
    list.forEach(p => {
      const card = document.createElement("div");
      card.className = "card";
      const createdPretty = formatDateNice(p.createdAt);
      const snippet = truncate(stripTags(p.statement||""), 160);
      card.innerHTML = `
        <h3 style="margin-bottom:6px">${escapeHtml(p.title || "(no title)")}</h3>
        <p style="color:#444;margin-bottom:8px">${escapeHtml(snippet)}</p>
        <div class="meta">📅 Created: ${createdPretty}</div>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">
          <button class="btn edit-btn" data-id="${p.id}">Edit</button>
          <button class="btn view-btn" data-id="${p.id}" style="background:#555;">View</button>
        </div>
      `;
      problemsList.appendChild(card);
    });

    // hook actions
    problemsList.querySelectorAll(".edit-btn").forEach(b => b.addEventListener("click", e => openEditor(e.target.dataset.id)));
    problemsList.querySelectorAll(".view-btn").forEach(b => b.addEventListener("click", e => {
      const id = e.target.dataset.id;
      window.open(`problem.html?id=${encodeURIComponent(id)}`, "_blank");
    }));
  }

  // store helpers
  function loadProblemsFromStore() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (err) { console.error(err); return []; }
  }
  function saveProblemsToStore(arr) {
    localStorage.setItem(STORE_KEY, JSON.stringify(arr));
  }

  // small utilities
  function genId(){ return 'p_' + Math.random().toString(36).slice(2,10); }
  function truncate(s,n=140){ if(!s) return ""; return s.length>n ? s.slice(0,n-1)+"…" : s; }
  function stripTags(s){ return String(s||"").replace(/<\/?[^>]+(>|$)/g, ""); }
  function escapeHtml(s){ return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  function formatDateNice(iso){ if(!iso) return "unknown"; const d = new Date(iso); if (isNaN(d)) return iso; return d.toLocaleDateString(undefined,{day:'2-digit',month:'short',year:'numeric'}); }
});
