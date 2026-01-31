/**
 * CORE / DATA.JS
 * Configuration Firebase (Firestore + Storage)
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore, collection, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc,
  query, orderBy, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  getStorage, ref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// 🔥 إعدادات Firebase الحقيقية (صحيحة)
const firebaseConfig = {
  apiKey: "AIzaSyDgBp2JC51ADRcYtLLB-ksfZKrZcZbLJg",
  authDomain: "dashboard-menu-digital.firebaseapp.com",
  projectId: "dashboard-menu-digital",
  storageBucket: "dashboard-menu-digital.firebasestorage.app",
  messagingSenderId: "1042043501192",
  appId: "1:1042043501192:web:81fbc8cf05a3e017877d3d"
};

// Initialisation Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// ✅ Export (مهم جدًا)
export {
  db, storage,
  collection, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc,
  query, orderBy, where, serverTimestamp,
  ref, uploadBytes, getDownloadURL, deleteObject
};
