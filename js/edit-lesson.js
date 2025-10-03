// js/edit-lesson.js
import { db, auth } from "./firebase.js";
import { protectAdminPage } from "./auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

protectAdminPage();

const urlParams = new URLSearchParams(window.location.search);
const lessonId = urlParams.get("id");

let contentBlocks = [];

// Load lesson data
async function loadLesson() {
  if (!lessonId) {
    alert("No lesson ID provided");
    window.location.href = "lessons.html";
    return;
  }

  try {
    const snap = await getDoc(doc(db, "lessons", lessonId));
    if (!snap.exists()) {
      alert("Lesson not found");
      window.location.href = "lessons.html";
      return;
    }

    const data = snap.data();
    document.getElementById("lesson-id").value = data.id || lessonId;
    document.getElementById("lesson-title").value = data.title || "";
    document.getElementById("lesson-category").value = data.category || "";
    document.getElementById("lesson-tags").value = (data.tags || []).join(", ");
    document.getElementById("lesson-cover").value = data.cover || "";
    document.getElementById("problem-refs").value = (data.problems || []).join(", ");

    contentBlocks = data.blocks || [{ type: "text", content: "" }];
    renderContentBlocks();
  } catch (err) {
    alert("Error loading lesson: " + err.message);
  }
}

// Render content blocks
function renderContentBlocks() {
  const container = document.getElementById("content-blocks");
  container.innerHTML = contentBlocks.map((block, index) => renderBlockEditor(block, index)).join("");
}

// Render block editor
function renderBlockEditor(block, index) {
  if (block.type === "text") {
    return `
      <div class="block-editor" draggable="true" data-index="${index}">
        <div class="block-header">
          <span>📝 Text Block</span>
          <div class="block-controls">
            <button onclick="moveBlock(${index}, -1)" class="btn-icon">⬆️</button>
            <button onclick="moveBlock(${index}, 1)" class="btn-icon">⬇️</button>
            <button onclick="deleteBlock(${index})" class="btn-icon">🗑️</button>
          </div>
        </div>
        <textarea class="block-textarea" data-index="${index}">${block.content || ""}</textarea>
      </div>
    `;
  } else if (block.type === "image") {
    return `
      <div class="block-editor" draggable="true" data-index="${index}">
        <div class="block-header">
          <span>🖼️ Image Block</span>
          <div class="block-controls">
            <button onclick="moveBlock(${index}, -1)" class="btn-icon">⬆️</button>
            <button onclick="moveBlock(${index}, 1)" class="btn-icon">⬇️</button>
            <button onclick="deleteBlock(${index})" class="btn-icon">🗑️</button>
          </div>
        </div>
        <input type="text" class="block-input" data-index="${index}" 
               value="${block.url || ""}" placeholder="Image URL" />
        ${block.url ? `<img src="${block.url}" style="max-width:200px; margin-top:0.5rem; border-radius:6px;" />` : ""}
      </div>
    `;
  } else if (block.type === "problem") {
    return `
      <div class="block-editor" draggable="true" data-index="${index}">
        <div class="block-header">
          <span>🔗 Problem Reference</span>
          <div class="block-controls">
            <button onclick="moveBlock(${index}, -1)" class="btn-icon">⬆️</button>
            <button onclick="moveBlock(${index}, 1)" class="btn-icon">⬇️</button>
            <button onclick="deleteBlock(${index})" class="btn-icon">🗑️</button>
          </div>
        </div>
        <input type="number" class="block-input" data-index="${index}" 
               value="${block.problemId || ""}" placeholder="Problem ID" />
        <small>This will display a problem preview card</small>
      </div>
    `;
  }
  return "";
}

// Move block
window.moveBlock = function(index, direction) {
  const newIndex = index + direction;
  
  if (newIndex < 0 || newIndex >= contentBlocks.length) return;
  
  [contentBlocks[index], contentBlocks[newIndex]] = [contentBlocks[newIndex], contentBlocks[index]];
  renderContentBlocks();
};

// Delete block
window.deleteBlock = function(index) {
  contentBlocks.splice(index, 1);
  if (contentBlocks.length === 0) contentBlocks = [{ type: "text", content: "" }];
  renderContentBlocks();
};

// Update blocks from inputs
function updateBlocksFromInputs() {
  document.querySelectorAll('.block-textarea, .block-input').forEach(el => {
    const index = parseInt(el.dataset.index);
    const block = contentBlocks[index];
    
    if (!block) return;
    
    if (block.type === "text") {
      block.content = el.value;
    } else if (block.type === "image") {
      block.url = el.value;
    } else if (block.type === "problem") {
      block.problemId = el.value;
    }
  });
}

// Add blocks
document.getElementById("add-text-block")?.addEventListener("click", () => {
  contentBlocks.push({ type: "text", content: "" });
  renderContentBlocks();
});

document.getElementById("add-image-block")?.addEventListener("click", () => {
  contentBlocks.push({ type: "image", url: "" });
  renderContentBlocks();
});

document.getElementById("add-problem-ref")?.addEventListener("click", () => {
  contentBlocks.push({ type: "problem", problemId: "" });
  renderContentBlocks();
});

// Save functions
async function saveLesson(isDraft) {
  updateBlocksFromInputs();
  
  const title = document.getElementById("lesson-title").value.trim();
  if (!title) {
    alert("Title is required!");
    return;
  }
  
  const data = {
    id: parseInt(document.getElementById("lesson-id").value),
    title: title,
    category: document.getElementById("lesson-category").value,
    tags: document.getElementById("lesson-tags").value.split(",").map(t => t.trim()).filter(t => t),
    cover: document.getElementById("lesson-cover").value.trim(),
    draft: isDraft,
    author: auth.currentUser?.email || "",
    timestamp: Date.now(),
    blocks: contentBlocks,
    problems: document.getElementById("problem-refs").value.split(",").map(p => parseInt(p.trim())).filter(p => !isNaN(p))
  };

  try {
    await updateDoc(doc(db, "lessons", lessonId), data);
    alert(isDraft ? "Saved as draft!" : "Published successfully!");
    window.location.href = "lessons.html";
  } catch (err) {
    alert("Error saving: " + err.message);
  }
}

document.getElementById("save-draft-btn")?.addEventListener("click", () => saveLesson(true));
document.getElementById("publish-btn")?.addEventListener("click", () => saveLesson(false));

// Preview mode
document.getElementById("preview-btn")?.addEventListener("click", () => {
  updateBlocksFromInputs();
  
  const editorForm = document.getElementById("editor-form");
  const previewMode = document.getElementById("preview-mode");
  
  if (previewMode.style.display === "none") {
    // Show preview
    const title = document.getElementById("lesson-title").value;
    const category = document.getElementById("lesson-category").value;
    const tags = document.getElementById("lesson-tags").value.split(",").map(t => t.trim()).filter(t => t);
    
    document.getElementById("preview-title").textContent = title || "Untitled Lesson";
    document.getElementById("preview-id").textContent = `#${lessonId}`;
    document.getElementById("preview-category").textContent = category || "Uncategorized";
    document.getElementById("preview-tags").innerHTML = tags.map(t => `<span class="tag">${t}</span>`).join("");
    
    document.getElementById("preview-content").innerHTML = contentBlocks.map(renderBlockPreview).join("");
    
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
  if (block.type === "problem") return `
    <div class="problem-preview-card">
      <h4>Problem #${block.problemId}</h4>
      <p class="problem-preview-category">Preview not available in editor</p>
      <a href="../problem.html?id=${block.problemId}" class="btn btn-small">View Problem →</a>
    </div>
  `;
  return "";
}

// Load on page load
loadLesson();
