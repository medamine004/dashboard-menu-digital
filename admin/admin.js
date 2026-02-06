
import { renderDashboard } from './dashboard.js';
import { renderOrders } from './orders.js';
import { renderInventory } from './inventory.js';
import { renderReports } from './reports.js';
import { renderSettings } from './settings.js';

// === Sidebar Toggle (GLOBAL) ===
window.toggleSidebar = () => {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  sidebar.classList.toggle('-translate-x-full');
};

// Configuration API Image
const IMGBB_API_KEY = "daad728bfd5bc5f2739a9612b27c1410"; 

// --- 1. INITIALISATION & AUTH ---
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("✅ Admin connecté:", user.email);
            switchTab('dashboard');
        } else {
            console.warn("⚠️ Aucun user : Mode Fallback (Test) activé");
            // En production, décommente la ligne suivante :
            // window.location.href = "login.html"; 
            switchTab('dashboard'); // Force l'accès pour le test
        }
    });
});

// --- 2. ROUTEUR SPA (SwitchTab) ---
window.switchTab = (tabName) => {
    const container = document.getElementById('page-content');
    
    // Fermer sidebar mobile
    if(window.innerWidth < 1024) toggleSidebar(false);

    // Update UI Sidebar Buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        if(btn.innerText.toLowerCase().includes(tabName.replace('menu', 'menu editor'))) {
            btn.classList.add('bg-gray-700', 'text-white');
            btn.classList.remove('text-gray-300');
        } else {
            btn.classList.remove('bg-gray-700', 'text-white');
            btn.classList.add('text-gray-300');
        }
    });

    // Loader temporaire
    container.innerHTML = `<div class="loader-container"><i class="fa-solid fa-circle-notch fa-spin text-4xl"></i></div>`;

    // Chargement dynamique
    setTimeout(() => {
        switch(tabName) {
            case 'dashboard': renderDashboard(container); break;
            case 'orders': renderOrders(container); break;
            case 'menu': renderMenuEditor(container); break; // Logique interne
            case 'inventory': renderInventory(container); break;
            case 'reports': renderReports(container); break;
            case 'settings': renderSettings(container); break;
            default: renderDashboard(container);
        }
    }, 50);
};

// --- 3. UI GLOBALE ---
window.toggleSidebar = (forceState = null) => {
    const sb = document.getElementById('sidebar');
    const ol = document.getElementById('mobile-overlay');
    
    if (forceState === false) {
        sb.classList.add('-translate-x-full');
        ol.classList.add('hidden');
    } else {
        sb.classList.toggle('-translate-x-full');
        ol.classList.toggle('hidden');
    }
};

window.handleLogout = async () => {
    if(confirm("Se déconnecter ?")) {
        await signOut(auth);
        window.location.href = "login.html"; // Redirection simple
    }
};

