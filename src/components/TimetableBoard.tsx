"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import { Plus, Pencil, Trash2, X } from "lucide-react";

type Opt = { id: number; name: string };
type SectionOpt = { id: number; name: string; classId: number | null };

type Slot = {
  id: number;
  classId: number;
  sectionId: number;
  subjectId: number;
  teacherId: number;
  dayOfWeek: number;
  periodNo: number;
  startTime: string;
  endTime: string;
  roomNo: string | null;
  subjectName: string;
  teacherName: string;
};

const DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

type FormState = {
  subjectId: string;
  teacherId: string;
  dayOfWeek: string;
  periodNo: string;
  startTime: string;
  endTime: string;
  roomNo: string;
};

const emptyForm: FormState = {
  subjectId: "",
  teacherId: "",
  dayOfWeek: "1",
  periodNo: "1",
  startTime: "",
  endTime: "",
  roomNo: "",
};

export default function TimetableBoard({
  classes,
  sections,
  subjects,
  teachers,
}: {
  classes: Opt[];
  sections: SectionOpt[];
  subjects: Opt[];
  teachers: Opt[];
}) {
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);

  // modal
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // delete
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sectionsForClass = classId
    ? sections.filter((s) => String(s.classId) === classId)
    : [];

  const loadSlots = useCallback(async () => {
    if (!classId || !sectionId) {
      setSlots([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/timetable?classId=${classId}&sectionId=${sectionId}`);
      const data = await res.json();
      setSlots(Array.isArray(data.slots) ? data.slots : []);
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [classId, sectionId]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  // reset section when class changes
  function onClassChange(v: string) {
    setClassId(v);
    setSectionId("");
    setSlots([]);
  }

  function slotAt(day: number, period: number): Slot | undefined {
    return slots.find((s) => s.dayOfWeek === day && s.periodNo === period);
  }

  function openAdd(day?: number, period?: number) {
    setEditId(null);
    setError("");
    setForm({
      ...emptyForm,
      dayOfWeek: day ? String(day) : "1",
      periodNo: period ? String(period) : "1",
    });
    setOpen(true);
  }

  function openEdit(slot: Slot) {
    setEditId(slot.id);
    setError("");
    setForm({
      subjectId: String(slot.subjectId),
      teacherId: String(slot.teacherId),
      dayOfWeek: String(slot.dayOfWeek),
      periodNo: String(slot.periodNo),
      startTime: slot.startTime,
      endTime: slot.endTime,
      roomNo: slot.roomNo ?? "",
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
    if (!form.subjectId) return setError("Please select a subject");
    if (!form.teacherId) return setError("Please select a teacher");
    if (!form.startTime) return setError("Please enter a start time");
    if (!form.endTime) return setError("Please enter an end time");

    setSaving(true);
    try {
      const payload = {
        classId: Number(classId),
        sectionId: Number(sectionId),
        subjectId: Number(form.subjectId),
        teacherId: Number(form.teacherId),
        dayOfWeek: Number(form.dayOfWeek),
        periodNo: Number(form.periodNo),
        startTime: form.startTime,
        endTime: form.endTime,
        roomNo: form.roomNo,
      };
      const url = editId ? `/api/timetable/${editId}` : "/api/timetable";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save slot");
        return;
      }
      setOpen(false);
      await loadSlots();
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
      const res = await fetch(`/api/timetable/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteId(null);
        await loadSlots();
      }
    } finally {
      setDeleting(false);
    }
  }

  const ready = Boolean(classId && sectionId);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Timetable"
        description="Manage class and teacher timetables. Conflicts are prevented automatically."
        action="Create Slot"
        actionOnClick={ready ? () => openAdd() : undefined}
        actionIcon={<Plus className="w-4 h-4" />}
      />

      {/* Class + Section selectors */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Class</label>
          <select className="input" value={classId} onChange={(e) => onClassChange(e.target.value)}>
            <option value="">Select class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Section</label>
          <select
            className="input"
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            disabled={!classId}
          >
            <option value="">Select section</option>
            {sectionsForClass.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="card p-4 overflow-x-auto">
        {!ready ? (
          <p className="text-sm text-slate-500 py-8 text-center">
            Select a class and section to view its timetable.
          </p>
        ) : (
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="bg-slate-50">
                <th className="p-2 text-left font-semibold text-xs uppercase text-slate-500">Period</th>
                {DAYS.map((d) => (
                  <th key={d.value} className="p-2 text-left font-semibold text-xs uppercase text-slate-500">
                    {d.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((p) => (
                <tr key={p} className="border-t border-slate-100">
                  <td className="p-2 font-semibold text-slate-700 whitespace-nowrap">Period {p}</td>
                  {DAYS.map((d) => {
                    const slot = slotAt(d.value, p);
                    return (
                      <td key={d.value} className="p-1.5 align-top">
                        {slot ? (
                          <div className="group rounded-lg border border-slate-200 bg-white p-2 hover:border-blue-300 transition">
                            <div className="font-semibold text-slate-800 text-xs">{slot.subjectName}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{slot.teacherName}</div>
                            <div className="mt-1">
                              <span className="badge-blue">{slot.startTime}–{slot.endTime}</span>
                            </div>
                            {slot.roomNo && (
                              <div className="text-[11px] text-slate-400 mt-1">Room {slot.roomNo}</div>
                            )}
                            <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition">
                              <button onClick={() => openEdit(slot)} className="text-slate-400 hover:text-blue-600" title="Edit">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setDeleteId(slot.id)} className="text-slate-400 hover:text-red-600" title="Delete">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => openAdd(d.value, p)}
                            className="w-full h-full min-h-[52px] rounded-lg border border-dashed border-slate-200 text-slate-300 hover:text-blue-500 hover:border-blue-300 transition flex items-center justify-center"
                            title="Add slot"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {ready && loading && <p className="text-xs text-slate-400 mt-3">Loading…</p>}
      </div>

      {/* Add / Edit modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeModal}>
          <div className="card p-5 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">{editId ? "Edit Slot" : "Add Slot"}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Subject</label>
                <select className="input" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
                  <option value="">Select subject</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Teacher</label>
                <select className="input" value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })}>
                  <option value="">Select teacher</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Day</label>
                <select className="input" value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}>
                  {DAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Period</label>
                <select className="input" value={form.periodNo} onChange={(e) => setForm({ ...form, periodNo: e.target.value })}>
                  {PERIODS.map((p) => <option key={p} value={p}>Period {p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Start Time</label>
                <input type="time" className="input" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">End Time</label>
                <input type="time" className="input" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Room No <span className="text-slate-400 normal-case">(optional)</span></label>
                <input type="text" className="input" value={form.roomNo} onChange={(e) => setForm({ ...form, roomNo: e.target.value })} placeholder="e.g. 101" />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button className="btn-secondary" onClick={closeModal} disabled={saving}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving}>
                {saving ? "Saving…" : editId ? "Update Slot" : "Add Slot"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !deleting && setDeleteId(null)}>
          <div className="card p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-slate-800 mb-2">Delete slot?</h3>
            <p className="text-sm text-slate-500 mb-4">This will remove the slot from the timetable. This cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</button>
              <button
                className="btn-primary !bg-red-600 hover:!bg-red-700"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
