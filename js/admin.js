// js/admin.js
import { db } from "./firebase.js";
import { protectAdminPage } from "./auth.js";
import {
  doc, setDoc, getDoc, updateDoc, collection
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// Protect page
protectAdminPage();

// --- Tab switching ---
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    tabButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    tabContents.forEach(c => c.classList.remove("active"));
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
  });
});

// --- ID generator helper ---
async function getNextId(type) {
  const metaRef = doc(db, "meta", type);
  const snap = await getDoc(metaRef);
  let id = 1;
  if (snap.exists()) {
    id = snap.data().lastId + 1;
    await updateDoc(metaRef, { lastId: id });
  } else {
    await setDoc(metaRef, { lastId: id });
  }
  return id;
}

// --- Add Problem ---
const problemForm = document.getElementById("add-problem-form");
problemForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("problem-title").value;
  const statement = document.getElementById("problem-statement").value;
  const solution = document.getElementById("problem-solution").value;

  try {
    const id = await getNextId("problems");
    await setDoc(doc(db, "problems", id.toString()), {
      id, title, statement, solution
    });
    alert("Problem added with ID " + id);
    problemForm.reset();
  } catch (err) {
    alert("Error: " + err.message);
  }
});

// --- Add Lesson ---
const lessonForm = document.getElementById("add-lesson-form");
lessonForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("lesson-title").value;
  const cover = document.getElementById("lesson-cover").value;
  const content = document.getElementById("lesson-content").value;

  try {
    const id = await getNextId("lessons");
    await setDoc(doc(db, "lessons", id.toString()), {
      id, title, cover, content
    });
    alert("Lesson added with ID " + id);
    lessonForm.reset();
  } catch (err) {
    alert("Error: " + err.message);
  }
});

// --- Simple client-side search ---
function setupSearch(inputId, listId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.addEventListener("input", () => {
    const query = input.value.toLowerCase();
    document.querySelectorAll(`#${listId} .card`).forEach(card => {
      card.style.display = card.textContent.toLowerCase().includes(query) ? "block" : "none";
    });
  });
}

setupSearch("search-problem", "problems-list");
setupSearch("search-lesson", "lessons-list");
setupSearch("search-user", "users-list");
