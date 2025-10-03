// js/users.js
import {
  db,
  collection,
  getDocs,
  updateDoc,
  doc
} from "../js/firebase.js";

document.addEventListener("DOMContentLoaded", async () => {
  const tbody = document.getElementById("users-list");
  tbody.innerHTML = "<tr><td colspan='4'>Loading...</td></tr>";
  const snap = await getDocs(collection(db, "Users"));
  tbody.innerHTML = "";
  snap.forEach(d => {
    const u = d.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.email}</td>
      <td>${u.role}</td>
      <td>${u.createdAt ? new Date(u.createdAt).toLocaleString() : ""}</td>
      <td>
        <button class="btn btn-small" data-uid="${d.id}" data-action="approve">Approve</button>
        <button class="btn btn-small" data-uid="${d.id}" data-action="make-admin">Make Admin</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll('button[data-action="approve"]').forEach(b => {
    b.addEventListener("click", async (e) => {
      const uid = e.currentTarget.dataset.uid;
      await updateDoc(doc(db, "Users", uid), { approved: true, role: "user" });
      location.reload();
    });
  });
  document.querySelectorAll('button[data-action="make-admin"]').forEach(b => {
    b.addEventListener("click", async (e) => {
      const uid = e.currentTarget.dataset.uid;
      if (!confirm("Make this user admin?")) return;
      await updateDoc(doc(db, "Users", uid), { role: "admin", approved: true });
      location.reload();
    });
  });
});
