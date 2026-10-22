"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import { Plus, Pencil, Trash2, X, Building2, MapPin, Phone, Mail, Star } from "lucide-react";

type Branch = {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  isMain: boolean | null;
  createdAt: string | null;
};

type FormState = {
  name: string;
  address: string;
  phone: string;
  email: string;
  isMain: boolean;
};

const emptyForm: FormState = {
  name: "",
  address: "",
  phone: "",
  email: "",
  isMain: false,
};

export default function BranchesBoard() {
  const [items, setItems] = useState<Branch[]>([]);
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
      const res = await fetch("/api/branches");
      const data = await res.json();
      setItems(Array.isArray(data.branches) ? data.branches : []);
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

  function openEdit(b: Branch) {
    setEditId(b.id);
    setError("");
    setForm({
      name: b.name,
      address: b.address ?? "",
      phone: b.phone ?? "",
      email: b.email ?? "",
      isMain: !!b.isMain,
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
    if (!form.name.trim()) return setError("Please enter a branch name");

    setSaving(true);
    try {
      const url = editId ? `/api/branches/${editId}` : "/api/branches";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save branch");
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
      const res = await fetch(`/api/branches/${deleteId}`, { method: "DELETE" });
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
        title="Branches"
        description="Manage multiple campuses/branches from one place."
        action="Add Branch"
        actionOnClick={openAdd}
        actionIcon={<Plus className="w-4 h-4" />}
      />

      {loading ? (
        <div className="card p-10 text-center text-sm text-slate-400">Loading…</div>
      ) : items.length === 0 ? (
        <div className="card p-10 text-center">
          <Building2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-500">No branches yet. Click “Add Branch” to create one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((b) => (
            <div key={b.id} className="card p-5 group">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-800">{b.name}</h3>
                    {b.isMain && (
                      <span className="badge-green inline-flex items-center gap-1">
                        <Star className="w-3 h-3" /> Main
                      </span>
                    )}
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-slate-600">
                    {b.address && (
                      <div className="flex items-start gap-1.5"><MapPin className="w-3.5 h-3.5 mt-0.5 text-slate-400" /> {b.address}</div>
                    )}
                    {b.phone && (
                      <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {b.phone}</div>
                    )}
                    {b.email && (
                      <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {b.email}</div>
                    )}
                    {!b.address && !b.phone && !b.email && (
                      <div className="text-slate-400">No contact details</div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => openEdit(b)} className="text-slate-400 hover:text-blue-600" title="Edit">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteId(b.id)} className="text-slate-400 hover:text-red-600" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeModal}>
          <div className="card p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">{editId ? "Edit Branch" : "Add Branch"}</h3>
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
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Branch Name</label>
                <input type="text" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Main Campus" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Address <span className="text-slate-400 normal-case">(optional)</span></label>
                <textarea className="input" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Phone <span className="text-slate-400 normal-case">(optional)</span></label>
                  <input type="text" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Email <span className="text-slate-400 normal-case">(optional)</span></label>
                  <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input type="checkbox" checked={form.isMain} onChange={(e) => setForm({ ...form, isMain: e.target.checked })} className="w-4 h-4" />
                <span className="text-sm text-slate-700">Set as main branch</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button className="btn-secondary" onClick={closeModal} disabled={saving}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving}>
                {saving ? "Saving…" : editId ? "Update Branch" : "Add Branch"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !deleting && setDeleteId(null)}>
          <div className="card p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-slate-800 mb-2">Delete branch?</h3>
            <p className="text-sm text-slate-500 mb-4">This will remove the branch. This cannot be undone.</p>
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
