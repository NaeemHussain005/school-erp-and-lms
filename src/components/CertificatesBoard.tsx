"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import { Plus, Trash2, X, FileBadge } from "lucide-react";
import { CERTIFICATE_TYPES, certificateTypeLabel } from "@/lib/certificates";

type StudentOpt = { id: number; label: string };

type Certificate = {
  id: number;
  studentId: number;
  type: string;
  title: string | null;
  certificateNo: string | null;
  issueDate: string | null;
  createdAt: string | null;
  studentName: string;
  admissionNo: string;
};

type FormState = {
  studentId: string;
  type: string;
  title: string;
  certificateNo: string;
  issueDate: string;
};

function todayStr(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

const emptyForm = (): FormState => ({
  studentId: "",
  type: "bonafide",
  title: "",
  certificateNo: "",
  issueDate: todayStr(),
});

function fmtDate(v: string | null): string {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

export default function CertificatesBoard({ students }: { students: StudentOpt[] }) {
  const [items, setItems] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  // modal
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // delete
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/certificates");
      const data = await res.json();
      setItems(Array.isArray(data.certificates) ? data.certificates : []);
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
    setError("");
    setForm(emptyForm());
    setOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setOpen(false);
    setError("");
  }

  async function save() {
    setError("");
    if (!form.studentId) return setError("Please select a student");
    if (!form.type) return setError("Please select a certificate type");

    setSaving(true);
    try {
      const payload = {
        studentId: Number(form.studentId),
        type: form.type,
        title: form.title,
        certificateNo: form.certificateNo,
        issueDate: form.issueDate || null,
      };
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not issue certificate");
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
      const res = await fetch(`/api/certificates/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteId(null);
        await load();
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Certificates Center"
        description="Issue bonafide, character, leaving and other certificates."
        action="Issue Certificate"
        actionOnClick={openAdd}
        actionIcon={<Plus className="w-4 h-4" />}
      />

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="text-sm text-slate-400 py-10 text-center">Loading…</p>
        ) : items.length === 0 ? (
          <div className="py-10 text-center">
            <FileBadge className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">No certificates issued yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <th className="p-3">Student</th>
                <th className="p-3">Type</th>
                <th className="p-3">Certificate No</th>
                <th className="p-3">Issue Date</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3">
                    <div className="font-semibold text-slate-800">{c.studentName}</div>
                    {c.admissionNo && <div className="text-xs text-slate-400">{c.admissionNo}</div>}
                  </td>
                  <td className="p-3">
                    <span className="badge-blue">{certificateTypeLabel(c.type)}</span>
                    {c.title && <div className="text-xs text-slate-500 mt-1">{c.title}</div>}
                  </td>
                  <td className="p-3 text-slate-600">{c.certificateNo || "—"}</td>
                  <td className="p-3 text-slate-600">{fmtDate(c.issueDate)}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => setDeleteId(c.id)} className="text-slate-400 hover:text-red-600" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Issue modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeModal}>
          <div className="card p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Issue Certificate</h3>
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
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Student</label>
                <select className="input" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
                  <option value="">Select student</option>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Type</label>
                <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {CERTIFICATE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Certificate No <span className="text-slate-400 normal-case">(optional)</span></label>
                  <input type="text" className="input" value={form.certificateNo} onChange={(e) => setForm({ ...form, certificateNo: e.target.value })} placeholder="e.g. BON-2026-001" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Issue Date</label>
                  <input type="date" className="input" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Title <span className="text-slate-400 normal-case">(optional)</span></label>
                <input type="text" className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Custom heading, if any" />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button className="btn-secondary" onClick={closeModal} disabled={saving}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving}>
                {saving ? "Issuing…" : "Issue Certificate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !deleting && setDeleteId(null)}>
          <div className="card p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-slate-800 mb-2">Delete certificate?</h3>
            <p className="text-sm text-slate-500 mb-4">This will remove the issued certificate record. This cannot be undone.</p>
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
