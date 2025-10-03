// js/lessons.js
import { db, collection, query, where, orderBy, getDocs } from "./firebase.js";

document.addEventListener("DOMContentLoaded", async () => {
  const list = document.getElementById("lessons-list");
  if (!list) return;
  list.innerHTML = "Loading...";
  const q = query(collection(db, "lessons"), where("draft", "==", false), orderBy("id"));
  const snap = await getDocs(q);
  list.innerHTML = "";
  if (snap.empty) {
    list.innerHTML = "<p>No lessons found.</p>";
    return;
  }
  snap.forEach(d => {
    const L = d.data();
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-header"><strong>${L.title || "Lesson " + L.id}</strong></div>
      <div class="card-body">
        <p>${L.category || ""} · ${L.tags ? L.tags.join(", ") : ""}</p>
        ${L.cover ? `<img src="${L.cover}" alt="cover" style="max-width:100px"/>` : ""}
      </div>
      <div class="card-footer">
        <a href="lesson.html?id=${L.id}" class="btn">View Lesson →</a>
      </div>
    `;
    list.appendChild(card);
  });
});
