"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import { Plus, Pencil, Trash2, X, CalendarDays, MapPin } from "lucide-react";
import { EVENT_AUDIENCES } from "@/lib/events";

type Opt = { id: number; name: string };

type EventItem = {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  audience: string;
  classId: number | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string | null;
  className: string | null;
};

type FormState = {
  title: string;
  description: string;
  location: string;
  audience: string;
  classId: string;
  startDate: string;
  endDate: string;
};

const emptyForm: FormState = {
  title: "",
  description: "",
  location: "",
  audience: "all",
  classId: "",
  startDate: "",
  endDate: "",
};

const AUDIENCE_LABEL: Record<string, string> =
  Object.fromEntries(EVENT_AUDIENCES.map((a) => [a.value, a.label]));

// ISO string -> value for <input type="datetime-local"> (local time, no seconds)
function toLocalInput(v: string | null): string {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "";
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
}

function fmtWhen(start: string | null, end: string | null): string {
  if (!start) return "";
  const s = new Date(start);
  if (isNaN(s.getTime())) return "";
  const opts: Intl.DateTimeFormatOptions = {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  };
  const sStr = s.toLocaleString(undefined, opts);
  if (!end) return sStr;
  const e = new Date(end);
  if (isNaN(e.getTime())) return sStr;
  return `${sStr} → ${e.toLocaleString(undefined, opts)}`;
}

export default function CalendarBoard({ classes }: { classes: Opt[] }) {
  const [items, setItems] = useState<EventItem[]>([]);
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/calendar");
      const data = await res.json();
      setItems(Array.isArray(data.events) ? data.events : []);
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

  function openEdit(ev: EventItem) {
    setEditId(ev.id);
    setError("");
    setForm({
      title: ev.title,
      description: ev.description ?? "",
      location: ev.location ?? "",
      audience: ev.audience || "all",
      classId: ev.classId ? String(ev.classId) : "",
      startDate: toLocalInput(ev.startDate),
      endDate: toLocalInput(ev.endDate),
    });
    setOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setOpen(false);
    setError("");
  }

  async function save() {
    setError("");
    if (!form.title.trim()) return setError("Please enter a title");
    if (!form.startDate) return setError("Please choose a start date");

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        location: form.location,
        audience: form.audience,
        classId: form.classId || null,
        startDate: form.startDate,
        endDate: form.endDate || null,
      };
      const url = editId ? `/api/calendar/${editId}` : "/api/calendar";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save event");
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
      const res = await fetch(`/api/calendar/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteId(null);
        await load();
      }
    } finally {
      setDeleting(false);
    }
  }

  function audienceText(ev: EventItem): string {
    const base = AUDIENCE_LABEL[ev.audience] || ev.audience;
    return ev.className ? `${base} · ${ev.className}` : base;
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Calendar & Events"
        description="Holidays, exams, events, and important dates."
        action="Add Event"
        actionOnClick={openAdd}
        actionIcon={<Plus className="w-4 h-4" />}
      />

      <div className="card p-4">
        {loading ? (
          <p className="text-sm text-slate-400 py-8 text-center">Loading…</p>
        ) : items.length === 0 ? (
          <div className="py-10 text-center">
            <CalendarDays className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">No events yet. Click “Add Event” to create one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((ev) => (
              <div key={ev.id} className="group rounded-lg border border-slate-200 p-4 hover:border-blue-300 transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-800">{ev.title}</h3>
                      <span className="badge-slate">{audienceText(ev)}</span>
                    </div>
                    <div className="text-xs text-blue-600 mt-1 font-medium">{fmtWhen(ev.startDate, ev.endDate)}</div>
                    {ev.location && (
                      <div className="text-xs text-slate-500 mt-1 inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {ev.location}
                      </div>
                    )}
                    {ev.description && (
                      <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{ev.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => openEdit(ev)} className="text-slate-400 hover:text-blue-600" title="Edit">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteId(ev.id)} className="text-slate-400 hover:text-red-600" title="Delete">
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
              <h3 className="font-semibold text-slate-800">{editId ? "Edit Event" : "Add Event"}</h3>
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
                <input type="text" className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Annual Sports Day" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Start</label>
                  <input type="datetime-local" className="input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">End <span className="text-slate-400 normal-case">(optional)</span></label>
                  <input type="datetime-local" className="input" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Audience</label>
                  <select className="input" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
                    {EVENT_AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Class <span className="text-slate-400 normal-case">(optional)</span></label>
                  <select className="input" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
                    <option value="">All classes</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Location <span className="text-slate-400 normal-case">(optional)</span></label>
                <input type="text" className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Main Ground" />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Description <span className="text-slate-400 normal-case">(optional)</span></label>
                <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Details about the event…" />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button className="btn-secondary" onClick={closeModal} disabled={saving}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving}>
                {saving ? "Saving…" : editId ? "Update Event" : "Add Event"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !deleting && setDeleteId(null)}>
          <div className="card p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-slate-800 mb-2">Delete event?</h3>
            <p className="text-sm text-slate-500 mb-4">This will remove the event from the calendar. This cannot be undone.</p>
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
