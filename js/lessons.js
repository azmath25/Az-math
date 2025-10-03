// js/lessons.js
import { db } from "./firebase.js";
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const container = document.getElementById("lessons-list");
const searchInput = document.getElementById("search-input");
const categoryFilter = document.getElementById("category-filter");

let allLessons = [];
let filteredLessons = [];

// Render lesson card
function renderLessonCard(lesson) {
  const description = lesson.description || getDescriptionFromBlocks(lesson.blocks);
  const coverImage = lesson.cover || "assets/img/lesson-placeholder.png";
  const tagsHTML = (lesson.tags || []).map(tag => `<span class="tag">${tag}</span>`).join("");
  
  return `
    <div class="card lesson-card">
      ${lesson.cover ? `<img src="${lesson.cover}" alt="${lesson.title}" class="lesson-cover" />` : ""}
      <h3>${lesson.title || "Untitled Lesson"}</h3>
      <p class="lesson-category">${lesson.category || "Uncategorized"}</p>
      <div class="lesson-tags">${tagsHTML}</div>
      <p class="lesson-description">${description}</p>
      <button onclick="location.href='lesson.html?id=${lesson.docId}'" class="btn">View Lesson →</button>
    </div>
  `;
}

// Extract description from first text block
function getDescriptionFromBlocks(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) return "No description available.";
  
  const firstTextBlock = blocks.find(b => b.type === "text");
  if (firstTextBlock && firstTextBlock.content) {
    return firstTextBlock.content.substring(0, 150) + (firstTextBlock.content.length > 150 ? "..." : "");
  }
  return "No description available.";
}

// Load all lessons
async function loadAllLessons() {
  try {
    const q = query(collection(db, "lessons"), where("draft", "==", false), orderBy("title"));
    const snapshot = await getDocs(q);
    
    allLessons = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      allLessons.push({ ...data, docId: doc.id });
    });
    
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
  
  filteredLessons = allLessons.filter(lesson => {
    // Search filter
    const matchesSearch = 
      (lesson.title || "").toLowerCase().includes(searchTerm) ||
      (lesson.category || "").toLowerCase().includes(searchTerm) ||
      (lesson.description || "").toLowerCase().includes(searchTerm) ||
      (lesson.tags || []).some(tag => tag.toLowerCase().includes(searchTerm));
    
    // Category filter
    const matchesCategory = !category || lesson.category === category;
    
    return matchesSearch && matchesCategory;
  });
  
  renderLessons();
}

// Render filtered lessons
function renderLessons() {
  if (filteredLessons.length === 0) {
    container.innerHTML = "<p>No lessons found.</p>";
  } else {
    container.innerHTML = filteredLessons.map(renderLessonCard).join("");
  }
}

// Event listeners
if (searchInput) {
  searchInput.addEventListener("input", applyFilters);
}

if (categoryFilter) {
  categoryFilter.addEventListener("change", applyFilters);
}

// Initial load
if (container) loadAllLessons();
