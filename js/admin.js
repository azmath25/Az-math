import { db, auth } from "./firebase.js";
import { protectAdminPage, getUserRole } from "./auth.js";
import { 
  collection, addDoc, getDocs, query, where, updateDoc, doc 
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// Protect the page
protectAdminPage();

// ===== Tabs =====
const tabBtns = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

tabBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    tabBtns.forEach(b => b.classList.remove("active"));
    tabContents.forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
  });
});

// ===== Problems =====
const problemForm = document.getElementById("add-problem-form");
if (problemForm) {
  problemForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("problem-title").value;
    const statement = document.getElementById("problem-statement").value;
    const solution = document.getElementById("problem-solution").value;

    try {
      await addDoc(collection(db, "problems"), { title, statement, solution, lessons: [] });
      alert("Problem added!");
      problemForm.reset();
    } catch (err) {
      alert("Error adding problem: " + err.message);
    }
  });
}

// Search problems
const searchProblem = document.getElementById("search-problem");
const problemsList = document.getElementById("problems-list");

if (searchProblem) {
  searchProblem.addEventListener("input", async () => {
    const term = searchProblem.value.trim().toLowerCase();
    problemsList.innerHTML = "";

    if (!term) return;

    const snap = await getDocs(collection(db, "problems"));
    snap.forEach(docSnap => {
      const prob = docSnap.data();
      if (
        docSnap.id.includes(term) ||
        prob.title.toLowerCase().includes(term) ||
        prob.statement.toLowerCase().includes(term)
      ) {
        const div = document.createElement("div");
        div.classList.add("card");
        div.innerHTML = `
          <h3>Problem: ${prob.title}</h3>
          <p>${prob.statement}</p>
          <button class="btn">Edit</button>
        `;
        problemsList.appendChild(div);
      }
    });
  });
}

// ===== Lessons =====
const lessonForm = document.getElementById("add-lesson-form");
if (lessonForm) {
  lessonForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("lesson-title").value;
    const cover = document.getElementById("lesson-cover").value || "";
    const content = document.getElementById("lesson-content").value;

    try {
      await addDoc(collection(db, "lessons"), { title, cover, content, problems: [] });
      alert("Lesson added!");
      lessonForm.reset();
    } catch (err) {
      alert("Error adding lesson: " + err.message);
    }
  });
}

// Search lessons
const searchLesson = document.getElementById("search-lesson");
const lessonsList = document.getElementById("lessons-list");

if (searchLesson) {
  searchLesson.addEventListener("input", async () => {
    const term = searchLesson.value.trim().toLowerCase();
    lessonsList.innerHTML = "";

    if (!term) return;

    const snap = await getDocs(collection(db, "lessons"));
    snap.forEach(docSnap => {
      const lesson = docSnap.data();
      if (
        docSnap.id.includes(term) ||
        lesson.title.toLowerCase().includes(term) ||
        lesson.content.toLowerCase().includes(term)
      ) {
        const div = document.createElement("div");
        div.classList.add("card");
        div.innerHTML = `
          <h3>${lesson.title}</h3>
          <p>${lesson.content.substring(0, 100)}...</p>
          <button class="btn">Edit</button>
        `;
        lessonsList.appendChild(div);
      }
    });
  });
}

// ===== Users =====
const searchUser = document.getElementById("search-user");
const usersList = document.getElementById("users-list");

if (searchUser) {
  searchUser.addEventListener("input", async () => {
    const term = searchUser.value.trim().toLowerCase();
    usersList.innerHTML = "";

    if (!term) return;

    const snap = await getDocs(collection(db, "users"));
    snap.forEach(docSnap => {
      const user = docSnap.data();
      if (
        docSnap.id.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      ) {
        const div = document.createElement("div");
        div.classList.add("card");

        // Prevent editing your own role
        let roleControls = "";
        if (docSnap.id !== auth.currentUser.uid) {
          roleControls = `<button class="btn">Change Role</button>`;
        } else {
          roleControls = `<span>(You cannot change your own role)</span>`;
        }

        div.innerHTML = `
          <h3>${user.email}</h3>
          <p>Role: ${user.role}</p>
          ${roleControls}
        `;
        usersList.appendChild(div);
      }
    });
  });
}
