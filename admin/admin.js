/**
 * ADMIN DASHBOARD LOGIC (admin/admin.js)
 */

// Sécurité
if (!sessionStorage.getItem('admin_auth')) {
    window.location.href = 'login.html';
}

function logout() {
    sessionStorage.removeItem('admin_auth');
    window.location.href = 'login.html';
}

// 🔄 BOUCLE DE SYNCHRONISATION
setInterval(() => {
    loadStats();
    if (document.getElementById('orders').classList.contains('active')) {
        loadOrders();
    }
}, 4000);

document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    setupImageUpload(); // Initialiser l'écouteur d'upload
});

// NAVIGATION
function switchTab(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    // Charger les données à la demande
    if (id === 'dashboard') loadStats();
    if (id === 'orders') loadOrders();
    if (id === 'products') loadProducts();
}

// --- STATISTIQUES ---

function loadStats() {
    const orders = DataManager.getOrders();
    const localToday = new Date().toLocaleDateString();

    const todayOrders = orders.filter(o => {
        if (!o.timestamp) return false;
        const oDate = new Date(o.timestamp).toLocaleDateString();
        return oDate === localToday;
    });

    const caTotal = orders.reduce((acc, o) => acc + (parseFloat(o.total) || 0), 0);
    const caToday = todayOrders.reduce((acc, o) => acc + (parseFloat(o.total) || 0), 0);

    const elCaToday = document.getElementById('stat-revenue-today');
    if (elCaToday) elCaToday.innerText = caToday.toFixed(1) + ' DT';

    const elOrderCount = document.getElementById('stat-orders-count');
    if (elOrderCount) elOrderCount.innerText = todayOrders.length; 

    const elCaTotal = document.getElementById('stat-revenue-7days');
    if (elCaTotal) elCaTotal.innerText = caTotal.toFixed(1) + ' DT';

    const recent = orders.slice().reverse().slice(0, 5);
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
}

// --- GESTION COMMANDES ---

function loadOrders() {
    const orders = DataManager.getOrders().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const tbody = document.querySelector('#all-orders-table tbody');
    if (!tbody) return;

    tbody.innerHTML = orders.map(o => {
        const time = new Date(o.timestamp).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'});
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
                `<button class="btn btn-sm btn-primary" onclick="setStatus('${o.orderId}', 'completed')">Terminer</button>` : 
                '<i class="fas fa-check" style="color:green"></i>'}
            </td>
        </tr>`;
    }).join('');
}

function setStatus(id, status) {
    DataManager.updateOrderStatus(id, status);
    loadOrders();
    loadStats();
}

// --- GESTION PRODUITS ---

function loadProducts() {
    const products = DataManager.getProducts();
    const tbody = document.querySelector('#products-table tbody');
    const catList = document.getElementById('catList');

    const cats = [...new Set(products.map(p => p.cat))];
    if (catList) catList.innerHTML = cats.map(c => `<option value="${c}">`).join('');

    if (!tbody) return;

    tbody.innerHTML = products.map(p => `
        <tr style="opacity: ${p.active ? 1 : 0.5}; background: ${p.active ? 'transparent' : '#f8f9fa'}">
            <td><img src="${p.img}" style="width:40px;height:40px;object-fit:cover;border-radius:4px" onerror="this.src='https://placehold.co/40'"></td>
            <td>${p.name}</td>
            <td>${p.cat}</td>
            <td>${p.price.toFixed(1)}</td>
            <td>${p.active ? 'Oui' : 'Non'}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick='editProduct(${JSON.stringify(p)})'><i class="fas fa-pen"></i></button>
                <button class="btn btn-sm ${p.active ? 'btn-danger' : 'btn-success'}" onclick="toggleActive(${p.id}, ${p.active})">
                    <i class="fas ${p.active ? 'fa-eye-slash' : 'fa-eye'}"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteProd(${p.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

// --- LOGIQUE UPLOAD IMAGE (NOUVEAU) ---
function setupImageUpload() {
    const fileInput = document.getElementById('prodImgFile');
    const hiddenInput = document.getElementById('prodImg');
    const preview = document.getElementById('imgPreview');

    if(fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(evt) {
                    // On stocke le Base64 dans l'input caché
                    hiddenInput.value = evt.target.result;
                    // On affiche l'aperçu
                    preview.src = evt.target.result;
                    preview.style.display = 'inline-block';
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

// --- MODAL PRODUITS ---

function openProductModal() {
    document.getElementById('modalTitle').innerText = "Nouveau Produit";
    document.getElementById('prodId').value = "";
    document.getElementById('prodName').value = "";
    document.getElementById('prodCat').value = "";
    document.getElementById('prodPrice').value = "";
    document.getElementById('prodDesc').value = "";
    
    // Reset Image
    document.getElementById('prodImg').value = "";
    document.getElementById('prodImgFile').value = "";
    const preview = document.getElementById('imgPreview');
    preview.style.display = 'none';
    preview.src = "";

    document.getElementById('productModal').classList.add('open');
}

function editProduct(p) {
    document.getElementById('modalTitle').innerText = "Modifier Produit";
    document.getElementById('prodId').value = p.id;
    document.getElementById('prodName').value = p.name;
    document.getElementById('prodCat').value = p.cat;
    document.getElementById('prodPrice').value = p.price;
    document.getElementById('prodDesc').value = p.desc || "";
    
    // Gestion Image
    document.getElementById('prodImg').value = p.img; // Stocke l'URL existante
    document.getElementById('prodImgFile').value = ""; // Reset le selecteur de fichier
    
    const preview = document.getElementById('imgPreview');
    if (p.img) {
        preview.src = p.img;
        preview.style.display = 'inline-block';
    } else {
        preview.style.display = 'none';
    }

    document.getElementById('productModal').classList.add('open');
}

function closeModal() {
    document.getElementById('productModal').classList.remove('open');
}

function saveProduct() {
    const id = document.getElementById('prodId').value;
    const name = document.getElementById('prodName').value;
    const cat = document.getElementById('prodCat').value;
    const price = parseFloat(document.getElementById('prodPrice').value);
    const desc = document.getElementById('prodDesc').value;
    
    // L'input caché contient soit l'ancienne URL, soit le nouveau Base64
    let img = document.getElementById('prodImg').value; 
    
    if (!img) img = '../menu/image/placeholder.jpg'; // Fallback

    if (!name || isNaN(price)) {
        alert("Nom et Prix sont obligatoires.");
        return;
    }

    const product = { name, cat, price, desc, img, active: true };

    if (id) {
        const oldP = DataManager.getProducts().find(p => p.id == id);
        product.id = parseInt(id);
        product.active = oldP ? oldP.active : true;
        DataManager.updateProduct(product);
    } else {
        DataManager.addProduct(product);
    }

    closeModal();
    loadProducts();
}

function toggleActive(id, currentStatus) {
    const products = DataManager.getProducts();
    const p = products.find(p => p.id === id);
    if (p) {
        p.active = !currentStatus;
        DataManager.updateProduct(p);
        loadProducts();
    }
}

function deleteProd(id) {
    if (confirm("Supprimer ce produit ?")) {
        DataManager.deleteProduct(id);
        loadProducts();
    }
}

// Exposer globalement
window.switchTab = switchTab;
window.logout = logout;
window.setStatus = setStatus;
window.editProduct = editProduct;
window.toggleActive = toggleActive;
window.deleteProd = deleteProd;
window.openProductModal = openProductModal;
window.closeModal = closeModal;
window.saveProduct = saveProduct;
window.loadOrders = loadOrders;