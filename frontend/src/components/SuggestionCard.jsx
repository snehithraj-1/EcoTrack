import { Bike, Bolt, Bus, Leaf, Recycle } from "lucide-react";

const iconMap = {
  travel: Bus,
  food: Leaf,
  energy: Bolt,
  general: Recycle,
};

const toneMap = {
  travel: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  food: "bg-amber-50 text-amber-700 ring-amber-200",
  energy: "bg-sky-50 text-sky-700 ring-sky-200",
  general: "bg-leaf-50 text-leaf-700 ring-leaf-200",
};

export default function SuggestionCard({ suggestion }) {
  const category = suggestion.category || "general";
  const Icon = iconMap[category] || Bike;
  const tone = toneMap[category] || toneMap.general;
  const saving = suggestion.estimated_savings ?? suggestion.estimatedSaving ?? 0;

  return (
    <article className="glass-panel rounded-2xl p-5 shadow-card">
      <div className="flex items-start gap-4">
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ring-1 ${tone}`}>
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg font-bold text-stone-950">{suggestion.title}</h3>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-leaf-700 ring-1 ring-leaf-100">
              Save {Number(saving || 0).toFixed(1)} kg
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-stone-600">{suggestion.description}</p>
        </div>
      </div>
    </article>
  );
}
