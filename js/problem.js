// js/problem.js
import { db } from "./firebase.js";
import { doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const urlParams = new URLSearchParams(window.location.search);
const problemId = urlParams.get("id");

const titleEl = document.getElementById("problem-title");
const idEl = document.getElementById("problem-id");
const categoryEl = document.getElementById("problem-category");
const difficultyEl = document.getElementById("problem-difficulty");
const tagsEl = document.getElementById("problem-tags");
const statementEl = document.getElementById("problem-statement");
const showSolutionsBtn = document.getElementById("show-solutions");
const solutionsContainer = document.getElementById("solutions-container");
const authorEl = document.getElementById("problem-author");
const timestampEl = document.getElementById("problem-timestamp");
const lessonList = document.getElementById("lesson-list");

// Render a block (text, image, problem ref, lesson ref)
function renderBlock(block) {
  if (!block || !block.type) return "";
  
  if (block.type === "text") {
    return `<p>${block.content || ""}</p>`;
  } else if (block.type === "image") {
    return `<img src="${block.url}" alt="Problem image" style="max-width:100%; border-radius:8px; margin:1rem 0;" />`;
  } else if (block.type === "problem") {
    return `<div class="ref-block"><a href="problem.html?id=${block.problemId}" class="ref-link">→ Related Problem #${block.problemId}</a></div>`;
  } else if (block.type === "lesson") {
    return `<div class="ref-block"><a href="lesson.html?id=${block.lessonId}" class="ref-link">→ Related Lesson #${block.lessonId}</a></div>`;
  }
  return "";
}

// Render blocks array
function renderBlocks(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return "<p>No content available.</p>";
  }
  return blocks.map(renderBlock).join("");
}

// Load problem data
async function loadProblem() {
  if (!problemId) {
    titleEl.textContent = "Problem not found";
    statementEl.innerHTML = "<p>No problem ID provided.</p>";
    return;
  }

  try {
    const docRef = doc(db, "problems", problemId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      titleEl.textContent = "Problem not found";
      statementEl.innerHTML = "<p>This problem does not exist.</p>";
      return;
    }

    const data = snap.data();

    // Header info
    titleEl.textContent = data.title || `Problem #${data.id || data.number || "?"}`;
    idEl.textContent = `#${data.id || data.number || "?"}`;
    categoryEl.textContent = data.category || "Uncategorized";
    difficultyEl.textContent = data.difficulty || "Medium";
    difficultyEl.className = `meta-item difficulty-${(data.difficulty || "medium").toLowerCase()}`;

    // Tags
    if (data.tags && data.tags.length > 0) {
      tagsEl.innerHTML = data.tags.map(tag => `<span class="tag">${tag}</span>`).join("");
    } else {
      tagsEl.innerHTML = "";
    }

    // Statement (blocks)
    statementEl.innerHTML = renderBlocks(data.statement);

    // Solutions (multiple solutions support)
    if (data.solutions && Array.isArray(data.solutions) && data.solutions.length > 0) {
      showSolutionsBtn.style.display = "inline-block";
      
      const solutionsHTML = data.solutions.map((solution, index) => {
        const solutionBlocks = renderBlocks(solution);
        return `
          <div class="solution-block">
            <h3>Solution ${index + 1}</h3>
            ${solutionBlocks}
          </div>
        `;
      }).join("");
      
      solutionsContainer.innerHTML = solutionsHTML;
      
      showSolutionsBtn.addEventListener("click", () => {
        solutionsContainer.style.display = "block";
        showSolutionsBtn.style.display = "none";
      });
    } else {
      showSolutionsBtn.style.display = "none";
      solutionsContainer.innerHTML = "<p>No solutions available yet.</p>";
    }

    // Metadata
    authorEl.textContent = data.author || "Unknown";
    
    if (data.timestamp) {
      const date = new Date(data.timestamp);
      timestampEl.textContent = date.toLocaleDateString();
    } else {
      timestampEl.textContent = "Unknown";
    }

    // Lesson references
    if (data.lessons && data.lessons.length > 0) {
      const lessonPromises = data.lessons.map(async (lessonId) => {
        const lessonDoc = await getDoc(doc(db, "lessons", String(lessonId)));
        if (lessonDoc.exists()) {
          const lessonData = lessonDoc.data();
          return `<li><a href="lesson.html?id=${lessonDoc.id}">${lessonData.title || `Lesson #${lessonId}`}</a></li>`;
        }
        return `<li>Lesson #${lessonId}</li>`;
      });
      
      const lessonItems = await Promise.all(lessonPromises);
      lessonList.innerHTML = lessonItems.join("");
    } else {
      lessonList.innerHTML = "<li>Not used in any lessons yet.</li>";
    }

  } catch (err) {
    console.error("Error loading problem:", err);
    titleEl.textContent = "Error loading problem";
    statementEl.innerHTML = `<p>Failed to load: ${err.message}</p>`;
  }
}

loadProblem();
