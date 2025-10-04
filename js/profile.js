// js/profile.js
import { onAuthState } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const userEmail = document.getElementById("user-email");
  const userRole = document.getElementById("user-role");
  const userPhoto = document.getElementById("user-photo");
  const adminSection = document.getElementById("admin-section");
  const guestSection = document.getElementById("guest-section");
  const pendingMessage = document.getElementById("pending-message");
  const profileCard = document.querySelector(".profile-card");

  onAuthState((user) => {
    if (!user) {
      // Not logged in - show guest section
      profileCard.style.display = "none";
      adminSection.style.display = "none";
      guestSection.style.display = "block";
      return;
    }

    // Logged in - show profile
    profileCard.style.display = "flex";
    guestSection.style.display = "none";

    userEmail.textContent = user.email || "Unknown";
    
    // Display role with badge styling
    const roleText = user.role || "pending";
    userRole.textContent = roleText.charAt(0).toUpperCase() + roleText.slice(1);
    
    // Add role badge styling
    if (user.role === "admin") {
      userRole.className = "role-badge role-admin";
      adminSection.style.display = "block";
    } else if (user.role === "user") {
      userRole.className = "role-badge role-user";
    } else {
      userRole.className = "role-badge role-pending";
      pendingMessage.style.display = "block";
    }

    // Load user photo if available
    if (user.photoURL) {
      userPhoto.src = user.photoURL;
    }
  });
});
