import { db, auth } from "./firebase.js";
import { protectAdminPage } from "./auth.js";
import { 
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// Protect page
protectAdminPage();

// ===== Tabs =====
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
  });
});

// ===== Problems =====
const problemsRef = collection(db, "problems");
const problemForm = document.getElementById("add-problem-form");
const problemsList = document.getElementById("problems-list");
const searchProblem = document.getElementById("search-problem");

problemForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("problem-title").value;
  const statement = document.getElementById("problem-statement").value;
  const solution = document.getElementById("problem-solution").value;

  await addDoc(problemsRef, { title, statement, solution, lessons: [] });
  alert("Problem added!");
  problemForm.reset();
});

searchProblem?.addEventListener("input", async () => {
  problemsList.innerHTML = "";
  const term = searchProblem.value.toLowerCase();
  if (!term) return;

  const snap = await getDocs(problemsRef);
  snap.forEach(d => {
    const prob = d.data();
    if (d.id.includes(term) || prob.title.toLowerCase().includes(term) || prob.statement.toLowerCase().includes(term)) {
      const div = document.createElement("div");
      div.classList.add("card");
      div.innerHTML = `
        <h3>${prob.title}</h3>
        <p>${prob.statement}</p>
        <button class="btn edit-prob" data-id="${d.id}">Edit</button>
        <button class="btn delete-prob" data-id="${d.id}">Delete</button>
      `;
      problemsList.appendChild(div);
    }
  });

  document.querySelectorAll(".edit-prob").forEach(btn =>
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const newTitle = prompt("New title:");
      if (newTitle) await updateDoc(doc(db, "problems", id), { title: newTitle });
      alert("Updated!");
    })
  );

  document.querySelectorAll(".delete-prob").forEach(btn =>
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (confirm("Delete this problem?")) {
        await deleteDoc(doc(db, "problems", id));
        alert("Deleted!");
        btn.parentElement.remove();
      }
    })
  );
});

// ===== Lessons =====
const lessonsRef = collection(db, "lessons");
const lessonForm = document.getElementById("add-lesson-form");
const lessonsList = document.getElementById("lessons-list");
const searchLesson = document.getElementById("search-lesson");

lessonForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("lesson-title").value;
  const cover = document.getElementById("lesson-cover").value || "";
  const content = document.getElementById("lesson-content").value;

  await addDoc(lessonsRef, { title, cover, content, problems: [] });
  alert("Lesson added!");
  lessonForm.reset();
});

searchLesson?.addEventListener("input", async () => {
  lessonsList.innerHTML = "";
  const term = searchLesson.value.toLowerCase();
  if (!term) return;

  const snap = await getDocs(lessonsRef);
  snap.forEach(d => {
    const lesson = d.data();
    if (d.id.includes(term) || lesson.title.toLowerCase().includes(term) || lesson.content.toLowerCase().includes(term)) {
      const div = document.createElement("div");
      div.classList.add("card");
      div.innerHTML = `
        <h3>${lesson.title}</h3>
        <p>${lesson.content.substring(0,100)}...</p>
        <button class="btn edit-lesson" data-id="${d.id}">Edit</button>
        <button class="btn delete-lesson" data-id="${d.id}">Delete</button>
      `;
      lessonsList.appendChild(div);
    }
  });

  document.querySelectorAll(".edit-lesson").forEach(btn =>
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const newTitle = prompt("New title:");
      if (newTitle) await updateDoc(doc(db, "lessons", id), { title: newTitle });
      alert("Updated!");
    })
  );

  document.querySelectorAll(".delete-lesson").forEach(btn =>
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (confirm("Delete this lesson?")) {
        await deleteDoc(doc(db, "lessons", id));
        alert("Deleted!");
        btn.parentElement.remove();
      }
    })
  );
});

// ===== Users =====
const usersRef = collection(db, "users");
const searchUser = document.getElementById("search-user");
const usersList = document.getElementById("users-list");

searchUser?.addEventListener("input", async () => {
  usersList.innerHTML = "";
  const term = searchUser.value.toLowerCase();
  if (!term) return;

  const snap = await getDocs(usersRef);
  snap.forEach(d => {
    const user = d.data();
    if (d.id.includes(term) || user.email.toLowerCase().includes(term)) {
      const div = document.createElement("div");
      div.classList.add("card");

      let roleControl = "";
      if (d.id !== auth.currentUser.uid) {
        roleControl = `<button class="btn change-role" data-id="${d.id}" data-role="${user.role}">
          Make ${user.role === "admin" ? "User" : "Admin"}
        </button>`;
      } else {
        roleControl = `<span>(You cannot change your own role)</span>`;
      }

      div.innerHTML = `
        <h3>${user.email}</h3>
        <p>Role: ${user.role}</p>
        ${roleControl}
      `;
      usersList.appendChild(div);
    }
  });

  document.querySelectorAll(".change-role").forEach(btn =>
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const role = btn.dataset.role === "admin" ? "user" : "admin";
      await updateDoc(doc(db, "users", id), { role });
      alert("Role updated!");
    })
  );
});
