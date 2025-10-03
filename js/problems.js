// js/problems.js
import { db } from "./firebase.js";
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const container = document.getElementById("problems-list");
const searchInput = document.getElementById("search-input");
const categoryFilter = document.getElementById("category-filter");
const difficultyFilter = document.getElementById("difficulty-filter");
const pageInfo = document.getElementById("page-info");
const prevBtn = document.getElementById("prev-page");
const nextBtn = document.getElementById("next-page");

let allProblems = [];
let filteredProblems = [];
let currentPage = 1;
const pageSize = 10;

// Render a block (text, image, problem ref, lesson ref)
function renderBlock(block) {
  if (block.type === "text") {
    return `<p>${block.content}</p>`;
  } else if (block.type === "image") {
    return `<img src="${block.url}" alt="Problem image" style="max-width:100%; border-radius:8px; margin:0.5rem 0;" />`;
  } else if (block.type === "problem") {
    return `<a href="problem.html?id=${block.problemId}" class="ref-link">→ Problem #${block.problemId}</a>`;
  } else if (block.type === "lesson") {
    return `<a href="lesson.html?id=${block.lessonId}" class="ref-link">→ Lesson #${block.lessonId}</a>`;
  }
  return "";
}

// Render problem card (wide, ~80% width)
function renderProblemCard(problem) {
  const statementHTML = (problem.statement || []).map(renderBlock).join("");
  const tagsHTML = (problem.tags || []).map(tag => `<span class="tag">${tag}</span>`).join("");
  
  return `
    <div class="problem-card-wide">
      <div class="problem-header">
        <span class="problem-id">Problem #${problem.id || problem.number || "?"}</span>
        <span class="problem-category">${problem.category || "Uncategorized"}</span>
        <span class="problem-difficulty difficulty-${(problem.difficulty || "medium").toLowerCase()}">${problem.difficulty || "Medium"}</span>
      </div>
      
      <div class="problem-tags">${tagsHTML}</div>
      
      <div class="problem-body">
        ${statementHTML || "<p>No statement available.</p>"}
      </div>
      
      <div class="problem-footer">
        <a href="problem.html?id=${problem.docId}" class="btn">View Problem →</a>
      </div>
    </div>
  `;
}

// Load all problems from Firestore
async function loadAllProblems() {
  try {
    const q = query(collection(db, "problems"), where("draft", "==", false));
    const snapshot = await getDocs(q);
    
    allProblems = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      allProblems.push({ ...data, docId: doc.id });
    });
    
    // Sort by ID/number
    allProblems.sort((a, b) => (a.id || a.number || 0) - (b.id || b.number || 0));
    
    filteredProblems = [...allProblems];
    renderPage();
  } catch (err) {
    console.error("Error loading problems:", err);
    container.innerHTML = "<p>Failed to load problems.</p>";
  }
}

// Filter problems based on search and filters
function applyFilters() {
  const searchTerm = searchInput.value.toLowerCase();
  const category = categoryFilter.value;
  const difficulty = difficultyFilter.value;
  
  filteredProblems = allProblems.filter(problem => {
    // Search filter
    const matchesSearch = 
      (problem.title || "").toLowerCase().includes(searchTerm) ||
      (problem.category || "").toLowerCase().includes(searchTerm) ||
      (problem.tags || []).some(tag => tag.toLowerCase().includes(searchTerm));
    
    // Category filter
    const matchesCategory = !category || problem.category === category;
    
    // Difficulty filter
    const matchesDifficulty = !difficulty || problem.difficulty === difficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });
  
  currentPage = 1;
  renderPage();
}

// Render current page
function renderPage() {
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const pageProblems = filteredProblems.slice(startIdx, endIdx);
  
  if (pageProblems.length === 0) {
    container.innerHTML = "<p>No problems found.</p>";
  } else {
    container.innerHTML = pageProblems.map(renderProblemCard).join("");
  }
  
  // Update pagination
  const totalPages = Math.ceil(filteredProblems.length / pageSize);
  pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
  
  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage >= totalPages;
}

// Event listeners
if (searchInput) {
  searchInput.addEventListener("input", applyFilters);
}

if (categoryFilter) {
  categoryFilter.addEventListener("change", applyFilters);
}

if (difficultyFilter) {
  difficultyFilter.addEventListener("change", applyFilters);
}

if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderPage();
      window.scrollTo(0, 0);
    }
  });
}

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    const totalPages = Math.ceil(filteredProblems.length / pageSize);
    if (currentPage < totalPages) {
      currentPage++;
      renderPage();
      window.scrollTo(0, 0);
    }
  });
}

// Initial load
if (container) loadAllProblems();
