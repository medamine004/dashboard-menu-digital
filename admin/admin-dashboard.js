import { db, collection, query, onSnapshot, orderBy } from "../../core/data.js";

document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
});

function initDashboard() {
    // 1. Écoute des Commandes pour KPIs
    const qOrders = query(collection(db, "orders"), orderBy("timestamp", "desc"));
    
    onSnapshot(qOrders, (snapshot) => {
        let revenueDay = 0;
        let activeOrders = 0;
        let completedOrders = 0;
        let logsHTML = '';
        let productsCount = {};

        const today = new Date().toDateString();

        snapshot.forEach(doc => {
            const data = doc.data();
            const dateObj = data.timestamp ? data.timestamp.toDate() : new Date();
            const dateStr = dateObj.toDateString();

            // Calcul Revenu Jour
            if (dateStr === today) {
                revenueDay += parseFloat(data.total) || 0;
            }

            // Commandes actives
            if (['pending', 'preparing'].includes(data.status)) {
                activeOrders++;
            } else if (data.status === 'completed') {
                completedOrders++;
            }

            // Top Produits (Comptage simple)
            if (data.items && Array.isArray(data.items)) {
                data.items.forEach(item => {
                    productsCount[item.name] = (productsCount[item.name] || 0) + item.qty;
                });
            }

            // Logs (5 derniers)
            if (logsHTML.split('</tr>').length < 6) {
                const time = dateObj.toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'});
                let statusColor = data.status === 'completed' ? 'text-green-500' : 'text-yellow-500';
                
                logsHTML += `
                <tr class="hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors">
                    <td class="p-4 whitespace-nowrap text-white font-mono">${time}</td>
                    <td class="p-4 whitespace-nowrap text-gray-300">${data.table ? 'Table '+data.table : 'Emporter'}</td>
                    <td class="p-4 whitespace-nowrap font-bold text-white">${parseFloat(data.total).toFixed(1)} DT</td>
                    <td class="p-4 whitespace-nowrap ${statusColor} text-xs uppercase font-bold">${data.status}</td>
                </tr>`;
            }
        });

        // Mise à jour DOM
        document.getElementById('stat-revenue').innerText = revenueDay.toFixed(2) + ' DT';
        document.getElementById('stat-active-orders').innerText = activeOrders;
        document.getElementById('stat-profit').innerText = (revenueDay * 0.40).toFixed(2) + ' DT'; // Marge estimée 40%
        document.getElementById('activity-log').innerHTML = logsHTML;

        // GRAPHIQUES (Chart.js)
        updateCharts(revenueDay, productsCount);
    });
}

function updateCharts(revenue, products) {
    // Top 5 Produits
    const sortedProducts = Object.entries(products).sort((a,b) => b[1] - a[1]).slice(0, 5);
    const labels = sortedProducts.map(p => p[0]);
    const data = sortedProducts.map(p => p[1]);

    // Render Chart Produits
    const ctxProd = document.getElementById('productsChart');
    if (ctxProd) {
        // Détruire l'ancien si existe (simple implémentation)
        if(window.myProductChart) window.myProductChart.destroy();
        
        window.myProductChart = new Chart(ctxProd, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: ['#D4AF37', '#F5F5F5', '#333333', '#666666', '#999999'],
                    borderWidth: 0
                }]
            },
            options: { plugins: { legend: { position: 'right', labels: { color: 'white' } } } }
        });
    }
}
