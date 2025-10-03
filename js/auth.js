// js/auth.js
import {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc
} from "./firebase.js";

// Register user -> create firebase auth user and create doc in Users collection (pending)
export async function register(email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;
    await setDoc(doc(db, "Users", uid), {
      email,
      role: "pending",
      name: "",
      approved: false,
      createdAt: Date.now()
    });
    alert("Registered. Waiting for admin approval.");
    location.href = "login.html";
  } catch (err) {
    console.error(err);
    alert("Register failed: " + err.message);
  }
}

// Login
export async function login(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged will handle redirect / UI
    location.href = "profile.html";
  } catch (err) {
    console.error(err);
    alert("Login failed: " + err.message);
  }
}

export async function logout() {
  await signOut(auth);
  location.href = "index.html";
}

// Check admin role; redirect if not admin
export async function protectAdminPage() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      location.href = "../login.html";
      return;
    }
    const udoc = await getDoc(doc(db, "Users", user.uid));
    const data = udoc.exists() ? udoc.data() : null;
    if (!data || data.role !== "admin") {
      alert("Admin access required.");
      location.href = "../index.html";
    }
  });
}

// Helper: get current user profile doc (or null)
export function onAuthState(cb) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return cb(null);
    const udoc = await getDoc(doc(db, "Users", user.uid));
    cb(udoc.exists() ? { uid: user.uid, ...udoc.data() } : null);
  });
}
