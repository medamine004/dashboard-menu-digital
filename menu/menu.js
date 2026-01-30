/**
 * MENU CLIENT LOGIC (menu/menu.js)
 * Version avec Feedback UX (Toasts) et Images GitHub
 */

const WHATSAPP_NUMBER = "21658052184"; 
const PLACEHOLDER_IMG = "https://placehold.co/400x300?text=Image+Non+Dispo";
const GITHUB_BASE_URL = "https://raw.githubusercontent.com/medamine004/dashboard-menu-digital/main/menu/";

// --- VARIABLES GLOBALES ---
let menu = [];
let categories = [];
let activeCat = "";
let cart = [];

// --- INITIALISATION AU CHARGEMENT ---
document.addEventListener('DOMContentLoaded', () => {
    if (typeof DataManager === 'undefined') {
        console.error("ERREUR CRITIQUE : DataManager introuvable.");
        return;
    }
    initMenu();
});

function initMenu() {
    menu = DataManager.getActiveProducts();

    if (!menu || menu.length === 0) {
        document.getElementById('menu-list').innerHTML = 
            `<div style="text-align:center; padding:3rem; color:#888;">Le menu est momentanément indisponible.</div>`;
        return;
    }

    categories = [...new Set(menu.map(p => p.cat))];

    if (categories.length > 0) {
        activeCat = categories[0]; 
    } else {
        activeCat = "";
    }

    renderCats();
    renderMenu();
    updateCart();
}

// --- RENDU DES CATÉGORIES ---
function renderCats() {
    const container = document.getElementById('cat-list');
    if (!container) return;

    container.innerHTML = categories.map(c => 
        `<button class="cat-item ${c === activeCat ? 'active' : ''}" onclick="filter('${c}')">
            ${c}
        </button>`
    ).join('');
}

function filter(c) {
    activeCat = c;
    renderCats();
    renderMenu();
}

// --- RENDU DU MENU ---
function renderMenu() {
    const grid = document.getElementById('menu-list');
    if (!grid) return;

    const items = menu.filter(p => p.cat === activeCat);

    if (items.length === 0) {
        grid.innerHTML = `<div style="text-align:center; width:100%; padding:2rem;">Aucun produit dans cette catégorie.</div>`;
        return;
    }

    grid.innerHTML = items.map(item => {
        // --- GESTION IMAGES GITHUB ---
        let displayImg = item.img || '';
        
        // Si c'est un chemin local (commence par ../menu/ ou image/), on le transforme en URL GitHub
        if (displayImg.startsWith('../menu/') || displayImg.startsWith('image/')) {
            // On nettoie le chemin pour ne garder que la partie relative (ex: "image/plat.jpg")
            let cleanPath = displayImg.replace('../menu/', '');
            displayImg = GITHUB_BASE_URL + cleanPath;
        }
        // Sinon (Base64 ou URL déjà complète), on laisse tel quel

        return `
        <div class="dish-card">
            <img src="${displayImg}" class="dish-img" loading="lazy" 
                 onerror="this.src='${PLACEHOLDER_IMG}'">
            
            <div class="dish-content">
                <div>
                    <div class="dish-title">${item.name}</div>
                    <div class="dish-desc">${item.cat}</div>
                </div>
                <div class="dish-footer">
                    <div class="dish-price">${Number(item.price).toFixed(1)} DT</div>
                    <button class="add-btn" onclick="addToCart(${item.id})">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        </div>`;
    }).join('');
}

// --- GESTION DU PANIER (AVEC TOAST) ---
function addToCart(id) {
    const product = menu.find(p => p.id === id);
    if (!product) return;

    const existing = cart.find(i => i.id === id);
    if (existing) existing.qty++;
    else cart.push({...product, qty: 1});

    updateCart();
    
    // ✨ UX : Notification visuelle
    showToast(`${product.name} ajouté ! 🛒`);
}

function removeItem(id) {
    cart = cart.filter(i => i.id !== id);
    updateCart();
}

function modQty(id, delta) {
    const idx = cart.findIndex(i => i.id === id);
    if (idx === -1) return;
    
    cart[idx].qty += delta;
    if (cart[idx].qty <= 0) cart.splice(idx, 1);
    
    updateCart();
}

