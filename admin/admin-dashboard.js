/**
 * NEXTRA ADMIN DASHBOARD - LOGIQUE UNIFIÉE
 * Gère Firebase, Auth, Navigation et Données
 */

// Import de la config existante (Adapter le chemin si nécessaire)
import { db, collection, query, onSnapshot, orderBy, addDoc, updateDoc, deleteDoc, doc, getDocs } from "../../core/data.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const auth = getAuth();
const currentPage = window.location.pathname.split("/").pop();

// --- AUTH & LOGOUT ---
document.addEventListener('DOMContentLoaded', () => {
    // Vérif Auth
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            // Redirection relative pour GitHub Pages
            window.location.href = '../login.html'; 
        } else {
            initPageLogic();
        }
    });

    // Fonction Logout globale
    window.logout = async () => {
        try {
            await signOut(auth);
            window.location.href = '../login.html';
        } catch (error) {
            console.error("Erreur logout", error);
            alert("Erreur lors de la déconnexion");
        }
    };
});

// --- ROUTEUR LOGIQUE ---
function initPageLogic() {
    console.log("Init Page:", currentPage);
    
    if (currentPage.includes('dashboard') || currentPage === '') initDashboard();
    if (currentPage.includes('orders')) initOrders();
    if (currentPage.includes('menu-editor')) initMenuEditor();
    if (currentPage.includes('inventory')) initInventory();
    if (currentPage.includes('reports')) initReports();
}

// --- 1. DASHBOARD ANALYTICS ---
function initDashboard() {
    const q = query(collection(db, "orders"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snap) => {
        let revenue = 0, active = 0, completed = 0, activityHTML = '';
        
        snap.forEach(doc => {
            const d = doc.data();
            // Stats
            if (d.status !== 'cancelled') revenue += parseFloat(d.total) || 0;
            if (['pending', 'preparing'].includes(d.status)) active++;
            
            // Logs (5 derniers)
            if(activityHTML.split('</tr>').length < 6) {
                const time = d.timestamp ? d.timestamp.toDate().toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'}) : '--:--';
                activityHTML += `
                <tr class="border-b border-white/5 last:border-0">
                    <td class="py-3 px-1 text-gray-300">${time}</td>
                    <td class="py-3 px-1 text-white font-bold">${d.total} DT</td>
                    <td class="py-3 px-1"><span class="text-xs uppercase ${d.status === 'completed' ? 'text-green-500' : 'text-primary'}">${d.status}</span></td>
                </tr>`;
            }
        });

        document.getElementById('stat-revenue').innerText = revenue.toFixed(2) + ' DT';
        document.getElementById('stat-active').innerText = active;
        document.getElementById('stat-profit').innerText = (revenue * 0.35).toFixed(2) + ' DT'; // Est. 35% marge
        document.getElementById('activity-log').innerHTML = activityHTML;
        
        // Graphique Simple
        renderChart('revenueChart', [revenue * 0.1, revenue * 0.2, revenue * 0.5, revenue * 0.8, revenue]);
    });
}

// --- 2. COMMANDES (KANBAN) ---
function initOrders() {
    const q = query(collection(db, "orders"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snap) => {
        const lists = { pending: document.getElementById('list-pending'), preparing: document.getElementById('list-preparing'), completed: document.getElementById('list-completed') };
        Object.values(lists).forEach(el => el ? el.innerHTML = '' : null);
        
        const counts = { pending: 0, preparing: 0, completed: 0 };

        snap.forEach(docSnap => {
            const order = { id: docSnap.id, ...docSnap.data() };
            const status = order.status === 'done' ? 'completed' : order.status; // Map 'done' -> 'completed'
            
            if (lists[status]) {
                counts[status]++;
                lists[status].innerHTML += `
                <div class="bg-surface p-3 rounded-lg border border-white/10 mb-2">
                    <div class="flex justify-between text-xs text-gray-500 mb-2">
                        <span>#${order.orderId || 'ID'}</span>
                        <span>${order.timestamp ? order.timestamp.toDate().toLocaleTimeString() : ''}</span>
                    </div>
                    <div class="text-white font-bold mb-2">${order.items.map(i=> `${i.qty}x ${i.name}`).join(', ')}</div>
                    <div class="flex justify-between items-center mt-2">
                        <span class="text-primary font-mono">${order.total} DT</span>
                        ${status === 'pending' ? `<button onclick="updateStatus('${order.id}', 'preparing')" class="px-2 py-1 bg-primary text-black text-xs rounded font-bold">PRÉPARER</button>` : ''}
                        ${status === 'preparing' ? `<button onclick="updateStatus('${order.id}', 'completed')" class="px-2 py-1 bg-green-500 text-black text-xs rounded font-bold">TERMINER</button>` : ''}
                    </div>
                </div>`;
            }
        });

        // Update counts
        if(document.getElementById('count-pending')) document.getElementById('count-pending').innerText = counts.pending;
        if(document.getElementById('count-preparing')) document.getElementById('count-preparing').innerText = counts.preparing;
        if(document.getElementById('count-done')) document.getElementById('count-done').innerText = counts.completed;
    });

    window.updateStatus = async (id, st) => { await updateDoc(doc(db, "orders", id), { status: st }); };
}

