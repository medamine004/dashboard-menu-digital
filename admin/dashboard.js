import { db, collection, query, onSnapshot } from "../core/data.js";

export function renderDashboard(container) {

  // ================= UI =================
  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">

      <div class="bg-gray-800 p-5 rounded-xl border-l-4 border-orange-500">
        <p class="text-gray-400 text-sm">Revenu du jour</p>
        <h3 class="text-3xl font-bold text-white" id="daily-revenue">0.0 DT</h3>
        <p class="text-xs text-gray-500">Aujourd’hui</p>
      </div>

      <div class="bg-gray-800 p-5 rounded-xl border-l-4 border-blue-500">
        <p class="text-gray-400 text-sm">Chiffre d'Affaires</p>
        <h3 class="text-3xl font-bold text-white" id="total-revenue">0.0 DT</h3>
      </div>

      <div class="bg-gray-800 p-5 rounded-xl border-l-4 border-yellow-500">
        <p class="text-gray-400 text-sm">Commandes Actives</p>
        <h3 class="text-3xl font-bold text-white" id="active-orders">0</h3>
      </div>

      <div class="bg-gray-800 p-5 rounded-xl border-l-4 border-green-500">
        <p class="text-gray-400 text-sm">Profit Net (Est.)</p>
        <h3 class="text-3xl font-bold text-white" id="profit">0.0 DT</h3>
      </div>

      <div class="bg-gray-800 p-5 rounded-xl border-l-4 border-purple-500">
        <p class="text-gray-400 text-sm">Total Commandes</p>
        <h3 class="text-3xl font-bold text-white" id="orders-count">0</h3>
      </div>

    </div>

    <div class="bg-gray-800 p-6 rounded-xl">
      <h3 class="text-white font-bold mb-4">Courbe des Ventes (Semaine)</h3>
      <div class="h-72">
        <canvas id="weekChart"></canvas>
      </div>
    </div>
  `;

  loadDashboardData();
}

// ================= LOGIC =================

function loadDashboardData() {

  const ordersRef = query(collection(db, "orders"));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekRevenue = [0, 0, 0, 0, 0, 0, 0]; // Lun → Dim

  onSnapshot(ordersRef, (snap) => {

    let totalRevenue = 0;
    let dailyRevenue = 0;
    let activeOrders = 0;
    let ordersCount = 0;

    snap.forEach(doc => {
      const o = doc.data();
      ordersCount++;

      const total = Number(o.total || 0);
      const status = o.status;

      // TOTAL
      if (status !== "cancelled") {
        totalRevenue += total;
      }

      // ACTIVE
      if (status === "pending" || status === "preparing") {
        activeOrders++;
      }

      // DATE
      if (!o.timestamp) return;

      const d = o.timestamp.toDate();
      const dayIndex = (d.getDay() + 6) % 7; // Lun=0 … Dim=6

      if (status === "completed") {
        weekRevenue[dayIndex] += total;

        d.setHours(0,0,0,0);
        if (d.getTime() === today.getTime()) {
          dailyRevenue += total;
        }
      }
    });

    // ===== UPDATE UI =====
    document.getElementById("total-revenue").innerText = totalRevenue.toFixed(1) + " DT";
    document.getElementById("daily-revenue").innerText = dailyRevenue.toFixed(1) + " DT";
    document.getElementById("active-orders").innerText = activeOrders;
    document.getElementById("orders-count").innerText = ordersCount;
    document.getElementById("profit").innerText = (totalRevenue * 0.4).toFixed(1) + " DT";

    drawWeekChart(weekRevenue);
  });
}

// ================= CHART =================

function drawWeekChart(data) {

  const ctx = document.getElementById("weekChart");
  if (!ctx) return;

  if (Chart.getChart(ctx)) {
    Chart.getChart(ctx).destroy();
  }

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
      datasets: [{
        data,
        backgroundColor: "#facc15",
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}
