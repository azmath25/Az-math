// js/lesson.js
import { db } from "./firebase.js";
import { doc, getDoc, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

function getLessonId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function loadLesson() {
  const id = getLessonId();
  if (!id) return;

  const snap = await getDoc(doc(db, "lessons", id));
  if (snap.exists()) {
    const data = snap.data();
    document.getElementById("lesson-title").textContent = data.title;
    document.getElementById("lesson-content").innerHTML = data.content;

    // Related problems
    const relProblems = document.getElementById("lesson-problems");
    const q = query(collection(db, "problems"), where("lessonIds", "array-contains", id));
    const res = await getDocs(q);
    relProblems.innerHTML = "";
    res.forEach(doc => {
      const p = doc.data();
      relProblems.innerHTML += `<li><a href="problem.html?id=${doc.id}">${p.title}</a></li>`;
    });
  } else {
    document.getElementById("lesson-title").textContent = "Lesson not found";
  }
}

loadLesson();
