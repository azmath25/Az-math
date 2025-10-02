import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getUserRole } from "./auth.js";

const menuDiv = document.getElementById("menu");

function renderMenu(buttons) {
  menuDiv.innerHTML = "";
  const menu = document.createElement("div");
  menu.classList.add("menu");
  buttons.forEach(btn => menu.appendChild(btn));
  menuDiv.appendChild(menu);
}

onAuthStateChanged(auth, async (user) => {
  if (!menuDiv) return;

  if (!user) {
    // Not logged in
    const loginBtn = document.createElement("button");
    loginBtn.textContent = "Login";
    loginBtn.onclick = () => window.location.href = "login.html";
    renderMenu([loginBtn]);
  } else {
    const role = await getUserRole(user.uid);

    const profileBtn = document.createElement("button");
    profileBtn.textContent = "Profile";
    profileBtn.onclick = () => window.location.href = "profile.html";

    const logoutBtn = document.createElement("button");
    logoutBtn.textContent = "Logout";
    logoutBtn.onclick = async () => {
      await signOut(auth);
      window.location.href = "login.html";
    };

    if (role === "admin") {
      const adminBtn = document.createElement("button");
      adminBtn.textContent = "Admin";
      adminBtn.onclick = () => window.location.href = "admin.html";
      renderMenu([profileBtn, adminBtn, logoutBtn]);
    } else {
      renderMenu([profileBtn, logoutBtn]);
    }
  }
});
