import { db, collection, query, orderBy, onSnapshot } from "../core/data.js";

export function renderDashboard(container) {

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

    <div class="bg-gray-800 p-6 rounded-xl border border-gray-700">
      <h3 class="text-white font-bold mb-4">Courbe des Ventes (Semaine)</h3>
      <div class="h-64">
        <canvas id="revenueChart"></canvas>
      </div>
    </div>
  `;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekData = [0, 0, 0, 0, 0, 0, 0]; // Lun → Dim

  const q = query(collection(db, "orders"), orderBy("timestamp", "desc"));

  onSnapshot(q, (snap) => {

    let total = 0;
    let daily = 0;
    let active = 0;
    let count = 0;

    weekData.fill(0);

    snap.forEach(doc => {
      const o = doc.data();
      if (!o.timestamp) return;

      const price = Number(o.price || 0);
      const qty = Number(o.qty || 1);
      const amount = price * qty;

      count++;

      if (o.status !== "cancelled") {
        total += amount;
      }

      if (o.status === "pending") {
        active++;
      }

      const d = o.timestamp.toDate();
      const dayIndex = (d.getDay() + 6) % 7; // Lun=0 … Dim=6

      if (o.status === "completed") {
        weekData[dayIndex] += amount;
      }

      d.setHours(0, 0, 0, 0);
      if (d.getTime() === today.getTime() && o.status === "completed") {
        daily += amount;
      }
    });

    document.getElementById("daily-revenue").innerText = daily.toFixed(1) + " DT";
    document.getElementById("stat-revenue").innerText = total.toFixed(1) + " DT";
    document.getElementById("stat-active").innerText = active;
    document.getElementById("stat-profit").innerText = (total * 0.4).toFixed(1) + " DT";
    document.getElementById("stat-count").innerText = count;

    renderWeekChart(weekData);
  });
}

// ===== CHART =====
function renderWeekChart(data) {
  const ctx = document.getElementById("revenueChart");
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
        backgroundColor: "#EAB308",
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: "#374151" } },
        x: { grid: { display: false } }
      }
    }
  });
}
