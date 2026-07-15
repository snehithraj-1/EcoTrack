import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Award, BarChart3, Home, Lightbulb, LogOut, Menu, PlusCircle, Settings, X } from "lucide-react";

import { useAuth } from "../context/auth-context";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/log", label: "Log Today", icon: PlusCircle },
  { to: "/history", label: "History", icon: BarChart3 },
  { to: "/suggestions", label: "Suggestions", icon: Lightbulb },
  { to: "/achievements", label: "Achievements", icon: Award },
  { to: "/profile", label: "Profile", icon: Settings },
  { to: "/settings", label: "Settings", icon: Settings },
];

function LinkItem({ link, onClick }) {
  const Icon = link.icon;
  return (
    <NavLink
      to={link.to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${
          isActive ? "brand-gradient text-white shadow-card" : "text-stone-600 hover:bg-white hover:text-cyan-700"
        }`
      }
    >
      <Icon className="h-4 w-4" />
      <span>{link.label}</span>
    </NavLink>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { demoMode, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-white/80 bg-white/72 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <NavLink to="/dashboard" className="flex items-center gap-3">
          <span className="brand-gradient grid h-11 w-11 place-items-center rounded-2xl text-lg font-black text-white shadow-card">
            E
          </span>
          <div>
            <p className="font-display text-lg font-extrabold leading-tight text-stone-950">EcoTrack</p>
            {demoMode ? <p className="text-xs font-bold text-amber-700">Demo mode</p> : <p className="text-xs font-bold text-cyan-700">Firebase cloud</p>}
          </div>
        </NavLink>

        <div className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <LinkItem key={link.to} link={link} />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={signOut}
            className="hidden rounded-xl bg-white px-3 py-2 text-sm font-bold text-stone-600 ring-1 ring-cyan-100 hover:text-cyan-700 sm:flex sm:items-center sm:gap-2"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="grid h-11 w-11 place-items-center rounded-xl bg-white text-stone-700 ring-1 ring-cyan-100 lg:hidden"
            aria-label="Open navigation"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open ? (
        <div className="border-t border-white/80 px-4 pb-4 lg:hidden">
          <div className="mx-auto grid max-w-7xl gap-2 pt-3">
            {links.map((link) => (
              <LinkItem key={link.to} link={link} onClick={() => setOpen(false)} />
            ))}
            <button
              type="button"
              onClick={signOut}
              className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold text-stone-600 ring-1 ring-cyan-100"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
