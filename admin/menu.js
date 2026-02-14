import { db, collection, addDoc, updateDoc, deleteDoc, doc, getDoc, query, orderBy, onSnapshot } from './admin-core.js';

// ⚠️ TA CLÉ IMGBB
const IMGBB_API_KEY = "daad728bfd5bc5f2739a9612b27c1410";

// --- RENDER MENU ---
export function renderMenu(container) {
    container.innerHTML = `
        <div class="flex justify-between items-center mb-8 fade-in">
            <div>
                <h2 class="text-3xl font-bold text-white tracking-tight">Menu Editor</h2>
                <p class="text-gray-400 text-sm mt-1">Gérez votre carte, prix et visibilité.</p>
            </div>
            <button onclick="window.openProductModal()" class="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-yellow-500/20 transition hover:scale-105">
                <i class="fa-solid fa-plus"></i> Ajouter un plat
            </button>
        </div>
        
        <div id="menu-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
            </div>
    `;

    // Écouteur Temps Réel
    const q = query(collection(db, "products"), orderBy("category"));
    onSnapshot(q, (snapshot) => {
        const grid = document.getElementById('menu-grid');
        const datalist = document.getElementById('category-suggestions');
        
        if (!grid) return;
        grid.innerHTML = '';
        
        // Pour stocker les catégories uniques
        const categories = new Set();

        if (snapshot.empty) {
            grid.innerHTML = `<div class="col-span-full text-center py-20 text-gray-500">Aucun produit dans le menu.</div>`;
            return;
        }

        snapshot.forEach(docSnap => {
            const p = { id: docSnap.id, ...docSnap.data() };
            if(p.category) categories.add(p.category);

            // Logique Visibilité
            const isHidden = p.hidden === true;
            const hiddenClass = isHidden ? 'product-hidden' : '';
            const eyeIcon = isHidden ? 'fa-eye-slash' : 'fa-eye';
            const hiddenBadge = isHidden ? `<span class="badge-hidden"><i class="fa-solid fa-eye-slash"></i> Masqué</span>` : '';

            grid.innerHTML += `
                <div class="bg-gray-800 rounded-2xl overflow-hidden relative group product-card ${hiddenClass} fade-in">
                    
                    <div class="h-48 overflow-hidden relative">
                        <img src="${p.img || 'https://placehold.co/400?text=No+Image'}" class="w-full h-full object-cover transition duration-500 group-hover:scale-110">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60"></div>
                        
                        <div class="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-[-10px] group-hover:translate-y-0">
                            <button onclick="window.toggleVisibility('${p.id}', ${isHidden})" class="action-btn visibility" title="${isHidden ? 'Afficher' : 'Masquer'}">
                                <i class="fa-solid ${eyeIcon}"></i>
                            </button>
                            <button onclick="window.openProductModal('${p.id}')" class="action-btn edit" title="Modifier">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button onclick="window.deleteProduct('${p.id}')" class="action-btn delete" title="Supprimer">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>

                        <span class="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide border border-white/10">
                            ${p.category || 'Non classé'}
                        </span>
                    </div>

                    <div class="p-5">
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="font-bold text-lg text-white leading-tight">${p.name}</h3>
                            <span class="text-yellow-400 font-mono font-bold text-lg">${parseFloat(p.price).toFixed(1)} <span class="text-xs">DT</span></span>
                        </div>
                        <div class="flex justify-between items-center mt-4">
                            ${hiddenBadge}
                            ${!isHidden ? '<span></span>' : ''} 
                            <span class="text-xs text-gray-500 font-mono">ID: ${p.id.slice(0, 4)}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        // Remplir la datalist pour les suggestions de catégorie
        if(datalist) {
            datalist.innerHTML = Array.from(categories).map(cat => `<option value="${cat}">`).join('');
        }
    });
}

// --- LOGIQUE MODAL (ADD & EDIT) ---
window.openProductModal = async (id = null) => {
    const modal = document.getElementById('modal-container');
    const form = document.getElementById('product-form');
    const title = document.getElementById('modal-title');
    const preview = document.getElementById('p-preview');

    // Reset du formulaire
    form.reset();
    document.getElementById('p-id').value = '';
    document.getElementById('p-current-img').value = '';
    document.getElementById('p-hidden-state').value = 'false';
    preview.src = 'https://placehold.co/100?text=Aperçu';

    if (id) {
        // --- MODE ÉDITION ---
        title.innerText = "Modifier le Produit";
        
        // Récupération des données fraîches
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('p-id').value = id;
            document.getElementById('p-name').value = data.name;
            document.getElementById('p-price').value = data.price;
            document.getElementById('p-cat').value = data.category;
            document.getElementById('p-current-img').value = data.img;
            document.getElementById('p-hidden-state').value = data.hidden || false;
            preview.src = data.img || 'https://placehold.co/100?text=No+Image';
        }
    } else {
        // --- MODE AJOUT ---
        title.innerText = "Nouveau Produit";
    }

    modal.classList.remove('hidden');

    // Gestion de la preview image locale
    document.getElementById('p-file').onchange = (e) => {
        const file = e.target.files[0];
        if (file) preview.src = URL.createObjectURL(file);
    };

    // Gestion du Submit
    form.onsubmit = handleSaveProduct;
};

// --- SAUVEGARDE (CREATE / UPDATE) ---
async function handleSaveProduct(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-save');
    const originalText = btn.innerHTML;
    
    try {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Traitement...`;

        const id = document.getElementById('p-id').value;
        const fileInput = document.getElementById('p-file');
        const file = fileInput.files[0];
        let imgUrl = document.getElementById('p-current-img').value;

        // 1. Upload ImgBB UNIQUEMENT si une nouvelle image est sélectionnée
        if (file) {
            btn.innerHTML = `<i class="fa-solid fa-cloud-upload"></i> Upload Image...`;
            const formData = new FormData();
            formData.append("image", file);
            
            const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { 
                method: "POST", 
                body: formData 
            });
            const data = await res.json();
            
            if (data.success) {
                imgUrl = data.data.url;
            } else {
                throw new Error("Échec upload image ImgBB");
            }
        } else if (!imgUrl) {
            // Si pas de nouvelle image ET pas d'ancienne image -> Placeholder
            imgUrl = 'https://placehold.co/400?text=Menu';
        }

        // 2. Préparation des données
        const productData = {
            name: document.getElementById('p-name').value.trim(),
            price: parseFloat(document.getElementById('p-price').value),
            category: document.getElementById('p-cat').value.trim(), // Catégorie libre
            img: imgUrl,
            // On conserve l'état hidden s'il existe, sinon false par défaut
            hidden: document.getElementById('p-hidden-state').value === 'true'
        };

        // 3. Envoi Firestore
        if (id) {
            await updateDoc(doc(db, "products", id), productData);
        } else {
            await addDoc(collection(db, "products"), productData);
        }

        // 4. Fermeture & Reset
        document.getElementById('modal-container').classList.add('hidden');
        
    } catch (error) {
        console.error(error);
        alert("Erreur : " + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// --- SUPPRESSION ---
window.deleteProduct = async (id) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce produit définitivement ?")) {
        try {
            await deleteDoc(doc(db, "products", id));
        } catch (e) {
            alert("Erreur suppression: " + e.message);
        }
    }
};

// --- VISIBILITÉ (HIDE/SHOW) ---
window.toggleVisibility = async (id, currentHiddenState) => {
    try {
        await updateDoc(doc(db, "products", id), { 
            hidden: !currentHiddenState 
        });
    } catch (e) {
        console.error("Erreur visibilité:", e);
    }
};
