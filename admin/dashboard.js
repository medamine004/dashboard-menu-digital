import { db, collection, query, orderBy, onSnapshot } 
from '../core/data.js';

export function renderDashboard(container) {
    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 fade-in">
            <div class="bg-gray-800 p-5 rounded-xl border-l-4 border-blue-500 shadow-lg">
                <p class="text-gray-400 text-sm">Chiffre d'Affaires</p>
                <h3 class="text-3xl font-bold mt-1 text-white" id="stat-revenue">...</h3>
            </div>
            <div class="bg-gray-800 p-5 rounded-xl border-l-4 border-yellow-500 shadow-lg">
                <p class="text-gray-400 text-sm">Commandes Actives</p>
                <h3 class="text-3xl font-bold mt-1 text-white" id="stat-active">...</h3>
            </div>
            <div class="bg-gray-800 p-5 rounded-xl border-l-4 border-green-500 shadow-lg">
                <p class="text-gray-400 text-sm">Profit Net (Est.)</p>
                <h3 class="text-3xl font-bold mt-1 text-white" id="stat-profit">...</h3>
            </div>
            <div class="bg-gray-800 p-5 rounded-xl border-l-4 border-purple-500 shadow-lg">
                <p class="text-gray-400 text-sm">Total Commandes</p>
                <h3 class="text-3xl font-bold mt-1 text-white" id="stat-count">...</h3>
            </div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in">
            <div class="lg:col-span-2 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                <h3 class="font-bold mb-4 text-white">Courbe des Ventes</h3>
                <div class="h-64 relative w-full"><canvas id="revenueChart"></canvas></div>
            </div>
            <div class="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg overflow-hidden">
                <h3 class="font-bold mb-4 text-white">Activité Récente</h3>
                <ul id="activity-log" class="space-y-3 text-sm text-gray-400"></ul>
            </div>
        </div>
    `;

    const q = query(collection(db, "orders"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snap) => {
        let total = 0, active = 0, count = 0;
        const logs = document.getElementById('activity-log');
        if(logs) logs.innerHTML = '';

        snap.forEach(d => {
            const o = d.data();
            if(o.status !== 'cancelled') total += parseFloat(o.total || 0);
            if(['pending', 'preparing'].includes(o.status)) active++;
            count++;

            if(logs && logs.children.length < 5) {
                logs.innerHTML += `
                    <li class="flex justify-between border-b border-gray-700 pb-2">
                        <span>Cmd #${o.orderId || '...'}</span> 
                        <span class="text-white font-bold">${o.total} DT</span>
                    </li>
                `;
            }
        });

        if(document.getElementById('stat-revenue')) {
            document.getElementById('stat-revenue').innerText = total.toFixed(1) + ' DT';
            document.getElementById('stat-active').innerText = active;
            document.getElementById('stat-profit').innerText = (total * 0.4).toFixed(1) + ' DT';
            document.getElementById('stat-count').innerText = count;
        }
        initChart();
    });
}

function initChart() {
    const ctx = document.getElementById('revenueChart');
    if(!ctx) return;
    
    // Destruction du chart existant pour éviter les glitchs
    const chartStatus = Chart.getChart("revenueChart"); 
    if (chartStatus != undefined) chartStatus.destroy();

    new Chart(ctx, {
        type: 'bar',
        data: { 
            labels: ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'], 
            datasets: [{ 
                label: 'Ventes', 
                data: [120, 190, 300, 250, 200, 350, 400], 
                backgroundColor: '#EAB308',
                borderRadius: 4
            }] 
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { legend: {display: false} },
            scales: { y: { grid: { color: '#374151' } } }
        }
    });
}
