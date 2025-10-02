// js/menu.js
import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getUserRole, logout } from "./auth.js";

const root = document.getElementById("menu");

function renderMenu(items) {
  root.innerHTML = `
    <nav class="menu">
      <button onclick="location.href='index.html'">Home</button>
      <button onclick="location.href='problems.html'">Problems</button>
      <button onclick="location.href='lessons.html'">Lessons</button>
      ${items.join("")}
    </nav>
  `;
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    renderMenu([`<button onclick="location.href='login.html'">Login</button>`]);
    return;
  }

  const role = await getUserRole(user.uid);
  const profileLabel = role === "admin" ? "(Admin) Profile" : "(User) Profile";

  let items = [
    `<button onclick="location.href='profile.html'">${profileLabel}</button>`,
    `<button onclick="import('./auth.js').then(m=>m.logout())">Logout</button>`
  ];

  if (role === "admin") {
    // Add Admin link if the user is admin
    items.splice(1, 0, `<button onclick="location.href='admin.html'">Admin</button>`);
  }

  renderMenu(items);
});
