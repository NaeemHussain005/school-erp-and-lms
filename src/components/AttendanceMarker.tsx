"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Clock, Plane, Save, Loader2, CheckSquare } from "lucide-react";
import { studentFullName, cn } from "@/lib/utils";

type Status = "present" | "absent" | "late" | "leave";

const statusConfig: Record<Status, { label: string; color: string; bg: string; icon: any }> = {
  present: { label: "P", color: "text-emerald-700", bg: "bg-emerald-100 border-emerald-300", icon: CheckCircle2 },
  absent: { label: "A", color: "text-red-700", bg: "bg-red-100 border-red-300", icon: XCircle },
  late: { label: "L", color: "text-amber-700", bg: "bg-amber-100 border-amber-300", icon: Clock },
  leave: { label: "LV", color: "text-blue-700", bg: "bg-blue-100 border-blue-300", icon: Plane },
};

export default function AttendanceMarker({
  date,
  classId,
  sectionId,
  students,
  existingSession,
  existingRecords,
}: {
  date: string;
  classId: number;
  sectionId: number;
  students: any[];
  existingSession: any;
  existingRecords: any[];
  schoolId?: number;
}) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<number | null>(existingSession?.id || null);
  const [statuses, setStatuses] = useState<Record<number, Status>>(() => {
    const init: Record<number, Status> = {};
    for (const s of students) init[s.id] = "present";
    for (const r of existingRecords) {
      if (r.studentId && r.status) init[r.studentId] = r.status;
    }
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(t);
  }, [saved]);

  const counts = useMemo(() => {
    const c = { present: 0, absent: 0, late: 0, leave: 0 };
    for (const s of students) {
      const st = statuses[s.id] || "present";
      c[st]++;
    }
    return c;
  }, [statuses, students]);

  function markAll(status: Status) {
    const next: Record<number, Status> = {};
    for (const s of students) next[s.id] = status;
    setStatuses(next);
    setSaved(false);
  }

  function setOne(id: number, status: Status) {
    setStatuses((prev) => ({ ...prev, [id]: status }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          classId,
          sectionId,
          existingSessionId: sessionId,
          records: students.map((s) => ({ studentId: s.id, status: statuses[s.id] || "present" })),
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Failed");
      if (d.sessionId) setSessionId(d.sessionId);
      setSaved(true);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-700">Bulk mark:</span>
            <button type="button" onClick={() => markAll("present")} className="btn-secondary text-sm py-1.5">
              <CheckSquare className="w-4 h-4" /> All Present
            </button>
            <button type="button" onClick={() => markAll("absent")} className="btn-secondary text-sm py-1.5">
              All Absent
            </button>
          </div>
          <div className="flex gap-2 text-sm">
            <Count label="Present" value={counts.present} tone="emerald" />
            <Count label="Absent" value={counts.absent} tone="red" />
            <Count label="Late" value={counts.late} tone="amber" />
            <Count label="Leave" value={counts.leave} tone="blue" />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-12">#</th>
                <th>Student</th>
                <th>Roll #</th>
                <th>Gender</th>
                <th className="text-center w-72">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => {
                const current = statuses[s.id] || "present";
                const name = studentFullName(s);
                return (
                  <tr key={s.id}>
                    <td className="text-slate-500 text-sm">{i + 1}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-semibold uppercase flex-shrink-0">
                          {name.slice(0, 2)}
                        </div>
                        <span className="font-medium text-slate-900">{name}</span>
                      </div>
                    </td>
                    <td className="text-sm">{s.rollNo || "—"}</td>
                    <td className="text-sm capitalize">{s.gender || "—"}</td>
                    <td>
                      <div className="flex gap-1 justify-center">
                        {(Object.keys(statusConfig) as Status[]).map((st) => {
                          const cfg = statusConfig[st];
                          const active = current === st;
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => setOne(s.id, st)}
                              className={cn(
                                "px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition",
                                active ? cfg.bg + " " + cfg.color : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                              )}
                              title={st}
                            >
                              {cfg.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-100 flex justify-between items-center">
          <div className="text-sm text-slate-600">
            Date: <span className="font-semibold">{date}</span> · {students.length} students
          </div>
          <button type="button" onClick={save} disabled={saving} className="btn-primary px-6">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {sessionId ? "Update Attendance" : "Save Attendance"}
          </button>
        </div>
        {saved && <div className="px-4 pb-4 text-sm text-emerald-700">✓ Attendance saved successfully.</div>}
      </div>
    </div>
  );
}

function Count({ label, value, tone }: { label: string; value: number; tone: string }) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-red-50 text-red-700 border-red-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
  };
  return (
    <div className={cn("px-2.5 py-1 rounded-lg border text-xs font-semibold", colors[tone])}>
      {label}: {value}
    </div>
  );
}
