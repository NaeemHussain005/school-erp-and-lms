"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Pencil, Trash2, Video, FileText, Link2, Save, X } from "lucide-react";

export type LessonItem = {
  id: number;
  title: string;
  description: string;
  content: string;
  videoUrl: string;
  pdfUrl: string;
  externalUrl: string;
  isPublished: boolean;
};

export type ModuleItem = {
  id: number;
  title: string;
  description: string;
  lessons: LessonItem[];
};

type LessonDraft = Omit<LessonItem, "id">;

const EMPTY_LESSON: LessonDraft = {
  title: "",
  description: "",
  content: "",
  videoUrl: "",
  pdfUrl: "",
  externalUrl: "",
  isPublished: true,
};

const isUrl = (s: string) => /^https?:\/\//i.test(s);
const label = "block text-xs font-medium text-slate-600 mb-1";

function ModuleForm({
  initial,
  busy,
  onSave,
  onCancel,
}: {
  initial: { title: string; description: string };
  busy: boolean;
  onSave: (v: { title: string; description: string }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  return (
    <div className="p-4 bg-slate-50 rounded-lg space-y-3">
      <div>
        <label className={label}>Module title *</label>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Chapter 1: Numbers" />
      </div>
      <div>
        <label className={label}>Description (optional)</label>
        <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <button type="button" disabled={busy} onClick={() => onSave({ title, description })} className="btn-primary">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
        </button>
        <button type="button" disabled={busy} onClick={onCancel} className="btn-secondary">
          <X className="w-4 h-4" /> Cancel
        </button>
      </div>
    </div>
  );
}

function LessonForm({
  initial,
  busy,
  onSave,
  onCancel,
}: {
  initial: LessonDraft;
  busy: boolean;
  onSave: (v: LessonDraft) => void;
  onCancel: () => void;
}) {
  const [f, setF] = useState<LessonDraft>(initial);
  const set = (k: keyof LessonDraft, v: any) => setF((s) => ({ ...s, [k]: v }));
  return (
    <div className="p-4 bg-slate-50 rounded-lg space-y-3">
      <div>
        <label className={label}>Lesson title *</label>
        <input className="input" value={f.title} onChange={(e) => set("title", e.target.value)} />
      </div>
      <div>
        <label className={label}>Short description (optional)</label>
        <input className="input" value={f.description} onChange={(e) => set("description", e.target.value)} />
      </div>
      <div>
        <label className={label}>Lesson text (optional)</label>
        <textarea className="input" rows={4} value={f.content} onChange={(e) => set("content", e.target.value)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className={label}>Video link</label>
          <input className="input" value={f.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="https://..." />
        </div>
        <div>
          <label className={label}>PDF link</label>
          <input className="input" value={f.pdfUrl} onChange={(e) => set("pdfUrl", e.target.value)} placeholder="https://..." />
        </div>
        <div>
          <label className={label}>Other link</label>
          <input className="input" value={f.externalUrl} onChange={(e) => set("externalUrl", e.target.value)} placeholder="https://..." />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={f.isPublished} onChange={(e) => set("isPublished", e.target.checked)} />
        Visible to students
      </label>
      <div className="flex gap-2">
        <button type="button" disabled={busy} onClick={() => onSave(f)} className="btn-primary">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Lesson
        </button>
        <button type="button" disabled={busy} onClick={onCancel} className="btn-secondary">
          <X className="w-4 h-4" /> Cancel
        </button>
      </div>
    </div>
  );
}

export default function CourseContent({
  courseId,
  modules,
  canEdit,
}: {
  courseId: number;
  modules: ModuleItem[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [addingModule, setAddingModule] = useState(false);
  const [editingModule, setEditingModule] = useState<number | null>(null);
  const [addingLesson, setAddingLesson] = useState<number | null>(null);
  const [editingLesson, setEditingLesson] = useState<number | null>(null);

  async function call(key: string, body: any): Promise<boolean> {
    setBusy(key);
    setError("");
    try {
      const res = await fetch(`/api/courses/${courseId}/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      router.refresh();
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setBusy(null);
    }
  }

  const isBusy = busy !== null;

  return (
    <div className="space-y-4">
      {error && <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">{error}</div>}

      {modules.length === 0 && !addingModule && (
        <div className="card p-8 text-center text-slate-500">
          No modules yet.{canEdit ? " Add the first module to start building the course." : ""}
        </div>
      )}

      {modules.map((m, mi) => (
        <div key={m.id} className="card">
          <div className="p-4 border-b border-slate-100 flex items-start justify-between gap-3">
            <div>
              <div className="font-bold text-slate-900">
                Module {mi + 1}: {m.title}
              </div>
              {m.description && <div className="text-sm text-slate-500 mt-0.5">{m.description}</div>}
            </div>
            {canEdit && (
              <div className="flex gap-2 flex-shrink-0">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => setEditingModule(editingModule === m.id ? null : m.id)}
                  className="text-slate-500 hover:text-blue-600"
                  title="Edit module"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={async () => {
                    if (!confirm("Delete this module and all its lessons?")) return;
                    await call("delmod-" + m.id, { action: "deleteModule", moduleId: m.id });
                  }}
                  className="text-slate-500 hover:text-red-600"
                  title="Delete module"
                >
                  {busy === "delmod-" + m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>

          <div className="p-4 space-y-3">
            {canEdit && editingModule === m.id && (
              <ModuleForm
                initial={{ title: m.title, description: m.description }}
                busy={busy === "upmod-" + m.id}
                onCancel={() => setEditingModule(null)}
                onSave={async (v) => {
                  if (await call("upmod-" + m.id, { action: "updateModule", moduleId: m.id, ...v })) setEditingModule(null);
                }}
              />
            )}

            {m.lessons.length === 0 && <p className="text-sm text-slate-500">No lessons in this module yet.</p>}

            {m.lessons.map((l, li) =>
              editingLesson === l.id ? (
                <LessonForm
                  key={l.id}
                  initial={{
                    title: l.title,
                    description: l.description,
                    content: l.content,
                    videoUrl: l.videoUrl,
                    pdfUrl: l.pdfUrl,
                    externalUrl: l.externalUrl,
                    isPublished: l.isPublished,
                  }}
                  busy={busy === "uples-" + l.id}
                  onCancel={() => setEditingLesson(null)}
                  onSave={async (v) => {
                    if (await call("uples-" + l.id, { action: "updateLesson", lessonId: l.id, ...v })) setEditingLesson(null);
                  }}
                />
              ) : (
                <div key={l.id} className="p-3 rounded-lg border border-slate-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900">
                        {li + 1}. {l.title}{" "}
                        {!l.isPublished && <span className="badge badge-slate ml-1">Hidden</span>}
                      </div>
                      {l.description && <div className="text-sm text-slate-500">{l.description}</div>}
                      {l.content && (
                        <div className="text-sm text-slate-600 mt-1 whitespace-pre-line">
                          {l.content.length > 300 ? l.content.slice(0, 300) + "…" : l.content}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-3 mt-2 text-sm">
                        {isUrl(l.videoUrl) && (
                          <a href={l.videoUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                            <Video className="w-3.5 h-3.5" /> Video
                          </a>
                        )}
                        {isUrl(l.pdfUrl) && (
                          <a href={l.pdfUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" /> PDF
                          </a>
                        )}
                        {isUrl(l.externalUrl) && (
                          <a href={l.externalUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                            <Link2 className="w-3.5 h-3.5" /> Link
                          </a>
                        )}
                      </div>
                    </div>
                    {canEdit && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => setEditingLesson(l.id)}
                          className="text-slate-500 hover:text-blue-600"
                          title="Edit lesson"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={async () => {
                            if (!confirm("Delete this lesson?")) return;
                            await call("delles-" + l.id, { action: "deleteLesson", lessonId: l.id });
                          }}
                          className="text-slate-500 hover:text-red-600"
                          title="Delete lesson"
                        >
                          {busy === "delles-" + l.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {canEdit &&
              (addingLesson === m.id ? (
                <LessonForm
                  initial={EMPTY_LESSON}
                  busy={busy === "addles-" + m.id}
                  onCancel={() => setAddingLesson(null)}
                  onSave={async (v) => {
                    if (await call("addles-" + m.id, { action: "addLesson", moduleId: m.id, ...v })) setAddingLesson(null);
                  }}
                />
              ) : (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => setAddingLesson(m.id)}
                  className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Lesson
                </button>
              ))}
          </div>
        </div>
      ))}

      {canEdit &&
        (addingModule ? (
          <div className="card p-4">
            <ModuleForm
              initial={{ title: "", description: "" }}
              busy={busy === "addmod"}
              onCancel={() => setAddingModule(false)}
              onSave={async (v) => {
                if (await call("addmod", { action: "addModule", ...v })) setAddingModule(false);
              }}
            />
          </div>
        ) : (
          <button type="button" disabled={isBusy} onClick={() => setAddingModule(true)} className="btn-secondary">
            <Plus className="w-4 h-4" /> Add Module
          </button>
        ))}
    </div>
  );
}
