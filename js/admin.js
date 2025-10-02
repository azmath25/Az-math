// js/admin.js
import { db } from "./firebase.js";
import { collection, getDocs, addDoc, updateDoc, doc, query, where } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tabs button");
  const sections = document.querySelectorAll(".section");
  const problemsList = document.getElementById("problems-list");

  // ---- Tab switching ----
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      sections.forEach(s => s.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(`${tab.dataset.tab}-section`).classList.add("active");
    });
  });

  // ---- Load Problems ----
  async function loadProblems(search = "") {
    problemsList.innerHTML = "Loading...";
    let q = collection(db, "problems");
    if (search) {
      // naive title filter, can extend later
      q = query(collection(db, "problems"), where("title", ">=", search), where("title", "<=", search + "\uf8ff"));
    }
    const snapshot = await getDocs(q);
    problemsList.innerHTML = "";
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <h3>${data.title}</h3>
        <p>${data.statement.slice(0, 100)}...</p>
        <button class="btn edit-btn" data-id="${docSnap.id}">Edit</button>
      `;
      problemsList.appendChild(card);
    });

    // hook up edit
    document.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", () => openEditor(btn.dataset.id));
    });
  }

  loadProblems();

  // ---- Search ----
  document.getElementById("search-problem-btn").addEventListener("click", () => {
    const q = document.getElementById("problem-search").value.trim();
    loadProblems(q);
  });

  // ---- Add Problem ----
  document.getElementById("add-problem-btn").addEventListener("click", () => {
    openEditor();
  });

  // ---- Modal Editor ----
  const modal = document.getElementById("editor-modal");
  const form = document.getElementById("editor-form");
  const closeBtn = document.getElementById("close-editor");
  let editingId = null;

  function openEditor(id = null) {
    editingId = id;
    if (id) {
      // load existing
      // TODO: fetch doc by id
      document.getElementById("editor-title").innerText = "Edit Problem";
    } else {
      document.getElementById("editor-title").innerText = "Add Problem";
      form.reset();
    }
    modal.style.display = "block";
  }

  closeBtn.addEventListener("click", () => (modal.style.display = "none"));

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const title = document.getElementById("problem-title").value;
    const statement = document.getElementById("problem-statement").value;
    const solution = document.getElementById("problem-solution").value;

    if (editingId) {
      const ref = doc(db, "problems", editingId);
      await updateDoc(ref, { title, statement, solution });
    } else {
      await addDoc(collection(db, "problems"), { title, statement, solution });
    }
    modal.style.display = "none";
    loadProblems();
  });
});
