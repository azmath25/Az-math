// js/users.js
import {
  db,
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc
} from "../js/firebase.js";
import { auth } from "../js/firebase.js";

let allUsers = [];
let filteredUsers = [];

const usersList = document.getElementById("users-list");
const searchInput = document.getElementById("search-input");
const roleFilter = document.getElementById("role-filter");

// Load all users
async function loadUsers() {
  try {
    usersList.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center; padding:2rem;">Loading users...</td>
      </tr>
    `;
    
    const snapshot = await getDocs(collection(db, "Users"));
    
    allUsers = [];
    snapshot.forEach(doc => {
      allUsers.push({ uid: doc.id, ...doc.data() });
    });
    
    // Sort by creation date (newest first)
    allUsers.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    
    filteredUsers = [...allUsers];
    renderUsers();
  } catch (err) {
    console.error("Error loading users:", err);
    usersList.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center; padding:2rem; color: #ef4444;">
          Error loading users. Please try again.
        </td>
      </tr>
    `;
  }
}

// Render users table
function renderUsers() {
  if (filteredUsers.length === 0) {
    usersList.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center; padding:2rem;">No users found.</td>
      </tr>
    `;
    return;
  }

  usersList.innerHTML = "";
  
  filteredUsers.forEach(user => {
    const row = createUserRow(user);
    usersList.appendChild(row);
  });
}

// Create user table row
function createUserRow(user) {
  const tr = document.createElement("tr");
  
  const roleClass = user.role === "admin" ? "role-admin" : 
                    user.role === "user" ? "role-user" : "role-pending";
  const roleText = user.role === "admin" ? "Admin" :
                   user.role === "user" ? "User" : "Pending";
  
  const joinedDate = user.createdAt ? 
    new Date(user.createdAt).toLocaleDateString() : "Unknown";
  
  // Check if this is the current admin
  const currentUser = auth.currentUser;
  const isCurrentUser = currentUser && currentUser.uid === user.uid;
  
  tr.innerHTML = `
    <td>
      ${escapeHtml(user.email || "Unknown")}
      ${isCurrentUser ? '<span style="color: #2563eb; font-size: 0.85rem;"> (You)</span>' : ''}
    </td>
    <td>
      <span class="role-badge ${roleClass}">${roleText}</span>
    </td>
    <td>${joinedDate}</td>
    <td>
      <div class="user-actions">
        ${user.role === "pending" ? `
          <button class="btn btn-small" data-uid="${user.uid}" data-action="approve">
            ✅ Approve
          </button>
        ` : ""}
        ${user.role !== "admin" ? `
          <button class="btn btn-small btn-edit" data-uid="${user.uid}" data-action="make-admin">
            ⚙️ Make Admin
          </button>
        ` : ""}
        ${user.role === "admin" && !isCurrentUser ? `
          <button class="btn btn-small btn-secondary" data-uid="${user.uid}" data-action="demote-admin">
            👤 Make User
          </button>
        ` : ""}
        ${!isCurrentUser ? `
          <button class="btn btn-small btn-delete" data-uid="${user.uid}" data-action="delete">
            🗑️ Delete
          </button>
        ` : ""}
      </div>
    </td>
  `;
  
  // Attach event listeners
  tr.querySelectorAll("button[data-action]").forEach(button => {
    button.addEventListener("click", handleUserAction);
  });
  
  return tr;
}

// Handle user actions
async function handleUserAction(e) {
  const button = e.currentTarget;
  const uid = button.dataset.uid;
  const action = button.dataset.action;
  
  try {
    button.disabled = true;
    
    switch (action) {
      case "approve":
        await approveUser(uid);
        break;
      case "make-admin":
        await makeAdmin(uid);
        break;
      case "demote-admin":
        await demoteAdmin(uid);
        break;
      case "delete":
        await deleteUser(uid);
        break;
    }
    
    // Reload users after action
    await loadUsers();
  } catch (err) {
    console.error(`Error performing ${action}:`, err);
    alert(`Failed to ${action}: ${err.message}`);
    button.disabled = false;
  }
}

// Approve user
async function approveUser(uid) {
  if (!confirm("Approve this user?")) return;
  
  await updateDoc(doc(db, "Users", uid), {
    role: "user",
    approved: true
  });
  
  alert("User approved successfully!");
}

// Make user admin
async function makeAdmin(uid) {
  if (!confirm("Make this user an admin? This will give them full access to the admin panel.")) return;
  
  await updateDoc(doc(db, "Users", uid), {
    role: "admin",
    approved: true
  });
  
  alert("User promoted to admin successfully!");
}

// Demote admin to user
async function demoteAdmin(uid) {
  if (!confirm("Remove admin privileges from this user?")) return;
  
  await updateDoc(doc(db, "Users", uid), {
    role: "user"
  });
  
  alert("Admin demoted to user successfully!");
}

// Delete user
async function deleteUser(uid) {
  const user = allUsers.find(u => u.uid === uid);
  const email = user ? user.email : "this user";
  
  if (!confirm(`Delete ${email}? This will remove their profile but NOT their Firebase Auth account.`)) return;
  
  await deleteDoc(doc(db, "Users", uid));
  alert("User deleted successfully!");
}

// Apply filters
function applyFilters() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  const roleValue = roleFilter.value;
  
  filteredUsers = allUsers.filter(user => {
    // Search filter
    if (searchTerm) {
      const emailMatch = (user.email || "").toLowerCase().includes(searchTerm);
      if (!emailMatch) return false;
    }
    
    // Role filter
    if (roleValue && user.role !== roleValue) {
      return false;
    }
    
    return true;
  });
  
  renderUsers();
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
  loadUsers();
  
  searchInput.addEventListener("input", applyFilters);
  roleFilter.addEventListener("change", applyFilters);
});
