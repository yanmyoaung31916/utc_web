// Dashboard visits card + Chart.js helpers.
// Same chart config as before; only the create-vs-update branching is shared.
import { $ } from "./dom.js";

const CHART_DEFAULTS = {
  responsive: false,
  animation: { duration: 200 },
};

function ensureVisitsCard() {
  if ($("visitsCard")) return;
  const grid = document.querySelector("#dashboardSection .grid");
  if (!grid) return;
  const card = document.createElement("div");
  card.className = "bg-white p-6 rounded-lg shadow-sm border border-gray-200";
  card.id = "visitsCard";
  card.innerHTML = `
                <div class="flex items-center">
                    <div class="p-3 bg-indigo-100 rounded-lg">
                        <i class="fas fa-users text-indigo-600 text-xl"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">Site Visits</p>
                        <p id="totalVisits" class="text-2xl font-bold text-gray-900">-</p>
                        <p class="text-xs text-gray-500">Unique: <span id="totalUnique">-</span> • Today: <span id="todayVisits">-</span>/<span id="todayUnique">-</span></p>
                    </div>
                </div>`;
  grid.appendChild(card);
}

export function setVisitsCard(totalVisits, totalUnique, todayStats = {}) {
  ensureVisitsCard();
  const set = (id, value) => {
    const el = $(id);
    if (el) el.textContent = value;
  };
  set("totalVisits", totalVisits);
  set("totalUnique", totalUnique);
  set("todayVisits", todayStats.visits || 0);
  set("todayUnique", todayStats.uniqueVisitors || 0);
}

function upsertChart(instance, ctx, config) {
  if (!ctx) return instance;
  if (instance) {
    instance.data.labels = config.data.labels;
    instance.data.datasets.forEach((dataset, i) => {
      dataset.data = config.data.datasets[i].data;
    });
    instance.update();
    return instance;
  }
  return new Chart(ctx, config);
}

export function renderCharts(state, analytics = {}) {
  try {
    state._visitsChart = upsertChart(state._visitsChart, $("visits7dChart"), {
      type: "line",
      data: {
        labels: (analytics.last7Days || []).map((d) => d.date),
        datasets: [
          {
            label: "Visits",
            data: (analytics.last7Days || []).map((d) => d.visits),
            borderColor: "#2563eb",
            backgroundColor: "rgba(37,99,235,0.2)",
            tension: 0.3,
          },
          {
            label: "Unique",
            data: (analytics.last7Days || []).map((d) => d.uniqueVisitors || 0),
            borderColor: "#10b981",
            backgroundColor: "rgba(16,185,129,0.2)",
            tension: 0.3,
          },
        ],
      },
      options: {
        ...CHART_DEFAULTS,
        plugins: { legend: { position: "bottom" } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    });

    state._topPathsChart = upsertChart(state._topPathsChart, $("topPathsChart"), {
      type: "bar",
      data: {
        labels: (analytics.topPaths || []).map((p) => p.path),
        datasets: [{ label: "Visits", data: (analytics.topPaths || []).map((p) => p.visits), backgroundColor: "#6366f1" }],
      },
      options: {
        ...CHART_DEFAULTS,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    });
  } catch (e) {
    console.error("Error rendering charts", e);
  }
}
