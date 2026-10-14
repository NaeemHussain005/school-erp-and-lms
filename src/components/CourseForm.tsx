"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

type ClassOpt = { id: number; name: string };
type SectionOpt = { id: number; classId: number | null; name: string };
type SubjectOpt = { id: number; name: string };

export type CourseInitial = {
  title: string;
  description: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  startDate: string;
  endDate: string;
};

const EMPTY: CourseInitial = {
  title: "",
  description: "",
  classId: "",
  sectionId: "",
  subjectId: "",
  startDate: "",
  endDate: "",
};

export default function CourseForm({
  courseId,
  initial,
  classes,
  sections,
  subjects,
}: {
  courseId?: number;
  initial?: CourseInitial;
  classes: ClassOpt[];
  sections: SectionOpt[];
  subjects: SubjectOpt[];
}) {
  const router = useRouter();
  const [f, setF] = useState<CourseInitial>(initial ?? EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const set = (k: keyof CourseInitial, v: string) => {
    setSaved(false);
    setF((s) => ({ ...s, [k]: v }));
  };
  const classSections = sections.filter((s) => String(s.classId) === f.classId);
  const label = "block text-sm font-medium text-slate-700 mb-1";

  async function onSave(e: React.MouseEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    if (!f.title.trim()) return setError("Enter the course title");
    setLoading(true);
    try {
      const res = await fetch(courseId ? `/api/courses/${courseId}` : "/api/courses", {
        method: courseId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save course");
      if (courseId) {
        setSaved(true);
        router.refresh();
      } else {
        router.push(`/lms/${data.id}`);
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
      {saved && <div className="rounded-lg bg-emerald-50 text-emerald-700 text-sm px-4 py-3">Course saved.</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className={label}>Course Title *</label>
          <input className="input" value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Mathematics - Grade 1" />
        </div>
        <div className="md:col-span-2">
          <label className={label}>Description</label>
          <textarea className="input" rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div>
          <label className={label}>Class</label>
          <select
            className="input"
            value={f.classId}
            onChange={(e) => {
              setSaved(false);
              setF((s) => ({ ...s, classId: e.target.value, sectionId: "" }));
            }}
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
        <div className="md:col-span-2">
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
          <label className={label}>Start Date</label>
          <input type="date" className="input" value={f.startDate} onChange={(e) => set("startDate", e.target.value)} />
        </div>
        <div>
          <label className={label}>End Date</label>
          <input type="date" className="input" value={f.endDate} onChange={(e) => set("endDate", e.target.value)} />
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100">
        <button type="button" onClick={onSave} disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{" "}
          {courseId ? "Save Changes" : "Create Course"}
        </button>
      </div>
    </div>
  );
}
