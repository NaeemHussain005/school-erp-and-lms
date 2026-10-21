"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, X } from "lucide-react";

type ClassOpt = { id: number; name: string };
type SubjectOpt = { id: number; name: string };

export type MaterialInitial = {
  id?: number;
  title: string;
  description: string;
  type: string;
  classId: string;
  subjectId: string;
  fileUrl: string;
  externalUrl: string;
  isPublic: boolean;
};

const EMPTY: MaterialInitial = {
  title: "",
  description: "",
  type: "pdf",
  classId: "",
  subjectId: "",
  fileUrl: "",
  externalUrl: "",
  isPublic: false,
};

const TYPES = [
  { value: "pdf", label: "PDF" },
  { value: "video", label: "Video" },
  { value: "document", label: "Document" },
  { value: "link", label: "Link" },
  { value: "worksheet", label: "Worksheet" },
  { value: "past_paper", label: "Past Paper" },
  { value: "book", label: "Book" },
];

const label = "block text-sm font-medium text-slate-700 mb-1";

export default function MaterialForm({
  initial,
  classes,
  subjects,
  onDone,
  onCancel,
}: {
  initial?: MaterialInitial;
  classes: ClassOpt[];
  subjects: SubjectOpt[];
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [f, setF] = useState<MaterialInitial>(initial ?? EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof MaterialInitial, v: any) => setF((s) => ({ ...s, [k]: v }));
  const editing = !!f.id;

  async function onSave(e: React.MouseEvent) {
    e.preventDefault();
    setError("");
    if (!f.title.trim()) return setError("Enter the material title");
    if (!f.fileUrl.trim() && !f.externalUrl.trim()) {
      return setError("Add at least a file link or an external link");
    }
    setLoading(true);
    try {
      const res = await fetch(editing ? `/api/materials/${f.id}` : "/api/materials", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save material");
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
          <label className={label}>Title *</label>
          <input
            className="input"
            value={f.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Chapter 3 Worksheet — Fractions"
          />
        </div>

        <div>
          <label className={label}>Type</label>
          <select className="input" value={f.type} onChange={(e) => set("type", e.target.value)}>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={label}>Class</label>
          <select className="input" value={f.classId} onChange={(e) => set("classId", e.target.value)}>
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
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
          <label className={label}>File link</label>
          <input
            className="input"
            value={f.fileUrl}
            onChange={(e) => set("fileUrl", e.target.value)}
            placeholder="https://… (PDF, doc, etc.)"
          />
        </div>

        <div>
          <label className={label}>External link</label>
          <input
            className="input"
            value={f.externalUrl}
            onChange={(e) => set("externalUrl", e.target.value)}
            placeholder="https://… (YouTube, website, etc.)"
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

        <label className="md:col-span-2 flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={f.isPublic}
            onChange={(e) => set("isPublic", e.target.checked)}
          />
          Visible to students and parents
        </label>
      </div>

      <div className="pt-2 border-t border-slate-100 flex gap-2">
        <button type="button" onClick={onSave} disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{" "}
          {editing ? "Save Changes" : "Add Material"}
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
