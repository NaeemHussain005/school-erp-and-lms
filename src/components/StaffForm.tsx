"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash2, UserX, UserCheck } from "lucide-react";

type Initial = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  isActive: boolean;
  employeeId: string;
  designation: string;
  joiningDate: string;
  salary: string;
};

export default function StaffForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const set = (k: keyof Initial, v: any) => setForm((f) => ({ ...f, [k]: v }));

  async function send(body: any, action: string) {
    setLoading(action);
    setError("");
    try {
      const res = await fetch(`/api/staff/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      router.push("/staff");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  }

  function onSave(e: React.MouseEvent) {
    e.preventDefault();
    send({ ...form, password: password || undefined }, "save");
  }

  function onToggleActive() {
    const next = !form.isActive;
    if (!confirm(next ? "Activate this staff member?" : "Deactivate this staff member?")) return;
    send({ ...form, isActive: next }, "toggle");
  }

  async function onDelete() {
    if (!confirm("Delete this staff member permanently? This cannot be undone.")) return;
    setLoading("delete");
    setError("");
    try {
      const res = await fetch(`/api/staff/${initial.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete");
      router.push("/staff");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  }

  const label = "block text-sm font-medium text-slate-700 mb-1";

  return (
    <div className="card p-6 space-y-5">
      {error && <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={label}>First Name *</label>
          <input className="input" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
        </div>
        <div>
          <label className={label}>Last Name</label>
          <input className="input" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
        </div>
        <div>
          <label className={label}>Email</label>
          <input type="email" className="input" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div>
          <label className={label}>Phone</label>
          <input className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div>
          <label className={label}>Gender</label>
          <select className="input" value={form.gender} onChange={(e) => set("gender", e.target.value)}>
            <option value="">—</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className={label}>Employee ID</label>
          <input className="input" value={form.employeeId} onChange={(e) => set("employeeId", e.target.value)} />
        </div>
        <div>
          <label className={label}>Designation</label>
          <input className="input" value={form.designation} onChange={(e) => set("designation", e.target.value)} />
        </div>
        <div>
          <label className={label}>Joining Date</label>
          <input type="date" className="input" value={form.joiningDate} onChange={(e) => set("joiningDate", e.target.value)} />
        </div>
        <div>
          <label className={label}>Salary (PKR)</label>
          <input type="number" min="0" step="0.01" className="input" value={form.salary} onChange={(e) => set("salary", e.target.value)} />
        </div>
        <div>
          <label className={label}>New Password</label>
          <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank to keep current" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
        <button type="button" onClick={onSave} disabled={loading !== null} className="btn-primary">
          {loading === "save" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
        </button>
        <button type="button" onClick={onToggleActive} disabled={loading !== null} className="btn-secondary">
          {loading === "toggle" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : form.isActive ? (
            <UserX className="w-4 h-4" />
          ) : (
            <UserCheck className="w-4 h-4" />
          )}{" "}
          {form.isActive ? "Deactivate" : "Activate"}
        </button>
        <button type="button" onClick={onDelete} disabled={loading !== null} className="btn-secondary text-red-600 md:ml-auto">
          {loading === "delete" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete
        </button>
      </div>
    </div>
  );
}