function updateCart() {
    const count = cart.reduce((a, b) => a + b.qty, 0);
    const badge = document.getElementById('nav-badge');
    
    if (badge) {
        badge.textContent = count;
        badge.classList.toggle('show', count > 0);
    }

    const container = document.getElementById('cart-items');
    let total = 0;

    if (container) {
        if (cart.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding:2rem; color:#888;">Panier vide</div>`;
        } else {
            container.innerHTML = cart.map(item => {
                total += item.price * item.qty;
                return `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #eee;">
                    <div style="flex:1">
                        <div style="font-weight:bold;">${item.name}</div>
                        <div style="font-size:0.8rem; color:#666;">${Number(item.price).toFixed(1)} DT x ${item.qty}</div>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <button onclick="modQty(${item.id}, -1)" class="btn-qty" style="width:25px;height:25px;border:none;background:#eee;border-radius:4px">-</button>
                        <span style="font-weight:bold;">${item.qty}</span>
                        <button onclick="modQty(${item.id}, 1)" class="btn-qty" style="width:25px;height:25px;border:none;background:#3b82f6;color:white;border-radius:4px">+</button>
                    </div>
                </div>`;
            }).join('');
        }
    }

    const totalEl = document.getElementById('cart-total');
    if (totalEl) totalEl.innerText = total.toFixed(1) + ' DT';
}

// --- COMMANDE (AVEC TOAST) ---
function order() {
    if (cart.length === 0) {
        showToast("Votre panier est vide !", "error");
        return;
    }

    const typeEl = document.querySelector('input[name="orderType"]:checked');
    const type = typeEl ? typeEl.value : 'A Emporter';
    const tableInput = document.getElementById('table-num');
    const table = tableInput ? tableInput.value.trim() : '';

    if (type === 'Sur Place' && !table) {
        alert("Veuillez entrer votre numéro de table 📍");
        return;
    }

    const itemsClone = cart.map(item => ({...item}));
    const orderId = "CMD-" + Math.floor(1000 + Math.random() * 9000);
    const total = cart.reduce((a, b) => a + (b.price * b.qty), 0);
    
    const orderData = {
        orderId: orderId,
        items: itemsClone,
        total: total,
        type: type,
        table: table || 'N/A',
        timestamp: new Date().toISOString(),
        status: 'pending'
    };

    try {
        if (typeof DataManager !== 'undefined') {
            DataManager.addOrder(orderData);
        }
    } catch (e) {
        console.error("Erreur sauvegarde", e);
    }

    let msg = `🧾 *COMMANDE ${orderId}*\n`;
    msg += `🕒 ${new Date().toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}\n`;
    msg += `🏷️ *${type.toUpperCase()}* ${type === 'Sur Place' ? '(Table ' + table + ')' : ''}\n`;
    msg += `────────────────\n`;
    itemsClone.forEach(i => {
        msg += `▪️ ${i.qty}x ${i.name} (${(i.price * i.qty).toFixed(1)} DT)\n`;
    });
    msg += `────────────────\n`;
    msg += `💰 *TOTAL : ${total.toFixed(1)} DT*`;

    // ✨ UX : Feedback visuel & Reset
    showToast("Commande confirmée ! ✅", "success");
    
    cart = [];
    updateCart();
    
    const drawer = document.getElementById('drawer');
    if(drawer) drawer.classList.remove('open');

    // Délai allongé (1s) pour laisser le temps de voir le message
    setTimeout(() => {
        window.location.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    }, 1000);
}

// --- ✨ FONCTION TOAST UX ---
function showToast(message, type = 'normal') {
    const container = document.getElementById('toast-container');
    if (!container) return; // Sécurité si le HTML n'existe pas

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    // Ajout d'icône selon le type
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-cart-plus';
    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
    
    container.appendChild(toast);
    
    // Animation entrée
    requestAnimationFrame(() => toast.classList.add('show'));

    // Animation sortie
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// --- UI GLOBALES ---
function openCart() { document.getElementById('drawer').classList.add('open'); }
function closeCart() { document.getElementById('drawer').classList.remove('open'); }
function toggleTableInput() {
    const group = document.getElementById('table-group');
    if(group) group.style.display = document.getElementById('opt-surplace').checked ? 'block' : 'none';
}
function toggleTheme() { document.documentElement.classList.toggle('dark'); }

// EXPORTS
window.addToCart = addToCart;
window.filter = filter;
window.openCart = openCart;
window.closeCart = closeCart;
window.toggleTableInput = toggleTableInput;
window.toggleTheme = toggleTheme;
window.order = order;
