import { Award, Bolt, CalendarCheck, Flame, Footprints, Gauge, Recycle, Salad, Sprout, Users } from "lucide-react";

const iconMap = {
  award: Award,
  bolt: Bolt,
  calendar: CalendarCheck,
  flame: Flame,
  footprints: Footprints,
  gauge: Gauge,
  recycle: Recycle,
  salad: Salad,
  sprout: Sprout,
  users: Users,
};

export default function BadgeCard({ badge }) {
  const Icon = iconMap[badge.icon] || Award;

  return (
    <article
      className={`rounded-2xl p-4 shadow-card ring-1 transition ${
        badge.earned
          ? "bg-white text-stone-900 ring-leaf-100"
          : "bg-white/60 text-stone-500 grayscale ring-stone-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${
            badge.earned ? "bg-leaf-50 text-leaf-700" : "bg-stone-100 text-stone-400"
          }`}
        >
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-base font-bold">{badge.name}</h3>
            {badge.earned ? (
              <span className="rounded-full bg-leaf-100 px-2 py-1 text-xs font-bold text-leaf-800">Earned</span>
            ) : (
              <span className="rounded-full bg-stone-100 px-2 py-1 text-xs font-bold text-stone-500">Locked</span>
            )}
          </div>
          <p className="mt-1 text-sm leading-5">{badge.condition}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
            <div
              className={`h-full rounded-full ${badge.earned ? "bg-leaf-500" : "bg-stone-300"}`}
              style={{ width: `${Math.max(8, Math.min(100, badge.progress || 0))}%` }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
