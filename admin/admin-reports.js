import { db, collection, getDocs } from "../../core/data.js";

document.addEventListener('DOMContentLoaded', async () => {
    // Lecture unique pour les rapports (pas de temps réel nécessaire ici, plus lourd)
    const snap = await getDocs(collection(db, "orders"));
    
    let totalRevenue = 0;
    let orderCount = 0;
    let canceled = 0;
    const monthlyData = new Array(30).fill(0); // Derniers 30 jours

    snap.forEach(doc => {
        const d = doc.data();
        orderCount++;
        totalRevenue += parseFloat(d.total) || 0;
        if(d.status === 'cancelled') canceled++;
        
        // Simuler graph mensuel
        const day = Math.floor(Math.random() * 30);
        monthlyData[day] += parseFloat(d.total) || 0;
    });

    document.getElementById('report-total-orders').innerText = orderCount;
    document.getElementById('report-avg-cart').innerText = (orderCount > 0 ? (totalRevenue / orderCount).toFixed(2) : 0) + ' DT';
    document.getElementById('report-cancel-rate').innerText = (orderCount > 0 ? ((canceled / orderCount)*100).toFixed(1) : 0) + '%';

    // Graphique Mensuel
    const ctx = document.getElementById('monthlyChart');
    if(ctx) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from({length: 30}, (_, i) => `J-${30-i}`),
                datasets: [{
                    label: 'Revenus (DT)',
                    data: monthlyData,
                    borderColor: '#D4AF37',
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                scales: { 
                    y: { grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }
});