"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash2 } from "lucide-react";

export type ParentData = {
  fatherName: string;
  motherName: string;
  guardianName: string;
  relation: string;
  fatherPhone: string;
  motherPhone: string;
  fatherWhatsapp: string;
  motherWhatsapp: string;
  fatherEmail: string;
  motherEmail: string;
  fatherCnic: string;
  motherCnic: string;
  fatherOccupation: string;
  motherOccupation: string;
  address: string;
};

const EMPTY: ParentData = {
  fatherName: "",
  motherName: "",
  guardianName: "",
  relation: "father",
  fatherPhone: "",
  motherPhone: "",
  fatherWhatsapp: "",
  motherWhatsapp: "",
  fatherEmail: "",
  motherEmail: "",
  fatherCnic: "",
  motherCnic: "",
  fatherOccupation: "",
  motherOccupation: "",
  address: "",
};

const FIELDS: { key: keyof ParentData; label: string; type?: string }[] = [
  { key: "fatherName", label: "Father Name" },
  { key: "motherName", label: "Mother Name" },
  { key: "guardianName", label: "Guardian Name" },
  { key: "fatherPhone", label: "Father Phone" },
  { key: "motherPhone", label: "Mother Phone" },
  { key: "fatherWhatsapp", label: "Father WhatsApp" },
  { key: "motherWhatsapp", label: "Mother WhatsApp" },
  { key: "fatherEmail", label: "Father Email", type: "email" },
  { key: "motherEmail", label: "Mother Email", type: "email" },
  { key: "fatherCnic", label: "Father CNIC" },
  { key: "motherCnic", label: "Mother CNIC" },
  { key: "fatherOccupation", label: "Father Occupation" },
  { key: "motherOccupation", label: "Mother Occupation" },
];

export default function ParentForm({ parentId, initial }: { parentId?: number; initial?: ParentData }) {
  const router = useRouter();
  const [form, setForm] = useState<ParentData>(initial ?? EMPTY);
  const [loading, setLoading] = useState<"save" | "delete" | null>(null);
  const [error, setError] = useState("");

  const set = (k: keyof ParentData, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const label = "block text-sm font-medium text-slate-700 mb-1";

  async function onSave(e: React.MouseEvent) {
    e.preventDefault();
    if (!form.fatherName.trim() && !form.motherName.trim() && !form.guardianName.trim()) {
      setError("Enter at least one name (father, mother or guardian)");
      return;
    }
    setLoading("save");
    setError("");
    try {
      const res = await fetch(parentId ? `/api/parents/${parentId}` : "/api/parents", {
        method: parentId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      router.push(parentId ? "/parents" : `/parents/${data.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  }

  async function onDelete() {
    if (!confirm("Delete this parent? Links to students will be removed too.")) return;
    setLoading("delete");
    setError("");
    try {
      const res = await fetch(`/api/parents/${parentId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete");
      router.push("/parents");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="card p-6 space-y-5">
      {error && <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={label}>Primary Contact (Relation)</label>
          <select className="input" value={form.relation} onChange={(e) => set("relation", e.target.value)}>
            <option value="father">Father</option>
            <option value="mother">Mother</option>
            <option value="guardian">Guardian</option>
          </select>
        </div>
        <div className="hidden md:block" />
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className={label}>{f.label}</label>
            <input
              type={f.type || "text"}
              className="input"
              value={form[f.key]}
              onChange={(e) => set(f.key, e.target.value)}
            />
          </div>
        ))}
        <div className="md:col-span-2">
          <label className={label}>Address</label>
          <textarea className="input" rows={2} value={form.address} onChange={(e) => set("address", e.target.value)} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
        <button type="button" onClick={onSave} disabled={loading !== null} className="btn-primary">
          {loading === "save" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{" "}
          {parentId ? "Save Changes" : "Save Parent"}
        </button>
        {parentId && (
          <button type="button" onClick={onDelete} disabled={loading !== null} className="btn-secondary text-red-600 md:ml-auto">
            {loading === "delete" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete
          </button>
        )}
      </div>
    </div>
  );
}
