/**
 * NEXTRA ADMIN LOGIC
 * Connects to existing Firebase Config
 */
import { db, storage, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where, ref, uploadBytes, getDownloadURL } from "../core/data.js";

// --- GLOBAL UTILS ---
const formatCurrency = (num) => parseFloat(num).toFixed(2) + ' DT';
const currentPage = window.location.pathname.split("/").pop();

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("Nextra Admin Init on: " + currentPage);

    if (currentPage.includes('dashboard.html')) initDashboard();
    if (currentPage.includes('orders.html')) initOrders();
    if (currentPage.includes('menu-editor.html')) initMenuEditor();
    if (currentPage.includes('inventory.html')) initMenuEditor(); // Inventory utilise la même logique que menu pour simplifier ici
});

// ==========================================================
// 1. DASHBOARD ANALYTICS LOGIC
// ==========================================================
function initDashboard() {
    // Écoute temps réel des commandes pour les stats
    const q = query(collection(db, "orders")); // Tu peux ajouter un filtre de date ici
    
    onSnapshot(q, (snapshot) => {
        let totalRevenue = 0;
        let totalOrders = 0;
        let pending = 0;
        let activityHTML = '';

        snapshot.forEach(doc => {
            const data = doc.data();
            totalRevenue += parseFloat(data.total) || 0;
            totalOrders++;
            if(data.status === 'pending') pending++;

            // Générer le log d'activité (5 derniers)
            const date = data.timestamp ? data.timestamp.toDate().toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'}) : '--:--';
            activityHTML += `
                <tr class="hover:bg-white/5 transition-colors">
                    <td class="p-4 text-white">${date}</td>
                    <td class="p-4"><span class="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold">Commande</span></td>
                    <td class="p-4 text-white">${formatCurrency(data.total)} - ${data.type}</td>
                    <td class="p-4"><span class="text-xs uppercase ${getStatusColor(data.status)}">${data.status}</span></td>
                </tr>
            `;
        });

        // Update DOM
        document.getElementById('stat-revenue').innerText = formatCurrency(totalRevenue);
        document.getElementById('stat-orders').innerText = totalOrders;
        document.getElementById('stat-pending').innerText = pending;
        document.getElementById('stat-profit').innerText = formatCurrency(totalRevenue * 0.65); // Simulation profit
        
        // On ne garde que les 5 premiers pour l'activité
        document.getElementById('activity-log').innerHTML = activityHTML.split('</tr>').slice(0, 5).join('</tr>');
    });
}

// ==========================================================
// 2. ORDERS MANAGEMENT LOGIC (KDS)
// ==========================================================
function initOrders() {
    const q = query(collection(db, "orders"), orderBy("timestamp", "desc"));
    
    onSnapshot(q, (snapshot) => {
        const lists = {
            pending: document.getElementById('list-pending'),
            preparing: document.getElementById('list-preparing'),
            completed: document.getElementById('list-completed')
        };
        const counts = { pending: 0, preparing: 0, completed: 0 };

        // Reset lists
        Object.values(lists).forEach(el => el.innerHTML = '');

        snapshot.forEach(docSnap => {
            const order = { id: docSnap.id, ...docSnap.data() };
            const statusKey = order.status === 'done' ? 'completed' : order.status; // map 'done' to 'completed' list
            
            if (lists[statusKey]) {
                counts[statusKey]++;
                lists[statusKey].innerHTML += createOrderCard(order);
            }
        });

        // Update counters
        document.getElementById('count-pending').innerText = counts.pending;
        document.getElementById('count-preparing').innerText = counts.preparing;
        document.getElementById('count-done').innerText = counts.completed;
    });

    // Expose actions to global scope for HTML onclick
    window.updateOrderStatus = async (id, status) => {
        try {
            await updateDoc(doc(db, "orders", id), { status: status });
        } catch(e) { console.error("Error updating order:", e); }
    };
}

function createOrderCard(order) {
    const time = order.timestamp ? order.timestamp.toDate().toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'}) : 'Now';
    const itemsList = order.items.map(i => `<div class="flex justify-between text-sm text-gray-300"><span>${i.qty}x ${i.name}</span></div>`).join('');
    
    let actions = '';
    if(order.status === 'pending') {
        actions = `<button onclick="updateOrderStatus('${order.id}', 'preparing')" class="flex-1 bg-primary text-black font-bold py-2 rounded text-xs hover:bg-primary-hover">CUISINER</button>`;
    } else if (order.status === 'preparing') {
        actions = `<button onclick="updateOrderStatus('${order.id}', 'completed')" class="flex-1 bg-green-500 text-white font-bold py-2 rounded text-xs hover:bg-green-600">PRÊT</button>`;
    }

    return `
    <div class="bg-bg-dark border border-border-color rounded-lg p-4 shadow-lg animate-fade-in">
        <div class="flex justify-between items-start mb-3 border-b border-white/5 pb-2">
            <div>
                <span class="text-xs text-primary font-bold">#${order.orderId || 'ID'}</span>
                <div class="text-lg font-bold text-white">${time}</div>
            </div>
            <div class="text-right">
                <div class="text-xs bg-white/10 px-2 py-1 rounded text-gray-300 mb-1">${order.type}</div>
                <div class="text-xs text-gray-500">${order.table ? 'Table ' + order.table : ''}</div>
            </div>
        </div>
        <div class="space-y-1 mb-4 border-b border-white/5 pb-3">
            ${itemsList}
        </div>
        <div class="flex justify-between items-center mb-3">
            <span class="text-gray-500 text-xs">Total</span>
            <span class="font-bold text-primary">${formatCurrency(order.total)}</span>
        </div>
        <div class="flex gap-2">
            ${actions}
        </div>
    </div>`;
}

