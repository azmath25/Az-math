// js/admin-problems.js
import { db } from "./firebase.js";
import { protectAdminPage } from "./auth.js";
import { 
  collection, getDocs, doc, getDoc, updateDoc, deleteDoc, setDoc 
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

protectAdminPage();

const container = document.getElementById("problems-list");
const searchInput = document.getElementById("search-input");
const categoryFilter = document.getElementById("category-filter");
const difficultyFilter = document.getElementById("difficulty-filter");
const draftFilter = document.getElementById("draft-filter");
const addBtn = document.getElementById("add-problem-btn");

let allProblems = [];
let filteredProblems = [];

// Render a block (text, image, problem ref, lesson ref)
function renderBlock(block) {
  if (block.type === "text") {
    return `<p>${block.content}</p>`;
  } else if (block.type === "image") {
    return `<img src="${block.url}" alt="Problem image" style="max-width:100%; border-radius:8px; margin:0.5rem 0;" />`;
  } else if (block.type === "problem") {
    return `<a href="../problem.html?id=${block.problemId}" class="ref-link">→ Problem #${block.problemId}</a>`;
  } else if (block.type === "lesson") {
    return `<a href="../lesson.html?id=${block.lessonId}" class="ref-link">→ Lesson #${block.lessonId}</a>`;
  }
  return "";
}

// Render problem card (admin version with edit/delete)
function renderProblemCard(problem) {
  const statementHTML = (problem.statement || []).map(renderBlock).join("");
  const tagsHTML = (problem.tags || []).map(tag => `<span class="tag">${tag}</span>`).join("");
  const draftBadge = problem.draft ? '<span class="draft-badge">DRAFT</span>' : '';
  
  return `
    <div class="problem-card-wide ${problem.draft ? 'draft-card' : ''}">
      <div class="problem-header">
        <span class="problem-id">Problem #${problem.id || problem.number || "?"}</span>
        <span class="problem-category">${problem.category || "Uncategorized"}</span>
        <span class="problem-difficulty difficulty-${(problem.difficulty || "medium").toLowerCase()}">${problem.difficulty || "Medium"}</span>
        ${draftBadge}
      </div>
      
      <div class="problem-tags">${tagsHTML}</div>
      
      <div class="problem-body">
        ${statementHTML || "<p>No statement available.</p>"}
      </div>
      
      <div class="problem-footer admin-footer">
        <div class="admin-actions">
          <button onclick="editProblem('${problem.docId}')" class="btn btn-edit">✏️ Edit</button>
          <button onclick="deleteProblem('${problem.docId}')" class="btn btn-delete">🗑️ Delete</button>
        </div>
        <a href="../problem.html?id=${problem.docId}" class="btn btn-secondary">👁️ View</a>
      </div>
    </div>
  `;
}

// Load all problems
async function loadAllProblems() {
  try {
    const snapshot = await getDocs(collection(db, "problems"));
    
    allProblems = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      allProblems.push({ ...data, docId: doc.id });
    });
    
    // Sort by ID/number
    allProblems.sort((a, b) => (a.id || a.number || 0) - (b.id || b.number || 0));
    
    filteredProblems = [...allProblems];
    renderProblems();
  } catch (err) {
    console.error("Error loading problems:", err);
    container.innerHTML = "<p>Failed to load problems.</p>";
  }
}

// Apply filters
function applyFilters() {
  const searchTerm = searchInput.value.toLowerCase();
  const category = categoryFilter.value;
  const difficulty = difficultyFilter.value;
  const draftStatus = draftFilter.value;
  
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
    
    // Draft filter
    let matchesDraft = true;
    if (draftStatus === "published") matchesDraft = !problem.draft;
    if (draftStatus === "draft") matchesDraft = problem.draft === true;
    
    return matchesSearch && matchesCategory && matchesDifficulty && matchesDraft;
  });
  
  renderProblems();
}

// Render problems
function renderProblems() {
  if (filteredProblems.length === 0) {
    container.innerHTML = "<p>No problems found.</p>";
  } else {
    container.innerHTML = filteredProblems.map(renderProblemCard).join("");
  }
}

// Edit problem
window.editProblem = function(docId) {
  window.location.href = `edit-problem.html?id=${docId}`;
};

// Delete problem
window.deleteProblem = async function(docId) {
  if (!confirm("Are you sure you want to delete this problem?")) return;
  
  try {
    await deleteDoc(doc(db, "problems", docId));
    alert("Problem deleted successfully!");
    loadAllProblems();
  } catch (err) {
    alert("Error deleting problem: " + err.message);
  }
};

// Add new problem
async function addNewProblem() {
  try {
    // Get next problem ID from counters
    const counterRef = doc(db, "meta", "counters");
    const counterSnap = await getDoc(counterRef);
    
    let nextId = 1;
    if (counterSnap.exists()) {
      nextId = (counterSnap.data().problems || 0) + 1;
    }
    
    // Update counter
    await updateDoc(counterRef, { problems: nextId });
    
    // Create new problem document with the ID as the document ID
    const newProblemRef = doc(db, "problems", String(nextId));
    await setDoc(newProblemRef, {
      id: nextId,
      title: `Problem ${nextId}`,
      category: "",
      difficulty: "Medium",
      tags: [],
      draft: true,
      author: "",
      timestamp: Date.now(),
      statement: [{ type: "text", content: "" }],
      solutions: [{ type: "text", content: "" }], // ✅ fixed: no nested array
      lessons: []
    });
    
    // Redirect to edit page
    window.location.href = `edit-problem.html?id=${nextId}`;
  } catch (err) {
    alert("Error creating problem: " + err.message);
    console.error(err);
  }
}

// Event listeners
if (searchInput) searchInput.addEventListener("input", applyFilters);
if (categoryFilter) categoryFilter.addEventListener("change", applyFilters);
if (difficultyFilter) difficultyFilter.addEventListener("change", applyFilters);
if (draftFilter) draftFilter.addEventListener("change", applyFilters);
if (addBtn) addBtn.addEventListener("click", addNewProblem);

// Initial load
if (container) loadAllProblems();
