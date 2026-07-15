import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BarChart3,
  CheckCircle2,
  Gauge,
  Leaf,
  LockKeyhole,
  Sparkles,
  Zap,
} from "lucide-react";

import heroImage from "../assets/hero.png";
import { useAuth } from "../context/auth-context";

const features = [
  { icon: Gauge, title: "Live carbon budget", text: "Track travel, food, and energy against a daily target with a responsive animated gauge." },
  { icon: Sparkles, title: "Groq AI suggestions", text: "Generate practical lifestyle swaps using llama-3.3-70b-versatile with local fallback tips." },
  { icon: BarChart3, title: "Analytics-ready history", text: "Review trends, category splits, heatmaps, best days, and exportable reports." },
  { icon: LockKeyhole, title: "Firebase secure", text: "Multi-user Firebase Auth with Firestore records scoped by verified user ID token." },
];

const metrics = [
  ["30 days", "trend window"],
  ["10 badges", "achievement system"],
  ["3 steps", "habit wizard"],
  ["4 charts", "analytics view"],
];

export default function Landing() {
  const { user, demoMode } = useAuth();
  const appTarget = user ? "/dashboard" : "/login";

  return (
    <main className="min-h-screen overflow-hidden">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <span className="brand-gradient grid h-11 w-11 place-items-center rounded-2xl font-black text-white shadow-card">E</span>
          <div>
            <p className="font-display text-lg font-extrabold text-stone-950">EcoTrack</p>
            <p className="text-xs font-bold text-cyan-700">{demoMode ? "Demo-ready SaaS" : "Firebase cloud SaaS"}</p>
          </div>
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/login" className="hidden rounded-xl bg-white px-4 py-2 text-sm font-bold text-stone-700 ring-1 ring-cyan-100 hover:text-cyan-700 sm:inline-flex">
            Login
          </Link>
          <Link to={appTarget} className="brand-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white shadow-card">
            Open App
            <ArrowRight className="h-4 w-4" />
          </Link>
        </nav>
      </header>

      <section className="relative min-h-[calc(100vh-84px)] px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <img
          src={heroImage}
          alt=""
          className="pointer-events-none absolute right-[3%] top-12 hidden w-[34rem] opacity-20 blur-[1px] lg:block"
        />
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="max-w-3xl">
            <p className="inline-flex rounded-full bg-white/80 px-4 py-2 text-sm font-extrabold text-cyan-800 shadow-card ring-1 ring-cyan-100">
              AI-powered personal carbon management
            </p>
            <h1 className="mt-6 font-display text-3xl font-extrabold leading-tight text-stone-950 sm:text-4xl lg:text-5xl">
              EcoTrack turns daily habits into clear climate action.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-stone-600">
              A polished full-stack dashboard for logging routines, calculating CO2e, visualizing progress, and generating personalized eco swaps with Groq.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={appTarget} className="brand-gradient inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-extrabold text-white shadow-soft">
                Launch Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/register" className="rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-stone-800 shadow-card ring-1 ring-cyan-100 hover:text-cyan-700">
                Create Account
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="glass-panel relative rounded-2xl p-5 shadow-soft"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-cyan-700">Dashboard Preview</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-stone-950">Today: 5.8 kg CO2e</h2>
              </div>
              <span className="brand-gradient grid h-12 w-12 place-items-center rounded-2xl text-white">
                <Leaf className="h-6 w-6" />
              </span>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["Travel", "1.2 kg", "bg-emerald-50 text-emerald-700"],
                ["Food", "3.1 kg", "bg-amber-50 text-amber-700"],
                ["Energy", "1.5 kg", "bg-cyan-50 text-cyan-700"],
              ].map(([label, value, tone]) => (
                <div key={label} className={`rounded-2xl p-4 ring-1 ring-white/70 ${tone}`}>
                  <p className="text-xs font-extrabold uppercase">{label}</p>
                  <p className="mt-2 font-display text-2xl font-bold">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl bg-white/80 p-4 ring-1 ring-cyan-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-stone-600">Weekly trend</span>
                <span className="text-sm font-extrabold text-emerald-700">18% lower</span>
              </div>
              <div className="mt-4 flex h-32 items-end gap-2">
                {[42, 68, 50, 76, 48, 35, 58].map((height, index) => (
                  <span
                    key={index}
                    className="flex-1 rounded-t-xl bg-gradient-to-t from-emerald-500 to-cyan-400"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/80 p-4 ring-1 ring-cyan-100">
                <div className="flex items-center gap-2 text-sm font-extrabold text-stone-800">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  AI swap
                </div>
                <p className="mt-2 text-sm text-stone-600">Swap one car trip for train to save about 0.9 kg.</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-4 ring-1 ring-cyan-100">
                <div className="flex items-center gap-2 text-sm font-extrabold text-stone-800">
                  <Award className="h-4 w-4 text-emerald-600" />
                  Badge earned
                </div>
                <p className="mt-2 text-sm text-stone-600">Green Day unlocked for staying under budget.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map(([value, label]) => (
            <div key={label} className="glass-panel rounded-2xl p-5 text-center shadow-card">
              <p className="font-display text-2xl font-extrabold text-stone-950">{value}</p>
              <p className="mt-1 text-sm font-bold text-stone-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-cyan-700">Platform</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold text-stone-950">Everything a climate dashboard needs.</h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="glass-panel rounded-2xl p-5 shadow-card">
                <span className="brand-gradient grid h-12 w-12 place-items-center rounded-2xl text-white">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-display text-xl font-bold text-stone-950">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">{feature.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-2xl p-6 shadow-soft sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr] lg:items-center">
            <div>
              <h2 className="font-display text-2xl font-extrabold text-stone-950">Built for portfolios, demos, and real Firebase cloud data.</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {["Firebase Auth", "Firestore storage", "Groq suggestions", "Carbon Interface-ready"].map((item) => (
                  <p key={item} className="flex items-center gap-2 text-sm font-bold text-stone-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    {item}
                  </p>
                ))}
              </div>
            </div>
            <Link to={appTarget} className="brand-gradient inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-extrabold text-white shadow-card">
              Start Tracking
              <Zap className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm font-semibold text-stone-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>EcoTrack carbon intelligence dashboard</p>
        <p>React + Flask + Firebase + Groq</p>
      </footer>
    </main>
  );
}
