// js/menu.js
import { onAuthState, logout } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const menuContainer = document.getElementById("menu");
  if (!menuContainer) return;

  // Determine base path (are we in admin folder?)
  const isAdminPage = window.location.pathname.includes("/admin/");
  const basePath = isAdminPage ? "../" : "";

  function renderMenu(user) {
    menuContainer.innerHTML = ""; // Clear existing
    menuContainer.className = "menu";

    if (!user) {
      // Guest menu
      menuContainer.innerHTML = `
        <a href="${basePath}index.html">🏠 Home</a>
        <a href="${basePath}problems.html">📝 Problems</a>
        <a href="${basePath}lessons.html">📚 Lessons</a>
        <a href="${basePath}login.html">🔑 Login</a>
        <a href="${basePath}register.html">✍️ Register</a>
      `;
    } else if (user.role === "admin") {
      // Admin menu
      menuContainer.innerHTML = `
        <a href="${basePath}index.html">🏠 Home</a>
        <a href="${basePath}problems.html">📝 Problems</a>
        <a href="${basePath}lessons.html">📚 Lessons</a>
        <a href="${basePath}profile.html">👤 Profile</a>
        <a href="${basePath}admin/index.html">⚙️ Admin Panel</a>
        <a href="#" id="logout-link">🚪 Logout</a>
      `;
    } else {
      // Regular user menu
      menuContainer.innerHTML = `
        <a href="${basePath}index.html">🏠 Home</a>
        <a href="${basePath}problems.html">📝 Problems</a>
        <a href="${basePath}lessons.html">📚 Lessons</a>
        <a href="${basePath}profile.html">👤 Profile</a>
        <a href="#" id="logout-link">🚪 Logout</a>
      `;
    }

    // Attach logout handler if logout link exists
    const logoutLink = document.getElementById("logout-link");
    if (logoutLink) {
      logoutLink.addEventListener("click", async (e) => {
        e.preventDefault();
        if (confirm("Are you sure you want to logout?")) {
          await logout();
        }
      });
    }
  }

  // Listen to auth state and update menu
  onAuthState((user) => {
    renderMenu(user);
  });
});
