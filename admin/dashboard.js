import { db, collection, query, orderBy, onSnapshot } from "../core/data.js";

export function renderDashboard(container) {

  // ================= UI =================
  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

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
      <h3 class="text-white font-bold mb-4">Courbe des Ventes</h3>
      <div style="height:300px">
        <canvas id="revenueChart"></canvas>
      </div>
    </div>
  `;

  // ================= DATA =================
  const q = query(collection(db, "orders"), orderBy("timestamp", "desc"));

  onSnapshot(q, (snap) => {
    let total = 0;
    let active = 0;
    let count = 0;

    snap.forEach(doc => {
      const o = doc.data();
      count++;

      if (o.status !== "cancelled") {
        total += Number(o.total || 0);
      }

      if (["pending", "preparing"].includes(o.status)) {
        active++;
      }
    });

    document.getElementById("stat-revenue").innerText = total.toFixed(1) + " DT";
    document.getElementById("stat-active").innerText = active;
    document.getElementById("stat-profit").innerText = (total * 0.4).toFixed(1) + " DT";
    document.getElementById("stat-count").innerText = count;

    initChart();
  });
}

// ================= CHART =================
function initChart() {
  const ctx = document.getElementById("revenueChart");
  if (!ctx || typeof Chart === "undefined") return;

  const existing = Chart.getChart(ctx);
  if (existing) existing.destroy();

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
      datasets: [{
        label: "Ventes",
        data: [120, 180, 300, 250, 200, 350, 400],
        backgroundColor: "#facc15",
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "#374151" }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}
