"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Check } from "lucide-react";

type Row = {
  studentId: number;
  name: string;
  rollNo: string;
  marks: string;
  feedback: string;
  status: string;
};

const STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "submitted", label: "Submitted" },
  { value: "graded", label: "Graded" },
  { value: "late", label: "Late" },
  { value: "resubmit", label: "Resubmit" },
];

export default function AssignmentGradebook({
  assignmentId,
  totalMarks,
  rows,
}: {
  assignmentId: number;
  totalMarks: number;
  rows: Row[];
}) {
  const router = useRouter();
  const [data, setData] = useState<Row[]>(rows);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [error, setError] = useState("");

  function set(studentId: number, key: keyof Row, value: string) {
    setSavedId(null);
    setData((d) => d.map((r) => (r.studentId === studentId ? { ...r, [key]: value } : r)));
  }

  async function save(row: Row) {
    setSavingId(row.studentId);
    setSavedId(null);
    setError("");
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: row.studentId,
          marks: row.marks,
          feedback: row.feedback,
          status: row.status,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Could not save");
      setSavedId(row.studentId);
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingId(null);
    }
  }

  if (data.length === 0) {
    return (
      <div className="card p-8 text-center text-slate-500">
        No students found for this class/section. Assign the assignment to a class with enrolled students.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">{error}</div>}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th className="w-32">Marks (/{totalMarks})</th>
                <th className="w-36">Status</th>
                <th>Feedback</th>
                <th className="w-24 text-right">Save</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.studentId}>
                  <td>
                    <div className="font-medium text-slate-900">{r.name}</div>
                    <div className="text-xs text-slate-500">Roll {r.rollNo || "—"}</div>
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      max={totalMarks}
                      className="input !py-1.5"
                      value={r.marks}
                      onChange={(e) => set(r.studentId, "marks", e.target.value)}
                      placeholder="—"
                    />
                  </td>
                  <td>
                    <select
                      className="input !py-1.5"
                      value={r.status}
                      onChange={(e) => set(r.studentId, "status", e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      className="input !py-1.5"
                      value={r.feedback}
                      onChange={(e) => set(r.studentId, "feedback", e.target.value)}
                      placeholder="Optional comment"
                    />
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={() => save(r)}
                      disabled={savingId === r.studentId}
                      className="btn-secondary !py-1.5 text-sm"
                    >
                      {savingId === r.studentId ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : savedId === r.studentId ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
