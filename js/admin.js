// js/admin.js
import { db } from "./firebase.js";
import { protectAdminPage } from "./auth.js";
import {
  collection,
  addDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// 🔒 Protect page
protectAdminPage();

/* ------------------- ADD PROBLEM ------------------- */
const problemForm = document.getElementById("add-problem-form");
if (problemForm) {
  problemForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("problem-title").value;
    const statement = document.getElementById("problem-statement").value;
    const solution = document.getElementById("problem-solution").value;

    try {
      await addDoc(collection(db, "problems"), { title, statement, solution });
      alert("✅ Problem added!");
      problemForm.reset();
    } catch (err) {
      alert("❌ Error adding problem: " + err.message);
    }
  });
}

/* ------------------- ADD LESSON ------------------- */
const lessonForm = document.getElementById("add-lesson-form");
if (lessonForm) {
  lessonForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("lesson-title").value;
    const content = document.getElementById("lesson-content").value;
    const cover = document.getElementById("lesson-cover").value;

    try {
      await addDoc(collection(db, "lessons"), { title, content, cover });
      alert("✅ Lesson added!");
      lessonForm.reset();
    } catch (err) {
      alert("❌ Error adding lesson: " + err.message);
    }
  });
}

/* ------------------- SEARCH HELPERS ------------------- */
async function searchCollection(colName, query, fields, listId) {
  const list = document.getElementById(listId);
  list.innerHTML = "🔎 Searching...";

  const snap = await getDocs(collection(db, colName));
  const results = [];

  snap.forEach((doc) => {
    const data = doc.data();
    const id = doc.id;
    let match = id.includes(query); // always check ID
    fields.forEach((f) => {
      if (data[f] && data[f].toLowerCase().includes(query.toLowerCase())) {
        match = true;
      }
    });
    if (match) results.push({ id, ...data });
  });

  if (results.length === 0) {
    list.innerHTML = "<p>No results found</p>";
  } else {
    list.innerHTML = results
      .map(
        (r) => `
      <div class="card">
        <h3>${r.title || "(no title)"} (#${r.id})</h3>
        <p>${(r.statement || r.content || "").slice(0, 100)}...</p>
      </div>
    `
      )
      .join("");
  }
}

/* ------------------- SEARCH EVENTS ------------------- */
// Problems
document
  .getElementById("search-problem-btn")
  ?.addEventListener("click", () => {
    const query = document.getElementById("search-problem").value.trim();
    if (query) searchCollection("problems", query, ["title", "statement"], "problems-list");
  });

// Lessons
document
  .getElementById("search-lesson-btn")
  ?.addEventListener("click", () => {
    const query = document.getElementById("search-lesson").value.trim();
    if (query) searchCollection("lessons", query, ["title", "content"], "lessons-list");
  });

// Users
document.getElementById("search-user-btn")?.addEventListener("click", () => {
  const query = document.getElementById("search-user").value.trim();
  if (query) searchCollection("users", query, ["email", "role"], "users-list");
});
