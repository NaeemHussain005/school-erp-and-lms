"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, X } from "lucide-react";

type ClassOpt = { id: number; name: string };
type SectionOpt = { id: number; classId: number | null; name: string };
type SubjectOpt = { id: number; name: string };

export type AssignmentInitial = {
  id?: number;
  title: string;
  description: string;
  instructions: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  dueDate: string;
  totalMarks: string;
  allowLateSubmission: boolean;
};

const EMPTY: AssignmentInitial = {
  title: "",
  description: "",
  instructions: "",
  classId: "",
  sectionId: "",
  subjectId: "",
  dueDate: "",
  totalMarks: "100",
  allowLateSubmission: false,
};

const label = "block text-sm font-medium text-slate-700 mb-1";

export default function AssignmentForm({
  initial,
  classes,
  sections,
  subjects,
}: {
  initial?: AssignmentInitial;
  classes: ClassOpt[];
  sections: SectionOpt[];
  subjects: SubjectOpt[];
}) {
  const router = useRouter();
  const [f, setF] = useState<AssignmentInitial>(initial ?? EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const set = (k: keyof AssignmentInitial, v: any) => {
    setSaved(false);
    setF((s) => ({ ...s, [k]: v }));
  };
  const editing = !!f.id;
  const classSections = sections.filter((s) => String(s.classId) === f.classId);

  async function onSave(e: React.MouseEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    if (!f.title.trim()) return setError("Enter the assignment title");
    setLoading(true);
    try {
      const res = await fetch(editing ? `/api/assignments/${f.id}` : "/api/assignments", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save assignment");
      if (editing) {
        setSaved(true);
        router.refresh();
      } else {
        router.push(`/assignments/${data.id}`);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-6 space-y-5">
      {error && <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">{error}</div>}
      {saved && <div className="rounded-lg bg-emerald-50 text-emerald-700 text-sm px-4 py-3">Assignment saved.</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className={label}>Title *</label>
          <input
            className="input"
            value={f.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Chapter 4 — Word Problems"
          />
        </div>

        <div>
          <label className={label}>Class</label>
          <select
            className="input"
            value={f.classId}
            onChange={(e) => setF((s) => ({ ...s, classId: e.target.value, sectionId: "" }))}
          >
            <option value="">Any class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={label}>Section</label>
          <select className="input" value={f.sectionId} onChange={(e) => set("sectionId", e.target.value)}>
            <option value="">All sections</option>
            {classSections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={label}>Subject</label>
          <select className="input" value={f.subjectId} onChange={(e) => set("subjectId", e.target.value)}>
            <option value="">No subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={label}>Total Marks</label>
          <input
            type="number"
            min={1}
            className="input"
            value={f.totalMarks}
            onChange={(e) => set("totalMarks", e.target.value)}
          />
        </div>

        <div>
          <label className={label}>Due Date &amp; Time</label>
          <input
            type="datetime-local"
            className="input"
            value={f.dueDate}
            onChange={(e) => set("dueDate", e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <label className={label}>Description</label>
          <textarea
            className="input"
            rows={2}
            value={f.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Short summary for students"
          />
        </div>

        <div className="md:col-span-2">
          <label className={label}>Instructions</label>
          <textarea
            className="input"
            rows={4}
            value={f.instructions}
            onChange={(e) => set("instructions", e.target.value)}
            placeholder="Detailed instructions, what to submit, format, etc."
          />
        </div>

        <label className="md:col-span-2 flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={f.allowLateSubmission}
            onChange={(e) => set("allowLateSubmission", e.target.checked)}
          />
          Allow late submissions
        </label>
      </div>

      <div className="pt-2 border-t border-slate-100">
        <button type="button" onClick={onSave} disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{" "}
          {editing ? "Save Changes" : "Create Assignment"}
        </button>
      </div>
    </div>
  );
}
