"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, X } from "lucide-react";

type ClassOpt = { id: number; name: string };
type SectionOpt = { id: number; classId: number | null; name: string };
type SubjectOpt = { id: number; name: string };
type TeacherOpt = { id: number; name: string };

export type LiveClassInitial = {
  id?: number;
  title: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  meetingUrl: string;
  provider: string;
  scheduledAt: string;
  durationMinutes: string;
  description: string;
};

const EMPTY: LiveClassInitial = {
  title: "",
  classId: "",
  sectionId: "",
  subjectId: "",
  teacherId: "",
  meetingUrl: "",
  provider: "external",
  scheduledAt: "",
  durationMinutes: "45",
  description: "",
};

const PROVIDERS = [
  { value: "external", label: "Other / Link" },
  { value: "zoom", label: "Zoom" },
  { value: "google_meet", label: "Google Meet" },
  { value: "microsoft_teams", label: "Microsoft Teams" },
];

const label = "block text-sm font-medium text-slate-700 mb-1";

export default function LiveClassForm({
  initial,
  classes,
  sections,
  subjects,
  teachers,
  onDone,
  onCancel,
}: {
  initial?: LiveClassInitial;
  classes: ClassOpt[];
  sections: SectionOpt[];
  subjects: SubjectOpt[];
  teachers: TeacherOpt[];
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [f, setF] = useState<LiveClassInitial>(initial ?? EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof LiveClassInitial, v: string) => setF((s) => ({ ...s, [k]: v }));
  const editing = !!f.id;
  const classSections = sections.filter((s) => String(s.classId) === f.classId);

  async function onSave(e: React.MouseEvent) {
    e.preventDefault();
    setError("");
    if (!f.title.trim()) return setError("Enter the class title");
    setLoading(true);
    try {
      const res = await fetch(editing ? `/api/live-classes/${f.id}` : "/api/live-classes", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save class");
      router.refresh();
      onDone?.();
      if (!editing) setF(EMPTY);
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
          <label className={label}>Class Title *</label>
          <input
            className="input"
            value={f.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Algebra — Live Revision"
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
          <label className={label}>Teacher</label>
          <select className="input" value={f.teacherId} onChange={(e) => set("teacherId", e.target.value)}>
            <option value="">Not assigned</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={label}>Date &amp; Time</label>
          <input
            type="datetime-local"
            className="input"
            value={f.scheduledAt}
            onChange={(e) => set("scheduledAt", e.target.value)}
          />
        </div>

        <div>
          <label className={label}>Duration (minutes)</label>
          <input
            type="number"
            min={1}
            className="input"
            value={f.durationMinutes}
            onChange={(e) => set("durationMinutes", e.target.value)}
          />
        </div>

        <div>
          <label className={label}>Provider</label>
          <select className="input" value={f.provider} onChange={(e) => set("provider", e.target.value)}>
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={label}>Meeting Link</label>
          <input
            className="input"
            value={f.meetingUrl}
            onChange={(e) => set("meetingUrl", e.target.value)}
            placeholder="https://… (Zoom / Meet / Teams)"
          />
        </div>

        <div className="md:col-span-2">
          <label className={label}>Description</label>
          <textarea
            className="input"
            rows={2}
            value={f.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 flex gap-2">
        <button type="button" onClick={onSave} disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{" "}
          {editing ? "Save Changes" : "Schedule Class"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={loading} className="btn-secondary">
            <X className="w-4 h-4" /> Cancel
          </button>
        )}
      </div>
    </div>
  );
}
