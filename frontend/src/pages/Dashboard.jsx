import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bike, CalendarDays, Flame, Leaf, TrendingDown, Zap } from "lucide-react";

import { getBadges, getHistory, getSettings } from "../api";
import GaugeCard from "../components/GaugeCard";
import StatCard from "../components/StatCard";
import { useAuth } from "../context/auth-context";
import { currentBudgetStreak } from "../utils/badges";
import { DEFAULT_BUDGET } from "../utils/constants";
import { sortDescending, toDateKey } from "../utils/date";

export default function Dashboard() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [settings, setSettings] = useState({ daily_budget: DEFAULT_BUDGET, name: "Eco Learner" });
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadDashboard() {
      try {
        const [settingsData, historyData, badgesData] = await Promise.all([
          getSettings(user.uid),
          getHistory(user.uid, 30),
          getBadges(user.uid),
        ]);
        if (!active) return;
        setSettings(settingsData);
        setHistory(historyData);
        setBadges(badgesData);
      } catch (exc) {
        if (active) setError(exc.response?.data?.error || "Unable to load dashboard data. Is Flask running on port 5000?");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadDashboard();
    return () => {
      active = false;
    };
  }, [user.uid]);

  const todayLog = history.find((row) => row.date === toDateKey()) || null;
  const budget = Number(settings.daily_budget || DEFAULT_BUDGET);

  const stats = useMemo(() => {
    const latest = sortDescending(history);
    const lastSeven = latest.slice(0, 7);
    const avg7 =
      lastSeven.length > 0 ? lastSeven.reduce((sum, row) => sum + Number(row.total || 0), 0) / lastSeven.length : 0;
    const best = latest.length ? latest.reduce((min, row) => (Number(row.total || 0) < Number(min.total || 0) ? row : min)) : null;
    return {
      avg7,
      best,
      streak: currentBudgetStreak(history, budget),
      earned: badges.length,
    };
  }, [history, budget, badges.length]);

  const todayBreakdown = todayLog?.breakdown || {};

  if (loading) {
    return <div className="glass-panel rounded-2xl p-8 text-center font-bold text-stone-600 shadow-card">Loading EcoTrack...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[1.05fr_1.95fr]">
        <GaugeCard total={Number(todayLog?.total || 0)} budget={budget} />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={TrendingDown}
            label="7-day average"
            value={`${stats.avg7.toFixed(1)} kg`}
            helper={stats.avg7 <= budget ? "Within your daily target" : "Above your daily target"}
            tone={stats.avg7 <= budget ? "leaf" : "amber"}
          />
          <StatCard
            icon={CalendarDays}
            label="Best day"
            value={stats.best ? `${Number(stats.best.total || 0).toFixed(1)} kg` : "0.0 kg"}
            helper={stats.best?.date || "No records yet"}
            tone="sky"
          />
          <StatCard icon={Flame} label="Budget streak" value={`${stats.streak} days`} helper="Consecutive under-budget days" tone="amber" />
          <StatCard icon={Leaf} label="Badges earned" value={`${stats.earned}/10`} helper="Achievement progress" tone="leaf" />
        </div>
      </section>

      {error ? <div className="rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-700 ring-1 ring-rose-100">{error}</div> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={Bike}
          label="Travel"
          value={`${Number(todayLog?.travel_emissions || 0).toFixed(1)} kg`}
          helper={todayBreakdown.travel?.label || "No travel logged today"}
          tone="leaf"
        />
        <StatCard
          icon={Leaf}
          label="Food"
          value={`${Number(todayLog?.food_emissions || 0).toFixed(1)} kg`}
          helper={todayBreakdown.food?.label || "No food logged today"}
          tone="amber"
        />
        <StatCard
          icon={Zap}
          label="Energy"
          value={`${Number(todayLog?.energy_emissions || 0).toFixed(1)} kg`}
          helper={todayBreakdown.energy ? `${todayBreakdown.energy.kwh} kWh used` : "No energy logged today"}
          tone="sky"
        />
      </section>

      <section className="glass-panel rounded-2xl p-5 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-stone-950">
              Hi {settings.name || user.displayName || "there"}, ready to trim today's footprint?
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
              Log travel, food, and energy habits to update the gauge, badges, suggestions, and history charts.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/log" className="rounded-xl bg-leaf-700 px-4 py-3 text-sm font-bold text-white shadow-card hover:bg-leaf-800">
              Log Today
            </Link>
            <Link to="/history" className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-stone-700 ring-1 ring-stone-200 hover:text-leaf-700">
              View History
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
