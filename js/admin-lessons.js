// js/admin-lessons.js
import { db } from "./firebase.js";
import { protectAdminPage } from "./auth.js";
import { 
  collection, getDocs, doc, getDoc, updateDoc, deleteDoc, setDoc 
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

protectAdminPage();

const container = document.getElementById("lessons-list");
const searchInput = document.getElementById("search-input");
const categoryFilter = document.getElementById("category-filter");
const draftFilter = document.getElementById("draft-filter");
const addBtn = document.getElementById("add-lesson-btn");

let allLessons = [];
let filteredLessons = [];

// Extract description from blocks
function getDescriptionFromBlocks(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) return "No description available.";
  
  const firstTextBlock = blocks.find(b => b.type === "text");
  if (firstTextBlock && firstTextBlock.content) {
    return firstTextBlock.content.substring(0, 150) + (firstTextBlock.content.length > 150 ? "..." : "");
  }
  return "No description available.";
}

// Render lesson card (admin version)
function renderLessonCard(lesson) {
  const description = lesson.description || getDescriptionFromBlocks(lesson.blocks);
  const tagsHTML = (lesson.tags || []).map(tag => `<span class="tag">${tag}</span>`).join("");
  const draftBadge = lesson.draft ? '<span class="draft-badge">DRAFT</span>' : '';
  
  return `
    <div class="card lesson-card ${lesson.draft ? 'draft-card' : ''}">
      ${lesson.cover ? `<img src="${lesson.cover}" alt="${lesson.title}" class="lesson-cover" />` : ""}
      <div class="card-content">
        ${draftBadge}
        <h3>${lesson.title || "Untitled Lesson"}</h3>
        <p class="lesson-category">${lesson.category || "Uncategorized"}</p>
        <div class="lesson-tags">${tagsHTML}</div>
        <p class="lesson-description">${description}</p>
        
        <div class="admin-actions">
          <button onclick="editLesson('${lesson.docId}')" class="btn btn-edit btn-small">✏️ Edit</button>
          <button onclick="deleteLesson('${lesson.docId}')" class="btn btn-delete btn-small">🗑️ Delete</button>
          <a href="../lesson.html?id=${lesson.docId}" class="btn btn-secondary btn-small">👁️ View</a>
        </div>
      </div>
    </div>
  `;
}

// Load all lessons
async function loadAllLessons() {
  try {
    const snapshot = await getDocs(collection(db, "lessons"));
    
    allLessons = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      allLessons.push({ ...data, docId: doc.id });
    });
    
    // Sort by ID/number
    allLessons.sort((a, b) => (a.id || a.number || 0) - (b.id || b.number || 0));
    
    filteredLessons = [...allLessons];
    renderLessons();
  } catch (err) {
    console.error("Error loading lessons:", err);
    container.innerHTML = "<p>Failed to load lessons.</p>";
  }
}

// Apply filters
function applyFilters() {
  const searchTerm = searchInput.value.toLowerCase();
  const category = categoryFilter.value;
  const draftStatus = draftFilter.value;
  
  filteredLessons = allLessons.filter(lesson => {
    // Search filter
    const matchesSearch = 
      (lesson.title || "").toLowerCase().includes(searchTerm) ||
      (lesson.category || "").toLowerCase().includes(searchTerm) ||
      (lesson.tags || []).some(tag => tag.toLowerCase().includes(searchTerm));
    
    // Category filter
    const matchesCategory = !category || lesson.category === category;
    
    // Draft filter
    let matchesDraft = true;
    if (draftStatus === "published") matchesDraft = !lesson.draft;
    if (draftStatus === "draft") matchesDraft = lesson.draft === true;
    
    return matchesSearch && matchesCategory && matchesDraft;
  });
  
  renderLessons();
}

// Render lessons
function renderLessons() {
  if (filteredLessons.length === 0) {
    container.innerHTML = "<p>No lessons found.</p>";
  } else {
    container.innerHTML = filteredLessons.map(renderLessonCard).join("");
  }
}

// Edit lesson
window.editLesson = function(docId) {
  window.location.href = `edit-lesson.html?id=${docId}`;
};

// Delete lesson
window.deleteLesson = async function(docId) {
  if (!confirm("Are you sure you want to delete this lesson?")) return;
  
  try {
    await deleteDoc(doc(db, "lessons", docId));
    alert("Lesson deleted successfully!");
    loadAllLessons();
  } catch (err) {
    alert("Error deleting lesson: " + err.message);
  }
};

// Add new lesson
async function addNewLesson() {
  try {
    // Get next lesson ID from counters
    const counterRef = doc(db, "meta", "counters");
    const counterSnap = await getDoc(counterRef);
    
    let nextId = 1;
    if (counterSnap.exists()) {
      nextId = (counterSnap.data().lessons || 0) + 1;
    }
    
    // Update counter
    await updateDoc(counterRef, { lessons: nextId });
    
    // Create new lesson document
    const newLessonRef = doc(db, "lessons", String(nextId));
    await setDoc(newLessonRef, {
      id: nextId,
      title: `Lesson ${nextId}`,
      category: "",
      tags: [],
      draft: true,
      author: "",
      timestamp: Date.now(),
      blocks: [{ type: "text", content: "" }],
      problems: [],
      cover: ""
    });
    
    // Redirect to edit page
    window.location.href = `edit-lesson.html?id=${nextId}`;
  } catch (err) {
    alert("Error creating lesson: " + err.message);
    console.error(err);
  }
}

// Event listeners
if (searchInput) searchInput.addEventListener("input", applyFilters);
if (categoryFilter) categoryFilter.addEventListener("change", applyFilters);
if (draftFilter) draftFilter.addEventListener("change", applyFilters);
if (addBtn) addBtn.addEventListener("click", addNewLesson);

// Initial load
if (container) loadAllLessons();
