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

  if (role === "admin") {
    renderMenu([
      `<button onclick="location.href='profile.html'">(Admin) Profile</button>`,
      `<button onclick="import('./auth.js').then(m=>m.logout())">Logout</button>`
    ]);
  } else {
    renderMenu([
      `<button onclick="location.href='profile.html'">(User) Profile</button>`,
      `<button onclick="import('./auth.js').then(m=>m.logout())">Logout</button>`
    ]);
  }
});
