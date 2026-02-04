/**
 * ADMIN DASHBOARD (Firestore + ImgBB Edition)
 * Stockage gratuit des images via API ImgBB
 */
import { 
    db, 
    collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, 
    query, orderBy 
} from "../core/data.js";

// ⚠️ COLLE TA CLÉ API IMGBB ICI (Gratuit sur api.imgbb.com)
const IMGBB_API_KEY = "daad728bfd5bc5f2739a9612b27c1410";

// --- SÉCURITÉ ---
if (!sessionStorage.getItem('admin_auth')) {
    window.location.href = 'login.html';
}

// Variables Globales
let selectedImageFile = null;

document.addEventListener('DOMContentLoaded', () => {
    initRealTimeListeners();
    setupImagePreview();

    // Exposition globale pour les onclick="" du HTML
    window.switchTab = switchTab;
    window.logout = logout;
    window.openProductModal = openProductModal;
    window.closeModal = closeModal;
    window.saveProduct = saveProduct;
    window.editProduct = editProduct;
    window.toggleActive = toggleActive;
    window.deleteProd = deleteProd;
    window.setStatus = setStatus;
    window.loadOrders = () => {}; 
});

function logout() {
    sessionStorage.removeItem('admin_auth');
    window.location.href = 'login.html';
}

// --- 1. FONCTION UPLOAD IMGBB (NOUVEAU) ---
async function uploadToImgBB(file) {
    const formData = new FormData();
    formData.append("image", file);

    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            return data.data.url; // Retourne l'URL directe de l'image
        } else {
            throw new Error("Erreur ImgBB: " + (data.error ? data.error.message : "Inconnue"));
        }
    } catch (error) {
        console.error("Erreur Upload:", error);
        throw error;
    }
}

// --- 2. ÉCOUTEURS TEMPS RÉEL ---
function initRealTimeListeners() {
    // Écoute Produits
    const qProducts = query(collection(db, "products"), orderBy("name"));
    onSnapshot(qProducts, (snapshot) => {
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderProductsTable(products);
    }, (error) => console.error("Erreur Produits:", error));

    // Écoute Commandes
    const qOrders = query(collection(db, "orders"), orderBy("timestamp", "desc"));
    onSnapshot(qOrders, (snapshot) => {
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderOrdersTable(orders);
        calculateStats(orders);
    }, (error) => console.error("Erreur Commandes:", error));
}

