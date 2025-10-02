// js/admin.js
import { db } from "./firebase.js";
import { protectAdminPage } from "./auth.js";
import {
  collection,
  setDoc,
  getDoc,
  getDocs,
  doc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

protectAdminPage();

// ---- Tab Switching ----
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    tabButtons.forEach(b => b.classList.remove("active"));
    tabContents.forEach(c => c.classList.remove("active"));

    btn.classList.add("active");
    const tabId = "tab-" + btn.dataset.tab;
    const content = document.getElementById(tabId);
    if (content) content.classList.add("active");
  });
});

// ---- ID generator (meta collection) ----
async function getNextId(type) {
  const metaRef = doc(db, "meta", type);
  const snap = await getDoc(metaRef);
  let nextId = 1;
  if (snap.exists()) {
    nextId = (snap.data().lastId || 0) + 1;
  }
  await setDoc(metaRef, { lastId: nextId });
  return nextId;
}

// ---- Add Problem ----
const problemForm = document.getElementById("add-problem-form");
if (problemForm) {
  problemForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("problem-title").value;
    const statement = document.getElementById("problem-statement").value;
    const solution = document.getElementById("problem-solution").value;

    try {
      const id = await getNextId("problems");
      await setDoc(doc(db, "problems", String(id)), { id, title, statement, solution });
      alert("Problem added with ID " + id);
      problemForm.reset();
    } catch (err) {
      alert("Error adding problem: " + err.message);
    }
  });
}

// ---- Add Lesson ----
const lessonForm = document.getElementById("add-lesson-form");
if (lessonForm) {
  lessonForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("lesson-title").value;
    const content = document.getElementById("lesson-content").value;

    try {
      const id = await getNextId("lessons");
      await setDoc(doc(db, "lessons", String(id)), { id, title, content });
      alert("Lesson added with ID " + id);
      lessonForm.reset();
    } catch (err) {
      alert("Error adding lesson: " + err.message);
    }
  });
}

// ---- Search Problems ----
const problemSearchBtn = document.getElementById("search-problem-btn");
if (problemSearchBtn) {
  problemSearchBtn.addEventListener("click", async () => {
    const term = document.getElementById("search-problem").value.trim().toLowerCase();
    const list = document.getElementById("problems-list");
    list.innerHTML = "";

    const snapshot = await getDocs(collection(db, "problems"));
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (
        data.title.toLowerCase().includes(term) ||
        data.statement.toLowerCase().includes(term) ||
        String(data.id).includes(term)
      ) {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `<h3>${data.title} (#${data.id})</h3>
                          <p>${data.statement.substring(0, 100)}...</p>`;
        list.appendChild(card);
      }
    });
  });
}

// ---- Search Lessons ----
const lessonSearchBtn = document.getElementById("search-lesson-btn");
if (lessonSearchBtn) {
  lessonSearchBtn.addEventListener("click", async () => {
    const term = document.getElementById("search-lesson").value.trim().toLowerCase();
    const list = document.getElementById("lessons-list");
    list.innerHTML = "";

    const snapshot = await getDocs(collection(db, "lessons"));
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (
        data.title.toLowerCase().includes(term) ||
        data.content.toLowerCase().includes(term) ||
        String(data.id).includes(term)
      ) {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `<h3>${data.title} (#${data.id})</h3>
                          <p>${data.content.substring(0, 100)}...</p>`;
        list.appendChild(card);
      }
    });
  });
}

// ---- Search Users (basic placeholder, role handling can be added later) ----
const userSearchBtn = document.getElementById("search-user-btn");
if (userSearchBtn) {
  userSearchBtn.addEventListener("click", async () => {
    const term = document.getElementById("search-user").value.trim().toLowerCase();
    const list = document.getElementById("users-list");
    list.innerHTML = "";

    const snapshot = await getDocs(collection(db, "users"));
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (
        (data.email && data.email.toLowerCase().includes(term)) ||
        String(data.id).includes(term)
      ) {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `<h3>${data.email || "Unknown"} (#${data.id || docSnap.id})</h3>
                          <p>Role: ${data.role || "user"}</p>`;
        list.appendChild(card);
      }
    });
  });
}
