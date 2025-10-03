// js/users.js
import { db } from "./firebase.js";
import { protectAdminPage } from "./auth.js";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

protectAdminPage();

const tbody = document.getElementById("users-list");
const searchInput = document.getElementById("search-input");
const roleFilter = document.getElementById("role-filter");

let allUsers = [];
let filteredUsers = [];

// Load all users
async function loadAllUsers() {
  try {
    const snapshot = await getDocs(collection(db, "Users"));
    
    allUsers = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      allUsers.push({ 
        uid: doc.id, 
        email: data.email || "No email",
        role: data.role || "user",
        createdAt: data.createdAt || null
      });
    });
    
    // Sort by email
    allUsers.sort((a, b) => a.email.localeCompare(b.email));
    
    filteredUsers = [...allUsers];
    renderUsers();
  } catch (err) {
    console.error("Error loading users:", err);
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Failed to load users</td></tr>';
  }
}

// Apply filters
function applyFilters() {
  const searchTerm = searchInput.value.toLowerCase();
  const role = roleFilter.value;
  
  filteredUsers = allUsers.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm);
    const matchesRole = !role || user.role === role;
    
    return matchesSearch && matchesRole;
  });
  
  renderUsers();
}

// Render users table
function renderUsers() {
  if (filteredUsers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No users found</td></tr>';
    return;
  }

  tbody.innerHTML = filteredUsers.map(user => {
    const roleBadge = getRoleBadge(user.role);
    const dateStr = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown";
    
    return `
      <tr>
        <td>${user.email}</td>
        <td>${roleBadge}</td>
        <td>${dateStr}</td>
        <td class="user-actions">
          ${user.role !== "admin" ? `<button onclick="makeAdmin('${user.uid}')" class="btn btn-small">⭐ Make Admin</button>` : ""}
          ${user.role === "admin" ? `<button onclick="removeAdmin('${user.uid}')" class="btn btn-small btn-secondary">👤 Make User</button>` : ""}
          ${user.role === "pending" ? `<button onclick="approveUser('${user.uid}')" class="btn btn-small">✅ Approve</button>` : ""}
          <button onclick="deleteUser('${user.uid}')" class="btn btn-small btn-delete">🗑️ Delete</button>
        </td>
      </tr>
    `;
  }).join("");
}

// Get role badge HTML
function getRoleBadge(role) {
  if (role === "admin") return '<span class="role-badge role-admin">Admin</span>';
  if (role === "pending") return '<span class="role-badge role-pending">Pending</span>';
  return '<span class="role-badge role-user">User</span>';
}

// Make user admin
window.makeAdmin = async function(uid) {
  if (!confirm("Grant admin privileges to this user?")) return;
  
  try {
    await updateDoc(doc(db, "Users", uid), { role: "admin" });
    alert("User is now an admin!");
    loadAllUsers();
  } catch (err) {
    alert("Error: " + err.message);
  }
};

// Remove admin privileges
window.removeAdmin = async function(uid) {
  if (!confirm("Remove admin privileges from this user?")) return;
  
  try {
    await updateDoc(doc(db, "Users", uid), { role: "user" });
    alert("User is now a regular user!");
    loadAllUsers();
  } catch (err) {
    alert("Error: " + err.message);
  }
};

// Approve pending user
window.approveUser = async function(uid) {
  try {
    await updateDoc(doc(db, "Users", uid), { role: "user" });
    alert("User approved!");
    loadAllUsers();
  } catch (err) {
    alert("Error: " + err.message);
  }
};

// Delete user
window.deleteUser = async function(uid) {
  if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
  
  try {
    await deleteDoc(doc(db, "Users", uid));
    alert("User deleted successfully!");
    loadAllUsers();
  } catch (err) {
    alert("Error deleting user: " + err.message);
  }
};

// Event listeners
if (searchInput) searchInput.addEventListener("input", applyFilters);
if (roleFilter) roleFilter.addEventListener("change", applyFilters);

// Initial load
if (tbody) loadAllUsers();
