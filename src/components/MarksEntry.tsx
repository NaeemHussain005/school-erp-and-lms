"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

type Row = {
  studentId: number;
  name: string;
  admissionNo: string;
  rollNo: string;
  obtained: string;
  absent: boolean;
  grade: string;
  position: number | null;
};

export default function MarksEntry({
  examId,
  totalMarks,
  passMarks,
  rows,
  canEdit,
}: {
  examId: number;
  totalMarks: number;
  passMarks: number;
  rows: Row[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [vals, setVals] = useState<Record<number, { obtained: string; absent: boolean }>>(() =>
    Object.fromEntries(rows.map((r) => [r.studentId, { obtained: r.obtained, absent: r.absent }]))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function setValue(id: number, patch: Partial<{ obtained: string; absent: boolean }>) {
    setSaved(false);
    setVals((v) => ({ ...v, [id]: { ...v[id], ...patch } }));
  }

  async function onSave() {
    setLoading(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch(`/api/exams/${examId}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marks: rows.map((r) => ({
            studentId: r.studentId,
            obtained: vals[r.studentId].obtained,
            absent: vals[r.studentId].absent,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save marks");
      setSaved(true);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (rows.length === 0) {
    return (
      <div className="card p-8 text-center text-slate-500">
        No students found in this class/section yet. Assign students to the class first.
      </div>
    );
  }

  return (
    <div className="card overflow-x-auto">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-slate-900">Marks Entry (out of {totalMarks})</h3>
        <span className="text-xs text-slate-500">Pass marks: {passMarks}</span>
      </div>

      {error && <div className="m-4 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">{error}</div>}
      {saved && <div className="m-4 rounded-lg bg-emerald-50 text-emerald-700 text-sm px-4 py-3">Marks saved.</div>}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
            <th className="p-3">#</th>
            <th className="p-3">Student</th>
            <th className="p-3">Marks</th>
            <th className="p-3">Absent</th>
            <th className="p-3">Result</th>
            <th className="p-3">Saved Grade</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const v = vals[r.studentId];
            const n = v.obtained === "" ? null : Number(v.obtained);
            return (
              <tr key={r.studentId} className="border-b border-slate-100">
                <td className="p-3 text-slate-500">{i + 1}</td>
                <td className="p-3">
                  <div className="font-medium text-slate-900">{r.name}</div>
                  <div className="text-xs text-slate-500">
                    {r.admissionNo}
                    {r.rollNo ? ` · Roll ${r.rollNo}` : ""}
                  </div>
                </td>
                <td className="p-3">
                  <input
                    type="number"
                    min="0"
                    max={totalMarks}
                    step="0.01"
                    className="input w-28"
                    disabled={!canEdit || v.absent}
                    value={v.absent ? "" : v.obtained}
                    onChange={(e) => setValue(r.studentId, { obtained: e.target.value })}
                  />
                </td>
                <td className="p-3">
                  <input
                    type="checkbox"
                    disabled={!canEdit}
                    checked={v.absent}
                    onChange={(e) => setValue(r.studentId, { absent: e.target.checked, obtained: "" })}
                  />
                </td>
                <td className="p-3">
                  {v.absent ? (
                    <span className="text-slate-500">Absent</span>
                  ) : n === null || isNaN(n) ? (
                    <span className="text-slate-400">—</span>
                  ) : n >= passMarks ? (
                    <span className="text-emerald-600 font-medium">Pass</span>
                  ) : (
                    <span className="text-red-600 font-medium">Fail</span>
                  )}
                </td>
                <td className="p-3 text-slate-600">
                  {r.grade ? `${r.grade}${r.position ? " · #" + r.position : ""}` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {canEdit && (
        <div className="p-4 border-t border-slate-100">
          <button type="button" onClick={onSave} disabled={loading} className="btn-primary">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Marks
          </button>
        </div>
      )}
    </div>
  );
}
