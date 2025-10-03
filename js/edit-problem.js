// js/edit-problem.js
import { db, auth } from "./firebase.js";
import { protectAdminPage } from "./auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

protectAdminPage();

const urlParams = new URLSearchParams(window.location.search);
const problemId = urlParams.get("id");

let statementBlocks = [];
let solutionsList = [[]]; // Array of solutions, each solution is an array of blocks

// Load problem data
async function loadProblem() {
  if (!problemId) {
    alert("No problem ID provided");
    window.location.href = "problems.html";
    return;
  }

  try {
    const snap = await getDoc(doc(db, "problems", problemId));
    if (!snap.exists()) {
      alert("Problem not found");
      window.location.href = "problems.html";
      return;
    }

    const data = snap.data();
    document.getElementById("problem-id").value = data.id || problemId;
    document.getElementById("problem-title").value = data.title || "";
    document.getElementById("problem-category").value = data.category || "";
    document.getElementById("problem-difficulty").value = data.difficulty || "Medium";
    document.getElementById("problem-tags").value = (data.tags || []).join(", ");
    document.getElementById("lesson-refs").value = (data.lessons || []).join(", ");

    statementBlocks = data.statement || [{ type: "text", content: "" }];
    solutionsList = data.solutions || [[{ type: "text", content: "" }]];

    renderStatementBlocks();
    renderSolutions();
  } catch (err) {
    alert("Error loading problem: " + err.message);
  }
}

// Render statement blocks
function renderStatementBlocks() {
  const container = document.getElementById("statement-blocks");
  container.innerHTML = statementBlocks.map((block, index) => renderBlockEditor(block, index, "statement")).join("");
}

// Render block editor
function renderBlockEditor(block, index, context) {
  if (block.type === "text") {
    return `
      <div class="block-editor" draggable="true" data-index="${index}">
        <div class="block-header">
          <span>📝 Text Block</span>
          <div class="block-controls">
            <button onclick="moveBlock('${context}', ${index}, -1)" class="btn-icon">⬆️</button>
            <button onclick="moveBlock('${context}', ${index}, 1)" class="btn-icon">⬇️</button>
            <button onclick="deleteBlock('${context}', ${index})" class="btn-icon">🗑️</button>
          </div>
        </div>
        <textarea class="block-textarea" data-context="${context}" data-index="${index}">${block.content || ""}</textarea>
      </div>
    `;
  } else if (block.type === "image") {
    return `
      <div class="block-editor" draggable="true" data-index="${index}">
        <div class="block-header">
          <span>🖼️ Image Block</span>
          <div class="block-controls">
            <button onclick="moveBlock('${context}', ${index}, -1)" class="btn-icon">⬆️</button>
            <button onclick="moveBlock('${context}', ${index}, 1)" class="btn-icon">⬇️</button>
            <button onclick="deleteBlock('${context}', ${index})" class="btn-icon">🗑️</button>
          </div>
        </div>
        <input type="text" class="block-input" data-context="${context}" data-index="${index}" 
               value="${block.url || ""}" placeholder="Image URL" />
      </div>
    `;
  } else if (block.type === "problem") {
    return `
      <div class="block-editor" draggable="true" data-index="${index}">
        <div class="block-header">
          <span>🔗 Problem Reference</span>
          <div class="block-controls">
            <button onclick="moveBlock('${context}', ${index}, -1)" class="btn-icon">⬆️</button>
            <button onclick="moveBlock('${context}', ${index}, 1)" class="btn-icon">⬇️</button>
            <button onclick="deleteBlock('${context}', ${index})" class="btn-icon">🗑️</button>
          </div>
        </div>
        <input type="number" class="block-input" data-context="${context}" data-index="${index}" 
               value="${block.problemId || ""}" placeholder="Problem ID" />
      </div>
    `;
  } else if (block.type === "lesson") {
    return `
      <div class="block-editor" draggable="true" data-index="${index}">
        <div class="block-header">
          <span>📚 Lesson Reference</span>
          <div class="block-controls">
            <button onclick="moveBlock('${context}', ${index}, -1)" class="btn-icon">⬆️</button>
            <button onclick="moveBlock('${context}', ${index}, 1)" class="btn-icon">⬇️</button>
            <button onclick="deleteBlock('${context}', ${index})" class="btn-icon">🗑️</button>
          </div>
        </div>
        <input type="number" class="block-input" data-context="${context}" data-index="${index}" 
               value="${block.lessonId || ""}" placeholder="Lesson ID" />
      </div>
    `;
  }
  return "";
}

