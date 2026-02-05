import { db, collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot } from './admin-core.js';

// ⚠️ TA CLÉ IMGBB
const IMGBB_API_KEY = "daad728bfd5bc5f2739a9612b27c1410";

// --- RENDER PAGE ---
export function renderMenu(container) {
    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-white">Menu Editor</h2>
            <button onclick="window.openProductModal()" class="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg transition">
                <i class="fa-solid fa-plus"></i> Ajouter Produit
            </button>
        </div>
        <div id="menu-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            </div>
    `;

    const q = query(collection(db, "products"), orderBy("name"));
    onSnapshot(q, (snapshot) => {
        const grid = document.getElementById('menu-grid');
        if (!grid) return;
        grid.innerHTML = '';

        snapshot.forEach(docSnap => {
            const p = { id: docSnap.id, ...docSnap.data() };
            grid.innerHTML += `
                <div class="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 group relative shadow-md">
                    <img src="${p.img || 'https://placehold.co/300'}" class="w-full h-48 object-cover">
                    <div class="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition duration-300">
                        <button onclick="window.openProductModal('${p.id}', '${p.name}', '${p.price}', '${p.cat}', '${p.img}')" class="bg-blue-600 text-white p-2 rounded shadow hover:bg-blue-500"><i class="fa-solid fa-pen"></i></button>
                        <button onclick="window.deleteProduct('${p.id}')" class="bg-red-600 text-white p-2 rounded shadow hover:bg-red-500"><i class="fa-solid fa-trash"></i></button>
                    </div>
                    <div class="p-4">
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="font-bold text-lg text-white">${p.name}</h3>
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

// --- LOGIQUE MODAL & UPLOAD ---
export function openProductModal(id = '', name = '', price = '', cat = 'Plats', img = '') {
    const modal = document.getElementById('modal-container');
    modal.classList.remove('hidden');
    modal.innerHTML = `
        <div class="bg-gray-900 border border-gray-700 p-6 rounded-xl w-full max-w-md relative shadow-2xl animate-[fadeIn_0.2s_ease-out]">
            <h3 class="text-xl font-bold mb-4 text-white">${id ? 'Modifier' : 'Ajouter'} Produit</h3>
            <form id="product-form" class="space-y-4">
                <input type="hidden" id="p-id" value="${id}">
                <input type="hidden" id="p-current-img" value="${img}">
                
                <input type="text" id="p-name" value="${name}" placeholder="Nom du produit" class="w-full bg-gray-800 border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none" required>
                
                <div class="grid grid-cols-2 gap-4">
                    <input type="number" step="0.5" id="p-price" value="${price}" placeholder="Prix" class="w-full bg-gray-800 border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none" required>
                    <select id="p-cat" class="w-full bg-gray-800 border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none">
                        <option value="Plats" ${cat === 'Plats' ? 'selected' : ''}>Plats</option>
                        <option value="Sandwichs" ${cat === 'Sandwichs' ? 'selected' : ''}>Sandwichs</option>
                        <option value="Boissons" ${cat === 'Boissons' ? 'selected' : ''}>Boissons</option>
                        <option value="Desserts" ${cat === 'Desserts' ? 'selected' : ''}>Desserts</option>
                    </select>
                </div>

                <div>
                    <label class="block text-xs text-gray-400 mb-1">Image</label>
                    <input type="file" id="p-file" accept="image/*" class="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-gray-800 file:text-white hover:file:bg-gray-700 cursor-pointer">
                </div>

                <div class="flex gap-2 pt-2">
                    <button type="button" onclick="document.getElementById('modal-container').classList.add('hidden')" class="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded font-bold transition">Annuler</button>
                    <button type="submit" id="btn-save" class="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black py-2 rounded font-bold transition">Enregistrer</button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('product-form').onsubmit = handleSaveProduct;
}

async function handleSaveProduct(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-save');
    const originalText = btn.innerText;
    
    try {
        btn.disabled = true;
        btn.innerText = "Traitement...";

        const id = document.getElementById('p-id').value;
        const file = document.getElementById('p-file').files[0];
        let imgUrl = document.getElementById('p-current-img').value;

        // Upload ImgBB si nouveau fichier
        if (file) {
            btn.innerText = "Upload Image...";
            const formData = new FormData();
            formData.append("image", file);
            const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: formData });
            const data = await res.json();
            if (data.success) {
                imgUrl = data.data.url;
            } else {
                throw new Error("Erreur Upload Image");
            }
        } else if (!imgUrl) {
            imgUrl = 'https://placehold.co/300?text=No+Image';
        }

        const productData = {
            name: document.getElementById('p-name').value,
            price: parseFloat(document.getElementById('p-price').value),
            cat: document.getElementById('p-cat').value,
            img: imgUrl,
            active: true,
            stock: 50 // Stock par défaut
        };

        if (id) {
            await updateDoc(doc(db, "products", id), productData);
        } else {
            await addDoc(collection(db, "products"), productData);
        }

        document.getElementById('modal-container').classList.add('hidden');
    } catch (error) {
        alert("Erreur : " + error.message);
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

export async function deleteProduct(id) {
    if (confirm("Supprimer ce produit ?")) {
        await deleteDoc(doc(db, "products", id));
    }
}

export async function toggleProductActive(id, currentState) {
    await updateDoc(doc(db, "products", id), { active: !currentState });
}