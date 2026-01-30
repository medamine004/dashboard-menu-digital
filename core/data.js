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

// ⚠️ REMPLACEZ AVEC VOS CLÉS FIREBASE ICI
const firebaseConfig = {
    apiKey: "VOTRE_API_KEY",
    authDomain: "VOTRE_PROJET.firebaseapp.com",
    projectId: "VOTRE_PROJECT_ID",
    storageBucket: "VOTRE_BUCKET.appspot.com",
    messagingSenderId: "VOTRE_SENDER_ID",
    appId: "VOTRE_APP_ID"
};

// Initialisation
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Exportation des outils
export { 
    db, storage, 
    collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, 
    query, orderBy, where, serverTimestamp,
    ref, uploadBytes, getDownloadURL, deleteObject
};