// Render solutions
function renderSolutions() {
  const container = document.getElementById("solutions-container");
  container.innerHTML = solutionsList.map((solution, sIndex) => `
    <div class="solution-editor">
      <div class="solution-header">
        <h3>Solution ${sIndex + 1}</h3>
        <button onclick="deleteSolution(${sIndex})" class="btn btn-delete btn-small">🗑️ Delete Solution</button>
      </div>
      <div id="solution-${sIndex}-blocks" class="blocks-container">
        ${solution.map((block, bIndex) => renderBlockEditor(block, bIndex, `solution-${sIndex}`)).join("")}
      </div>
      <div class="block-actions">
        <button onclick="addBlockToSolution(${sIndex}, 'text')" class="btn btn-small">➕ Text</button>
        <button onclick="addBlockToSolution(${sIndex}, 'image')" class="btn btn-small">🖼️ Image</button>
      </div>
    </div>
  `).join("");
}

// Add block functions
window.addBlockToSolution = function(sIndex, type) {
  const newBlock = type === "text" ? { type: "text", content: "" } : { type: "image", url: "" };
  solutionsList[sIndex].push(newBlock);
  renderSolutions();
};

window.deleteSolution = function(sIndex) {
  if (confirm("Delete this solution?")) {
    solutionsList.splice(sIndex, 1);
    if (solutionsList.length === 0) {
      solutionsList = [[{ type: "text", content: "" }]];
    }
    renderSolutions();
  }
};

window.moveBlock = function(context, index, direction) {
  const blocks = context === "statement" ? statementBlocks : solutionsList[parseInt(context.split("-")[1])];
  const newIndex = index + direction;
  
  if (newIndex < 0 || newIndex >= blocks.length) return;
  
  [blocks[index], blocks[newIndex]] = [blocks[newIndex], blocks[index]];
  
  if (context === "statement") renderStatementBlocks();
  else renderSolutions();
};

window.deleteBlock = function(context, index) {
  if (context === "statement") {
    statementBlocks.splice(index, 1);
    if (statementBlocks.length === 0) statementBlocks = [{ type: "text", content: "" }];
    renderStatementBlocks();
  } else {
    const sIndex = parseInt(context.split("-")[1]);
    solutionsList[sIndex].splice(index, 1);
    if (solutionsList[sIndex].length === 0) solutionsList[sIndex] = [{ type: "text", content: "" }];
    renderSolutions();
  }
};

// Update blocks from inputs
function updateBlocksFromInputs() {
  // Update statement blocks
  document.querySelectorAll('[data-context="statement"]').forEach(el => {
    const index = parseInt(el.dataset.index);
    const block = statementBlocks[index];
    
    if (block.type === "text") {
      block.content = el.value;
    } else if (block.type === "image") {
      block.url = el.value;
    } else if (block.type === "problem") {
      block.problemId = el.value;
    } else if (block.type === "lesson") {
      block.lessonId = el.value;
    }
  });

  // Update solution blocks
  solutionsList.forEach((solution, sIndex) => {
    document.querySelectorAll(`[data-context="solution-${sIndex}"]`).forEach(el => {
      const bIndex = parseInt(el.dataset.index);
      const block = solution[bIndex];
      
      if (block.type === "text") {
        block.content = el.value;
      } else if (block.type === "image") {
        block.url = el.value;
      }
    });
  });
}

// Add statement blocks
document.getElementById("add-text-statement")?.addEventListener("click", () => {
  statementBlocks.push({ type: "text", content: "" });
  renderStatementBlocks();
});

document.getElementById("add-image-statement")?.addEventListener("click", () => {
  statementBlocks.push({ type: "image", url: "" });
  renderStatementBlocks();
});

