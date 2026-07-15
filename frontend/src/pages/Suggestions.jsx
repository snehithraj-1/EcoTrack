import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw } from "lucide-react";

import { generateSuggestions, getHistory, getSettings } from "../api";
import EmptyState from "../components/EmptyState";
import SuggestionCard from "../components/SuggestionCard";
import SuggestionSkeleton from "../components/SuggestionSkeleton";
import { useAuth } from "../context/auth-context";
import { DEFAULT_BUDGET } from "../utils/constants";
import { sortDescending, toDateKey } from "../utils/date";

function flattenContext(log, settings) {
  if (!log) return null;
  return {
    ...log,
    daily_budget: Number(settings.daily_budget || DEFAULT_BUDGET),
    travel_mode: log.breakdown?.travel?.mode || log.travel_mode,
    distance_km: log.breakdown?.travel?.distance_km || log.distance_km,
    diet_type: log.breakdown?.food?.diet_type || log.diet_type,
    food_waste: log.breakdown?.food?.food_waste ?? log.food_waste,
    kwh: log.breakdown?.energy?.kwh || log.kwh,
    heating: log.breakdown?.energy?.heating ?? log.heating,
    ac: log.breakdown?.energy?.ac ?? log.ac,
  };
}

export default function Suggestions() {
  const { user } = useAuth();
  const [context, setContext] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSuggestions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const settings = await getSettings(user.uid);
      const stored = sessionStorage.getItem("latestLog");
      const latestFromSession = stored ? JSON.parse(stored) : null;
      const history = latestFromSession ? [] : await getHistory(user.uid, 30);
      const latest = latestFromSession || history.find((row) => row.date === toDateKey()) || sortDescending(history)[0];
      const dailyContext = flattenContext(latest, settings);
      setContext(dailyContext);
      if (!dailyContext) {
        setSuggestions([]);
        return;
      }
      const response = await generateSuggestions(dailyContext);
      setSuggestions(response.suggestions || []);
      setSource(response.source || "");
    } catch (exc) {
      setError(exc.response?.data?.error || "Unable to generate suggestions.");
    } finally {
      setLoading(false);
    }
  }, [user.uid]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-leaf-700">Suggestions</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-stone-950">Preparing eco swaps</h1>
        </div>
        {[0, 1, 2].map((item) => (
          <SuggestionSkeleton key={item} />
        ))}
      </div>
    );
  }

  if (!context) {
    return (
      <EmptyState
        title="Log a day to unlock suggestions"
        message="EcoTrack uses your latest travel, food, and energy breakdown to shape recommendations."
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
      <section className="glass-panel rounded-2xl p-5 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-leaf-700">Suggestions</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-stone-950">AI eco swaps</h1>
            <p className="mt-2 text-sm text-stone-600">
              Based on {Number(context.total || 0).toFixed(1)} kg CO2e logged on {context.date}.
            </p>
          </div>
          <button
            type="button"
            onClick={loadSuggestions}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-stone-700 ring-1 ring-stone-200 hover:text-leaf-700"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </section>

      {error ? <div className="rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-700 ring-1 ring-rose-100">{error}</div> : null}
      {source ? <p className="text-xs font-bold uppercase tracking-[0.12em] text-stone-500">Source: {source}</p> : null}

      <section className="grid gap-4">
        {suggestions.map((suggestion, index) => (
          <SuggestionCard key={`${suggestion.title}-${index}`} suggestion={suggestion} />
        ))}
      </section>
    </div>
  );
}
