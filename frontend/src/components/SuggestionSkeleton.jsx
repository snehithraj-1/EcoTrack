export default function SuggestionSkeleton() {
  return (
    <div className="glass-panel rounded-2xl p-5 shadow-card">
      <div className="flex gap-4">
        <div className="pulse-card h-12 w-12 rounded-xl bg-stone-200" />
        <div className="flex-1 space-y-3">
          <div className="pulse-card h-5 w-2/3 rounded bg-stone-200" />
          <div className="pulse-card h-4 w-full rounded bg-stone-200" />
          <div className="pulse-card h-4 w-5/6 rounded bg-stone-200" />
        </div>
      </div>
    </div>
  );
}
