// js/admin.js
import { db } from "./firebase.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  query,
  orderBy,
  where,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

/* -----------------------------
   Helpers
----------------------------- */

// Transaction: get next numeric ID
async function getNextId(type) {
  const counterRef = doc(db, "meta", "counters");
  const newId = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    if (!snap.exists()) throw new Error("Counters doc missing!");
    const data = snap.data();
    const current = data[type] || 0;
    const next = current + 1;
    tx.update(counterRef, { [type]: next });
    return next;
  });
  return newId;
}

// Format Firestore Timestamp or string date
function formatDate(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString();
}

// Re-render MathJax after inserting new HTML
function renderMath() {
  if (window.MathJax) {
    MathJax.typesetPromise();
  }
}

/* -----------------------------
   Tab switching
----------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tabs button");
  const sections = document.querySelectorAll(".section");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      sections.forEach((s) => s.classList.remove("active"));
      tab.classList.add("active");
      document
        .getElementById(`${tab.dataset.tab}-section`)
        .classList.add("active");
    });
  });

  // Load Problems initially
  loadProblems();

  // Bind buttons
  document
    .getElementById("add-problem-btn")
    .addEventListener("click", () => openProblemEditor());

  document
    .getElementById("search-problem-btn")
    .addEventListener("click", () => {
      const q = document.getElementById("problem-search").value.trim();
      loadProblems(q);
    });

  document
    .getElementById("add-lesson-btn")
    .addEventListener("click", () => addLessonStub());

  document
    .getElementById("search-lesson-btn")
    .addEventListener("click", () => {
      // TODO: implement lesson search
      alert("Lesson search not implemented yet");
    });
});

/* -----------------------------
   Problems CRUD
----------------------------- */

async function loadProblems(search = "") {
  const list = document.getElementById("problems-list");
  list.innerHTML = "Loading...";

  let q = query(collection(db, "problems"), orderBy("createdAt", "desc"));

  // Naive filter by title
  if (search) {
    // You can refine this later
    const allSnap = await getDocs(collection(db, "problems"));
    const filtered = allSnap.docs.filter((d) =>
      d.data().title.toLowerCase().includes(search.toLowerCase())
    );
    renderProblems(filtered, list);
    return;
  }

  const snap = await getDocs(q);
  renderProblems(snap.docs, list);
}

function renderProblems(docs, container) {
  container.innerHTML = "";
  docs.forEach((docSnap) => {
    const data = docSnap.data();
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${data.title}</h3>
      <p>${data.statement.slice(0, 120)}...</p>
      <p class="meta">📅 ${formatDate(data.createdAt)}</p>
      <button class="btn edit-btn" data-id="${docSnap.id}">Edit</button>
      <button class="btn delete-btn" data-id="${docSnap.id}">Delete</button>
    `;
    container.appendChild(card);
  });

  // Attach events
  container.querySelectorAll(".edit-btn").forEach((btn) =>
    btn.addEventListener("click", () => openProblemEditor(btn.dataset.id))
  );
  container.querySelectorAll(".delete-btn").forEach((btn) =>
    btn.addEventListener("click", () => deleteProblem(btn.dataset.id))
  );

  renderMath();
}

async function deleteProblem(docId) {
  if (!confirm("Delete this problem?")) return;
  await deleteDoc(doc(db, "problems", docId));
  loadProblems();
}

/* -----------------------------
   Problem Editor (Modal)
----------------------------- */

const modal = document.getElementById("editor-modal");
const form = document.getElementById("editor-form");
const closeBtn = document.getElementById("close-editor");

let editingId = null;

async function openProblemEditor(docId = null) {
  editingId = docId;
  form.reset();

  if (docId) {
    const ref = doc(db, "problems", docId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      document.getElementById("editor-title").innerText = "Edit Problem";
      document.getElementById("problem-title").value = data.title || "";
      document.getElementById("problem-statement").value =
        data.statement || "";
      document.getElementById("problem-solution").value = data.solution || "";
    }
  } else {
    document.getElementById("editor-title").innerText = "Add Problem";
  }

  modal.style.display = "flex";
}

closeBtn.addEventListener("click", () => (modal.style.display = "none"));

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("problem-title").value.trim();
  const statement = document.getElementById("problem-statement").value.trim();
  const solution = document.getElementById("problem-solution").value.trim();

  if (!title || !statement) {
    alert("Title and statement are required!");
    return;
  }

  if (editingId) {
    const ref = doc(db, "problems", editingId);
    await updateDoc(ref, {
      title,
      statement,
      solution,
      updatedAt: serverTimestamp(),
    });
  } else {
    const nextId = await getNextId("problems");
    await addDoc(collection(db, "problems"), {
      id: nextId,
      title,
      statement,
      solution,
      createdAt: serverTimestamp(),
    });
  }

  modal.style.display = "none";
  loadProblems();
});

/* -----------------------------
   Lessons (stub)
----------------------------- */

async function addLessonStub() {
  const nextId = await getNextId("lessons");
  await addDoc(collection(db, "lessons"), {
    id: nextId,
    title: "Untitled Lesson",
    content: "Coming soon",
    createdAt: serverTimestamp(),
  });
  alert("Lesson added (stub). Refresh lessons tab.");
}
