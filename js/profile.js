// js/profile.js
import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getUserRole } from "./auth.js";

onAuthStateChanged(auth, async (user) => {
  const emailEl = document.getElementById("user-email");
  const roleEl = document.getElementById("user-role");
  const adminSection = document.getElementById("admin-section");

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  emailEl.textContent = user.email;
  const role = await getUserRole(user.uid);
  roleEl.textContent = role;

  if (role === "admin") {
    adminSection.style.display = "block";
  }
});
