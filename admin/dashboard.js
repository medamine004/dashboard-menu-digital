import { db, collection, query, onSnapshot } from "../core/data.js";

/* =========================================================
   RENDER DASHBOARD
========================================================= */
export function renderDashboard(container) {
  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">

      <div class="bg-gray-800 p-5 rounded-xl border-l-4 border-orange-500">
        <p class="text-gray-400 text-sm">Revenu du jour</p>
        <h3 id="daily-revenue" class="text-2xl font-bold text-white">0.0 DT</h3>
      </div>

      <div class="bg-gray-800 p-5 rounded-xl border-l-4 border-blue-500">
        <p class="text-gray-400 text-sm">Chiffre d'Affaires</p>
        <h3 id="stat-revenue" class="text-2xl font-bold text-white">0.0 DT</h3>
      </div>

      <div class="bg-gray-800 p-5 rounded-xl border-l-4 border-yellow-500">
        <p class="text-gray-400 text-sm">Commandes Actives</p>
        <h3 id="stat-active" class="text-2xl font-bold text-white">0</h3>
      </div>

      <div class="bg-gray-800 p-5 rounded-xl border-l-4 border-green-500">
        <p class="text-gray-400 text-sm">Profit Net (Est.)</p>
        <h3 id="stat-profit" class="text-2xl font-bold text-white">0.0 DT</h3>
      </div>

      <div class="bg-gray-800 p-5 rounded-xl border-l-4 border-purple-500">
        <p class="text-gray-400 text-sm">Total Commandes</p>
        <h3 id="stat-count" class="text-2xl font-bold text-white">0</h3>
      </div>

    </div>

    <div class="bg-gray-800 p-6 rounded-xl">
      <h3 class="text-white font-bold mb-4">Courbe des Ventes</h3>
      <div class="h-72">
        <canvas id="revenueChart"></canvas>
      </div>
    </div>
  `;

  loadDashboardData();
}

/* =========================================================
   DATA + LOGIC
========================================================= */
function loadDashboardData() {
  const ordersRef = collection(db, "orders");
  const q = query(ordersRef);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekDays = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const weekTotals = [0, 0, 0, 0, 0, 0, 0];

  onSnapshot(q, (snap) => {
    let totalRevenue = 0;
    let dailyRevenue = 0;
    let active = 0;
    let count = 0;

    weekTotals.fill(0);

    snap.forEach((doc) => {
      const o = doc.data();
      if (!o || !o.status) return;

      count++;

      if (o.status === "pending" || o.status === "preparing") {
        active++;
      }

      if (typeof o.total === "number") {
        totalRevenue += o.total;
      }

      if (o.createdAt?.toDate) {
        const d = o.createdAt.toDate();
        const dayStart = new Date(d);
        dayStart.setHours(0, 0, 0, 0);

        if (
          dayStart.getTime() === today.getTime() &&
          (o.status === "finished" || o.status === "served")
        ) {
          dailyRevenue += Number(o.total || 0);
        }

        const dayIndex = d.getDay();
        if (o.status !== "cancelled") {
          weekTotals[dayIndex] += Number(o.total || 0);
        }
      }
    });

    // KPIs
    document.getElementById("stat-revenue").innerText =
      totalRevenue.toFixed(1) + " DT";
    document.getElementById("daily-revenue").innerText =
      dailyRevenue.toFixed(1) + " DT";
    document.getElementById("stat-active").innerText = active;
    document.getElementById("stat-profit").innerText =
      (totalRevenue * 0.4).toFixed(1) + " DT";
    document.getElementById("stat-count").innerText = count;

    renderChart(weekDays, weekTotals);
  });
}

/* =========================================================
   CHART
========================================================= */
function renderChart(labels, data) {
  const ctx = document.getElementById("revenueChart");
  if (!ctx) return;

  if (window.revenueChart) {
    window.revenueChart.destroy();
  }

  window.revenueChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: "#FACC15",
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "#374151" },
        },
        x: {
          grid: { display: false },
        },
      },
    },
  });
}
