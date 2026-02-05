import { db, collection, getDocs } from './admin-core.js';

export async function renderReports(container) {
    container.innerHTML = `
        <h2 class="text-2xl font-bold mb-6 text-white fade-in">Rapports & Stats</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 fade-in">
            <div class="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                <h3 class="font-bold mb-4 text-white">Répartition des Commandes</h3>
                <div class="h-64 relative"><canvas id="statusChart"></canvas></div>
            </div>
            <div class="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                <h3 class="font-bold mb-4 text-white">KPIs Mensuels</h3>
                <ul class="space-y-4">
                    <li class="flex justify-between border-b border-gray-700 pb-2"><span class="text-gray-400">Total Commandes</span> <span class="text-white font-bold" id="rep-total">...</span></li>
                    <li class="flex justify-between border-b border-gray-700 pb-2"><span class="text-gray-400">Revenus</span> <span class="text-yellow-500 font-bold" id="rep-rev">...</span></li>
                    <li class="flex justify-between border-b border-gray-700 pb-2"><span class="text-gray-400">Annulations</span> <span class="text-red-500 font-bold" id="rep-cancel">...</span></li>
                </ul>
            </div>
        </div>
    `;

    const snap = await getDocs(collection(db, "orders"));
    let statusCounts = { pending:0, preparing:0, completed:0, cancelled:0 };
    let totalRev = 0;

    snap.forEach(d => {
        const data = d.data();
        const s = data.status === 'done' ? 'completed' : data.status;
        if(statusCounts[s] !== undefined) statusCounts[s]++;
        
        if(s !== 'cancelled') totalRev += parseFloat(data.total || 0);
    });

    document.getElementById('rep-total').innerText = snap.size;
    document.getElementById('rep-rev').innerText = totalRev.toFixed(1) + ' DT';
    document.getElementById('rep-cancel').innerText = statusCounts.cancelled;

    const ctx = document.getElementById('statusChart');
    
    const chartStatus = Chart.getChart("statusChart"); 
    if (chartStatus != undefined) chartStatus.destroy();

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Attente', 'Prépa', 'Fini', 'Annulé'],
            datasets: [{ 
                data: Object.values(statusCounts), 
                backgroundColor: ['#EF4444', '#EAB308', '#22C55E', '#6B7280'], 
                borderWidth: 0 
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { legend: { position: 'right', labels: { color: 'white' } } } 
        }
    });
}