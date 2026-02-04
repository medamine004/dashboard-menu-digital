import { db, collection, query, onSnapshot, orderBy } from "../../core/data.js";

document.addEventListener('DOMContentLoaded', () => {
    const q = query(collection(db, "products"), orderBy("name"));
    const tbody = document.getElementById('inventory-table-body');
    const alerts = document.getElementById('stock-alerts');

    onSnapshot(q, (snapshot) => {
        tbody.innerHTML = '';
        alerts.innerHTML = '';
        let hasAlert = false;

        snapshot.forEach(doc => {
            const p = doc.data();
            // Si le champ 'stock' n'existe pas, on suppose 0 ou infini selon ta logique. Ici on simule 50 par défaut.
            const stock = p.stock !== undefined ? p.stock : 50; 
            const consumption = Math.floor(Math.random() * 20); // Simulation sans collection historique complexe

            let status = '<span class="text-green-500">OK</span>';
            if(stock < 10) {
                status = '<span class="text-red-500 font-bold animate-pulse">CRITIQUE</span>';
                alerts.innerHTML += `
                    <div class="bg-red-500/10 border border-red-500/50 p-4 rounded-lg flex items-center gap-3 text-red-500">
                        <span class="material-symbols-outlined">warning</span>
                        Stock faible pour : <strong>${p.name}</strong> (${stock} restants)
                    </div>`;
                hasAlert = true;
            } else if (stock < 20) {
                status = '<span class="text-yellow-500">FAIBLE</span>';
            }

            tbody.innerHTML += `
            <tr class="hover:bg-white/5 border-b border-white/5 last:border-0">
                <td class="p-4 font-bold text-white flex items-center gap-3">
                    <img src="${p.img}" class="w-8 h-8 rounded object-cover"> ${p.name}
                </td>
                <td class="p-4 text-gray-400">${p.cat}</td>
                <td class="p-4 text-center font-mono text-white">${stock}</td>
                <td class="p-4 text-center text-gray-500">-${consumption}</td>
                <td class="p-4 text-center text-xs font-bold uppercase">${status}</td>
                <td class="p-4 text-right">
                    <button class="text-primary hover:text-white text-xs underline">Commander</button>
                </td>
            </tr>`;
        });
        
        if(!hasAlert) alerts.innerHTML = ''; // Clear if resolved
    });
});