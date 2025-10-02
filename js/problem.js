// js/problem.js
import { db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

function getProblemId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function loadProblem() {
  const id = getProblemId();
  if (!id) return;

  const snap = await getDoc(doc(db, "problems", id));
  if (snap.exists()) {
    const data = snap.data();
    document.getElementById("problem-title").textContent = data.title;
    document.getElementById("problem-statement").textContent = data.statement;

    const solutionBtn = document.getElementById("show-solution");
    const solContainer = document.getElementById("solution-container");

    solutionBtn.addEventListener("click", () => {
      solContainer.style.display = "block";
      solContainer.innerHTML = data.solution || "<p>No solution yet.</p>";
    });
  } else {
    document.getElementById("problem-title").textContent = "Problem not found";
  }
}

loadProblem();
