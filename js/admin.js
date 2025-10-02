// js/admin.js
import { db } from "./firebase.js";
import { protectAdminPage } from "./auth.js";
import {
  collection,
  doc,
  getDoc,
  runTransaction,
  setDoc,
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// Protect page
protectAdminPage();

/**
 * Get the next numeric ID for either "problems" or "lessons"
 */
async function getNextId(kind) {
  const countersRef = doc(db, "counters", "main"); // one doc holding both
  let newId = null;

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(countersRef);
    if (!snap.exists()) {
      throw new Error("Counters document does not exist!");
    }

    const data = snap.data();
    const current = data[kind] ?? 0;
    newId = current + 1;
    transaction.update(countersRef, { [kind]: newId });
  });

  return newId;
}

/**
 * Save a problem or lesson into Firestore with numeric ID
 */
export async function saveToFirestore(kind, data) {
  const newId = await getNextId(kind);
  data.id = newId;

  const ref = doc(db, kind, String(newId)); // store as numeric string
  await setDoc(ref, data);

  return newId;
}

// --- Problem Editor logic (sketch) ---
const problemEditor = document.getElementById("problem-editor");
const addStatementBtn = document.getElementById("add-statement-btn");
const addSolutionBtn = document.getElementById("add-solution-btn");
const previewProblemBtn = document.getElementById("preview-problem-btn");

function createBlock(type, value = "") {
  const block = document.createElement("div");
  block.className = "editor-block";

  if (type === "text") {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.placeholder = "Enter text...";
    block.appendChild(textarea);
  } else if (type === "image") {
    const input = document.createElement("input");
    input.type = "text";
    input.value = value;
    input.placeholder = "Enter image URL...";
    block.appendChild(input);
  }

  const delBtn = document.createElement("button");
  delBtn.textContent = "✖";
  delBtn.className = "delete-btn";
  delBtn.onclick = () => block.remove();

  block.appendChild(delBtn);
  return block;
}

// Add Statement
if (addStatementBtn) {
  addStatementBtn.onclick = () => {
    if (!document.querySelector("#statement-section")) {
      const section = document.createElement("div");
      section.id = "statement-section";
      section.innerHTML = `<h3>Statement</h3>`;
      const addText = document.createElement("button");
      addText.textContent = "Add Text Block";
      addText.onclick = () => section.appendChild(createBlock("text"));

      const addImage = document.createElement("button");
      addImage.textContent = "Add Image Block";
      addImage.onclick = () => section.appendChild(createBlock("image"));

      section.appendChild(addText);
      section.appendChild(addImage);
      problemEditor.appendChild(section);
    }
  };
}

// Add Solution
if (addSolutionBtn) {
  addSolutionBtn.onclick = () => {
    const section = document.createElement("div");
    section.className = "solution-section";
    section.innerHTML = `<h3>Solution</h3>`;
    const addText = document.createElement("button");
    addText.textContent = "Add Text Block";
    addText.onclick = () => section.appendChild(createBlock("text"));

    const addImage = document.createElement("button");
    addImage.textContent = "Add Image Block";
    addImage.onclick = () => section.appendChild(createBlock("image"));

    section.appendChild(addText);
    section.appendChild(addImage);
    problemEditor.appendChild(section);
  };
}

// Preview Problem
if (previewProblemBtn) {
  previewProblemBtn.onclick = async () => {
    const title = document.getElementById("problem-title").value;
    const statementBlocks = [];
    const solutionBlocks = [];

    // collect statement
    const statementSection = document.getElementById("statement-section");
    if (statementSection) {
      statementSection.querySelectorAll(".editor-block").forEach((b) => {
        const input = b.querySelector("textarea, input");
        statementBlocks.push({ type: input.tagName === "TEXTAREA" ? "text" : "image", value: input.value });
      });
    }

    // collect solutions
    document.querySelectorAll(".solution-section").forEach((sec) => {
      const blocks = [];
      sec.querySelectorAll(".editor-block").forEach((b) => {
        const input = b.querySelector("textarea, input");
        blocks.push({ type: input.tagName === "TEXTAREA" ? "text" : "image", value: input.value });
      });
      solutionBlocks.push(blocks);
    });

    const draft = {
      title,
      statement: statementBlocks,
      solutions: solutionBlocks,
    };

    // Save draft to localStorage
    localStorage.setItem("preview-problem", JSON.stringify(draft));

    // Open problem.html in preview mode
    window.open(`problem.html?preview=true`, "_blank");
  };
}
