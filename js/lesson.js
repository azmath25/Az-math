// js/lesson.js
import { db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const urlParams = new URLSearchParams(window.location.search);
const lessonId = urlParams.get("id");

const titleEl = document.getElementById("lesson-title");
const idEl = document.getElementById("lesson-id");
const categoryEl = document.getElementById("lesson-category");
const tagsEl = document.getElementById("lesson-tags");
const contentEl = document.getElementById("lesson-content");
const authorEl = document.getElementById("lesson-author");
const timestampEl = document.getElementById("lesson-timestamp");

// Render a block (text, image, problem ref)
async function renderBlock(block) {
  if (!block || !block.type) return "";
  
  if (block.type === "text") {
    return `<p>${block.content || ""}</p>`;
  } else if (block.type === "image") {
    return `<img src="${block.url}" alt="Lesson image" style="max-width:100%; border-radius:8px; margin:1rem 0;" />`;
  } else if (block.type === "problem") {
    // Fetch problem info for preview
    try {
      const problemDoc = await getDoc(doc(db, "problems", String(block.problemId)));
      if (problemDoc.exists()) {
        const problemData = problemDoc.data();
        return `
          <div class="problem-preview-card">
            <h4>Problem #${problemData.id || problemData.number || block.problemId}</h4>
            <p class="problem-preview-category">${problemData.category || "Uncategorized"} • ${problemData.difficulty || "Medium"}</p>
            <p>${getStatementPreview(problemData.statement)}</p>
            <a href="problem.html?id=${problemDoc.id}" class="btn btn-small">View Problem →</a>
          </div>
        `;
      } else {
        return `<div class="ref-block"><a href="problem.html?id=${block.problemId}" class="ref-link">→ Problem #${block.problemId}</a></div>`;
      }
    } catch (err) {
      return `<div class="ref-block"><a href="problem.html?id=${block.problemId}" class="ref-link">→ Problem #${block.problemId}</a></div>`;
    }
  }
  return "";
}

// Get preview text from statement blocks
function getStatementPreview(statement) {
  if (!Array.isArray(statement) || statement.length === 0) return "No preview available.";
  
  const firstTextBlock = statement.find(b => b.type === "text");
  if (firstTextBlock && firstTextBlock.content) {
    return firstTextBlock.content.substring(0, 200) + (firstTextBlock.content.length > 200 ? "..." : "");
  }
  return "No preview available.";
}

// Render blocks array (async because of problem previews)
async function renderBlocks(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return "<p>No content available.</p>";
  }
  
  const renderedBlocks = await Promise.all(blocks.map(block => renderBlock(block)));
  return renderedBlocks.join("");
}

// Load lesson data
async function loadLesson() {
  if (!lessonId) {
    titleEl.textContent = "Lesson not found";
    contentEl.innerHTML = "<p>No lesson ID provided.</p>";
    return;
  }

  try {
    const docRef = doc(db, "lessons", lessonId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      titleEl.textContent = "Lesson not found";
      contentEl.innerHTML = "<p>This lesson does not exist.</p>";
      return;
    }

    const data = snap.data();

    // Header info
    titleEl.textContent = data.title || `Lesson #${data.id || data.number || "?"}`;
    idEl.textContent = `#${data.id || data.number || "?"}`;
    categoryEl.textContent = data.category || "Uncategorized";

    // Tags
    if (data.tags && data.tags.length > 0) {
      tagsEl.innerHTML = data.tags.map(tag => `<span class="tag">${tag}</span>`).join("");
    } else {
      tagsEl.innerHTML = "";
    }

    // Content (blocks) - async render for problem previews
    contentEl.innerHTML = "<p>Loading content...</p>";
    const contentHTML = await renderBlocks(data.blocks);
    contentEl.innerHTML = contentHTML;

    // Metadata
    authorEl.textContent = data.author || "Unknown";
    
    if (data.timestamp) {
      const date = new Date(data.timestamp);
      timestampEl.textContent = date.toLocaleDateString();
    } else {
      timestampEl.textContent = "Unknown";
    }

  } catch (err) {
    console.error("Error loading lesson:", err);
    titleEl.textContent = "Error loading lesson";
    contentEl.innerHTML = `<p>Failed to load: ${err.message}</p>`;
  }
}

loadLesson();