// ==========================================================
// 3. MENU EDITOR LOGIC
// ==========================================================
function initMenuEditor() {
    const tableBody = document.getElementById('menu-table-body');
    
    // Listen to products
    onSnapshot(query(collection(db, "products"), orderBy("name")), (snap) => {
        tableBody.innerHTML = '';
        snap.forEach(docSnap => {
            const p = { id: docSnap.id, ...docSnap.data() };
            tableBody.innerHTML += `
            <tr class="hover:bg-white/5 group transition-colors border-b border-white/5 last:border-0">
                <td class="p-4"><img src="${p.img}" class="w-12 h-12 rounded-lg object-cover border border-white/10"></td>
                <td class="p-4 font-bold text-white">${p.name}</td>
                <td class="p-4"><span class="px-2 py-1 rounded bg-white/5 text-xs">${p.cat}</span></td>
                <td class="p-4 text-primary font-mono">${formatCurrency(p.price)}</td>
                <td class="p-4 text-sm ${p.stock < 10 ? 'text-red-500 font-bold' : 'text-gray-400'}">${p.stock || '∞'}</td>
                <td class="p-4">
                    <button onclick="toggleActive('${p.id}', ${p.active})" class="w-8 h-4 rounded-full ${p.active ? 'bg-green-500' : 'bg-gray-700'} relative transition-colors">
                        <span class="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${p.active ? 'translate-x-4' : ''}"></span>
                    </button>
                </td>
                <td class="p-4 text-right">
                    <button onclick='editProduct(${JSON.stringify(p)})' class="text-gray-500 hover:text-white mr-2"><span class="material-symbols-outlined">edit</span></button>
                    <button onclick="deleteProduct('${p.id}')" class="text-gray-500 hover:text-red-500"><span class="material-symbols-outlined">delete</span></button>
                </td>
            </tr>`;
        });
    });

    // Form Submit Handler
    document.getElementById('product-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('prod-id').value;
        const file = document.getElementById('prod-img-file').files[0];
        let imgUrl = document.getElementById('prod-img').value;

        // Upload Logic (Simulée ou réelle si storage configuré)
        if (file && storage) {
            try {
                const storageRef = ref(storage, `menu/${Date.now()}_${file.name}`);
                await uploadBytes(storageRef, file);
                imgUrl = await getDownloadURL(storageRef);
            } catch(err) {
                console.error("Upload error:", err);
                alert("Erreur upload image (Vérifiez config Storage)");
            }
        } else if (!imgUrl) {
            imgUrl = 'https://placehold.co/400x400?text=No+Image';
        }

        const data = {
            name: document.getElementById('prod-name').value,
            price: parseFloat(document.getElementById('prod-price').value),
            cat: document.getElementById('prod-cat').value,
            img: imgUrl,
            stock: parseInt(document.getElementById('prod-stock').value) || 0,
            active: document.getElementById('prod-active').checked
        };

        try {
            if(id) await updateDoc(doc(db, "products", id), data);
            else await addDoc(collection(db, "products"), data);
            closeProductModal();
        } catch(err) { console.error(err); alert("Erreur sauvegarde"); }
    });

    // Global Exposures
    window.openProductModal = () => {
        document.getElementById('product-form').reset();
        document.getElementById('prod-id').value = '';
        document.getElementById('modal-title').innerText = 'Nouveau Produit';
        document.getElementById('product-modal').classList.remove('hidden');
    };
    window.closeProductModal = () => document.getElementById('product-modal').classList.add('hidden');
    
    window.editProduct = (p) => {
        document.getElementById('prod-id').value = p.id;
        document.getElementById('prod-name').value = p.name;
        document.getElementById('prod-price').value = p.price;
        document.getElementById('prod-cat').value = p.cat;
        document.getElementById('prod-img').value = p.img;
        document.getElementById('prod-stock').value = p.stock || 0;
        document.getElementById('prod-active').checked = p.active;
        document.getElementById('modal-title').innerText = 'Modifier Produit';
        document.getElementById('product-modal').classList.remove('hidden');
    };

    window.deleteProduct = async (id) => {
        if(confirm('Supprimer ce produit ?')) await deleteDoc(doc(db, "products", id));
    };

    window.toggleActive = async (id, current) => {
        await updateDoc(doc(db, "products", id), { active: !current });
    };
}

// Utils helper
function getStatusColor(status) {
    if(status === 'completed' || status === 'done') return 'text-green-500';
    if(status === 'preparing') return 'text-orange-500';
    return 'text-red-500';
}

window.logout = () => {
    // Implementer logique logout simple
    window.location.href = '../index.html';
};