import { Gauge } from "lucide-react";

export default function GaugeCard({ total = 0, budget = 8 }) {
  const radius = 78;
  const stroke = 14;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.min(1.25, total / Math.max(budget, 1));
  const dashOffset = circumference - Math.min(percent, 1) * circumference;
  const remaining = budget - total;
  const status =
    percent <= 0.65
      ? { color: "#16a34a", label: "Comfortably under budget" }
      : percent <= 1
        ? { color: "#f59e0b", label: "Close to daily budget" }
        : { color: "#e11d48", label: "Budget exceeded" };

  return (
    <section className="glass-panel surface-gradient rounded-2xl p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-cyan-700">Today</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-stone-950">Carbon Gauge</h2>
        </div>
        <span className="brand-gradient grid h-11 w-11 place-items-center rounded-xl text-white ring-1 ring-white/60">
          <Gauge className="h-5 w-5" />
        </span>
      </div>

      <div className="mt-5 grid place-items-center">
        <div className="relative h-56 w-56">
          <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
            <circle cx="100" cy="100" r={radius} stroke="#dbeafe" strokeWidth={stroke} fill="none" />
            <circle
              cx="100"
              cy="100"
              r={radius}
              stroke={status.color}
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="gauge-progress"
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="font-display text-5xl font-extrabold text-stone-950">{total.toFixed(1)}</p>
              <p className="text-sm font-semibold text-stone-500">kg CO2e</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-white/70 p-4 text-center ring-1 ring-stone-200">
        <p className="text-sm font-bold" style={{ color: status.color }}>
          {status.label}
        </p>
        <p className="mt-1 text-sm text-stone-600">
          {remaining >= 0
            ? `${remaining.toFixed(1)} kg CO2e remaining from your ${budget.toFixed(1)} kg daily budget`
            : `${Math.abs(remaining).toFixed(1)} kg CO2e above your ${budget.toFixed(1)} kg daily budget`}
        </p>
      </div>
    </section>
  );
}
