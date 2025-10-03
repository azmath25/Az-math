import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const problemsGrid = document.getElementById("problemsGrid");
const searchInput = document.getElementById("searchInput");

// ===== Load and Render Problems =====
async function loadProblems() {
  try {
    problemsGrid.innerHTML = "<p>Loading problems...</p>";
    const q = query(collection(db, "problems"), orderBy("title"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      problemsGrid.innerHTML = "<p>No problems found.</p>";
      return;
    }

    problemsGrid.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const problem = docSnap.data();
      const card = createProblemCard(docSnap.id, problem);
      problemsGrid.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading problems:", err);
    problemsGrid.innerHTML = "<p>Error loading problems.</p>";
  }
}

// ===== Create Problem Card =====
function createProblemCard(id, problem) {
  const card = document.createElement("div");
  card.className = "problem-card";

  const title = document.createElement("h3");
  title.textContent = problem.title || "Untitled";

  const statement = document.createElement("p");
  statement.textContent = (problem.statement || "").slice(0, 100) + "...";

  const btnGroup = document.createElement("div");
  btnGroup.className = "btn-group";

  const editBtn = document.createElement("button");
  editBtn.textContent = "Edit";
  editBtn.addEventListener("click", () => {
    window.location.href = `problem-edit.html?id=${id}`;
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.className = "danger";
  deleteBtn.addEventListener("click", async () => {
    if (!confirm("Are you sure you want to delete this problem?")) return;
    try {
      await deleteDoc(doc(db, "problems", id));
      alert("Problem deleted.");
      loadProblems();
    } catch (err) {
      console.error("Error deleting problem:", err);
      alert("Failed to delete problem.");
    }
  });

  btnGroup.appendChild(editBtn);
  btnGroup.appendChild(deleteBtn);

  card.appendChild(title);
  card.appendChild(statement);
  card.appendChild(btnGroup);

  return card;
}

// ===== Search Problems =====
searchInput.addEventListener("input", () => {
  const term = searchInput.value.toLowerCase();
  const cards = document.querySelectorAll(".problem-card");
  cards.forEach((card) => {
    const title = card.querySelector("h3").textContent.toLowerCase();
    card.style.display = title.includes(term) ? "block" : "none";
  });
});

// ===== Initial Load =====
loadProblems();
