"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, Loader2, School } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@school.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      router.push(data.redirect || "/dashboard");
      router.refresh();
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-violet-50 p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-0 card overflow-hidden shadow-xl">
        {/* Left side */}
        <div className="hidden md:flex relative bg-gradient-to-br from-blue-600 to-violet-700 p-12 text-white flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xl font-bold">
              <School className="w-7 h-7" />
              <span>SchoolGuide</span>
            </div>
            <h1 className="mt-16 text-4xl font-bold leading-tight">
              Your complete school operating system.
            </h1>
            <p className="mt-4 text-blue-100 text-lg max-w-sm">
              ERP + LMS with attendance, fees, exams, online learning, parent portal and more — all in one.
            </p>
          </div>
          <div className="space-y-3 text-sm text-blue-100">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-white" /> Simple enough for any staff
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-white" /> Powerful enough for large schools
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-white" /> Multi-branch & multi-year ready
            </div>
          </div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-violet-400/20 blur-3xl" />
        </div>

        {/* Right side */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="md:hidden flex items-center gap-2 text-xl font-bold text-blue-600 mb-8">
            <GraduationCap className="w-7 h-7" />
            SchoolGuide
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
          <p className="text-slate-500 mt-1">Sign in to continue to your account.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label className="label">Email or Username</label>
              <input
                className="input"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@school.com"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 text-base"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Sign In
            </button>

            <div className="text-xs text-slate-500 text-center mt-2 p-3 rounded-lg bg-slate-50 border border-slate-100">
              Demo admin: <span className="font-mono font-semibold">admin@school.com</span> / <span className="font-mono font-semibold">admin123</span>
            </div>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
            <Link href="#" className="hover:text-blue-600">Forgot password?</Link>
            <Link href="#" className="hover:text-blue-600">Need help?</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
