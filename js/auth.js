// js/auth.js
import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// 🔎 Get role of user (admin or user)
export async function getUserRole(uid) {
  const userDoc = await getDoc(doc(db, "Users", uid));
  if (userDoc.exists()) return userDoc.data().role || "user";
  return "user"; // default
}

// 🔑 Login
export async function login(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "index.html";
  } catch (err) {
    alert("Login failed: " + err.message);
  }
}

// 📝 Register (defaults to student "user")
export async function register(email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "Users", cred.user.uid), { role: "user" });
    window.location.href = "index.html";
  } catch (err) {
    alert("Registration failed: " + err.message);
  }
}

// 🚪 Logout
export async function logout() {
  await signOut(auth);
  window.location.href = "login.html";
}

// 🔒 Protect admin-only pages
export async function protectAdminPage() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    const role = await getUserRole(user.uid);
    if (role !== "admin") {
      alert("You are not authorized to view this page.");
      window.location.href = "index.html";
    }
  });
}
