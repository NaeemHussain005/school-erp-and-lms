"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

type ClassOpt = { id: number; name: string };
type SectionOpt = { id: number; classId: number | null; name: string };
type SubjectOpt = { id: number; name: string };

const TYPES = [
  { v: "mid_term", l: "Mid Term" },
  { v: "final_term", l: "Final Term" },
  { v: "monthly", l: "Monthly Test" },
  { v: "weekly", l: "Weekly Test" },
  { v: "quiz", l: "Quiz" },
  { v: "assignment", l: "Assignment" },
  { v: "annual", l: "Annual" },
  { v: "unit_test", l: "Unit Test" },
];

export default function ExamForm({
  classes,
  sections,
  subjects,
}: {
  classes: ClassOpt[];
  sections: SectionOpt[];
  subjects: SubjectOpt[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    type: "mid_term",
    classId: "",
    sectionId: "",
    subjectId: "",
    startDate: "",
    totalMarks: "100",
    passMarks: "33",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const classSections = sections.filter((s) => String(s.classId) === form.classId);
  const label = "block text-sm font-medium text-slate-700 mb-1";

  async function onSave(e: React.MouseEvent) {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) return setError("Enter the exam title");
    if (!form.classId) return setError("Select a class");
    setLoading(true);
    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create exam");
      router.push(`/exams/${data.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-6 space-y-5">
      {error && <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className={label}>Exam Title *</label>
          <input
            className="input"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Mid Term - Mathematics"
          />
        </div>
        <div>
          <label className={label}>Exam Type *</label>
          <select className="input" value={form.type} onChange={(e) => set("type", e.target.value)}>
            {TYPES.map((t) => (
              <option key={t.v} value={t.v}>
                {t.l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Date</label>
          <input type="date" className="input" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
        </div>
        <div>
          <label className={label}>Class *</label>
          <select
            className="input"
            value={form.classId}
            onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value, sectionId: "" }))}
          >
            <option value="">Select class…</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Section</label>
          <select className="input" value={form.sectionId} onChange={(e) => set("sectionId", e.target.value)}>
            <option value="">All sections</option>
            {classSections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className={label}>Subject</label>
          <select className="input" value={form.subjectId} onChange={(e) => set("subjectId", e.target.value)}>
            <option value="">No subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Total Marks *</label>
          <input type="number" min="1" className="input" value={form.totalMarks} onChange={(e) => set("totalMarks", e.target.value)} />
        </div>
        <div>
          <label className={label}>Pass Marks *</label>
          <input type="number" min="0" className="input" value={form.passMarks} onChange={(e) => set("passMarks", e.target.value)} />
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100">
        <button type="button" onClick={onSave} disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Create Exam
        </button>
      </div>
    </div>
  );
}
