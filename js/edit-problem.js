// js/edit-problem.js
import { db } from "./firebase.js";
import { protectAdminPage } from "./auth.js";
import { 
  doc, getDoc, updateDoc 
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

protectAdminPage();

const problemId = new URLSearchParams(window.location.search).get("id");
const titleInput = document.getElementById("title");
const categoryInput = document.getElementById("category");
const difficultyInput = document.getElementById("difficulty");
const tagsInput = document.getElementById("tags");
const draftCheckbox = document.getElementById("draft");
const statementContainer = document.getElementById("statement-container");
const solutionsContainer = document.getElementById("solutions-container");
const saveBtn = document.getElementById("save-btn");

let problemData = null;

// Render a block editor
function renderBlockEditor(block, container) {
  if (block.type === "text") {
    const textarea = document.createElement("textarea");
    textarea.value = block.content || "";
    textarea.className = "block-textarea";
    textarea.addEventListener("input", () => block.content = textarea.value);
    container.appendChild(textarea);
  } else if (block.type === "image") {
    const input = document.createElement("input");
    input.type = "text";
    input.value = block.url || "";
    input.placeholder = "Image URL";
    input.className = "block-input";
    input.addEventListener("input", () => block.url = input.value);
    container.appendChild(input);
  }
}

// Load problem
async function loadProblem() {
  try {
    const ref = doc(db, "problems", problemId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      alert("Problem not found!");
      return;
    }
    problemData = snap.data();

    // Fill inputs
    titleInput.value = problemData.title || "";
    categoryInput.value = problemData.category || "";
    difficultyInput.value = problemData.difficulty || "Medium";
    tagsInput.value = (problemData.tags || []).join(", ");
    draftCheckbox.checked = !!problemData.draft;

    // Render statement blocks
    statementContainer.innerHTML = "";
    (problemData.statement || []).forEach(block => {
      const div = document.createElement("div");
      div.className = "block-editor";
      renderBlockEditor(block, div);
      statementContainer.appendChild(div);
    });

    // Render solutions (flat array now ✅)
    solutionsContainer.innerHTML = "";
    (problemData.solutions || []).forEach(block => {
      const div = document.createElement("div");
      div.className = "block-editor";
      renderBlockEditor(block, div);
      solutionsContainer.appendChild(div);
    });

  } catch (err) {
    console.error("Error loading problem:", err);
  }
}

// Save problem
async function saveProblem() {
  try {
    // Collect updated data
    const updatedProblem = {
      ...problemData,
      title: titleInput.value,
      category: categoryInput.value,
      difficulty: difficultyInput.value,
      tags: tagsInput.value.split(",").map(t => t.trim()).filter(Boolean),
      draft: draftCheckbox.checked,
      statement: problemData.statement,
      solutions: problemData.solutions // ✅ flat array preserved
    };

    // Save to Firestore
    await updateDoc(doc(db, "problems", problemId), updatedProblem);
    alert("Problem saved!");
  } catch (err) {
    console.error("Error saving problem:", err);
    alert("Failed to save problem.");
  }
}

// Events
if (saveBtn) saveBtn.addEventListener("click", saveProblem);

// Init
loadProblem();
