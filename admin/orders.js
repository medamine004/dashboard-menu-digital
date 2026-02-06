import { db, collection, query, orderBy, onSnapshot, doc, updateDoc } from './admin-core.js';

export function renderOrders(container) {
    container.innerHTML = `
        <h2 class="text-2xl font-bold mb-4 text-white fade-in">Suivi Commandes</h2>
        
        <div class="orders-grid-container grid grid-cols-1 md:grid-cols-3 gap-4 fade-in">
            
            <div class="bg-gray-800 rounded-xl border border-gray-700 flex flex-col h-full overflow-hidden">
                <div class="p-3 border-b border-gray-700 font-bold text-red-400 bg-red-900/10 flex justify-between items-center shrink-0">
                    <span>En Attente</span> 
                    <span id="cnt-pending" class="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">0</span>
                </div>
                <div id="list-pending" class="kanban-list p-3 space-y-3"></div>
            </div>

            <div class="bg-gray-800 rounded-xl border border-gray-700 flex flex-col h-full overflow-hidden">
                <div class="p-3 border-b border-gray-700 font-bold text-yellow-400 bg-yellow-900/10 flex justify-between items-center shrink-0">
                    <span>Préparation</span> 
                    <span id="cnt-preparing" class="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full">0</span>
                </div>
                <div id="list-preparing" class="kanban-list p-3 space-y-3"></div>
            </div>

            <div class="bg-gray-800 rounded-xl border border-gray-700 flex flex-col h-full overflow-hidden">
                <div class="p-3 border-b border-gray-700 font-bold text-green-400 bg-green-900/10 flex justify-between items-center shrink-0">
                    <span>Prêt / Servi</span> 
                    <span id="cnt-completed" class="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">0</span>
                </div>
                <div id="list-completed" class="kanban-list p-3 space-y-3"></div>
            </div>
        </div>
    `;

    const q = query(collection(db, "orders"), orderBy("timestamp", "asc"));
    onSnapshot(q, (snap) => {
        const lists = { 
            pending: document.getElementById('list-pending'), 
            preparing: document.getElementById('list-preparing'), 
            completed: document.getElementById('list-completed') 
        };
        const counts = { pending:0, preparing:0, completed:0 };

        if(!lists.pending) return;
        Object.values(lists).forEach(l => l.innerHTML = '');

        snap.forEach(docSnap => {
            const o = {id: docSnap.id, ...docSnap.data()};
            const st = o.status === 'done' ? 'completed' : o.status;

            if(lists[st]) {
                counts[st]++;
                lists[st].innerHTML += `
                    <div class="order-card-item bg-gray-700 p-4 rounded-lg shadow border-l-4 ${st==='pending'?'border-red-500':st==='preparing'?'border-yellow-500':'border-green-500'}">
                        <div class="flex justify-between items-center mb-2">
                            <span class="font-bold text-white">#${o.orderId||'ID'}</span>
                            <span class="text-xs text-gray-400">${o.timestamp?.toDate().toLocaleTimeString().slice(0,5)}</span>
                        </div>
                        <div class="text-sm text-gray-200 mb-3 space-y-1">
                            ${o.items ? o.items.map(i => `<div class="flex justify-between"><span>${i.qty}x ${i.name}</span></div>`).join('') : '<span class="text-red-400">Erreur items</span>'}
                        </div>
                        <div class="flex justify-between items-center pt-2 border-t border-gray-600">
                            <span class="text-yellow-400 font-bold">${o.total} DT</span>
                            ${st==='pending' ? `<button onclick="window.updOrder('${o.id}','preparing')" class="bg-blue-600 px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-500 shadow-lg">CUISINER</button>` : ''}
                            ${st==='preparing' ? `<button onclick="window.updOrder('${o.id}','completed')" class="bg-green-600 px-3 py-1.5 rounded text-xs font-bold hover:bg-green-500 shadow-lg">SERVIR</button>` : ''}
                        </div>
                    </div>
                `;
            }
        });

        if(document.getElementById('cnt-pending')) document.getElementById('cnt-pending').innerText = counts.pending;
        if(document.getElementById('cnt-preparing')) document.getElementById('cnt-preparing').innerText = counts.preparing;
        if(document.getElementById('cnt-completed')) document.getElementById('cnt-completed').innerText = counts.completed;
    });
}

window.updOrder = async (id, s) => {
    try {
        await updateDoc(doc(db, "orders", id), { status: s });
    } catch(e) { console.error(e); }
};
