// js/auth.js
import { auth } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

// Login
export async function login(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    console.log("Logged in:", email);
    window.location.href = "index.html"; // redirect after login
  } catch (err) {
    console.error("Login failed:", err.message);
    alert("Login failed: " + err.message);
  }
}

// Register
export async function register(email, password) {
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    console.log("Registered:", email);
    window.location.href = "index.html";
  } catch (err) {
    console.error("Registration failed:", err.message);
    alert("Registration failed: " + err.message);
  }
}

// Logout
export async function logout() {
  await signOut(auth);
  console.log("User logged out");
  window.location.href = "login.html";
}

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
  const profilePhoto = document.getElementById("profile-photo");
  if (user) {
    console.log("User logged in:", user.email);
    if (profilePhoto) profilePhoto.title = user.email;
  } else {
    console.log("No user logged in");
    if (profilePhoto) profilePhoto.title = "Guest";
  }
});
