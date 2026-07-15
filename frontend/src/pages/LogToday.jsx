import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";

import { calculateFootprint, getBadges, getSettings, logHabit, saveBadges } from "../api";
import Toast from "../components/Toast";
import { useAuth } from "../context/auth-context";
import { evaluateBadges } from "../utils/badges";
import { ENERGY_FACTOR, FOOD_OPTIONS, TRANSPORT_OPTIONS } from "../utils/constants";
import { toDateKey } from "../utils/date";

const steps = ["Travel", "Food", "Energy"];

function OptionButton({ active, label, helper, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl p-4 text-left ring-1 transition ${
        active ? "bg-leaf-700 text-white ring-leaf-700 shadow-card" : "bg-white text-stone-700 ring-stone-200 hover:ring-leaf-200"
      }`}
    >
      <span className="block text-sm font-extrabold">{label}</span>
      {helper ? <span className={`mt-1 block text-xs ${active ? "text-leaf-50" : "text-stone-500"}`}>{helper}</span> : null}
    </button>
  );
}

export default function LogToday() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [travel, setTravel] = useState({ travel_mode: "car_petrol", distance_km: 12, passengers: 1 });
  const [food, setFood] = useState({ diet_type: "omnivore", food_waste: false });
  const [energy, setEnergy] = useState({ kwh: 6, heating: false, ac: false });
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const preview = useMemo(() => {
    const mode = TRANSPORT_OPTIONS.find((item) => item.value === travel.travel_mode);
    const divisor = String(travel.travel_mode).startsWith("car_") ? Math.max(1, Number(travel.passengers || 1)) : 1;
    const travelKg = (Number(travel.distance_km || 0) * Number(mode?.factor || 0)) / divisor;
    const diet = FOOD_OPTIONS.find((item) => item.value === food.diet_type);
    const foodKg = Number(diet?.daily || 0) * (food.food_waste ? 1.1 : 1);
    const energyKg = Number(energy.kwh || 0) * ENERGY_FACTOR + (energy.heating ? 2 : 0) + (energy.ac ? 1.5 : 0);
    return { travel: travelKg, food: foodKg, energy: energyKg, total: travelKg + foodKg + energyKg };
  }, [travel, food, energy]);

  function validateStep() {
    setError("");
    if (step === 0 && Number(travel.distance_km) < 0) {
      setError("Distance must be a non-negative number.");
      return false;
    }
    if (step === 2 && (Number(energy.kwh) < 0 || Number(energy.kwh) > 30)) {
      setError("kWh must be between 0 and 30.");
      return false;
    }
    return true;
  }

  function nextStep(event) {
    event?.preventDefault();
    if (!validateStep()) return;
    setStep((value) => Math.min(steps.length - 1, value + 1));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validateStep()) return;
    setSubmitting(true);
    setError("");

    const payload = {
      date: toDateKey(),
      ...travel,
      distance_km: Number(travel.distance_km),
      passengers: Number(travel.passengers),
      ...food,
      ...energy,
      kwh: Number(energy.kwh),
    };

    try {
      const calculation = await calculateFootprint(payload);
      if (!calculation.success) throw new Error(calculation.error || "Calculation failed");
      const response = await logHabit(user.uid, { ...payload, calculation });
      const settings = await getSettings(user.uid);
      const existingBadges = await getBadges(user.uid);
      const earnedBadges = evaluateBadges(response.history || [], response.log, existingBadges, settings);
      await saveBadges(user.uid, earnedBadges);

      const latestLog = { ...response.log, daily_budget: settings.daily_budget };
      sessionStorage.setItem("latestLog", JSON.stringify(latestLog));
      setToast("Daily habits saved.");
      setTravel({ travel_mode: "car_petrol", distance_km: 12, passengers: 1 });
      setFood({ diet_type: "omnivore", food_waste: false });
      setEnergy({ kwh: 6, heating: false, ac: false });
      setStep(0);
      navigate("/suggestions");
    } catch (exc) {
      setError(exc.response?.data?.error || exc.message || "Unable to save today's log.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="glass-panel rounded-2xl p-5 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-leaf-700">Log Today</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-stone-950">{steps[step]} habits</h1>
          </div>
          <div className="flex gap-2">
            {steps.map((label, index) => (
              <button
                type="button"
                key={label}
                onClick={() => setStep(index)}
                className={`h-10 min-w-10 rounded-xl px-3 text-sm font-extrabold ring-1 ${
                  index === step ? "bg-leaf-700 text-white ring-leaf-700" : "bg-white text-stone-500 ring-stone-200"
                }`}
                aria-label={label}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
        <div className="glass-panel rounded-2xl p-5 shadow-card">
          {step === 0 ? (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {TRANSPORT_OPTIONS.map((option) => (
                  <OptionButton
                    key={option.value}
                    active={travel.travel_mode === option.value}
                    label={option.label}
                    helper={`${option.factor.toFixed(3)} kg/km`}
                    onClick={() => setTravel((value) => ({ ...value, travel_mode: option.value }))}
                  />
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold text-stone-700">Distance travelled (km)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={travel.distance_km}
                    onChange={(event) => setTravel((value) => ({ ...value, distance_km: event.target.value }))}
                    className="mt-2 w-full rounded-xl border-0 bg-white px-4 py-3 text-stone-900 ring-1 ring-stone-200 focus:ring-2 focus:ring-leaf-500"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-stone-700">Passengers for carpooling</span>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={travel.passengers}
                    onChange={(event) => setTravel((value) => ({ ...value, passengers: event.target.value }))}
                    className="mt-2 w-full rounded-xl border-0 bg-white px-4 py-3 text-stone-900 ring-1 ring-stone-200 focus:ring-2 focus:ring-leaf-500"
                  />
                </label>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {FOOD_OPTIONS.map((option) => (
                  <OptionButton
                    key={option.value}
                    active={food.diet_type === option.value}
                    label={option.label}
                    helper={`${option.daily.toFixed(2)} kg/day`}
                    onClick={() => setFood((value) => ({ ...value, diet_type: option.value }))}
                  />
                ))}
              </div>
              <label className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4 ring-1 ring-stone-200">
                <span>
                  <span className="block text-sm font-bold text-stone-800">Food wasted today</span>
                  <span className="block text-xs text-stone-500">Adds a 10% emissions penalty</span>
                </span>
                <input
                  type="checkbox"
                  checked={food.food_waste}
                  onChange={(event) => setFood((value) => ({ ...value, food_waste: event.target.checked }))}
                  className="h-6 w-6 accent-leaf-700"
                />
              </label>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <label className="block rounded-2xl bg-white p-5 ring-1 ring-stone-200">
                <span className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-stone-700">Electricity used</span>
                  <span className="rounded-full bg-leaf-50 px-3 py-1 text-sm font-extrabold text-leaf-700">{energy.kwh} kWh</span>
                </span>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="0.5"
                  value={energy.kwh}
                  onChange={(event) => setEnergy((value) => ({ ...value, kwh: event.target.value }))}
                  className="mt-5 w-full accent-leaf-700"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["heating", "Heating used", "+2.0 kg flat rate"],
                  ["ac", "AC used", "+1.5 kg flat rate"],
                ].map(([key, label, helper]) => (
                  <label key={key} className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4 ring-1 ring-stone-200">
                    <span>
                      <span className="block text-sm font-bold text-stone-800">{label}</span>
                      <span className="block text-xs text-stone-500">{helper}</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={energy[key]}
                      onChange={(event) => setEnergy((value) => ({ ...value, [key]: event.target.checked }))}
                      className="h-6 w-6 accent-leaf-700"
                    />
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {error ? <p className="mt-5 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p> : null}

          <div className="mt-6 flex flex-wrap justify-between gap-3">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => setStep((value) => Math.max(0, value - 1))}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-stone-700 ring-1 ring-stone-200 disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            {step < steps.length - 1 ? (
              <button type="button" onClick={nextStep} className="inline-flex items-center gap-2 rounded-xl bg-leaf-700 px-4 py-3 text-sm font-bold text-white shadow-card">
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-leaf-700 px-4 py-3 text-sm font-bold text-white shadow-card disabled:opacity-70"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {submitting ? "Saving..." : "Save & Get Suggestions"}
              </button>
            )}
          </div>
        </div>

        <aside className="glass-panel rounded-2xl p-5 shadow-card">
          <h2 className="font-display text-xl font-bold text-stone-950">Live estimate</h2>
          <div className="mt-4 space-y-3">
            {[
              ["Travel", preview.travel],
              ["Food", preview.food],
              ["Energy", preview.energy],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-xl bg-white/80 px-4 py-3 ring-1 ring-stone-200">
                <span className="text-sm font-bold text-stone-600">{label}</span>
                <span className="font-display text-lg font-bold text-stone-950">{value.toFixed(1)} kg</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl bg-leaf-700 p-4 text-white">
            <p className="text-sm font-bold text-leaf-50">Estimated total</p>
            <p className="mt-1 font-display text-4xl font-extrabold">{preview.total.toFixed(1)} kg</p>
          </div>
        </aside>
      </section>
      <Toast message={toast} />
    </form>
  );
}
