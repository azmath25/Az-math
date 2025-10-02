// js/auth.js
import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

/**
 * findDocRef(uid)
 * Try to find an existing user doc in either "Users" or "users".
 * If neither exists, return the reference to "Users" (default) so we write there.
 */
function userDocRef(uid) {
  // We'll return two possible refs; actual existence check happens in getUserRole
  return {
    capitalRef: doc(db, "Users", uid),
    lowerRef: doc(db, "users", uid),
    defaultRef: doc(db, "Users", uid) // default write location if none exist
  };
}

/**
 * getUserRole(uid, email)
 * - Checks for a user doc in either "Users" or "users".
 * - If found, returns role (or "user" if missing).
 * - If not found, creates a doc in "Users" (default) with { email, role: "user" } and returns "user".
 *
 * Pass email when available (on login/register) so created doc has email field.
 */
export async function getUserRole(uid, email = "") {
  try {
    const refs = userDocRef(uid);

    // check capitalized first
    let snap = await getDoc(refs.capitalRef);
    if (snap.exists()) {
      return snap.data().role || "user";
    }

    // check lowercase
    snap = await getDoc(refs.lowerRef);
    if (snap.exists()) {
      return snap.data().role || "user";
    }

    // no doc found: create default doc in "Users" (capitalized) so future lookups succeed
    await setDoc(refs.defaultRef, { email: email || "", role: "user" });
    return "user";
  } catch (err) {
    console.error("getUserRole error:", err);
    return "user";
  }
}

/* -------- Auth actions -------- */

export async function login(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    // redirect to profile for consistency
    window.location.href = "profile.html";
  } catch (err) {
    alert("Login failed: " + err.message);
  }
}

export async function register(email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // create user doc (use "Users" by default so it matches your existing collection)
    await setDoc(doc(db, "Users", cred.user.uid), {
      email: cred.user.email,
      role: "user"
    });

    window.location.href = "profile.html";
  } catch (err) {
    alert("Registration failed: " + err.message);
  }
}

export async function logout() {
  await signOut(auth);
  window.location.href = "login.html";
}

/* protect admin page: redirect to login if not signed in, redirect to index if not admin */
export async function protectAdminPage() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    const role = await getUserRole(user.uid, user.email || "");
    if (role !== "admin") {
      alert("You are not authorized to view this page.");
      window.location.href = "index.html";
    }
  });
}
