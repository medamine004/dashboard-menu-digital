import { db, collection, query, orderBy, onSnapshot } from "../core/data.js";

export function renderDashboard(container) {

  /* ================= UI ================= */
  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">

      <div class="bg-gray-800 p-5 rounded-xl border-l-4 border-orange-500">
        <p class="text-gray-400 text-sm">Revenu du jour</p>
        <h3 class="text-3xl font-bold text-white" id="daily-revenue">0.0 DT</h3>
      </div>

      <div class="bg-gray-800 p-5 rounded-xl border-l-4 border-blue-500">
        <p class="text-gray-400 text-sm">Chiffre d'Affaires</p>
        <h3 class="text-3xl font-bold text-white" id="stat-revenue">0.0 DT</h3>
      </div>

      <div class="bg-gray-800 p-5 rounded-xl border-l-4 border-yellow-500">
        <p class="text-gray-400 text-sm">Commandes Actives</p>
        <h3 class="text-3xl font-bold text-white" id="stat-active">0</h3>
      </div>

      <div class="bg-gray-800 p-5 rounded-xl border-l-4 border-green-500">
        <p class="text-gray-400 text-sm">Profit Net (Est.)</p>
        <h3 class="text-3xl font-bold text-white" id="stat-profit">0.0 DT</h3>
      </div>

      <div class="bg-gray-800 p-5 rounded-xl border-l-4 border-purple-500">
        <p class="text-gray-400 text-sm">Total Commandes</p>
        <h3 class="text-3xl font-bold text-white" id="stat-count">0</h3>
      </div>

    </div>

    <div class="bg-gray-800 p-6 rounded-xl">
      <h3 class="font-bold mb-4 text-white">Courbe des Ventes</h3>
      <canvas id="revenueChart" height="120"></canvas>
    </div>
  `;

  /* ================= LOGIC ================= */

  const ordersRef = query(
    collection(db, "orders"),
    orderBy("timestamp", "desc")
  );

  onSnapshot(ordersRef, snap => {

    let totalRevenue = 0;
    let dailyRevenue = 0;
    let active = 0;
    let count = 0;

    const todayKey = new Date().toISOString().slice(0, 10);

    const weekData = {
      Lun: 0,
      Mar: 0,
      Mer: 0,
      Jeu: 0,
      Ven: 0,
      Sam: 0,
      Dim: 0
    };

    snap.forEach(doc => {
      const o = doc.data();
      if (!o.timestamp) return;

      const date = o.timestamp.toDate();
      const dayKey = date.toISOString().slice(0, 10);
      const dayName = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"][date.getDay()];

      const total = (Number(o.price) || 0) * (Number(o.qty) || 1);

      count++;

      if (o.status !== "cancelled") {
        totalRevenue += total;
        weekData[dayName] += total;
      }

      if (["pending", "preparing"].includes(o.status)) {
        active++;
      }

      if (
        dayKey === todayKey &&
        (o.status === "completed" || o.status === "served")
      ) {
        dailyRevenue += total;
      }
    });

    /* ===== KPIs ===== */
    document.getElementById("stat-revenue").innerText =
      totalRevenue.toFixed(1) + " DT";

    document.getElementById("daily-revenue").innerText =
      dailyRevenue.toFixed(1) + " DT";

    document.getElementById("stat-active").innerText = active;

    document.getElementById("stat-profit").innerText =
      (totalRevenue * 0.4).toFixed(1) + " DT";

    document.getElementById("stat-count").innerText = count;

    /* ===== CHART ===== */
    initRevenueChart(Object.values(weekData));
  });
}

/* ================= CHART ================= */

function initRevenueChart(data) {
  const ctx = document.getElementById("revenueChart");
  if (!ctx) return;

  if (Chart.getChart(ctx)) {
    Chart.getChart(ctx).destroy();
  }

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"],
      datasets: [{
        data,
        backgroundColor: "#EAB308",
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
