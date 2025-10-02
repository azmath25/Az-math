onAuthStateChanged(auth, async (user) => {
  if (!menuDiv) return;

  if (!user) {
    renderMenu([makeBtn("Login", "login.html")]);
  } else {
    let role = "user"; // fallback
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
      renderMenu([profileBtn, adminBtn, logoutBtn]);
    } else {
      renderMenu([profileBtn, logoutBtn]);
    }
  }
});

// helper
function makeBtn(label, href, onclick) {
  const btn = document.createElement("button");
  btn.textContent = label;
  if (onclick) btn.onclick = onclick;
  else if (href) btn.onclick = () => (window.location.href = href);
  return btn;
}
