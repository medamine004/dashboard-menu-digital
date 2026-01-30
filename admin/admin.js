/**
 * ADMIN DASHBOARD LOGIC (Firebase Edition)
 */

// 1. IMPORTS FIREBASE (v9 Modular SDK)
// Assurez-vous d'utiliser <script type="module" src="admin.js"></script> dans votre HTML
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, Timestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// 2. CONFIGURATION FIREBASE (À REMPLACER PAR VOS CLÉS)
const firebaseConfig = {
    apiKey: "VOTRE_API_KEY",
    authDomain: "VOTRE_PROJET.firebaseapp.com",
    projectId: "VOTRE_PROJECT_ID",
    storageBucket: "VOTRE_BUCKET.appspot.com",
    messagingSenderId: "VOTRE_SENDER_ID",
    appId: "VOTRE_APP_ID"
};

// 3. INITIALISATION
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Variable globale pour stocker le fichier image sélectionné
let selectedImageFile = null;

// Sécurité Session
if (!sessionStorage.getItem('admin_auth')) {
    window.location.href = 'login.html';
}

window.logout = function() {
    sessionStorage.removeItem('admin_auth');
    window.location.href = 'login.html';
}

// 🔄 BOUCLE DE SYNCHRONISATION
setInterval(() => {
    // On ne recharge les stats que si nécessaire pour éviter trop de lectures Firestore
    // Idéalement, utilisez onSnapshot pour du temps réel, ici on garde le polling simple
}, 60000); 

document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    setupImageUpload();
});

// NAVIGATION
window.switchTab = function(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    if (id === 'dashboard') loadStats();
    if (id === 'orders') loadOrders();
    if (id === 'products') loadProducts();
}

// --- STATISTIQUES (FIRESTORE) ---
async function loadStats() {
    try {
        const querySnapshot = await getDocs(collection(db, "orders"));
        const orders = [];
        querySnapshot.forEach((doc) => orders.push(doc.data()));

        const localToday = new Date().toLocaleDateString();

        const todayOrders = orders.filter(o => {
            if (!o.timestamp) return false;
            // Gestion timestamp Firestore ou String ISO
            const dateVal = o.timestamp.toDate ? o.timestamp.toDate() : new Date(o.timestamp);
            return dateVal.toLocaleDateString() === localToday;
        });

        const caTotal = orders.reduce((acc, o) => acc + (parseFloat(o.total) || 0), 0);
        const caToday = todayOrders.reduce((acc, o) => acc + (parseFloat(o.total) || 0), 0);

        const elCaToday = document.getElementById('stat-revenue-today');
        if (elCaToday) elCaToday.innerText = caToday.toFixed(1) + ' DT';

        const elOrderCount = document.getElementById('stat-orders-count');
        if (elOrderCount) elOrderCount.innerText = todayOrders.length; 

        const elCaTotal = document.getElementById('stat-revenue-7days');
        if (elCaTotal) elCaTotal.innerText = caTotal.toFixed(1) + ' DT';

        // Tableau Dashboard (5 derniers)
        // Note: Pour trier, Firestore nécessite un index, on trie ici en JS pour faire simple
        orders.sort((a, b) => {
            const dateA = a.timestamp.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
            const dateB = b.timestamp.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
            return dateB - dateA;
        });

        const recent = orders.slice(0, 5);
        const table = document.getElementById('dash-orders-table');
        if (table) {
            if (recent.length === 0) table.innerHTML = `<tr><td colspan="3">Aucune commande</td></tr>`;
            else {
                table.innerHTML = recent.map(o => `
                    <tr>
                        <td>${o.orderId}</td>
                        <td>${o.total.toFixed(1)} DT</td>
                        <td><span class="status-badge status-${o.status}">${o.status}</span></td>
                    </tr>
                `).join('');
            }
        }
    } catch (e) {
        console.error("Erreur chargement stats:", e);
    }
}

