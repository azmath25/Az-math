// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCYrw8aLDGtbKXdou7YweLVBKLFXHyl9SM",
  authDomain: "az-math.firebaseapp.com",
  projectId: "az-math",
  storageBucket: "az-math.appspot.com",   // fixed
  messagingSenderId: "49046309945",
  appId: "1:49046309945:web:a3be9525705860c75191e8"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
