// js/admin.js
import { db } from "./firebase.js";
import { protectAdminPage } from "./auth.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// Protect page
protectAdminPage();

// Add Problem
const problemForm = document.getElementById("add-problem-form");
if (problemForm) {
  problemForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("problem-title").value;
    const statement = document.getElementById("problem-statement").value;

    try {
      await addDoc(collection(db, "problems"), { title, statement });
      alert("Problem added!");
      problemForm.reset();
    } catch (err) {
      alert("Error adding problem: " + err.message);
    }
  });
}

// Add Lesson
const lessonForm = document.getElementById("add-lesson-form");
if (lessonForm) {
  lessonForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("lesson-title").value;
    const content = document.getElementById("lesson-content").value;

    try {
      await addDoc(collection(db, "lessons"), { title, content });
      alert("Lesson added!");
      lessonForm.reset();
    } catch (err) {
      alert("Error adding lesson: " + err.message);
    }
  });
}
