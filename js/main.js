// js/main.js
import { onAuthState } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menu-toggle");
  const sidebar = document.getElementById("sidebar");
  if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", () => sidebar.classList.toggle("open"));
  }

  // Profile photo click / show
  const profilePhoto = document.getElementById("profile-photo") || document.getElementById("profile-photo");
  if (profilePhoto) {
    profilePhoto.src = "assets/img/defaultprofile.png";
  }

  // show admin link if admin
  onAuthState((user) => {
    if (!user) return;
    const menu = document.getElementById("menu");
    if (!menu) return;
    if (user.role === "admin") {
      const a = document.createElement("a");
      a.href = "admin/index.html";
      a.textContent = "Admin";
      a.className = "admin-shortcut";
      menu.appendChild(a);
    }
  });
});
