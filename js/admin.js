// js/admin.js
import { db } from "./firebase.js";
import { protectAdminPage } from "./auth.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  doc,
  updateDoc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// Protect page
protectAdminPage();

// ----- Tab Switching -----
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    // deactivate all
    tabButtons.forEach((b) => b.classList.remove("active"));
    tabContents.forEach((c) => c.classList.remove("active"));

    // activate selected
    btn.classList.add("active");
    const tabId = "tab-" + btn.dataset.tab;
    const tabEl = document.getElementById(tabId);
    if (tabEl) {
      tabEl.classList.add("active");
    }
  });
});

// ----- Helper: Get Next ID -----
async function getNextId(type) {
  const ref = doc(db, "meta", type);
  const snap = await getDoc(ref);
  let newId = 1;
  if (snap.exists()) {
    newId = snap.data().lastId + 1;
  }
  await setDoc(ref, { lastId: newId });
  return newId;
}

// ----- Add Problem -----
const problemForm = document.getElementById("add-problem-form");
if (problemForm) {
  problemForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("problem-title").value;
    const statement = document.getElementById("problem-statement").value;
    const solution = document.getElementById("problem-solution").value;

    try {
      const id = await getNextId("problems");
      await setDoc(doc(db, "problems", id.toString()), {
        id,
        title,
        statement,
        solution,
      });
      alert("Problem added with ID " + id);
      problemForm.reset();
    } catch (err) {
      console.error(err);
      alert("Error adding problem: " + err.message);
    }
  });
}

// ----- Add Lesson -----
const lessonForm = document.getElementById("add-lesson-form");
if (lessonForm) {
  lessonForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("lesson-title").value;
    const cover = document.getElementById("lesson-cover").value;
    const content = document.getElementById("lesson-content").value;

    try {
      const id = await getNextId("lessons");
      await setDoc(doc(db, "lessons", id.toString()), {
        id,
        title,
        cover,
        content,
      });
      alert("Lesson added with ID " + id);
      lessonForm.reset();
    } catch (err) {
      console.error(err);
      alert("Error adding lesson: " + err.message);
    }
  });
}

// ----- Search Problems -----
const searchProblemBtn = document.getElementById("search-problem-btn");
if (searchProblemBtn) {
  searchProblemBtn.addEventListener("click", async () => {
    const term = document.getElementById("search-problem").value.toLowerCase();
    const snapshot = await getDocs(query(collection(db, "problems")));
    const list = document.getElementById("problems-list");
    list.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const p = docSnap.data();
      if (
        p.title.toLowerCase().includes(term) ||
        p.statement.toLowerCase().includes(term) ||
        p.id.toString() === term
      ) {
        list.innerHTML += `<div class="card"><h3>${p.title}</h3><p>${p.statement}</p></div>`;
      }
    });
  });
}

// ----- Search Lessons -----
const searchLessonBtn = document.getElementById("search-lesson-btn");
if (searchLessonBtn) {
  searchLessonBtn.addEventListener("click", async () => {
    const term = document.getElementById("search-lesson").value.toLowerCase();
    const snapshot = await getDocs(query(collection(db, "lessons")));
    const list = document.getElementById("lessons-list");
    list.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const l = docSnap.data();
      if (
        l.title.toLowerCase().includes(term) ||
        l.content.toLowerCase().includes(term) ||
        l.id.toString() === term
      ) {
        list.innerHTML += `<div class="card"><h3>${l.title}</h3><p>${l.content}</p></div>`;
      }
    });
  });
}

// ----- Search Users -----
const searchUserBtn = document.getElementById("search-user-btn");
if (searchUserBtn) {
  searchUserBtn.addEventListener("click", async () => {
    const term = document.getElementById("search-user").value.toLowerCase();
    const snapshot = await getDocs(query(collection(db, "users")));
    const list = document.getElementById("users-list");
    list.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const u = docSnap.data();
      if (u.email.toLowerCase().includes(term) || u.role.toLowerCase().includes(term)) {
        list.innerHTML += `
          <div class="card">
            <h3>${u.email}</h3>
            <p>Role: ${u.role}</p>
            <button class="btn" onclick="window.changeRole('${docSnap.id}','admin')">Make Admin</button>
            <button class="btn" onclick="window.changeRole('${docSnap.id}','user')">Make User</button>
          </div>`;
      }
    });
  });
}

// ----- Change Role -----
window.changeRole = async (uid, role) => {
  try {
    await updateDoc(doc(db, "users", uid), { role });
    alert("Role updated to " + role);
  } catch (err) {
    console.error(err);
    alert("Error updating role: " + err.message);
  }
};
