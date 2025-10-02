// js/auth.js
import { auth } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

const emailEl = document.getElementById("email");
const passEl = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userState = document.getElementById("userState");

if (loginBtn) loginBtn.addEventListener("click", login);
if (registerBtn) registerBtn.addEventListener("click", register);
if (logoutBtn) logoutBtn.addEventListener("click", logout);

export async function register() {
  const email = emailEl.value.trim();
  const password = passEl.value;
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("Registered. Check profile.");
  } catch (err) {
    alert(err.message);
  }
}

export async function login() {
  const email = emailEl.value.trim();
  const password = passEl.value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Logged in");
  } catch (err) {
    alert(err.message);
  }
}

export async function logout() {
  try {
    await signOut(auth);
    alert("Logged out");
  } catch (err) {
    alert(err.message);
  }
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    userState.innerText = `Signed in: ${user.email}`;
    if (loginBtn) loginBtn.style.display = "none";
    if (registerBtn) registerBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "inline-block";
  } else {
    userState.innerText = "Not signed in";
    if (loginBtn) loginBtn.style.display = "inline-block";
    if (registerBtn) registerBtn.style.display = "inline-block";
    if (logoutBtn) logoutBtn.style.display = "none";
  }
});
