// js/lessons.js
import { db } from "./firebase.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const container = document.getElementById("lessons-list");

async function loadLessons() {
  try {
    const q = query(collection(db, "lessons"), orderBy("title"));
    const snapshot = await getDocs(q);

    container.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      container.innerHTML += `
        <div class="card">
          <h3>${data.title}</h3>
          <p>${data.content.substring(0, 100)}...</p>
          <button onclick="location.href='lesson.html?id=${doc.id}'">View Lesson</button>
        </div>
      `;
    });

    if (snapshot.empty) {
      container.innerHTML = "<p>No lessons found.</p>";
    }
  } catch (err) {
    console.error("Error loading lessons:", err);
    container.innerHTML = "<p>Failed to load lessons.</p>";
  }
}

if (container) loadLessons();
