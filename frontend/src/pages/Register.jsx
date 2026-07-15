import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Leaf, Loader2, ShieldCheck } from "lucide-react";

import { useAuth } from "../context/auth-context";

export default function Register() {
  const { user, loading, demoMode, signUp } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { name: "", email: "", password: "" } });

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function onSubmit(values) {
    setSubmitting(true);
    try {
      await signUp(values.name, values.email, values.password);
      toast.success(demoMode ? "Demo account opened." : "Account created.");
      navigate("/dashboard");
    } catch (exc) {
      toast.error(exc.message || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <form onSubmit={handleSubmit(onSubmit)} className="glass-panel w-full max-w-md rounded-2xl border-t-4 border-t-emerald-400 p-6 shadow-soft">
        <Link to="/login" className="brand-gradient grid h-12 w-12 place-items-center rounded-2xl text-white">
          <Leaf className="h-7 w-7" />
        </Link>
        <h1 className="mt-5 font-display text-2xl font-bold text-stone-950">Create your account</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">Start tracking carbon habits with Firebase-backed multi-user storage.</p>
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 ring-1 ring-emerald-100">
          <ShieldCheck className="h-4 w-4" />
          <span>{demoMode ? "Demo mode enabled" : "Email/Password Authentication"}</span>
        </div>

        {!demoMode ? (
          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-bold text-stone-700">Name</span>
              <input
                {...register("name", { required: "Name is required" })}
                className="mt-2 w-full rounded-xl border-0 bg-white px-4 py-3 text-stone-900 ring-1 ring-emerald-100 focus:ring-2 focus:ring-emerald-500"
              />
              {errors.name ? <span className="mt-1 block text-xs font-bold text-rose-600">{errors.name.message}</span> : null}
            </label>
            <label className="block">
              <span className="text-sm font-bold text-stone-700">Email</span>
              <input
                type="email"
                {...register("email", { required: "Email is required" })}
                className="mt-2 w-full rounded-xl border-0 bg-white px-4 py-3 text-stone-900 ring-1 ring-emerald-100 focus:ring-2 focus:ring-emerald-500"
              />
              {errors.email ? <span className="mt-1 block text-xs font-bold text-rose-600">{errors.email.message}</span> : null}
            </label>
            <label className="block">
              <span className="text-sm font-bold text-stone-700">Password</span>
              <input
                type="password"
                {...register("password", { required: "Password is required", minLength: { value: 6, message: "Use at least 6 characters" } })}
                className="mt-2 w-full rounded-xl border-0 bg-white px-4 py-3 text-stone-900 ring-1 ring-emerald-100 focus:ring-2 focus:ring-emerald-500"
              />
              {errors.password ? <span className="mt-1 block text-xs font-bold text-rose-600">{errors.password.message}</span> : null}
            </label>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="brand-gradient mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-card disabled:opacity-70"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {demoMode ? "Open Demo Account" : "Create Account"}
        </button>
        <Link to="/login" className="mt-3 block rounded-xl bg-white px-4 py-3 text-center text-sm font-bold text-stone-700 ring-1 ring-emerald-100 hover:text-emerald-700">
          Already have an account?
        </Link>
      </form>
    </main>
  );
}
