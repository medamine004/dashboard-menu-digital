/**
 * CORE / DATA.JS
 * Configuration Firebase (Auth + Firestore + Storage)
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

/* ================= FIRESTORE ================= */
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= STORAGE ================= */
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

/* ================= AUTH ================= */
import {
  getAuth,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ================= CONFIG ================= */
// 🔥 إعدادات Firebase (صحيحة)
const firebaseConfig = {
  apiKey: "AIzaSyDgBp2JC51ADRcYtLLB-ksfZKrZcZbLJg",
  authDomain: "dashboard-menu-digital.firebaseapp.com",
  projectId: "dashboard-menu-digital",
  storageBucket: "dashboard-menu-digital.firebasestorage.app",
  messagingSenderId: "1042043501192",
  appId: "1:1042043501192:web:81fbc8cf05a3e017877d3d"
};

/* ================= INIT ================= */
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

/* ================= EXPORT ================= */
// ✅ مهم جدًا – هذا يحل مشكلة signOut و auth نهائيًا
export {
  db,
  storage,
  auth,
  signOut,

  // Firestore
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
  serverTimestamp,

  // Storage
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
};
