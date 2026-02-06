import { db, collection, query, orderBy, onSnapshot } from '../core/data.js';

export function renderDashboard(container) {

  // ================= UI =================
  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8 fade-in">

      <div class="bg-gray-800 p-5 rounded-xl border-l-4 border-orange-500 shadow-lg">
        <p class="text-gray-400 text-sm">Revenu du jour</p>
        <h3 class="text-3xl font-bold mt-1 text-white" id="daily-revenue">0.0 DT</h3>
        <p class="text-xs text-gray-500 mt-1">Aujourd’hui</p>
      </div>

      <div class="bg-gray-800 p-5 rounded-xl border-l-4 border-blue-500 shadow-lg">
        <p class="text-gray-400 text-sm">Chiffre d'Affaires</p>
        <h3 class="text-3xl font-bold mt-1 text-white" id="stat-revenue">0 DT</h3>
      </div>

      <div class="bg-gray-800 p-5 rounded-xl border-l-4 border-yellow-500 shadow-lg">
        <p class="text-gray-400 text-sm">Commandes Actives</p>
        <h3 class="text-3xl font-bold mt-1 text-white" id="stat-active">0</h3>
      </div>

      <div class="bg-gray-800 p-5 rounded-xl border-l-4 border-green-500 shadow-lg">
        <p class="text-gray-400 text-sm">Profit Net (Est.)</p>
        <h3 class="text-3xl font-bold mt-1 text-white" id="stat-profit">0 DT</h3>
      </div>

      <div class="bg-gray-800 p-5 rounded-xl border-l-4 border-purple-500 shadow-lg">
        <p class="text-gray-400 text-sm">Total Commandes</p>
        <h3 class="text-3xl font-bold mt-1 text-white" id="stat-count">0</h3>
      </div>

    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in">
      <div class="lg:col-span-2 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
        <h3 class="font-bold mb-4 text-white">Courbe des Ventes</h3>
        <div class="h-64"><canvas id="revenueChart"></canvas></div>
      </div>

      <div class="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
        <h3 class="font-bold mb-4 text-white">Activité Récente</h3>
        <ul id="activity-log" class="space-y-3 text-sm text-gray-400"></ul>
      </div>
    </div>

    <div class="bg-gray-800 p-5 rounded-xl shadow-lg mt-6 fade-in">
      <h3 class="text-white font-bold mb-3">Produits les plus vendus (Aujourd’hui)</h3>
      <canvas id="top-products-chart" height="220"></canvas>
    </div>
  `;

  // ================= LOGIC =================

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"));

  onSnapshot(ordersQuery, (snap) => {

    let total = 0;
    let dailyTotal = 0;
    let active = 0;
    let count = 0;
    const productsCount = {};

    const logs = document.getElementById("activity-log");
    if (logs) logs.innerHTML = "";

    snap.forEach(doc => {
      const o = doc.data();
      if (!o.status) return;

      count++;

      if (o.status !== "cancelled") {
        total += Number(o.total || 0);
      }

      if (["pending", "preparing"].includes(o.status)) {
        active++;
      }

      if (o.createdAt) {
        const d = o.createdAt.toDate();
        d.setHours(0, 0, 0, 0);

        if (
          d.getTime() === today.getTime() &&
          (o.status === "finished" || o.status === "served")
        ) {
          dailyTotal += Number(o.total || 0);

          if (Array.isArray(o.items)) {
            o.items.forEach(item => {
              const name = item.name;
              const qty = item.qty || 1;
              productsCount[name] = (productsCount[name] || 0) + qty;
            });
          }
        }
      }

      if (logs && logs.children.length < 5) {
        logs.innerHTML += `
          <li class="flex justify-between border-b border-gray-700 pb-2">
            <span>Cmd #${o.orderId || "—"}</span>
            <span class="text-white font-bold">${o.total || 0} DT</span>
          </li>
        `;
      }
    });

    // ===== KPIs =====
    document.getElementById("stat-revenue").innerText = total.toFixed(1) + " DT";
    document.getElementById("daily-revenue").innerText = dailyTotal.toFixed(1) + " DT";
    document.getElementById("stat-active").innerText = active;
    document.getElementById("stat-profit").innerText = (total * 0.4).toFixed(1) + " DT";
    document.getElementById("stat-count").innerText = count;

    // ===== Charts =====
    initRevenueChart();
    initTopProductsChart(productsCount);
  });
}

// ================= CHARTS =================

function initRevenueChart() {
  const ctx = document.getElementById("revenueChart");
  if (!ctx) return;

  if (Chart.getChart(ctx)) Chart.getChart(ctx).destroy();

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
      datasets: [{
        label: "Ventes",
        data: [120, 190, 300, 250, 200, 350, 400],
        backgroundColor: "#EAB308",
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } }
    }
  });
}

function initTopProductsChart(productsCount) {
  const ctx = document.getElementById("top-products-chart");
  if (!ctx) return;

  if (window.topProductsChart) window.topProductsChart.destroy();

  window.topProductsChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: Object.keys(productsCount),
      datasets: [{
        data: Object.values(productsCount),
        backgroundColor: [
          "#ef4444",
          "#f59e0b",
          "#22c55e",
          "#3b82f6",
          "#a855f7",
          "#06b6d4"
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "right",
          labels: { color: "#e5e7eb" }
        }
      }
    }
  });
}
