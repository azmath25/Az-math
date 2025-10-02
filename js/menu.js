import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getUserRole } from "./auth.js";

const menuDiv = document.getElementById("menu");

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
  if (!menuDiv) return;

  // Base navigation links (shown to everyone)
  const navBtns = [
    makeBtn("Home", "index.html"),
    makeBtn("Problems", "problems.html"),
    makeBtn("Lessons", "lessons.html"),
  ];

  if (!user) {
    // Unauthenticated → show Login
    renderMenu([...navBtns, makeBtn("Login", "login.html")]);
  } else {
    // Logged in → add Profile + Logout
    let role = "user";
    try {
      role = await getUserRole(user.uid) || "user";
    } catch (e) {
      console.error("Role fetch failed", e);
    }

    const profileBtn = makeBtn("Profile", "profile.html");
    const logoutBtn = makeBtn("Logout", null, async () => {
      await signOut(auth);
      window.location.href = "login.html";
    });

    if (role === "admin") {
      const adminBtn = makeBtn("Admin", "admin.html");
      renderMenu([...navBtns, profileBtn, adminBtn, logoutBtn]);
    } else {
      renderMenu([...navBtns, profileBtn, logoutBtn]);
    }
  }
});
