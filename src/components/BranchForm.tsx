"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash2 } from "lucide-react";

export type BranchInitial = {
  name: string;
  address: string;
  phone: string;
  email: string;
  isMain: boolean;
};

const EMPTY: BranchInitial = { name: "", address: "", phone: "", email: "", isMain: false };

export default function BranchForm({
  branchId,
  initial,
}: {
  branchId?: number;
  initial?: BranchInitial;
}) {
  const router = useRouter();
  const start = initial ?? EMPTY;
  const [f, setF] = useState<BranchInitial>(start);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const set = (k: keyof BranchInitial, v: any) => setF((s) => ({ ...s, [k]: v }));
  const label = "block text-sm font-medium text-slate-700 mb-1";
  const wasMain = start.isMain;

  async function post(key: string, body: any) {
    setLoading(key);
    setError("");
    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      router.push("/branches");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(null);
    }
  }

  function onSave(e: React.MouseEvent) {
    e.preventDefault();
    if (!f.name.trim()) return setError("Enter the branch name");
    post("save", { ...f, action: branchId ? "update" : "create", id: branchId });
  }

  function onDelete() {
    if (!confirm("Delete this branch? This cannot be undone.")) return;
    post("delete", { action: "delete", id: branchId });
  }

  return (
    <div className="card p-6 space-y-5">
      {error && <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className={label}>Branch Name *</label>
          <input className="input" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Jalalabad Campus" />
        </div>
        <div className="md:col-span-2">
          <label className={label}>Address</label>
          <textarea className="input" rows={2} value={f.address} onChange={(e) => set("address", e.target.value)} />
        </div>
        <div>
          <label className={label}>Phone</label>
          <input className="input" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div>
          <label className={label}>Email</label>
          <input type="email" className="input" value={f.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <label className="md:col-span-2 flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={f.isMain}
            disabled={wasMain}
            onChange={(e) => set("isMain", e.target.checked)}
          />
          Main branch
          {wasMain && <span className="text-xs text-slate-500">(to change the main branch, open another branch and tick this)</span>}
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
        <button type="button" onClick={onSave} disabled={loading !== null} className="btn-primary">
          {loading === "save" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{" "}
          {branchId ? "Save Changes" : "Add Branch"}
        </button>
        {branchId && !wasMain && (
          <button type="button" onClick={onDelete} disabled={loading !== null} className="btn-secondary text-red-600 md:ml-auto">
            {loading === "delete" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete
          </button>
        )}
      </div>
    </div>
  );
}
