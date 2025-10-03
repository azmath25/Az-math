// js/admin-lessons.js
import {
  db,
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "../js/firebase.js";

async function loadLessons() {
  const list = document.getElementById("lessons-list");
  list.innerHTML = "Loading...";
  const q = query(collection(db, "lessons"), orderBy("id"));
  const snap = await getDocs(q);
  list.innerHTML = "";
  if (snap.empty) return list.innerHTML = "<p>No lessons yet</p>";
  snap.forEach(d => {
    const L = d.data();
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div>
        <strong>${L.title || "Lesson " + L.id}</strong>
        <div>${L.category || ""}</div>
      </div>
      <div class="actions">
        <a class="btn" href="edit-lesson.html?id=${L.id}">Edit</a>
        <button class="btn btn-danger" data-id="${L.id}" data-action="delete">Delete</button>
      </div>
    `;
    list.appendChild(card);
  });
  document.querySelectorAll('button[data-action="delete"]').forEach(b => {
    b.addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.id;
      if (!confirm("Delete lesson " + id + "?")) return;
      await deleteDoc(doc(db, "lessons", String(id)));
      loadLessons();
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("add-lesson-btn").addEventListener("click", async () => {
    // naive new id: timestamp or use meta/lessons.latestId pattern in production
    const newId = Date.now();
    await setDoc(doc(db, "lessons", String(newId)), {
      id: newId,
      title: "",
      category: "",
      tags: [],
      cover: "",
      blocks: [],
      problems: [],
      draft: true,
      timestamp: serverTimestamp()
    });
    location.href = `edit-lesson.html?id=${newId}`;
  });
  loadLessons();
});