document.getElementById("add-problem-ref-statement")?.addEventListener("click", () => {
  statementBlocks.push({ type: "problem", problemId: "" });
  renderStatementBlocks();
});

document.getElementById("add-lesson-ref-statement")?.addEventListener("click", () => {
  statementBlocks.push({ type: "lesson", lessonId: "" });
  renderStatementBlocks();
});

document.getElementById("add-solution-btn")?.addEventListener("click", () => {
  solutionsList.push([{ type: "text", content: "" }]);
  renderSolutions();
});

// Save functions
async function saveProblem(isDraft) {
  updateBlocksFromInputs();
  
  const data = {
    id: parseInt(document.getElementById("problem-id").value),
    title: document.getElementById("problem-title").value.trim() || `Problem ${problemId}`,
    category: document.getElementById("problem-category").value,
    difficulty: document.getElementById("problem-difficulty").value,
    tags: document.getElementById("problem-tags").value.split(",").map(t => t.trim()).filter(t => t),
    draft: isDraft,
    author: auth.currentUser?.email || "",
    timestamp: Date.now(),
    statement: statementBlocks,
    solutions: solutionsList,
    lessons: document.getElementById("lesson-refs").value.split(",").map(l => parseInt(l.trim())).filter(l => !isNaN(l))
  };

  try {
    await updateDoc(doc(db, "problems", problemId), data);
    alert(isDraft ? "Saved as draft!" : "Published successfully!");
    window.location.href = "problems.html";
  } catch (err) {
    alert("Error saving: " + err.message);
  }
}

document.getElementById("save-draft-btn")?.addEventListener("click", () => saveProblem(true));
document.getElementById("publish-btn")?.addEventListener("click", () => saveProblem(false));

// Preview mode
document.getElementById("preview-btn")?.addEventListener("click", () => {
  updateBlocksFromInputs();
  
  const editorForm = document.getElementById("editor-form");
  const previewMode = document.getElementById("preview-mode");
  
  if (previewMode.style.display === "none") {
    // Show preview
    const title = document.getElementById("problem-title").value || `Problem ${problemId}`;
    const category = document.getElementById("problem-category").value;
    const difficulty = document.getElementById("problem-difficulty").value;
    const tags = document.getElementById("problem-tags").value.split(",").map(t => t.trim()).filter(t => t);
    
    document.getElementById("preview-title").textContent = title;
    document.getElementById("preview-id").textContent = `#${problemId}`;
    document.getElementById("preview-category").textContent = category || "Uncategorized";
    document.getElementById("preview-difficulty").textContent = difficulty;
    document.getElementById("preview-difficulty").className = `meta-item difficulty-${difficulty.toLowerCase()}`;
    document.getElementById("preview-tags").innerHTML = tags.map(t => `<span class="tag">${t}</span>`).join("");
    
    document.getElementById("preview-statement").innerHTML = statementBlocks.map(renderBlockPreview).join("");
    document.getElementById("preview-solutions").innerHTML = solutionsList.map((sol, idx) => `
      <div class="solution-block">
        <h3>Solution ${idx + 1}</h3>
        ${sol.map(renderBlockPreview).join("")}
      </div>
    `).join("");
    
    editorForm.style.display = "none";
    previewMode.style.display = "block";
    document.getElementById("preview-btn").textContent = "✏️ Edit";
  } else {
    // Show editor
    editorForm.style.display = "block";
    previewMode.style.display = "none";
    document.getElementById("preview-btn").textContent = "👁️ Preview";
  }
});

function renderBlockPreview(block) {
  if (block.type === "text") return `<p>${block.content || ""}</p>`;
  if (block.type === "image") return `<img src="${block.url}" style="max-width:100%; border-radius:8px; margin:1rem 0;" />`;
  if (block.type === "problem") return `<div class="ref-block"><a href="../problem.html?id=${block.problemId}">→ Problem #${block.problemId}</a></div>`;
  if (block.type === "lesson") return `<div class="ref-block"><a href="../lesson.html?id=${block.lessonId}">→ Lesson #${block.lessonId}</a></div>`;
  return "";
}

// Load on page load
loadProblem();
