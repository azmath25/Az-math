// js/admin-problems.js
import {
  db,
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "../js/firebase.js";

async function loadProblems() {
  const list = document.getElementById("problems-list");
  list.innerHTML = "Loading...";
  const q = query(collection(db, "problems"), orderBy("id"));
  const snap = await getDocs(q);
  list.innerHTML = "";
  if (snap.empty) {
    list.innerHTML = "<p>No problems</p>";
    return;
  }
  snap.forEach(d => {
    const p = d.data();
    const el = document.createElement("div");
    el.className = "problem-row";
    el.innerHTML = `
      <div>
        <strong>${p.title || "Problem " + p.id}</strong>
        <div>${p.category || ""} · ${p.difficulty || ""}</div>
      </div>
      <div class="actions">
        <a class="btn" href="edit-problem.html?id=${p.id}">Edit</a>
        <button class="btn btn-danger" data-id="${p.id}" data-action="delete">Delete</button>
      </div>
    `;
    list.appendChild(el);
  });

  // wire delete buttons
  document.querySelectorAll('button[data-action="delete"]').forEach(b => {
    b.addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.id;
      if (!confirm("Delete problem " + id + "?")) return;
      await deleteProblem(id);
      loadProblems();
    });
  });
}

async function deleteProblem(id) {
  try {
    await deleteDoc(doc(db, "problems", String(id)));
    alert("Deleted " + id);
  } catch (err) {
    console.error(err);
    alert("Delete failed");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("add-problem-btn").addEventListener("click", async () => {
    // get latest id from meta/problems
    const metaDoc = await getDoc(doc(db, "meta", "problems"));
    let nextId = 1;
    if (metaDoc.exists()) nextId = (metaDoc.data().latestId || 0) + 1;
    // create draft problem
    await setDoc(doc(db, "problems", String(nextId)), {
      id: nextId,
      draft: true,
      category: "",
      difficulty: "Easy",
      tags: [],
      statement: [],
      solutions: [],
      lessons: [],
      timestamp: serverTimestamp()
    });
    // update meta
    await setDoc(doc(db, "meta", "problems"), { latestId: nextId }, { merge: true });
    location.href = `edit-problem.html?id=${nextId}`;
  });
  await loadProblems();
});
