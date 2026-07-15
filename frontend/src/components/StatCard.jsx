export default function StatCard({ icon: Icon, label, value, helper, tone = "leaf" }) {
  const toneClasses = {
    leaf: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    sky: "bg-cyan-50 text-cyan-700 ring-cyan-100",
    rose: "bg-rose-50 text-rose-700 ring-rose-100",
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
  };
  const borderClasses = {
    leaf: "border-t-emerald-300",
    amber: "border-t-amber-300",
    sky: "border-t-cyan-300",
    rose: "border-t-rose-300",
    violet: "border-t-violet-300",
  };

  return (
    <section className={`glass-panel rounded-2xl border-t-4 p-4 shadow-card ${borderClasses[tone] || borderClasses.leaf}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-stone-500">{label}</p>
          <p className="mt-2 text-2xl font-extrabold text-stone-900">{value}</p>
        </div>
        {Icon ? (
          <span className={`grid h-11 w-11 place-items-center rounded-xl ring-1 ${toneClasses[tone]}`}>
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
      </div>
      {helper ? <p className="mt-3 text-sm text-stone-500">{helper}</p> : null}
    </section>
  );
}
