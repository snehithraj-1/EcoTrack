import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { BarChart3, CalendarDays, CloudSun, Download, FileText, TrendingDown } from "lucide-react";

import { getHistory, getSettings } from "../api";
import EmptyState from "../components/EmptyState";
import StatCard from "../components/StatCard";
import { useAuth } from "../context/auth-context";
import { CATEGORY_STYLES, DEFAULT_BUDGET } from "../utils/constants";
import { friendlyDate, lastNDays, sortAscending, sortDescending } from "../utils/date";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

const gridColor = "rgba(65, 82, 70, 0.12)";

export default function History() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [settings, setSettings] = useState({ daily_budget: DEFAULT_BUDGET });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadHistory() {
      try {
        const [settingsData, historyData] = await Promise.all([getSettings(user.uid), getHistory(user.uid, 30)]);
        if (!active) return;
        setSettings(settingsData);
        setHistory(historyData);
      } catch (exc) {
        if (active) setError(exc.response?.data?.error || "Unable to load history.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadHistory();
    return () => {
      active = false;
    };
  }, [user.uid]);

  const budget = Number(settings.daily_budget || DEFAULT_BUDGET);
  const ascending = useMemo(() => sortAscending(history), [history]);
  const latest = useMemo(() => sortDescending(history), [history]);

  const summary = useMemo(() => {
    const lastSeven = latest.slice(0, 7);
    const avg7 =
      lastSeven.length > 0 ? lastSeven.reduce((sum, row) => sum + Number(row.total || 0), 0) / lastSeven.length : 0;
    const best = latest.length ? latest.reduce((min, row) => (Number(row.total || 0) < Number(min.total || 0) ? row : min)) : null;
    const worst = latest.length ? latest.reduce((max, row) => (Number(row.total || 0) > Number(max.total || 0) ? row : max)) : null;
    const monthly = latest.reduce((sum, row) => sum + Number(row.total || 0), 0);
    return { avg7, best, worst, monthly };
  }, [latest]);

  const lineData = {
    labels: ascending.map((row) => friendlyDate(row.date)),
    datasets: [
      {
        label: "Daily total",
        data: ascending.map((row) => Number(row.total || 0)),
        borderColor: "#268b51",
        backgroundColor: "rgba(38, 139, 81, 0.16)",
        fill: true,
        tension: 0.35,
      },
      {
        label: "Budget",
        data: ascending.map(() => budget),
        borderColor: "#d59625",
        borderDash: [6, 6],
        pointRadius: 0,
      },
    ],
  };

  const last14 = ascending.slice(-14);
  const stackedData = {
    labels: last14.map((row) => friendlyDate(row.date)),
    datasets: [
      {
        label: "Travel",
        data: last14.map((row) => Number(row.travel_emissions || 0)),
        backgroundColor: CATEGORY_STYLES.travel.chart,
      },
      {
        label: "Food",
        data: last14.map((row) => Number(row.food_emissions || 0)),
        backgroundColor: CATEGORY_STYLES.food.chart,
      },
      {
        label: "Energy",
        data: last14.map((row) => Number(row.energy_emissions || 0)),
        backgroundColor: CATEGORY_STYLES.energy.chart,
      },
    ],
  };

  const categoryTotals = ["travel", "food", "energy"].map((category) =>
    latest.reduce((sum, row) => sum + Number(row[`${category}_emissions`] || 0), 0),
  );

  const doughnutData = {
    labels: ["Travel", "Food", "Energy"],
    datasets: [
      {
        data: categoryTotals,
        backgroundColor: [CATEGORY_STYLES.travel.chart, CATEGORY_STYLES.food.chart, CATEGORY_STYLES.energy.chart],
        borderWidth: 0,
      },
    ],
  };

  const varianceRows = latest.slice(0, 10).reverse();
  const varianceData = {
    labels: varianceRows.map((row) => friendlyDate(row.date)),
    datasets: [
      {
        label: "Budget variance",
        data: varianceRows.map((row) => Number(row.total || 0) - budget),
        backgroundColor: varianceRows.map((row) => (Number(row.total || 0) <= budget ? "#38a861" : "#dc3f3f")),
      },
    ],
  };

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { boxWidth: 12, color: "#445047", font: { family: "DM Sans", weight: "700" } } },
      tooltip: { callbacks: { label: (item) => `${item.dataset.label}: ${Number(item.raw).toFixed(2)} kg` } },
    },
    scales: {
      x: { grid: { color: gridColor }, ticks: { color: "#657167" } },
      y: { grid: { color: gridColor }, ticks: { color: "#657167" }, beginAtZero: true },
    },
  };

  const heatDays = lastNDays(30);
  const byDate = new Map(history.map((row) => [row.date, row]));

  function heatColor(total) {
    if (total === null) return "bg-stone-100";
    if (total <= budget * 0.55) return "bg-leaf-500";
    if (total <= budget) return "bg-amber-400";
    return "bg-rose-500";
  }

  function exportCsv() {
    const headers = ["date", "travel_kg", "food_kg", "energy_kg", "total_kg"];
    const rows = ascending.map((row) => [
      row.date,
      Number(row.travel_emissions || 0).toFixed(2),
      Number(row.food_emissions || 0).toFixed(2),
      Number(row.energy_emissions || 0).toFixed(2),
      Number(row.total || 0).toFixed(2),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ecotrack-history.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportPdf() {
    const reportWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!reportWindow) return;
    const rows = latest
      .map(
        (row) =>
          `<tr><td>${row.date}</td><td>${Number(row.travel_emissions || 0).toFixed(2)}</td><td>${Number(row.food_emissions || 0).toFixed(2)}</td><td>${Number(row.energy_emissions || 0).toFixed(2)}</td><td>${Number(row.total || 0).toFixed(2)}</td></tr>`,
      )
      .join("");
    reportWindow.document.write(`
      <html>
        <head>
          <title>EcoTrack Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #17231d; }
            h1 { margin: 0 0 8px; }
            .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 24px 0; }
            .card { border: 1px solid #dbeafe; border-radius: 14px; padding: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border-bottom: 1px solid #e5e7eb; padding: 10px; text-align: left; }
            th { background: #ecfeff; }
          </style>
        </head>
        <body>
          <h1>EcoTrack Carbon Report</h1>
          <p>Generated from the latest ${latest.length} logged days.</p>
          <section class="summary">
            <div class="card"><strong>7-day avg</strong><br>${summary.avg7.toFixed(1)} kg</div>
            <div class="card"><strong>Best day</strong><br>${Number(summary.best?.total || 0).toFixed(1)} kg</div>
            <div class="card"><strong>Worst day</strong><br>${Number(summary.worst?.total || 0).toFixed(1)} kg</div>
            <div class="card"><strong>Monthly total</strong><br>${summary.monthly.toFixed(1)} kg</div>
          </section>
          <table>
            <thead><tr><th>Date</th><th>Travel</th><th>Food</th><th>Energy</th><th>Total</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `);
    reportWindow.document.close();
  }

  if (loading) {
    return <div className="glass-panel rounded-2xl p-8 text-center font-bold text-stone-600 shadow-card">Loading history...</div>;
  }

  if (!history.length) {
    return (
      <EmptyState
        title="No footprint history yet"
        message="Your charts and heatmap will appear after the first habit log."
        action={
          <Link to="/log" className="rounded-xl bg-leaf-700 px-4 py-3 text-sm font-bold text-white shadow-card">
            Log Today
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-leaf-700">History</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-stone-950">Carbon trends</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-stone-700 ring-1 ring-cyan-100 hover:text-cyan-700"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
          <button
            type="button"
            onClick={exportPdf}
            className="brand-gradient inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold text-white shadow-card"
          >
            <FileText className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      {error ? <div className="rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-700 ring-1 ring-rose-100">{error}</div> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={TrendingDown} label="7-day average" value={`${summary.avg7.toFixed(1)} kg`} helper="Recent daily mean" tone="leaf" />
        <StatCard icon={CloudSun} label="Best day" value={`${Number(summary.best?.total || 0).toFixed(1)} kg`} helper={summary.best?.date} tone="sky" />
        <StatCard icon={BarChart3} label="Worst day" value={`${Number(summary.worst?.total || 0).toFixed(1)} kg`} helper={summary.worst?.date} tone="rose" />
        <StatCard icon={CalendarDays} label="Monthly total" value={`${summary.monthly.toFixed(1)} kg`} helper="Last 30 logged days" tone="amber" />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="glass-panel rounded-2xl p-5 shadow-card">
          <h2 className="font-display text-xl font-bold text-stone-950">30-day trend</h2>
          <div className="chart-box mt-4">
            <Line data={lineData} options={baseOptions} />
          </div>
        </article>
        <article className="glass-panel rounded-2xl p-5 shadow-card">
          <h2 className="font-display text-xl font-bold text-stone-950">14-day category breakdown</h2>
          <div className="chart-box mt-4">
            <Bar
              data={stackedData}
              options={{
                ...baseOptions,
                scales: {
                  x: { stacked: true, grid: { color: gridColor }, ticks: { color: "#657167" } },
                  y: { stacked: true, grid: { color: gridColor }, ticks: { color: "#657167" }, beginAtZero: true },
                },
              }}
            />
          </div>
        </article>
        <article className="glass-panel rounded-2xl p-5 shadow-card">
          <h2 className="font-display text-xl font-bold text-stone-950">Category share</h2>
          <div className="chart-box mt-4">
            <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: baseOptions.plugins }} />
          </div>
        </article>
        <article className="glass-panel rounded-2xl p-5 shadow-card">
          <h2 className="font-display text-xl font-bold text-stone-950">Budget variance</h2>
          <div className="chart-box mt-4">
            <Bar data={varianceData} options={baseOptions} />
          </div>
        </article>
      </section>

      <section className="glass-panel rounded-2xl p-5 shadow-card">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-xl font-bold text-stone-950">30-day heatmap</h2>
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-stone-600">
            <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-leaf-500" />Low</span>
            <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-amber-400" />Near budget</span>
            <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-rose-500" />Over</span>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-10 gap-2 sm:grid-cols-15">
          {heatDays.map((day) => {
            const row = byDate.get(day);
            const total = row ? Number(row.total || 0) : null;
            return (
              <div
                key={day}
                title={`${day}: ${total === null ? "no log" : `${total.toFixed(1)} kg`}`}
                className={`heat-cell rounded-lg ring-1 ring-white/70 ${heatColor(total)}`}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
