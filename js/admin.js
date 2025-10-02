// js/admin.js
import { db } from "./firebase.js";
import { protectAdminPage } from "./auth.js";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// Protect page
protectAdminPage();

/* ---------- Tab Switching ---------- */
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
  });
});

/* ---------- Toggle Add Problem Form ---------- */
const addProblemBtn = document.getElementById("btn-add-problem");
if (addProblemBtn) {
  addProblemBtn.addEventListener("click", () => {
    document.getElementById("add-problem-container").classList.toggle("hidden");
  });
}

/* ---------- Toggle Add Lesson Form ---------- */
const addLessonBtn = document.getElementById("btn-add-lesson");
if (addLessonBtn) {
  addLessonBtn.addEventListener("click", () => {
    document.getElementById("add-lesson-container").classList.toggle("hidden");
  });
}

/* ---------- Add Problem ---------- */
const problemForm = document.getElementById("add-problem-form");
if (problemForm) {
  problemForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("problem-title").value.trim();
    const statement = document.getElementById("problem-statement").value.trim();
    const solution = document.getElementById("problem-solution").value.trim();

    if (!title || !statement) return alert("Fill in all fields!");

    try {
      await addDoc(collection(db, "problems"), { title, statement, solution });
      alert("Problem added!");
      problemForm.reset();
      document.getElementById("add-problem-container").classList.add("hidden");
    } catch (err) {
      alert("Error adding problem: " + err.message);
    }
  });
}

/* ---------- Add Lesson ---------- */
const lessonForm = document.getElementById("add-lesson-form");
if (lessonForm) {
  lessonForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("lesson-title").value.trim();
    const content = document.getElementById("lesson-content").value.trim();

    if (!title || !content) return alert("Fill in all fields!");

    try {
      await addDoc(collection(db, "lessons"), { title, content });
      alert("Lesson added!");
      lessonForm.reset();
      document.getElementById("add-lesson-container").classList.add("hidden");
    } catch (err) {
      alert("Error adding lesson: " + err.message);
    }
  });
}

/* ---------- Search Problems (basic Firestore query) ---------- */
const searchProblemBtn = document.getElementById("btn-search-problem");
if (searchProblemBtn) {
  searchProblemBtn.addEventListener("click", async () => {
    const term = document.getElementById("search-problem").value.trim();
    if (!term) return alert("Enter search text");

    const q = query(collection(db, "problems"), where("title", "==", term));
    const snap = await getDocs(q);

    const list = document.getElementById("problems-list");
    list.innerHTML = "";
    snap.forEach(doc => {
      const d = doc.data();
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `<h3>${d.title}</h3><p>${d.statement}</p>`;
      list.appendChild(card);
    });

    if (snap.empty) {
      list.innerHTML = `<p>No problems found for "${term}"</p>`;
    }
  });
}

/* ---------- Search Lessons (basic) ---------- */
const searchLessonBtn = document.getElementById("btn-search-lesson");
if (searchLessonBtn) {
  searchLessonBtn.addEventListener("click", async () => {
    const term = document.getElementById("search-lesson").value.trim();
    if (!term) return alert("Enter search text");

    const q = query(collection(db, "lessons"), where("title", "==", term));
    const snap = await getDocs(q);

    const list = document.getElementById("lessons-list");
    list.innerHTML = "";
    snap.forEach(doc => {
      const d = doc.data();
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `<h3>${d.title}</h3><p>${d.content}</p>`;
      list.appendChild(card);
    });

    if (snap.empty) {
      list.innerHTML = `<p>No lessons found for "${term}"</p>`;
    }
  });
}
