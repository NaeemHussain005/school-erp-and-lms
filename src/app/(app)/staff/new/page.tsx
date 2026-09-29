"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { Save, X, Loader2 } from "lucide-react";

export default function NewStaffPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    phone: "",
    role: "teacher",
    gender: "male",
    designation: "",
    employeeId: "",
    joiningDate: new Date().toISOString().slice(0, 10),
    salary: "",
  });

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed");
      router.push("/staff");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in max-w-3xl">
      <PageHeader title="Add Staff Member" description="Add a teacher, accountant, or other school staff." backHref="/staff" />
      <form onSubmit={onSubmit} className="card p-6 space-y-4">
        {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">First Name *</label>
            <input className="input" required value={form.firstName} onChange={(e) => update("firstName", e.target.value)} />
          </div>
          <div>
            <label className="label">Last Name *</label>
            <input className="input" required value={form.lastName} onChange={(e) => update("lastName", e.target.value)} />
          </div>
          <div>
            <label className="label">Role *</label>
            <select className="input" value={form.role} onChange={(e) => update("role", e.target.value)}>
              <option value="teacher">Teacher</option>
              <option value="accountant">Accountant</option>
              <option value="librarian">Librarian</option>
              <option value="receptionist">Receptionist</option>
              <option value="exam_controller">Exam Controller</option>
              <option value="principal">Principal</option>
              <option value="vice_principal">Vice Principal</option>
              <option value="hr_manager">HR Manager</option>
            </select>
          </div>
          <div>
            <label className="label">Designation</label>
            <input className="input" value={form.designation} onChange={(e) => update("designation", e.target.value)} placeholder="e.g. Senior Teacher" />
          </div>
          <div>
            <label className="label">Email (login)</label>
            <input type="email" className="input" value={form.email} onChange={(e) => update("email", e.target.value)} />
          </div>
          <div>
            <label className="label">Username (login)</label>
            <input className="input" value={form.username} onChange={(e) => update("username", e.target.value)} />
          </div>
          <div>
            <label className="label">Password *</label>
            <input type="password" className="input" required minLength={6} value={form.password} onChange={(e) => update("password", e.target.value)} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>
          <div>
            <label className="label">Gender</label>
            <select className="input" value={form.gender} onChange={(e) => update("gender", e.target.value)}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Employee ID</label>
            <input className="input" value={form.employeeId} onChange={(e) => update("employeeId", e.target.value)} />
          </div>
          <div>
            <label className="label">Joining Date</label>
            <input type="date" className="input" value={form.joiningDate} onChange={(e) => update("joiningDate", e.target.value)} />
          </div>
          <div>
            <label className="label">Salary</label>
            <input type="number" className="input" value={form.salary} onChange={(e) => update("salary", e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <button type="button" onClick={() => router.back()} className="btn-secondary"><X className="w-4 h-4" /> Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Staff
          </button>
        </div>
      </form>
    </div>
  );
}