// --- 4. LOGIQUE MENU EDITOR (Intégrée ici) ---
function renderMenuEditor(container) {
    container.innerHTML = `
        <div class="flex justify-between items-center mb-6 fade-in">
            <h2 class="text-2xl font-bold text-white">Menu Editor</h2>
            <button onclick="window.openProductModal()" class="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition shadow">
                <i class="fa-solid fa-plus"></i> Ajouter Produit
            </button>
        </div>
        <div id="menu-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
            </div>
    `;

    const q = query(collection(db, "products"), orderBy("name"));
    onSnapshot(q, (snapshot) => {
        const grid = document.getElementById('menu-grid');
        if(!grid) return;
        grid.innerHTML = '';

        if(snapshot.empty) {
            grid.innerHTML = `<div class="text-gray-500 col-span-full text-center py-10">Aucun produit trouvé.</div>`;
            return;
        }

        snapshot.forEach(docSnap => {
            const p = { id: docSnap.id, ...docSnap.data() };
            grid.innerHTML += `
                <div class="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 group relative shadow-lg fade-in">
                    <img src="${p.img || 'https://placehold.co/300'}" class="w-full h-48 object-cover">
                    <div class="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition duration-300">
                        <button onclick="window.openProductModal('${p.id}', '${p.name}', '${p.price}', '${p.cat}', '${p.img}')" class="bg-blue-600 text-white p-2 rounded shadow hover:bg-blue-500"><i class="fa-solid fa-pen"></i></button>
                        <button onclick="window.deleteProduct('${p.id}')" class="bg-red-600 text-white p-2 rounded shadow hover:bg-red-500"><i class="fa-solid fa-trash"></i></button>
                    </div>
                    <div class="p-4">
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="font-bold text-lg text-white truncate w-3/4">${p.name}</h3>
                            <span class="text-yellow-400 font-mono font-bold">${parseFloat(p.price).toFixed(1)} DT</span>
                        </div>
                        <div class="flex justify-between items-center mt-3">
                            <span class="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">${p.cat}</span>
                            <button onclick="window.toggleProductActive('${p.id}', ${p.active})" class="text-xs px-2 py-1 rounded font-bold cursor-pointer ${p.active ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}">
                                ${p.active ? 'ACTIF' : 'INACTIF'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
    });
}

// Modal Logic & ImgBB
window.openProductModal = (id = '', name = '', price = '', cat = 'Plats', img = '') => {
    const modal = document.getElementById('modal-container');
    modal.classList.remove('hidden');
    modal.innerHTML = `
        <div class="bg-gray-900 border border-gray-700 p-6 rounded-xl w-full max-w-md relative shadow-2xl fade-in">
            <h3 class="text-xl font-bold mb-4 text-white">${id ? 'Modifier' : 'Ajouter'} Produit</h3>
            <form id="product-form" class="space-y-4">
                <input type="hidden" id="p-id" value="${id}">
                <input type="hidden" id="p-current-img" value="${img}">
                
                <div><label class="text-xs text-gray-400">Nom</label><input type="text" id="p-name" value="${name}" class="w-full bg-gray-800 border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none" required></div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div><label class="text-xs text-gray-400">Prix</label><input type="number" step="0.5" id="p-price" value="${price}" class="w-full bg-gray-800 border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none" required></div>
                    <div><label class="text-xs text-gray-400">Catégorie</label>
                       <input 
  type="text"
  id="p-cat"
  value="${cat}"
  placeholder="Ex: Pizzas, Vegan, Spécialité maison..."
  class="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none"
/>
                    </div>
                </div>

                <div><label class="text-xs text-gray-400">Image</label><input type="file" id="p-file" accept="image/*" class="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:bg-gray-800 file:text-white hover:file:bg-gray-700"></div>

                <div class="flex gap-2 pt-2">
                    <button type="button" onclick="document.getElementById('modal-container').classList.add('hidden')" class="flex-1 bg-gray-700 py-2 rounded text-white">Annuler</button>
                    <button type="submit" id="btn-save" class="flex-1 bg-yellow-500 text-black py-2 rounded font-bold hover:bg-yellow-600">Enregistrer</button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('product-form').onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-save');
        btn.innerText = "Traitement..."; btn.disabled = true;

        try {
            const file = document.getElementById('p-file').files[0];
            let imgUrl = document.getElementById('p-current-img').value;

            if (file) {
                btn.innerText = "Upload...";
                const formData = new FormData();
                formData.append("image", file);
                const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: formData });
                const data = await res.json();
                if (data.success) imgUrl = data.data.url;
            } else if (!imgUrl) {
                imgUrl = 'https://placehold.co/300?text=No+Image';
            }

            const data = {
                name: document.getElementById('p-name').value,
                price: parseFloat(document.getElementById('p-price').value),
                cat: document.getElementById('p-cat').value,
                img: imgUrl, active: true, stock: 50 // Stock par défaut
            };

            const pid = document.getElementById('p-id').value;
            if (pid) await updateDoc(doc(db, "products", pid), data);
            else await addDoc(collection(db, "products"), data);

            document.getElementById('modal-container').classList.add('hidden');
        } catch(err) { 
            alert(err.message); 
        } finally { 
            btn.disabled = false; 
        }
    };
};

window.deleteProduct = async (id) => { 
    if(confirm("Supprimer ce produit ?")) await deleteDoc(doc(db, "products", id)); 
};

window.toggleProductActive = async (id, current) => { 
    await updateDoc(doc(db, "products", id), { active: !current }); 
};
