import { db, auth } from "./firebase.js";
import { protectAdminPage } from "./auth.js";
import { 
  collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// Protect page
protectAdminPage();

// ===== COUNTER HELPER =====
async function getNextNumber(type) {
  const counterRef = doc(db, "meta", "counters");
  const snap = await getDoc(counterRef);

  let last = 0;
  if (snap.exists()) {
    last = snap.data()[type] || 0;
  }
  const next = last + 1;

  await updateDoc(counterRef, { [type]: next });
  return next;
}

// ===== Problems =====
const problemsRef = collection(db, "problems");
const problemForm = document.getElementById("add-problem-form");
if (problemForm) {
  problemForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("problem-title").value;
    const statement = document.getElementById("problem-statement").value;
    const solution = document.getElementById("problem-solution").value;

    try {
      const number = await getNextNumber("problems");
      await addDoc(problemsRef, { number, title, statement, solution, lessons: [] });
      alert(`Problem #${number} added!`);
      problemForm.reset();
    } catch (err) {
      alert("Error adding problem: " + err.message);
    }
  });
}

// ===== Lessons =====
const lessonsRef = collection(db, "lessons");
const lessonForm = document.getElementById("add-lesson-form");
if (lessonForm) {
  lessonForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("lesson-title").value;
    const cover = document.getElementById("lesson-cover").value || "";
    const content = document.getElementById("lesson-content").value;

    try {
      const number = await getNextNumber("lessons");
      await addDoc(lessonsRef, { number, title, cover, content, problems: [] });
      alert(`Lesson #${number} added!`);
      lessonForm.reset();
    } catch (err) {
      alert("Error adding lesson: " + err.message);
    }
  });
}
