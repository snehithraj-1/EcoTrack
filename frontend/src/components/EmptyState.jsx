import { Leaf } from "lucide-react";

export default function EmptyState({ title, message, action }) {
  return (
    <div className="glass-panel rounded-2xl p-8 text-center shadow-card">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-leaf-50 text-leaf-700 ring-1 ring-leaf-100">
        <Leaf className="h-7 w-7" />
      </span>
      <h2 className="mt-4 font-display text-xl font-bold text-stone-950">{title}</h2>
      {message ? <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-stone-600">{message}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
