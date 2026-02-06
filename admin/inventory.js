import { db, collection, query, orderBy, onSnapshot } from './admin-core.js';

export function renderInventory(container) {
  container.innerHTML = `
    <h2 class="text-2xl font-bold mb-6 text-white fade-in">Stock & Inventaire</h2>

    <div class="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg fade-in">
      <table class="w-full text-left text-sm text-gray-400">
        <thead class="bg-gray-700 text-gray-200 uppercase text-xs">
          <tr>
            <th class="p-4">Produit</th>
            <th class="p-4 text-center">Stock</th>
            <th class="p-4 text-center">État</th>
            <th class="p-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody id="inventory-list" class="divide-y divide-gray-700"></tbody>
      </table>
    </div>
  `;

  const q = query(collection(db, "products"), orderBy("name"));

  onSnapshot(q, (snap) => {
    const list = document.getElementById("inventory-list");
    if (!list) return;

    list.innerHTML = "";

    snap.forEach((d) => {
      const p = d.data();
      const stock = p.stock || 0;

      list.innerHTML += `
        <tr class="hover:bg-gray-700/50 transition">

          <td class="p-4 flex items-center gap-3">
            <img src="${p.img || 'https://placehold.co/40'}"
                 class="w-8 h-8 rounded object-cover bg-gray-600">
            <span class="text-white">${p.name || ''}</span>
          </td>

          <td class="p-4 text-center font-mono font-bold ${
            stock < 10 ? 'text-red-500' : 'text-white'
          }">
            ${stock}
          </td>

          <td class="p-4 text-center">
  ${
    stock < 10
      ? `<span class="text-red-400 font-bold text-xs bg-red-900/20 px-2 py-1 rounded">FAIBLE</span>`
      : `<span class="text-green-400 font-bold text-xs">OK</span>`
  }
</td>

          <td class="p-4 text-center">
            <div class="flex gap-3 justify-center">
              <button
                onclick="openEditProductModal('${d.id}')"
                class="text-blue-400 hover:text-blue-600 text-lg"
                title="Modifier">
                ✏️
              </button>

              <button
                onclick="deleteProduct('${d.id}')"
                class="text-red-400 hover:text-red-600 text-lg"
                title="Supprimer">
                🗑️
              </button>
            </div>
          </td>

        </tr>
      `;
    });
  });
}
