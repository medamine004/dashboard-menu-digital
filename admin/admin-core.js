/**
 * admin-core.js
 * Configuration Firebase & Exports
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, 
    query, where, orderBy, onSnapshot, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- CONFIGURATION IMPOSEE ---
const firebaseConfig = {
    apiKey: "AIzaSyDgBp2JC51ADRcYtLLB-ksfZKrZcZbLJg",
    authDomain: "dashboard-menu-digital.firebaseapp.com",
    projectId: "dashboard-menu-digital",
    storageBucket: "dashboard-menu-digital.firebasestorage.app",
    messagingSenderId: "1042043501192",
    appId: "1:1042043501192:web:81fbc8cf05a3e017877d3d"
};

// --- INITIALISATION ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- EXPORTS ---
export { 
    app, auth, db, 
    signOut, onAuthStateChanged, signInWithEmailAndPassword,
    collection, addDoc, getDocs, updateDoc, deleteDoc, doc, 
    query, where, orderBy, onSnapshot, serverTimestamp 
};