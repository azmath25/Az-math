// js/admin.js
import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { collection, getDocs, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const adminProblems = document.getElementById("admin-problems");
const addProblemBtn = document.getElementById("addProblemBtn");
const refreshBtn = document.getElementById("refreshProblemsBtn");

onAuthStateChanged(auth, async user => {
  if (!user) {
    // not logged in
    if (adminProblems) adminProblems.innerHTML = "<small>Sign in as admin to edit.</small>";
    return;
  }
  // NOTE: You should use a proper role check. For now we show UI to any signed user.
  await loadAdminProblems();
});

async function loadAdminProblems() {
  if (!adminProblems) return;
  adminProblems.innerHTML = "Loading...";
  try {
    const snap = await getDocs(collection(db, "problems"));
    adminProblems.innerHTML = "";
    snap.forEach(docSnap => {
      const d = docSnap.data();
      const el = document.createElement("div");
      el.className = "card";
      el.innerHTML = `<strong>${d.title || "Untitled"}</strong>
                      <div class="row">
                        <button onclick="editProblem('${docSnap.id}')">Edit</button>
                        <button onclick="deleteProblem('${docSnap.id}')">Delete</button>
                      </div>`;
      adminProblems.appendChild(el);
    });
  } catch (err) {
    adminProblems.innerHTML = "Error: " + err.message;
  }
}

window.editProblem = (id) => {
  alert("Edit not implemented yet. ID: " + id);
};

window.deleteProblem = async (id) => {
  if (!confirm("Delete problem?")) return;
  try {
    await deleteDoc(doc(db, "problems", id));
    alert("Deleted");
    loadAdminProblems();
  } catch (err) {
    alert("Error: " + err.message);
  }
};

if (addProblemBtn) addProblemBtn.addEventListener("click", async () => {
  const title = prompt("Problem title:");
  if (!title) return;
  try {
    await addDoc(collection(db, "problems"), {title, statement:"", createdAt: new Date().toISOString()});
    loadAdminProblems();
  } catch(err) {
    alert(err.message);
  }
});

if (refreshBtn) refreshBtn.addEventListener("click", loadAdminProblems);
