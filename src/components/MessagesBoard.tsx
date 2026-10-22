"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import { Plus, Pencil, Trash2, X, Megaphone } from "lucide-react";
import { AUDIENCES, PRIORITIES } from "@/lib/announcements";

type Opt = { id: number; name: string };
type SectionOpt = { id: number; name: string; classId: number | null };

type Announcement = {
  id: number;
  title: string;
  message: string;
  audience: string;
  classId: number | null;
  sectionId: number | null;
  priority: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string | null;
  className: string | null;
};

type FormState = {
  title: string;
  message: string;
  audience: string;
  classId: string;
  sectionId: string;
  priority: string;
  startDate: string;
  endDate: string;
};

const emptyForm: FormState = {
  title: "",
  message: "",
  audience: "all",
  classId: "",
  sectionId: "",
  priority: "normal",
  startDate: "",
  endDate: "",
};

const PRIORITY_BADGE: Record<string, string> = {
  low: "badge-slate",
  normal: "badge-blue",
  high: "badge-yellow",
};

const AUDIENCE_LABEL: Record<string, string> =
  Object.fromEntries(AUDIENCES.map((a) => [a.value, a.label]));

function toDateInput(v: string | null): string {
  if (!v) return "";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function fmtDate(v: string | null): string {
  if (!v) return "";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString();
}

export default function MessagesBoard({
  classes,
  sections,
}: {
  classes: Opt[];
  sections: SectionOpt[];
}) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // modal
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // delete
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sectionsForClass = form.classId
    ? sections.filter((s) => String(s.classId) === form.classId)
    : [];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      setItems(Array.isArray(data.announcements) ? data.announcements : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setEditId(null);
    setError("");
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(a: Announcement) {
    setEditId(a.id);
    setError("");
    setForm({
      title: a.title,
      message: a.message,
      audience: a.audience || "all",
      classId: a.classId ? String(a.classId) : "",
      sectionId: a.sectionId ? String(a.sectionId) : "",
      priority: a.priority || "normal",
      startDate: toDateInput(a.startDate),
      endDate: toDateInput(a.endDate),
    });
    setOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setOpen(false);
    setError("");
  }

  function setClass(v: string) {
    setForm((f) => ({ ...f, classId: v, sectionId: "" }));
  }

  async function save() {
    setError("");
    if (!form.title.trim()) return setError("Please enter a title");
    if (!form.message.trim()) return setError("Please enter a message");

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        message: form.message,
        audience: form.audience,
        classId: form.classId || null,
        sectionId: form.sectionId || null,
        priority: form.priority,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      };
      const url = editId ? `/api/messages/${editId}` : "/api/messages";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save message");
        return;
      }
      setOpen(false);
      await load();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/messages/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteId(null);
        await load();
      }
    } finally {
      setDeleting(false);
    }
  }

  function audienceText(a: Announcement): string {
    const base = AUDIENCE_LABEL[a.audience] || a.audience;
    if (a.className) return `${base} · ${a.className}`;
    return base;
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Messages"
        description="Post announcements and notices to your school."
        action="New Message"
        actionOnClick={openAdd}
        actionIcon={<Plus className="w-4 h-4" />}
      />

      <div className="card p-4">
        {loading ? (
          <p className="text-sm text-slate-400 py-8 text-center">Loading…</p>
        ) : items.length === 0 ? (
          <div className="py-10 text-center">
            <Megaphone className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">No messages yet. Click “New Message” to post one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((a) => (
              <div key={a.id} className="group rounded-lg border border-slate-200 p-4 hover:border-blue-300 transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-800">{a.title}</h3>
                      <span className={PRIORITY_BADGE[a.priority] || "badge-slate"}>{a.priority}</span>
                      <span className="badge-slate">{audienceText(a)}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{a.message}</p>
                    {(a.startDate || a.endDate) && (
                      <p className="text-xs text-slate-400 mt-2">
                        {fmtDate(a.startDate)}{a.endDate ? ` – ${fmtDate(a.endDate)}` : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => openEdit(a)} className="text-slate-400 hover:text-blue-600" title="Edit">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteId(a.id)} className="text-slate-400 hover:text-red-600" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeModal}>
          <div className="card p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">{editId ? "Edit Message" : "New Message"}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Title</label>
                <input type="text" className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Parent-Teacher Meeting" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Message</label>
                <textarea className="input" rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Write the announcement…" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Audience</label>
                  <select className="input" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
                    {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Priority</label>
                  <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Class <span className="text-slate-400 normal-case">(optional)</span></label>
                  <select className="input" value={form.classId} onChange={(e) => setClass(e.target.value)}>
                    <option value="">All classes</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Section <span className="text-slate-400 normal-case">(optional)</span></label>
                  <select className="input" value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })} disabled={!form.classId}>
                    <option value="">All sections</option>
                    {sectionsForClass.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Start Date <span className="text-slate-400 normal-case">(optional)</span></label>
                  <input type="date" className="input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">End Date <span className="text-slate-400 normal-case">(optional)</span></label>
                  <input type="date" className="input" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button className="btn-secondary" onClick={closeModal} disabled={saving}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving}>
                {saving ? "Saving…" : editId ? "Update Message" : "Post Message"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !deleting && setDeleteId(null)}>
          <div className="card p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-slate-800 mb-2">Delete message?</h3>
            <p className="text-sm text-slate-500 mb-4">This will remove the announcement. This cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</button>
              <button className="btn-primary !bg-red-600 hover:!bg-red-700" onClick={confirmDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
