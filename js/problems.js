// js/problems.js
import { db } from "./firebase.js";
import { collection, getDocs, query, orderBy, limit, startAfter } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const container = document.getElementById("problems-list");
const prevBtn = document.getElementById("prev-page");
const nextBtn = document.getElementById("next-page");
const pageInfo = document.getElementById("page-info");

let lastVisible = null;
let firstVisible = null;
let currentPage = 1;

async function loadProblems(direction = "forward") {
  let q = query(collection(db, "problems"), orderBy("title"), limit(10));

  if (direction === "forward" && lastVisible) {
    q = query(collection(db, "problems"), orderBy("title"), startAfter(lastVisible), limit(10));
    currentPage++;
  } else if (direction === "backward" && firstVisible) {
    // (Firestore doesn't support "previous" easily, needs caching pages — skipping for simplicity)
    alert("Back navigation not implemented yet.");
    return;
  }

  const snapshot = await getDocs(q);
  container.innerHTML = "";
  snapshot.forEach(doc => {
    const data = doc.data();
    container.innerHTML += `<div class="card"><a href="problem.html?id=${doc.id}">${data.title}</a></div>`;
  });

  if (!snapshot.empty) {
    firstVisible = snapshot.docs[0];
    lastVisible = snapshot.docs[snapshot.docs.length - 1];
  }

  pageInfo.textContent = `Page ${currentPage}`;
}

if (container) loadProblems();
if (nextBtn) nextBtn.addEventListener("click", () => loadProblems("forward"));
