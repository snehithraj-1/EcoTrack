import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Bell, Globe2, Moon, RotateCcw, Save, Sun, Target } from "lucide-react";

import { getSettings, resetUserData, saveSettings } from "../api";
import { useAuth } from "../context/auth-context";
import { DEFAULT_BUDGET } from "../utils/constants";

export default function Settings() {
  const { user } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem("ecotrack-theme") || "light");
  const [notifications, setNotifications] = useState(() => localStorage.getItem("ecotrack-notifications") !== "off");
  const [language, setLanguage] = useState(() => localStorage.getItem("ecotrack-language") || "English");
  const [budget, setBudget] = useState(DEFAULT_BUDGET);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark-mode", theme === "dark");
    localStorage.setItem("ecotrack-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("ecotrack-notifications", notifications ? "on" : "off");
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem("ecotrack-language", language);
  }, [language]);

  useEffect(() => {
    let active = true;
    async function loadSettings() {
      try {
        const settings = await getSettings(user.uid);
        if (active) setBudget(Number(settings.daily_budget || DEFAULT_BUDGET));
      } catch (exc) {
        toast.error(exc.response?.data?.error || "Unable to load settings.");
      }
    }
    loadSettings();
    return () => {
      active = false;
    };
  }, [user.uid]);

  async function saveBudget() {
    setSaving(true);
    try {
      await saveSettings(user.uid, { daily_budget: Number(budget), language, notifications });
      toast.success("Settings saved.");
    } catch (exc) {
      toast.error(exc.response?.data?.error || "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  }

  async function resetData() {
    const confirmed = window.confirm("Reset all EcoTrack logs and badges for this account?");
    if (!confirmed) return;
    setResetting(true);
    try {
      await resetUserData(user.uid);
      sessionStorage.removeItem("latestLog");
      toast.success("Account data reset.");
    } catch (exc) {
      toast.error(exc.response?.data?.error || "Unable to reset data.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-cyan-700">Settings</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-stone-950">Workspace preferences</h1>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="glass-panel rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-3">
            <span className="brand-gradient grid h-11 w-11 place-items-center rounded-xl text-white">
              {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </span>
            <div>
              <h2 className="font-display text-xl font-bold text-stone-950">Theme</h2>
              <p className="text-sm text-stone-500">Switch between bright dashboard and deep focus mode.</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {["light", "dark"].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTheme(option)}
                className={`rounded-xl px-4 py-3 text-sm font-extrabold capitalize ring-1 ${
                  theme === option ? "brand-gradient text-white ring-white/60" : "bg-white text-stone-700 ring-cyan-100"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </article>

        <article className="glass-panel rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
              <Bell className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold text-stone-950">Notifications</h2>
              <p className="text-sm text-stone-500">Control local reminder preferences for habit logging.</p>
            </div>
          </div>
          <label className="mt-5 flex items-center justify-between rounded-xl bg-white p-4 ring-1 ring-cyan-100">
            <span className="text-sm font-bold text-stone-700">Daily habit reminders</span>
            <input type="checkbox" checked={notifications} onChange={(event) => setNotifications(event.target.checked)} className="h-6 w-6 accent-cyan-600" />
          </label>
        </article>

        <article className="glass-panel rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
              <Globe2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold text-stone-950">Language</h2>
              <p className="text-sm text-stone-500">Store a language preference for future localization.</p>
            </div>
          </div>
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="mt-5 w-full rounded-xl border-0 bg-white px-4 py-3 text-sm font-bold text-stone-800 ring-1 ring-cyan-100 focus:ring-2 focus:ring-cyan-500"
          >
            <option>English</option>
            <option>Hindi</option>
            <option>Telugu</option>
            <option>Spanish</option>
          </select>
        </article>

        <article className="glass-panel rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <Target className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold text-stone-950">Budget</h2>
              <p className="text-sm text-stone-500">Tune the daily carbon budget used by charts and badges.</p>
            </div>
          </div>
          <label className="mt-5 block">
            <span className="text-sm font-bold text-stone-700">Daily carbon budget (kg CO2e)</span>
            <input
              type="number"
              min="1"
              step="0.1"
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
              className="mt-2 w-full rounded-xl border-0 bg-white px-4 py-3 text-stone-900 ring-1 ring-cyan-100 focus:ring-2 focus:ring-cyan-500"
            />
          </label>
          <button
            type="button"
            onClick={saveBudget}
            disabled={saving}
            className="brand-gradient mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold text-white shadow-card disabled:opacity-70"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </article>
      </section>

      <section className="glass-panel rounded-2xl border-t-4 border-t-rose-300 p-5 shadow-card">
        <h2 className="font-display text-xl font-bold text-stone-950">Reset Data</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
          Clear habit logs and earned badges for this account while keeping profile settings intact.
        </p>
        <button
          type="button"
          onClick={resetData}
          disabled={resetting}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-extrabold text-white shadow-card disabled:opacity-70"
        >
          <RotateCcw className="h-4 w-4" />
          {resetting ? "Resetting..." : "Reset Logs and Badges"}
        </button>
      </section>
    </div>
  );
}
