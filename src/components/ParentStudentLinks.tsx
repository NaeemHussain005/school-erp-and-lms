"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Link2, X } from "lucide-react";

type Linked = { id: number; name: string; admissionNo: string };
type Option = { id: number; label: string };

export default function ParentStudentLinks({
  parentId,
  linked,
  available,
}: {
  parentId: number;
  linked: Linked[];
  available: Option[];
}) {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function onLink() {
    if (!studentId) return;
    setLoading("link");
    setError("");
    try {
      const res = await fetch(`/api/parents/${parentId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: parseInt(studentId) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not link student");
      setStudentId("");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  }

  async function onUnlink(id: number) {
    if (!confirm("Remove this student from the parent?")) return;
    setLoading("unlink-" + id);
    setError("");
    try {
      const res = await fetch(`/api/parents/${parentId}/students?studentId=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not unlink student");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="card p-6 mt-6">
      <h3 className="font-bold text-slate-900 mb-3">Linked Students</h3>
      {error && <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3 mb-3">{error}</div>}

      {linked.length === 0 ? (
        <p className="text-sm text-slate-500 mb-4">No students linked yet.</p>
      ) : (
        <div className="space-y-2 mb-4">
          {linked.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
              <a href={`/students/${s.id}`} className="text-sm font-semibold text-blue-600 hover:underline">
                {s.name} <span className="text-xs text-slate-500 font-normal">{s.admissionNo}</span>
              </a>
              <button
                type="button"
                onClick={() => onUnlink(s.id)}
                disabled={loading !== null}
                className="text-slate-400 hover:text-red-600"
                title="Unlink"
              >
                {loading === "unlink-" + s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-3">
        <select className="input flex-1" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
          <option value="">Select a student to link…</option>
          {available.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <button type="button" onClick={onLink} disabled={loading !== null || !studentId} className="btn-primary">
          {loading === "link" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />} Link Student
        </button>
      </div>
    </div>
  );
}
