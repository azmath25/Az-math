// js/problem.js
import {
  db,
  doc,
  getDoc
} from "./firebase.js";

function renderBlock(b) {
  if (!b) return "";
  if (b.type === "text") return `<div class="block-text">${b.content}</div>`;
  if (b.type === "image") return `<div class="block-image"><img src="${b.url}" alt="image" style="max-width:100%"/></div>`;
  if (b.type === "problem") return `<div class="block-ref">Problem ref: <a href="problem.html?id=${b.problemId}">${b.problemId}</a></div>`;
  if (b.type === "lesson") return `<div class="block-ref">Lesson ref: <a href="lesson.html?id=${b.lessonId}">${b.lessonId}</a></div>`;
  return `<div class="block-unknown">${JSON.stringify(b)}</div>`;
}

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  if (!id) {
    document.getElementById("problem-title").textContent = "Problem not found";
    return;
  }
  const snap = await getDoc(doc(db, "problems", String(id)));
  if (!snap.exists()) {
    document.getElementById("problem-title").textContent = "Problem not found";
    return;
  }
  const data = snap.data();
  document.getElementById("problem-title").textContent = data.title || `Problem #${data.id}`;
  document.getElementById("problem-id").textContent = `#${data.id}`;
  document.getElementById("problem-category").textContent = data.category || "";
  document.getElementById("problem-difficulty").textContent = data.difficulty || "";
  document.getElementById("problem-author").textContent = data.author || "";
  document.getElementById("problem-timestamp").textContent = data.timestamp ? new Date(data.timestamp).toLocaleString() : "";

  // render tags
  const tagsContainer = document.getElementById("problem-tags");
  tagsContainer.innerHTML = "";
  (data.tags || []).forEach(t => {
    const s = document.createElement("span");
    s.className = "tag";
    s.textContent = t;
    tagsContainer.appendChild(s);
  });

  // statement
  const statementDiv = document.getElementById("problem-statement");
  statementDiv.innerHTML = "";
  (data.statement || []).forEach(b => {
    statementDiv.insertAdjacentHTML("beforeend", renderBlock(b));
  });

  // lesson refs
  const lessonList = document.getElementById("lesson-list");
  lessonList.innerHTML = "";
  (data.lessons || []).forEach(lid => {
    const li = document.createElement("li");
    li.innerHTML = `<a href="lesson.html?id=${lid}">Lesson ${lid}</a>`;
    lessonList.appendChild(li);
  });

  // solutions
  const showBtn = document.getElementById("show-solutions");
  const solContainer = document.getElementById("solutions-container");
  showBtn.addEventListener("click", () => {
    if (!data.solutions || !data.solutions.length) {
      solContainer.innerHTML = "<p>No solutions yet.</p>";
    } else {
      solContainer.innerHTML = "";
      data.solutions.forEach((sol, idx) => {
        const wrapper = document.createElement("div");
        wrapper.className = "solution";
        wrapper.innerHTML = `<h3>Solution ${idx + 1}${sol.author ? " — " + sol.author : ""}</h3>`;
        sol.blocks.forEach(b => wrapper.insertAdjacentHTML("beforeend", renderBlock(b)));
        solContainer.appendChild(wrapper);
      });
    }
    solContainer.style.display = "block";
    showBtn.style.display = "none";
  });
});
