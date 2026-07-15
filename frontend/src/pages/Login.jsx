import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Leaf, Loader2, ShieldCheck } from "lucide-react";

import { useAuth } from "../context/auth-context";

export default function Login() {
  const { user, loading, demoMode, signIn, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [forgotMode, setForgotMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: { email: "", password: "", remember: true } });

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function onSubmit(values) {
    setSubmitting(true);
    try {
      if (forgotMode) {
        await resetPassword(values.email);
        toast.success("Password reset email sent.");
        setForgotMode(false);
      } else {
        await signIn(values.email, values.password, values.remember);
        toast.success(demoMode ? "Demo dashboard opened." : "Welcome back.");
        navigate("/dashboard");
      }
    } catch (exc) {
      toast.error(exc.message || "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <form onSubmit={handleSubmit(onSubmit)} className="glass-panel w-full max-w-md rounded-2xl border-t-4 border-t-cyan-400 p-6 shadow-soft">
        <Link to="/login" className="brand-gradient grid h-12 w-12 place-items-center rounded-2xl text-white">
          <Leaf className="h-7 w-7" />
        </Link>
        <h1 className="mt-5 font-display text-2xl font-bold text-stone-950">{forgotMode ? "Reset password" : "Welcome back"}</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          {demoMode ? "Firebase is not configured, so sign in to open a local demo session." : "Sign in to your secure carbon dashboard."}
        </p>
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-cyan-50 px-3 py-2 text-xs font-bold text-cyan-800 ring-1 ring-cyan-100">
          <ShieldCheck className="h-4 w-4" />
          <span>{demoMode ? "Local demo storage" : "Firebase Authentication + Firestore cloud data"}</span>
        </div>

        {!demoMode ? (
          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-bold text-stone-700">Email</span>
              <input
                type="email"
                {...register("email", { required: "Email is required" })}
                className="mt-2 w-full rounded-xl border-0 bg-white px-4 py-3 text-stone-900 ring-1 ring-cyan-100 focus:ring-2 focus:ring-cyan-500"
              />
              {errors.email ? <span className="mt-1 block text-xs font-bold text-rose-600">{errors.email.message}</span> : null}
            </label>

            {!forgotMode ? (
              <>
                <label className="block">
                  <span className="text-sm font-bold text-stone-700">Password</span>
                  <input
                    type="password"
                    {...register("password", { required: "Password is required" })}
                    className="mt-2 w-full rounded-xl border-0 bg-white px-4 py-3 text-stone-900 ring-1 ring-cyan-100 focus:ring-2 focus:ring-cyan-500"
                  />
                  {errors.password ? <span className="mt-1 block text-xs font-bold text-rose-600">{errors.password.message}</span> : null}
                </label>
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm font-bold text-stone-600">
                    <input type="checkbox" {...register("remember")} className="h-4 w-4 accent-cyan-600" />
                    Remember me
                  </label>
                  <button type="button" onClick={() => setForgotMode(true)} className="text-sm font-bold text-cyan-700">
                    Forgot password?
                  </button>
                </div>
              </>
            ) : null}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="brand-gradient mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-card disabled:opacity-70"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {demoMode ? "Sign In to Demo" : forgotMode ? "Send Reset Email" : "Sign In"}
        </button>

        {!demoMode ? (
          <div className="mt-3 grid gap-2">
            {forgotMode ? (
              <button type="button" onClick={() => setForgotMode(false)} className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-stone-700 ring-1 ring-cyan-100 hover:text-cyan-700">
                Back to login
              </button>
            ) : (
              <Link to="/register" className="rounded-xl bg-white px-4 py-3 text-center text-sm font-bold text-stone-700 ring-1 ring-cyan-100 hover:text-cyan-700">
                Create a new account
              </Link>
            )}
          </div>
        ) : null}
        {forgotMode && watch("email") ? <p className="mt-3 text-xs font-semibold text-stone-500">Reset link will be sent to {watch("email")}.</p> : null}
      </form>
    </main>
  );
}