// --- 3. SAUVEGARDE PRODUIT (MODIFIÉ) ---
function setupImagePreview() {
    const fileInput = document.getElementById('prodImgFile');
    const preview = document.getElementById('imgPreview');
    
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // Max 32MB (Limite ImgBB) mais restons raisonnables (5Mo)
                if(file.size > 5 * 1024 * 1024) return alert("Image trop lourde (Max 5Mo)");
                selectedImageFile = file;
                const reader = new FileReader();
                reader.onload = (evt) => {
                    preview.src = evt.target.result;
                    preview.style.display = 'inline-block';
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

async function saveProduct() {
    const saveBtn = document.querySelector('.btn-primary[onclick="saveProduct()"]');
    const originalText = saveBtn.innerText;
    
    // Feedback UI
    saveBtn.innerText = "Upload en cours...";
    saveBtn.disabled = true;

    try {
        // Validation Clé API
        if (IMGBB_API_KEY === "REMPLACE_CECI_PAR_TA_CLE_IMGBB" || !IMGBB_API_KEY) {
            throw new Error("Clé API ImgBB manquante dans le code !");
        }

        const id = document.getElementById('prodId').value;
        const name = document.getElementById('prodName').value;
        const cat = document.getElementById('prodCat').value;
        const price = parseFloat(document.getElementById('prodPrice').value);
        const desc = document.getElementById('prodDesc').value;
        let imgUrl = document.getElementById('prodImg').value; 

        if (!name || isNaN(price)) throw new Error("Nom et Prix requis");

        // 🔥 UPLOAD VERS IMGBB SI NOUVELLE IMAGE 🔥
        if (selectedImageFile) {
            imgUrl = await uploadToImgBB(selectedImageFile);
            console.log("Image uploadée sur ImgBB:", imgUrl);
        } else if (!imgUrl) {
            imgUrl = 'https://placehold.co/400x300?text=No+Image';
        }

        const productData = { name, cat, price, desc, img: imgUrl, active: true };

        if (id) {
            await updateDoc(doc(db, "products", id), productData);
        } else {
            await addDoc(collection(db, "products"), productData);
        }

        closeModal();
        alert("Produit enregistré avec succès ! ✅");

    } catch (e) {
        console.error(e);
        alert("Erreur : " + e.message);
    } finally {
        saveBtn.innerText = originalText;
        saveBtn.disabled = false;
    }
}

// --- 4. AFFICHAGE (UI) ---
function renderProductsTable(products) {
    const tbody = document.querySelector('#products-table tbody');
    const catList = document.getElementById('catList');
    if (!tbody) return;

    // Datalist
    const cats = [...new Set(products.map(p => p.cat))];
    if(catList) catList.innerHTML = cats.map(c => `<option value="${c}">`).join('');

    tbody.innerHTML = products.length === 0 ? 
        `<tr><td colspan="6" style="text-align:center">Aucun produit</td></tr>` : 
        products.map(p => `
        <tr style="opacity: ${p.active ? 1 : 0.5}">
            <td><img src="${p.img}" style="width:40px;height:40px;object-fit:cover;border-radius:4px" onerror="this.src='https://placehold.co/40'"></td>
            <td>${p.name}</td>
            <td>${p.cat}</td>
            <td>${p.price.toFixed(1)}</td>
            <td>${p.active ? 'Oui' : 'Non'}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick='editProduct(${JSON.stringify(p)})'><i class="fas fa-pen"></i></button>
                <button class="btn btn-sm ${p.active ? 'btn-danger' : 'btn-success'}" onclick="toggleActive('${p.id}', ${p.active})">
                    <i class="fas ${p.active ? 'fa-eye-slash' : 'fa-eye'}"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteProd('${p.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function renderOrdersTable(orders) {
    const tbody = document.querySelector('#all-orders-table tbody');
    if (!tbody) return;

    tbody.innerHTML = orders.length === 0 ? 
        `<tr><td colspan="6" style="text-align:center">Aucune commande</td></tr>` : 
        orders.map(o => {
            const dateObj = o.timestamp?.toDate ? o.timestamp.toDate() : new Date();
            const time = dateObj.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
            const place = o.type === 'Sur Place' ? `Table <strong>${o.table}</strong>` : '📦 Emporter';
            return `
            <tr>
                <td>${time}</td>
                <td>${place}</td>
                <td><strong>${parseFloat(o.total).toFixed(1)} DT</strong></td>
                <td>${o.type}</td>
                <td><span class="status-badge status-${o.status}">${o.status}</span></td>
                <td>
                    ${o.status === 'pending' ? 
                    `<button class="btn btn-sm btn-primary" onclick="setStatus('${o.id}', 'completed')">Terminer</button>` : 
                    '<i class="fas fa-check" style="color:#10b981"></i>'}
                </td>
            </tr>`;
        }).join('');
}

function calculateStats(orders) {
    const localToday = new Date().toLocaleDateString();
    const todayOrders = orders.filter(o => {
        if (!o.timestamp) return false;
        const d = o.timestamp.toDate ? o.timestamp.toDate() : new Date();
        return d.toLocaleDateString() === localToday;
    });

    const caTotal = orders.reduce((acc, o) => acc + (parseFloat(o.total) || 0), 0);
    const caToday = todayOrders.reduce((acc, o) => acc + (parseFloat(o.total) || 0), 0);

    const elCaToday = document.getElementById('stat-revenue-today');
    if(elCaToday) elCaToday.innerText = caToday.toFixed(1) + ' DT';
    
    const elCount = document.getElementById('stat-orders-count');
    if(elCount) elCount.innerText = todayOrders.length;
    
    const elCaTotal = document.getElementById('stat-revenue-7days');
    if(elCaTotal) elCaTotal.innerText = caTotal.toFixed(1) + ' DT';

    const recent = orders.slice(0, 5);
    const tableDash = document.getElementById('dash-orders-table');
    if(tableDash) {
        tableDash.innerHTML = recent.map(o => `
            <tr>
                <td>${o.orderId}</td>
                <td>${parseFloat(o.total).toFixed(1)} DT</td>
                <td><span class="status-badge status-${o.status}">${o.status}</span></td>
            </tr>
        `).join('');
    }
}

// --- 5. ACTIONS & MODALES ---
async function toggleActive(id, current) {
    try { await updateDoc(doc(db, "products", id), { active: !current }); } 
    catch(e) { alert("Erreur: " + e.message); }
}

async function deleteProd(id) {
    if (confirm("Supprimer ?")) {
        try { await deleteDoc(doc(db, "products", id)); } 
        catch(e) { alert("Erreur: " + e.message); }
    }
}

async function setStatus(id, status) {
    try { await updateDoc(doc(db, "orders", id), { status: status }); } 
    catch(e) { alert("Erreur: " + e.message); }
}

function openProductModal() {
    document.getElementById('modalTitle').innerText = "Nouveau Produit";
    document.getElementById('prodId').value = "";
    document.getElementById('prodName').value = "";
    document.getElementById('prodCat').value = "";
    document.getElementById('prodPrice').value = "";
    document.getElementById('prodDesc').value = "";
    document.getElementById('prodImg').value = "";
    document.getElementById('prodImgFile').value = "";
    document.getElementById('imgPreview').style.display = 'none';
    selectedImageFile = null;
    document.getElementById('productModal').classList.add('open');
}

function editProduct(p) {
    document.getElementById('modalTitle').innerText = "Modifier";
    document.getElementById('prodId').value = p.id;
    document.getElementById('prodName').value = p.name;
    document.getElementById('prodCat').value = p.cat;
    document.getElementById('prodPrice').value = p.price;
    document.getElementById('prodDesc').value = p.desc || "";
    document.getElementById('prodImg').value = p.img;
    document.getElementById('prodImgFile').value = "";
    selectedImageFile = null;
    const preview = document.getElementById('imgPreview');
    preview.src = p.img;
    preview.style.display = 'inline-block';
    document.getElementById('productModal').classList.add('open');
}

function closeModal() { document.getElementById('productModal').classList.remove('open'); }
function switchTab(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}
