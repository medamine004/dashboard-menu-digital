/**
 * MENU CLIENT (Firebase Edition)
 */
import { 
    db, collection, onSnapshot, addDoc, query, orderBy, serverTimestamp 
} from "../core/data.js";

const WHATSAPP_NUMBER = "21658052184"; 
const PLACEHOLDER_IMG = "https://placehold.co/400x300?text=Image+Non+Dispo";

// État
let menu = [];
let categories = [];
let activeCat = "";
let cart = [];

document.addEventListener('DOMContentLoaded', () => {
    initRealTimeMenu();

    // Exposition globale
    window.addToCart = addToCart;
    window.filter = filter;
    window.order = order;
    window.modQty = modQty; 
    window.openCart = () => document.getElementById('drawer').classList.add('open');
    window.closeCart = () => document.getElementById('drawer').classList.remove('open');
    window.toggleTableInput = () => {
        const d = document.getElementById('table-group');
        d.style.display = document.getElementById('opt-surplace').checked ? 'block' : 'none';
    };
    window.toggleTheme = () => document.documentElement.classList.toggle('dark');
});

// --- 1. CHARGEMENT TEMPS RÉEL ---
function initRealTimeMenu() {
    const q = query(collection(db, "products"), orderBy("name"));
    
    onSnapshot(q, (snapshot) => {
        // Mapping + Filtrage (actifs uniquement)
        menu = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                            .filter(p => p.active === true);
        
        if(menu.length > 0) {
            categories = [...new Set(menu.map(p => p.cat))];
            if (!activeCat || !categories.includes(activeCat)) activeCat = categories[0];
            renderCats();
            renderMenu();
        } else {
            document.getElementById('menu-list').innerHTML = `<div style="text-align:center;padding:3rem;color:#888">Menu en cours de mise à jour...</div>`;
        }
    });
}

// --- 2. RENDU ---
function renderCats() {
    const container = document.getElementById('cat-list');
    if(!container) return;
    container.innerHTML = categories.map(c => 
        `<button class="cat-item ${c === activeCat ? 'active' : ''}" onclick="filter('${c}')">${c}</button>`
    ).join('');
}

function filter(c) {
    activeCat = c;
    renderCats();
    renderMenu();
}

function renderMenu() {
    const grid = document.getElementById('menu-list');
    if(!grid) return;
    
    const items = menu.filter(p => p.cat === activeCat);
    if(items.length === 0) {
        grid.innerHTML = `<div style="text-align:center;width:100%;padding:2rem">Aucun produit ici</div>`;
        return;
    }

    grid.innerHTML = items.map(item => `
        <div class="dish-card">
            <img src="${item.img}" class="dish-img" loading="lazy" onerror="this.src='${PLACEHOLDER_IMG}'">
            <div class="dish-content">
                <div>
                    <div class="dish-title">${item.name}</div>
                    <div class="dish-desc">${item.cat}</div>
                </div>
                <div class="dish-footer">
                    <div class="dish-price">${parseFloat(item.price).toFixed(1)} DT</div>
                    <button class="add-btn" onclick="addToCart('${item.id}')">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// --- 3. PANIER ---
function addToCart(id) {
    const product = menu.find(p => p.id === id);
    if (!product) return;
    const existing = cart.find(i => i.id === id);
    if (existing) existing.qty++;
    else cart.push({...product, qty: 1});
    updateCart();
    showToast(`${product.name} ajouté ! 🛒`);
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
    if(badge) { badge.textContent = count; badge.classList.toggle('show', count > 0); }
    
    const container = document.getElementById('cart-items');
    let total = 0;
    if(container) {
        container.innerHTML = cart.length === 0 ? 
        `<div style="text-align:center;padding:2rem;color:#888">Panier vide</div>` : 
        cart.map(item => {
            total += item.price * item.qty;
            return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #eee">
                <div style="flex:1">
                    <b>${item.name}</b><br>
                    <small>${item.price} DT x ${item.qty}</small>
                </div>
                <div>
                    <button class="btn-qty" onclick="modQty('${item.id}', -1)">-</button> 
                    <b>${item.qty}</b> 
                    <button class="btn-qty" onclick="modQty('${item.id}', 1)">+</button>
                </div>
            </div>`;
        }).join('');
    }
    const totalEl = document.getElementById('cart-total');
    if(totalEl) totalEl.innerText = total.toFixed(1) + ' DT';
}

// --- 4. COMMANDE ---
async function order() {
    if (cart.length === 0) return showToast("Votre panier est vide !", "error");

    const type = document.querySelector('input[name="orderType"]:checked').value;
    const table = document.getElementById('table-num').value;

    if (type === 'Sur Place' && !table) return alert("Veuillez indiquer votre table.");

    const orderId = "CMD-" + Math.floor(1000 + Math.random() * 9000);
    const total = cart.reduce((a, b) => a + (b.price * b.qty), 0);

    showToast("Envoi de la commande...", "success");

    try {
        await addDoc(collection(db, "orders"), {
            orderId,
            items: cart,
            total,
            type,
            table: table || 'N/A',
            timestamp: serverTimestamp(),
            status: 'pending'
        });

        // WhatsApp
        let msg = `🧾 *COMMANDE ${orderId}*\n🏷️ *${type}* ${table ? '('+table+')' : ''}\n────────────────\n`;
        cart.forEach(i => msg += `▪️ ${i.qty}x ${i.name} (${(i.price*i.qty).toFixed(1)} DT)\n`);
        msg += `────────────────\n💰 *TOTAL : ${total.toFixed(1)} DT*`;

        cart = [];
        updateCart();
        window.closeCart();

        setTimeout(() => {
            window.location.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
        }, 1000);
    } catch (e) {
        console.error(e);
        alert("Erreur de connexion internet.");
    }
}

function showToast(msg, type='normal') {
    const box = document.getElementById('toast-container');
    if(!box) return;
    const el = document.createElement('div');
    el.className = `toast ${type} show`;
    el.innerHTML = `<span>${msg}</span>`;
    box.appendChild(el);
    setTimeout(() => el.remove(), 2500);
}
