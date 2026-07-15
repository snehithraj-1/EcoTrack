import { useEffect, useState } from "react";
import { Award, Flame, Trophy } from "lucide-react";

import { getBadges, getHistory, getSettings, saveBadges } from "../api";
import BadgeCard from "../components/BadgeCard";
import StatCard from "../components/StatCard";
import { useAuth } from "../context/auth-context";
import { currentBudgetStreak, evaluateBadges, hydrateBadges } from "../utils/badges";
import { DEFAULT_BUDGET } from "../utils/constants";

export default function Achievements() {
  const { user } = useAuth();
  const [badges, setBadges] = useState([]);
  const [history, setHistory] = useState([]);
  const [settings, setSettings] = useState({ daily_budget: DEFAULT_BUDGET });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadAchievements() {
      try {
        const [settingsData, historyData, savedBadges] = await Promise.all([
          getSettings(user.uid),
          getHistory(user.uid, 30),
          getBadges(user.uid),
        ]);
        let updatedBadges = savedBadges;
        if (historyData.length) {
          updatedBadges = evaluateBadges(historyData, historyData[0], savedBadges, settingsData);
          if (updatedBadges.length !== savedBadges.length) {
            await saveBadges(user.uid, updatedBadges);
          }
        }
        if (!active) return;
        setSettings(settingsData);
        setHistory(historyData);
        setBadges(updatedBadges);
      } catch (exc) {
        if (active) setError(exc.response?.data?.error || "Unable to load achievements.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadAchievements();
    return () => {
      active = false;
    };
  }, [user.uid]);

  const hydrated = hydrateBadges(badges, history, settings);
  const earnedCount = hydrated.filter((badge) => badge.earned).length;
  const streak = currentBudgetStreak(history, Number(settings.daily_budget || DEFAULT_BUDGET));

  if (loading) {
    return <div className="glass-panel rounded-2xl p-8 text-center font-bold text-stone-600 shadow-card">Loading achievements...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-leaf-700">Achievements</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-stone-950">Badges and streaks</h1>
      </div>

      {error ? <div className="rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-700 ring-1 ring-rose-100">{error}</div> : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Trophy} label="Badges earned" value={`${earnedCount}/10`} helper="Unlocked achievements" tone="leaf" />
        <StatCard icon={Flame} label="Budget streak" value={`${streak} days`} helper="Under-budget run" tone="amber" />
        <StatCard icon={Award} label="Completion" value={`${Math.round((earnedCount / 10) * 100)}%`} helper="Badge grid progress" tone="sky" />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {hydrated.map((badge) => (
          <BadgeCard key={badge.id} badge={badge} />
        ))}
      </section>
    </div>
  );
}
