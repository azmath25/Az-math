// js/profile.js
import { onAuthState } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  onAuthState((user) => {
    if (!user) {
      document.getElementById("user-email").textContent = "Not logged";
      return;
    }
    document.getElementById("user-email").textContent = user.email || "";
    document.getElementById("user-role").textContent = user.role || "";
    if (user.role === "admin") document.getElementById("admin-section").style.display = "block";
  });
});
