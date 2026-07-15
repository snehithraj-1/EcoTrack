import { addDays, toDateKey } from "./date";

export const BADGE_DEFINITIONS = [
  {
    id: "first_log",
    icon: "sprout",
    name: "First Footprint",
    condition: "Log one complete day",
  },
  {
    id: "budget_keeper",
    icon: "gauge",
    name: "Budget Keeper",
    condition: "Finish a day under budget",
  },
  {
    id: "three_day_streak",
    icon: "flame",
    name: "Three-Day Streak",
    condition: "Log three days in a row",
  },
  {
    id: "week_under_budget",
    icon: "calendar",
    name: "Low-Carbon Week",
    condition: "Keep a 7-day average below budget",
  },
  {
    id: "carpool_captain",
    icon: "users",
    name: "Carpool Captain",
    condition: "Share a car trip with 2+ passengers",
  },
  {
    id: "zero_commute",
    icon: "footprints",
    name: "Zero-Emission Trip",
    condition: "Choose walking or cycling",
  },
  {
    id: "plant_plate",
    icon: "salad",
    name: "Plant Plate",
    condition: "Log a vegetarian or vegan day",
  },
  {
    id: "waste_watcher",
    icon: "recycle",
    name: "Waste Watcher",
    condition: "Log five no-waste food days",
  },
  {
    id: "power_saver",
    icon: "bolt",
    name: "Power Saver",
    condition: "Use 5 kWh or less in a day",
  },
  {
    id: "monthly_momentum",
    icon: "award",
    name: "Monthly Momentum",
    condition: "Record 20 days of history",
  },
];

function badgeMap(existingBadges = []) {
  return new Map(
    existingBadges.map((badge) => {
      if (typeof badge === "string") {
        return [badge, { id: badge, earned_at: new Date().toISOString() }];
      }
      return [badge.id, badge];
    }),
  );
}

function uniqueByDate(history = [], currentLog) {
  const rows = [...history, currentLog].filter(Boolean);
  const map = new Map();
  rows.forEach((row) => {
    if (row.date) {
      map.set(row.date, row);
    }
  });
  return [...map.values()];
}

export function currentLogStreak(history = []) {
  const dates = new Set(history.map((row) => row.date));
  let streak = 0;
  let cursor = new Date();
  while (dates.has(toDateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function currentBudgetStreak(history = [], budget = 8) {
  const byDate = new Map(history.map((row) => [row.date, row]));
  let streak = 0;
  let cursor = new Date();
  while (byDate.has(toDateKey(cursor)) && Number(byDate.get(toDateKey(cursor)).total || 0) <= budget) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function evaluateBadges(history = [], currentLog, existingBadges = [], settings = {}) {
  const rows = uniqueByDate(history, currentLog);
  const earned = badgeMap(existingBadges);
  const budget = Number(settings.daily_budget || 8);
  const latest = currentLog || rows[0] || {};
  const sevenRows = rows
    .filter((row) => row.date)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 7);
  const sevenAverage =
    sevenRows.length > 0 ? sevenRows.reduce((sum, row) => sum + Number(row.total || 0), 0) / sevenRows.length : 0;
  const noWasteDays = rows.filter((row) => row.breakdown?.food && !row.breakdown.food.food_waste).length;
  const travelMode = latest.breakdown?.travel?.mode || latest.travel_mode;
  const dietType = latest.breakdown?.food?.diet_type || latest.diet_type;

  const checks = {
    first_log: rows.length >= 1,
    budget_keeper: Number(latest.total || 0) > 0 && Number(latest.total || 0) <= budget,
    three_day_streak: currentLogStreak(rows) >= 3,
    week_under_budget: sevenRows.length >= 7 && sevenAverage <= budget,
    carpool_captain: String(travelMode || "").startsWith("car_") && Number(latest.breakdown?.travel?.passengers || 1) >= 2,
    zero_commute: travelMode === "walking" || travelMode === "bicycle",
    plant_plate: dietType === "vegetarian" || dietType === "vegan",
    waste_watcher: noWasteDays >= 5,
    power_saver: Number(latest.breakdown?.energy?.kwh || latest.kwh || 99) <= 5,
    monthly_momentum: rows.length >= 20,
  };

  BADGE_DEFINITIONS.forEach((definition) => {
    if (checks[definition.id] && !earned.has(definition.id)) {
      earned.set(definition.id, { id: definition.id, earned_at: new Date().toISOString() });
    }
  });

  return [...earned.values()];
}

export function hydrateBadges(savedBadges = [], history = [], settings = {}) {
  const earned = badgeMap(savedBadges);
  const budget = Number(settings.daily_budget || 8);
  const streak = currentLogStreak(history);
  const noWasteDays = history.filter((row) => row.breakdown?.food && !row.breakdown.food.food_waste).length;
  const underBudgetDays = history.filter((row) => Number(row.total || 0) <= budget).length;

  return BADGE_DEFINITIONS.map((definition) => {
    const saved = earned.get(definition.id);
    let progress = 0;
    if (definition.id === "three_day_streak") progress = Math.min(100, (streak / 3) * 100);
    else if (definition.id === "waste_watcher") progress = Math.min(100, (noWasteDays / 5) * 100);
    else if (definition.id === "monthly_momentum") progress = Math.min(100, (history.length / 20) * 100);
    else if (definition.id === "week_under_budget") progress = Math.min(100, (underBudgetDays / 7) * 100);
    else progress = saved ? 100 : 0;

    return {
      ...definition,
      earned: Boolean(saved),
      earned_at: saved?.earned_at,
      progress,
    };
  });
}
