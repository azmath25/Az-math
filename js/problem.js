// js/problem.js
import { db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// Get problem ID from URL query (?id=123)
const urlParams = new URLSearchParams(window.location.search);
const problemId = urlParams.get("id");

const titleEl = document.getElementById("problem-title");
const statementEl = document.getElementById("problem-statement");
const solutionBtn = document.getElementById("show-solution");
const solutionEl = document.getElementById("solution-container");

async function loadProblem() {
  if (!problemId) {
    titleEl.textContent = "Problem not found";
    statementEl.textContent = "No problem ID provided.";
    return;
  }

  try {
    const docRef = doc(db, "problems", problemId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      titleEl.textContent = "Problem not found";
      statementEl.textContent = "This problem does not exist.";
      return;
    }

    const data = snap.data();
    titleEl.textContent = data.title || "Untitled Problem";
    statementEl.textContent = data.statement || "No statement available.";
    solutionEl.textContent = data.solution || "No solution available.";

    // Only show button if solution exists
    if (data.solution) {
      solutionBtn.style.display = "inline-block";
      solutionBtn.addEventListener("click", () => {
        solutionEl.style.display = "block";
        solutionBtn.style.display = "none";
      });
    }
  } catch (err) {
    titleEl.textContent = "Error loading problem";
    statementEl.textContent = err.message;
  }
}

loadProblem();
