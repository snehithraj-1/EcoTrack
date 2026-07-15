import { useEffect, useRef, useState } from "react";
import { Camera, ImageUp, Save, Trash2, UserRound } from "lucide-react";

import { getSettings, saveSettings } from "../api";
import Toast from "../components/Toast";
import { useAuth } from "../context/auth-context";
import { DEFAULT_BUDGET } from "../utils/constants";

export default function Profile() {
  const { user, demoMode } = useAuth();
  const uploadInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [form, setForm] = useState({
    name: user.displayName || "Eco Learner",
    daily_budget: DEFAULT_BUDGET,
    country: "India",
    avatar: "",
    language: "English",
    weekly_goal: "Stay under budget 5 days this week",
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  function resizeAvatar(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve("");
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Unable to read avatar image."));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error("Unable to load avatar image."));
        image.onload = () => {
          const size = 320;
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          const scale = Math.max(size / image.width, size / image.height);
          const width = image.width * scale;
          const height = image.height * scale;
          canvas.width = size;
          canvas.height = size;
          context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    try {
      const avatar = await resizeAvatar(file);
      setForm((value) => ({ ...value, avatar }));
      setToast("Avatar ready. Save profile to store it.");
    } catch (exc) {
      setError(exc.message || "Unable to process avatar image.");
    } finally {
      event.target.value = "";
    }
  }

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      try {
        const settings = await getSettings(user.uid);
        if (active) setForm((value) => ({ ...value, ...settings }));
      } catch (exc) {
        if (active) setError(exc.response?.data?.error || "Unable to load profile settings.");
      }
    }
    loadProfile();
    return () => {
      active = false;
    };
  }, [user.uid]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const saved = await saveSettings(user.uid, { ...form, daily_budget: Number(form.daily_budget) });
      setForm(saved);
      setToast("Profile settings saved.");
    } catch (exc) {
      setError(exc.response?.data?.error || "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
      <section className="glass-panel rounded-2xl p-5 shadow-card">
        <span className="grid h-20 w-20 place-items-center overflow-hidden rounded-2xl bg-leaf-50 text-leaf-700 ring-1 ring-leaf-100">
          {form.avatar ? <img src={form.avatar} alt="Profile avatar" className="h-full w-full object-cover" /> : <UserRound className="h-8 w-8" />}
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold text-stone-950">Profile</h1>
        <div className="mt-5 space-y-3 text-sm text-stone-600">
          <p>
            <span className="font-bold text-stone-900">User:</span> {user.email || "demo@ecotrack.local"}
          </p>
          <p>
            <span className="font-bold text-stone-900">Mode:</span> {demoMode ? "Demo mode with local backend storage" : "Firebase Auth"}
          </p>
        </div>
        <div className="mt-5 grid gap-2">
          <input ref={uploadInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="user" onChange={handleAvatarChange} className="hidden" />
          <button
            type="button"
            onClick={() => uploadInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-stone-700 ring-1 ring-cyan-100 hover:text-cyan-700"
          >
            <ImageUp className="h-4 w-4" />
            Upload Avatar
          </button>
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-stone-700 ring-1 ring-cyan-100 hover:text-cyan-700"
          >
            <Camera className="h-4 w-4" />
            Take Photo
          </button>
          {form.avatar ? (
            <button
              type="button"
              onClick={() => setForm((value) => ({ ...value, avatar: "" }))}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 ring-1 ring-rose-100"
            >
              <Trash2 className="h-4 w-4" />
              Remove Avatar
            </button>
          ) : null}
        </div>
      </section>

      <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-5 shadow-card">
        <h2 className="font-display text-xl font-bold text-stone-950">Carbon preferences</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-bold text-stone-700">Name</span>
            <input
              value={form.name}
              onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))}
              className="mt-2 w-full rounded-xl border-0 bg-white px-4 py-3 text-stone-900 ring-1 ring-stone-200 focus:ring-2 focus:ring-leaf-500"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-stone-700">Daily carbon budget (kg)</span>
            <input
              type="number"
              min="1"
              step="0.1"
              value={form.daily_budget}
              onChange={(event) => setForm((value) => ({ ...value, daily_budget: event.target.value }))}
              className="mt-2 w-full rounded-xl border-0 bg-white px-4 py-3 text-stone-900 ring-1 ring-stone-200 focus:ring-2 focus:ring-leaf-500"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-stone-700">Country</span>
            <input
              value={form.country}
              onChange={(event) => setForm((value) => ({ ...value, country: event.target.value }))}
              className="mt-2 w-full rounded-xl border-0 bg-white px-4 py-3 text-stone-900 ring-1 ring-stone-200 focus:ring-2 focus:ring-leaf-500"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-stone-700">Language</span>
            <select
              value={form.language}
              onChange={(event) => setForm((value) => ({ ...value, language: event.target.value }))}
              className="mt-2 w-full rounded-xl border-0 bg-white px-4 py-3 text-stone-900 ring-1 ring-stone-200 focus:ring-2 focus:ring-leaf-500"
            >
              <option>English</option>
              <option>Hindi</option>
              <option>Telugu</option>
              <option>Spanish</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-bold text-stone-700">Weekly goal</span>
            <input
              value={form.weekly_goal}
              onChange={(event) => setForm((value) => ({ ...value, weekly_goal: event.target.value }))}
              className="mt-2 w-full rounded-xl border-0 bg-white px-4 py-3 text-stone-900 ring-1 ring-stone-200 focus:ring-2 focus:ring-leaf-500"
            />
          </label>
        </div>

        {error ? <p className="mt-5 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p> : null}

        <button type="submit" disabled={saving} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-leaf-700 px-4 py-3 text-sm font-bold text-white shadow-card disabled:opacity-70">
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Settings"}
        </button>
        <Toast message={toast} />
      </form>
    </div>
  );
}
