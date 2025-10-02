// js/admin.js
import { db } from "./firebase.js";
import { protectAdminPage } from "./auth.js";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// Protect page
protectAdminPage();

// ===== Tabs =====
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");
tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;
    tabButtons.forEach((b) => b.classList.remove("active"));
    tabContents.forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`tab-${tab}`).classList.add("active");
  });
});

// ===== Helper: getNextId from meta =====
async function getNextId(type) {
  const metaRef = doc(db, "meta", type + "Counter");
  const snap = await getDoc(metaRef);
  let id = 1;
  if (snap.exists()) {
    id = (snap.data().last || 0) + 1;
  }
  await setDoc(metaRef, { last: id });
  return id;
}

// ===== Problems =====
document.getElementById("add-problem-btn")?.addEventListener("click", async () => {
  const title = prompt("Problem Title:");
  if (!title) return;
  const statement = prompt("Problem Statement:");
  const solution = prompt("Problem Solution:");

  try {
    const id = await getNextId("problem");
    await setDoc(doc(db, "problems", id.toString()), {
      id,
      title,
      statement,
      solution,
      createdAt: Date.now(),
    });
    alert("Problem added with ID " + id);
  } catch (err) {
    alert("Error: " + err.message);
  }
});

// Search problems
document.getElementById("search-problem-btn")?.addEventListener("click", async () => {
  const term = document.getElementById("search-problem").value.toLowerCase();
  const q = query(collection(db, "problems"));
  const snap = await getDocs(q);
  const listDiv = document.getElementById("problems-list");
  listDiv.innerHTML = "";

  snap.forEach((docSnap) => {
    const data = docSnap.data();
    if (
      data.title?.toLowerCase().includes(term) ||
      data.statement?.toLowerCase().includes(term) ||
      data.id?.toString() === term
    ) {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `<h3>#${data.id} - ${data.title}</h3><p>${data.statement?.slice(0,80)}...</p>`;
      listDiv.appendChild(card);
    }
  });
});

// ===== Lessons =====
document.getElementById("add-lesson-btn")?.addEventListener("click", async () => {
  const title = prompt("Lesson Title:");
  if (!title) return;
  const content = prompt("Lesson Content:");

  try {
    const id = await getNextId("lesson");
    await setDoc(doc(db, "lessons", id.toString()), {
      id,
      title,
      content,
      createdAt: Date.now(),
    });
    alert("Lesson added with ID " + id);
  } catch (err) {
    alert("Error: " + err.message);
  }
});

// ===== Users =====
document.getElementById("search-user-btn")?.addEventListener("click", async () => {
  const term = document.getElementById("search-user").value.toLowerCase();
  const q = query(collection(db, "Users"));
  const snap = await getDocs(q);
  const listDiv = document.getElementById("users-list");
  listDiv.innerHTML = "";

  snap.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.email?.toLowerCase().includes(term)) {
      const card = document.createElement("div");
      card.className = "card";
      const role = data.role || "user";
      card.innerHTML = `
        <h3>${data.email}</h3>
        <p>Role: ${role}</p>
        ${
          role === "admin"
            ? `<button disabled class="btn">Already Admin</button>`
            : `<button class="btn" data-id="${docSnap.id}">Make Admin</button>`
        }
      `;
      listDiv.appendChild(card);

      if (role !== "admin") {
        card.querySelector("button").addEventListener("click", async () => {
          await updateDoc(doc(db, "Users", docSnap.id), { role: "admin" });
          alert("Role updated to admin!");
        });
      }
    }
  });
});
