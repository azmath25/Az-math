// js/lesson.js
import { db, doc, getDoc } from "./firebase.js";

function renderBlock(b) {
  if (!b) return "";
  if (b.type === "text") return `<div class="block-text">${b.content}</div>`;
  if (b.type === "image") return `<div class="block-image"><img src="${b.url}" style="max-width:100%"/></div>`;
  if (b.type === "problem") return `<div class="block-ref">Problem: <a href="problem.html?id=${b.problemId}">${b.problemId}</a></div>`;
  return `<div class="block-unknown">${JSON.stringify(b)}</div>`;
}

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  if (!id) {
    document.getElementById("lesson-title").textContent = "Lesson not found";
    return;
  }
  const snap = await getDoc(doc(db, "lessons", String(id)));
  if (!snap.exists()) {
    document.getElementById("lesson-title").textContent = "Lesson not found";
    return;
  }
  const data = snap.data();
  document.getElementById("lesson-title").textContent = data.title || `Lesson #${data.id}`;
  document.getElementById("lesson-id").textContent = `#${data.id}`;
  document.getElementById("lesson-category").textContent = data.category || "";

  const tagsContainer = document.getElementById("lesson-tags");
  tagsContainer.innerHTML = "";
  (data.tags || []).forEach(t => {
    const s = document.createElement("span");
    s.className = "tag";
    s.textContent = t;
    tagsContainer.appendChild(s);
  });

  const content = document.getElementById("lesson-content");
  content.innerHTML = "";
  (data.blocks || []).forEach(b => content.insertAdjacentHTML("beforeend", renderBlock(b)));

  document.getElementById("lesson-author").textContent = data.author || "";
  document.getElementById("lesson-timestamp").textContent = data.timestamp ? new Date(data.timestamp).toLocaleString() : "";
});
