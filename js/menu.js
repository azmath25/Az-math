import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getUserRole } from "./auth.js";

const menuDiv = document.getElementById("menu");
console.log("menu.js loaded, menuDiv:", menuDiv);

function renderMenu(buttons) {
  menuDiv.innerHTML = "";
  const container = document.createElement("div");
  container.className = "menu";
  buttons.forEach(btn => container.appendChild(btn));
  menuDiv.appendChild(container);
}

function makeBtn(label, href, onclick) {
  const btn = document.createElement("button");
  btn.textContent = label;
  if (onclick) btn.onclick = onclick;
  else if (href) btn.onclick = () => (window.location.href = href);
  return btn;
}

onAuthStateChanged(auth, async (user) => {
  console.log("Auth state changed:", user);

  if (!menuDiv) {
    console.warn("No #menu div found!");
    return;
  }

  if (!user) {
    console.log("No user, rendering Login");
    renderMenu([makeBtn("Login", "login.html")]);
  } else {
    console.log("User logged in:", user.email);
    let role = "user";
    try {
      role = await getUserRole(user.uid) || "user";
    } catch (e) {
      console.error("Role fetch failed", e);
    }
    console.log("User role:", role);

    const profileBtn = makeBtn("Profile", "profile.html");
    const logoutBtn = makeBtn("Logout", null, async () => {
      await signOut(auth);
      window.location.href = "login.html";
    });

    if (role === "admin") {
      const adminBtn = makeBtn("Admin", "admin.html");
      renderMenu([profileBtn, adminBtn, logoutBtn]);
    } else {
      renderMenu([profileBtn, logoutBtn]);
    }
  }
});
