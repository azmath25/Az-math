// js/main.js
import { onAuthState } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  // Sidebar toggle
  const menuToggle = document.getElementById("menu-toggle");
  const sidebar = document.getElementById("sidebar");
  
  if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });

    // Close sidebar when clicking outside
    document.addEventListener("click", (e) => {
      if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
        sidebar.classList.remove("open");
      }
    });
  }

  // Profile photo handling
  const profilePhoto = document.getElementById("profile-photo");
  if (profilePhoto) {
    // Determine base path
    const isAdminPage = window.location.pathname.includes("/admin/");
    const basePath = isAdminPage ? "../" : "";

    // Set default photo
    profilePhoto.src = `${basePath}assets/img/defaultprofile.png`;

    // Make clickable to go to profile
    profilePhoto.style.cursor = "pointer";
    profilePhoto.addEventListener("click", () => {
      onAuthState((user) => {
        if (user) {
          window.location.href = `${basePath}profile.html`;
        } else {
          window.location.href = `${basePath}login.html`;
        }
      });
    });

    // Load user's photo if they have one
    onAuthState((user) => {
      if (user && user.photoURL) {
        profilePhoto.src = user.photoURL;
      }
    });
  }
});
