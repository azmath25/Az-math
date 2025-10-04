// js/lesson.js
import { db, doc, getDoc } from "./firebase.js";

// Render a content block
function renderBlock(block) {
  if (!block) return "";
  
  switch (block.type) {
    case "text":
      return `<div class="block-text">${escapeHtml(block.content || "")}</div>`;
    
    case "image":
      return `<div class="block-image">
        <img src="${escapeHtml(block.url || "")}" alt="Lesson image" style="max-width:100%; border-radius: 8px; margin: 1rem 0;" />
      </div>`;
    
    case "problem":
      return `<div class="ref-block">
        <strong>📝 Related Problem:</strong>
        <a href="problem.html?id=${escapeHtml(block.problemId || "")}" class="ref-link">Problem #${escapeHtml(block.problemId || "")}</a>
      </div>`;
    
    default:
      return `<div class="block-unknown">Unknown block type: ${block.type}</div>`;
  }
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Load and display lesson
async function loadLesson() {
  const params = new URLSearchParams(window.location.search);
  const lessonId = params.get("id");
  
  if (!lessonId) {
    document.getElementById("lesson-title").textContent = "Lesson not found";
    document.getElementById("lesson-content").innerHTML = "<p>No lesson ID provided.</p>";
    return;
  }
  
  try {
    const lessonDoc = await getDoc(doc(db, "lessons", String(lessonId)));
    
    if (!lessonDoc.exists()) {
      document.getElementById("lesson-title").textContent = "Lesson not found";
      document.getElementById("lesson-content").innerHTML = "<p>This lesson does not exist.</p>";
      return;
    }
    
    const lessonData = lessonDoc.data();
    
    // Render header
    const title = lessonData.title || `Lesson #${lessonData.id}`;
    document.getElementById("lesson-title").textContent = title;
    document.getElementById("lesson-id").textContent = `#${lessonData.id}`;
    document.getElementById("lesson-category").textContent = lessonData.category || "General";
    
    // Render tags
    const tagsContainer = document.getElementById("lesson-tags");
    tagsContainer.innerHTML = "";
    if (lessonData.tags && lessonData.tags.length > 0) {
      lessonData.tags.forEach(tag => {
        const tagSpan = document.createElement("span");
        tagSpan.className = "tag";
        tagSpan.textContent = tag;
        tagsContainer.appendChild(tagSpan);
      });
    }
    
    // Render cover image
    if (lessonData.cover) {
      document.getElementById("lesson-cover-container").style.display = "block";
      document.getElementById("lesson-cover").src = lessonData.cover;
      document.getElementById("lesson-cover").alt = title;
    }
    
    // Render content blocks
    const contentContainer = document.getElementById("lesson-content");
    contentContainer.innerHTML = "";
    
    if (lessonData.blocks && lessonData.blocks.length > 0) {
      lessonData.blocks.forEach(block => {
        contentContainer.insertAdjacentHTML("beforeend", renderBlock(block));
      });
    } else {
      contentContainer.innerHTML = "<p><em>No content available</em></p>";
    }
    
    // Render related problems
    if (lessonData.problems && lessonData.problems.length > 0) {
      document.getElementById("problems-section").style.display = "block";
      const problemList = document.getElementById("problem-list");
      problemList.innerHTML = "";
      
      lessonData.problems.forEach(problemId => {
        const li = document.createElement("li");
        li.innerHTML = `<a href="problem.html?id=${problemId}" class="ref-link">Problem #${problemId}</a>`;
        problemList.appendChild(li);
      });
    }
    
    // Metadata
    document.getElementById("lesson-author").textContent = lessonData.author || "Unknown";
    
    if (lessonData.timestamp) {
      const date = lessonData.timestamp.toDate ? lessonData.timestamp.toDate() : new Date(lessonData.timestamp);
      document.getElementById("lesson-timestamp").textContent = date.toLocaleDateString();
    }
    
    // Typeset MathJax
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([contentContainer]).catch(err => {
        console.error("MathJax error:", err);
      });
    }
    
  } catch (err) {
    console.error("Error loading lesson:", err);
    document.getElementById("lesson-title").textContent = "Error loading lesson";
    document.getElementById("lesson-content").innerHTML = "<p>An error occurred. Please try again.</p>";
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadLesson();
});
