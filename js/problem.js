// js/problems.js
import { db } from "./firebase.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const container = document.getElementById("problems-list");
const searchInput = document.getElementById("search");
const btnSearch = document.getElementById("btnSearch");

async function loadProblems() {
  if (!container) return;
  container.innerHTML = "Loading problems...";
  try {
    const q = query(collection(db, "problems"), orderBy("title"));
    const snap = await getDocs(q);
    container.innerHTML = "";
    snap.forEach(doc => {
      const d = doc.data();
      const card = document.createElement("div");
      card.className = "problem-card";
      card.innerHTML = `<h3>${d.title || "Untitled"}</h3>
                        <small>${(d.category || "")}</small>
                        <p>${(d.statement || "").slice(0,200)}${(d.statement && d.statement.length>200 ? "..." : "")}</p>
                        <button onclick="location.href='problem.html?id=${doc.id}'">Open</button>`;
      container.appendChild(card);
    });
  } catch (err) {
    container.innerHTML = "Error loading problems: " + err.message;
  }
}

if (btnSearch) btnSearch.addEventListener("click", loadProblems);
loadProblems();