// --- GESTION COMMANDES (FIRESTORE) ---
window.loadOrders = async function() {
    const tbody = document.querySelector('#all-orders-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Chargement...</td></tr>';

    try {
        const q = query(collection(db, "orders")); // Ajoutez orderBy("timestamp", "desc") après avoir créé l'index
        const querySnapshot = await getDocs(q);
        const orders = [];
        querySnapshot.forEach((doc) => {
            orders.push({ firebaseId: doc.id, ...doc.data() });
        });

        // Tri JS fallback
        orders.sort((a, b) => {
            const dateA = a.timestamp.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
            const dateB = b.timestamp.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
            return dateB - dateA;
        });

        tbody.innerHTML = orders.map(o => {
            const dateObj = o.timestamp.toDate ? o.timestamp.toDate() : new Date(o.timestamp);
            const time = dateObj.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'});
            const place = o.type === 'Sur Place' ? `Table <strong>${o.table}</strong>` : '📦 À Emporter';
            
            return `
            <tr>
                <td>${time}</td>
                <td>${place}</td>
                <td><strong>${o.total.toFixed(1)} DT</strong></td>
                <td>${o.type}</td>
                <td><span class="status-badge status-${o.status}">${o.status}</span></td>
                <td>
                    ${o.status === 'pending' ? 
                    `<button class="btn btn-sm btn-primary" onclick="setStatus('${o.firebaseId}', 'completed')">Terminer</button>` : 
                    '<i class="fas fa-check" style="color:green"></i>'}
                </td>
            </tr>`;
        }).join('');
    } catch (e) {
        console.error("Erreur chargement commandes:", e);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red">Erreur chargement</td></tr>';
    }
}

window.setStatus = async function(docId, status) {
    try {
        const orderRef = doc(db, "orders", docId);
        await updateDoc(orderRef, { status: status });
        loadOrders();
        loadStats();
    } catch (e) {
        alert("Erreur mise à jour statut: " + e.message);
    }
}

// --- GESTION PRODUITS (FIRESTORE + STORAGE) ---
window.loadProducts = async function() {
    const tbody = document.querySelector('#products-table tbody');
    const catList = document.getElementById('catList');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Chargement...</td></tr>';

    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const products = [];
        querySnapshot.forEach((doc) => {
            products.push({ firebaseId: doc.id, ...doc.data() });
        });

        // Datalist catégories
        const cats = [...new Set(products.map(p => p.cat))];
        if (catList) catList.innerHTML = cats.map(c => `<option value="${c}">`).join('');

        tbody.innerHTML = products.map(p => `
            <tr style="opacity: ${p.active ? 1 : 0.5}; background: ${p.active ? 'transparent' : '#f8f9fa'}">
                <td><img src="${p.img}" style="width:40px;height:40px;object-fit:cover;border-radius:4px" onerror="this.src='https://placehold.co/40'"></td>
                <td>${p.name}</td>
                <td>${p.cat}</td>
                <td>${parseFloat(p.price).toFixed(1)}</td>
                <td>${p.active ? 'Oui' : 'Non'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick='editProduct(${JSON.stringify(p)})'><i class="fas fa-pen"></i></button>
                    <button class="btn btn-sm ${p.active ? 'btn-danger' : 'btn-success'}" onclick="toggleActive('${p.firebaseId}', ${p.active})">
                        <i class="fas ${p.active ? 'fa-eye-slash' : 'fa-eye'}"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProd('${p.firebaseId}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        console.error("Erreur chargement produits:", e);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red">Erreur chargement</td></tr>';
    }
}

// --- LOGIQUE UPLOAD & PREVIEW ---
function setupImageUpload() {
    const fileInput = document.getElementById('prodImgFile');
    const preview = document.getElementById('imgPreview');

    if(fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                // 1. Sauvegarde le fichier brut pour l'upload Firebase
                selectedImageFile = file;

                // 2. Affiche un aperçu local immédiat
                const reader = new FileReader();
                reader.onload = function(evt) {
                    preview.src = evt.target.result;
                    preview.style.display = 'inline-block';
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

// --- MODAL & SAUVEGARDE ---
window.openProductModal = function() {
    document.getElementById('modalTitle').innerText = "Nouveau Produit";
    document.getElementById('prodId').value = ""; // Vide = création
    document.getElementById('prodName').value = "";
    document.getElementById('prodCat').value = "";
    document.getElementById('prodPrice').value = "";
    document.getElementById('prodDesc').value = "";
    document.getElementById('prodImg').value = ""; // URL existante
    
    // Reset Fichier
    document.getElementById('prodImgFile').value = "";
    selectedImageFile = null;
    
    const preview = document.getElementById('imgPreview');
    preview.style.display = 'none';
    preview.src = "";

    document.getElementById('productModal').classList.add('open');
}

window.editProduct = function(p) {
    document.getElementById('modalTitle').innerText = "Modifier Produit";
    // On utilise l'ID Firebase si dispo, sinon l'ID local (migration)
    document.getElementById('prodId').value = p.firebaseId || ""; 
    document.getElementById('prodName').value = p.name;
    document.getElementById('prodCat').value = p.cat;
    document.getElementById('prodPrice').value = p.price;
    document.getElementById('prodDesc').value = p.desc || "";
    document.getElementById('prodImg').value = p.img || ""; 
    
    document.getElementById('prodImgFile').value = "";
    selectedImageFile = null;
    
    const preview = document.getElementById('imgPreview');
    if (p.img) {
        preview.src = p.img;
        preview.style.display = 'inline-block';
    } else {
        preview.style.display = 'none';
    }

    document.getElementById('productModal').classList.add('open');
}

window.closeModal = function() {
    document.getElementById('productModal').classList.remove('open');
}

// 🔥 CŒUR DU SYSTÈME : UPLOAD + SAVE FIRESTORE 🔥
window.saveProduct = async function() {
    const saveBtn = document.querySelector('.btn-primary[onclick="saveProduct()"]');
    const originalText = saveBtn.innerText;
    saveBtn.innerText = "Sauvegarde...";
    saveBtn.disabled = true;

    try {
        const id = document.getElementById('prodId').value;
        const name = document.getElementById('prodName').value;
        const cat = document.getElementById('prodCat').value;
        const price = parseFloat(document.getElementById('prodPrice').value);
        const desc = document.getElementById('prodDesc').value;
        let imgUrl = document.getElementById('prodImg').value; // URL actuelle

        if (!name || isNaN(price)) {
            throw new Error("Nom et Prix obligatoires.");
        }

        // 1. UPLOAD IMAGE VERS STORAGE (SI NOUVELLE IMAGE)
        if (selectedImageFile) {
            const fileName = `products/${Date.now()}_${selectedImageFile.name}`;
            const storageRef = ref(storage, fileName);
            
            // Upload
            const snapshot = await uploadBytes(storageRef, selectedImageFile);
            // Récupération URL publique
            imgUrl = await getDownloadURL(snapshot.ref);
            console.log("Image uploadée:", imgUrl);
        } else if (!imgUrl) {
            imgUrl = 'https://placehold.co/400x300?text=No+Image';
        }

        const productData = {
            name,
            cat,
            price,
            desc,
            img: imgUrl,
            active: true,
            id: Date.now() // ID numérique pour compatibilité héritée
        };

        // 2. SAUVEGARDE DANS FIRESTORE
        if (id) {
            // Modification
            const productRef = doc(db, "products", id);
            await updateDoc(productRef, productData);
        } else {
            // Création
            await addDoc(collection(db, "products"), productData);
        }

        closeModal();
        loadProducts(); // Rafraîchir la liste
        alert("Produit enregistré avec succès ! ✅");

    } catch (error) {
        console.error("Erreur sauvegarde:", error);
        alert("Erreur : " + error.message);
    } finally {
        saveBtn.innerText = originalText;
        saveBtn.disabled = false;
    }
}

// --- ACTIONS UNITAIRES ---
window.toggleActive = async function(docId, currentStatus) {
    if(!docId) return;
    try {
        const productRef = doc(db, "products", docId);
        await updateDoc(productRef, { active: !currentStatus });
        loadProducts();
    } catch (e) {
        alert("Erreur: " + e.message);
    }
}

window.deleteProd = async function(docId) {
    if(!docId) return;
    if (confirm("Supprimer ce produit définitivement ?")) {
        try {
            await deleteDoc(doc(db, "products", docId));
            loadProducts();
        } catch (e) {
            alert("Erreur suppression: " + e.message);
        }
    }
}
