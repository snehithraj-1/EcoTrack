import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="glass-panel max-w-lg rounded-2xl p-8 text-center shadow-soft">
        <span className="brand-gradient mx-auto grid h-14 w-14 place-items-center rounded-2xl text-white">
          <Compass className="h-7 w-7" />
        </span>
        <h1 className="mt-5 font-display text-4xl font-extrabold text-stone-950">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">The route you opened does not exist in EcoTrack.</p>
        <Link to="/login" className="brand-gradient mt-6 inline-flex rounded-2xl px-5 py-3 text-sm font-extrabold text-white shadow-card">
          Back to Login
        </Link>
      </section>
    </main>
  );
}