// --- 3. MENU EDITOR ---
function initMenuEditor() {
    const tbody = document.getElementById('menu-table-body');
    const q = query(collection(db, "products"), orderBy("name"));
    
    onSnapshot(q, (snap) => {
        tbody.innerHTML = '';
        snap.forEach(docSnap => {
            const p = { id: docSnap.id, ...docSnap.data() };
            tbody.innerHTML += `
            <tr class="hover:bg-white/5 border-b border-white/5">
                <td class="p-4 flex items-center gap-3">
                    <img src="${p.img}" class="w-8 h-8 rounded object-cover bg-gray-800"> <span class="text-white font-medium">${p.name}</span>
                </td>
                <td class="p-4 text-primary">${p.price} DT</td>
                <td class="p-4 text-gray-400 text-xs uppercase">${p.cat}</td>
                <td class="p-4"><span class="w-2 h-2 rounded-full inline-block ${p.active ? 'bg-green-500' : 'bg-red-500'}"></span></td>
                <td class="p-4 text-right">
                    <button onclick='editProduct(${JSON.stringify(p)})' class="text-gray-400 hover:text-white mr-2"><span class="material-symbols-outlined text-sm">edit</span></button>
                    <button onclick="deleteProduct('${p.id}')" class="text-red-500/50 hover:text-red-500"><span class="material-symbols-outlined text-sm">delete</span></button>
                </td>
            </tr>`;
        });
    });

    // Modal Logic
    const form = document.getElementById('product-form');
    const modal = document.getElementById('product-modal');
    
    window.openProductModal = () => { form.reset(); document.getElementById('prod-id').value=''; modal.classList.remove('hidden'); }
    window.closeProductModal = () => { modal.classList.add('hidden'); }
    
    window.editProduct = (p) => {
        document.getElementById('prod-id').value = p.id;
        document.getElementById('prod-name').value = p.name;
        document.getElementById('prod-price').value = p.price;
        document.getElementById('prod-cat').value = p.cat;
        document.getElementById('prod-img').value = p.img;
        document.getElementById('prod-active').checked = p.active;
        modal.classList.remove('hidden');
    }

    window.deleteProduct = async (id) => { if(confirm("Supprimer ?")) await deleteDoc(doc(db, "products", id)); }
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('prod-id').value;
        const data = {
            name: document.getElementById('prod-name').value,
            price: parseFloat(document.getElementById('prod-price').value),
            cat: document.getElementById('prod-cat').value,
            img: document.getElementById('prod-img').value,
            active: document.getElementById('prod-active').checked,
            stock: 50 // Default
        };
        if(id) await updateDoc(doc(db, "products", id), data);
        else await addDoc(collection(db, "products"), data);
        closeProductModal();
    });
}

// --- 4. INVENTORY ---
function initInventory() {
    const tbody = document.getElementById('inventory-table-body');
    const alerts = document.getElementById('stock-alerts');
    
    onSnapshot(query(collection(db, "products")), (snap) => {
        tbody.innerHTML = ''; alerts.innerHTML = '';
        
        snap.forEach(doc => {
            const p = doc.data();
            const stock = p.stock || 0; // Default if missing
            let status = stock < 10 ? '<span class="text-red-500 font-bold">CRITIQUE</span>' : '<span class="text-green-500">OK</span>';
            
            if(stock < 10) {
                alerts.innerHTML += `<div class="bg-red-500/10 border border-red-500/30 text-red-500 p-3 rounded text-sm mb-2">Stock faible: <strong>${p.name}</strong> (${stock})</div>`;
            }

            tbody.innerHTML += `
            <tr class="border-b border-white/5">
                <td class="p-4 text-white">${p.name}</td>
                <td class="p-4 text-center font-mono text-gray-300">${stock}</td>
                <td class="p-4 text-center text-xs">${status}</td>
            </tr>`;
        });
    });
}

// --- 5. REPORTS ---
async function initReports() {
    const snap = await getDocs(collection(db, "orders"));
    let total = 0, count = 0;
    snap.forEach(d => { total += parseFloat(d.data().total) || 0; count++; });
    
    document.getElementById('report-total').innerText = count;
    document.getElementById('report-avg').innerText = (count ? (total/count).toFixed(2) : 0) + ' DT';
    renderChart('monthlyChart', [total*0.1, total*0.3, total*0.6, total]);
}

// Helper Graphique
function renderChart(id, data) {
    const ctx = document.getElementById(id);
    if(ctx) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['S1', 'S2', 'S3', 'S4'],
                datasets: [{ label: 'Ventes', data: data, borderColor: '#D4AF37', backgroundColor: 'rgba(212, 175, 55, 0.1)', fill: true }]
            },
            options: { plugins: { legend: { display: false } }, scales: { y: { grid: { color: '#333' } }, x: { grid: { display: false } } } }
        });
    }
}
