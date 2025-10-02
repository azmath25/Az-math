// js/menu.js
import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getUserRole } from "./auth.js";

const menuDiv = document.getElementById("menu");

function renderMenu(buttons) {
  if (!menuDiv) return;
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
  if (!menuDiv) return;

  // base nav visible to all
  const base = [
    makeBtn("Home", "index.html"),
    makeBtn("Problems", "problems.html"),
    makeBtn("Lessons", "lessons.html")
  ];

  if (!user) {
    renderMenu([...base, makeBtn("Login", "login.html")]);
    return;
  }

  // signed-in: ensure user doc exists & get role (pass email so auto-create has it)
  let role = "user";
  try {
    role = await getUserRole(user.uid, user.email || "") || "user";
  } catch (e) {
    console.error("menu: getUserRole failed", e);
    role = "user";
  }

  const profileBtn = makeBtn(role === "admin" ? "(Admin) Profile" : "(User) Profile", "profile.html");
  const logoutBtn = makeBtn("Logout", null, async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });

  if (role === "admin") {
    const adminBtn = makeBtn("Admin", "admin.html");
    renderMenu([...base, profileBtn, adminBtn, logoutBtn]);
  } else {
    renderMenu([...base, profileBtn, logoutBtn]);
  }
});
