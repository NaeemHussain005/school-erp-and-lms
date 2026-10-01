"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X } from "lucide-react";

export function SectionChip({ id, label }: { id: number; label: string }) {
  const router = useRouter();
  async function del() {
    if (!confirm("Delete this section?")) return;
    const res = await fetch(`/api/sections/${id}`, { method: "DELETE" });
    const d = await res.json();
    if (!res.ok) return alert(d.error || "Could not delete");
    router.refresh();
  }
  return (
    <span className="badge badge-slate inline-flex items-center gap-1">
      {label}
      <button type="button" onClick={del} title="Delete section"><X className="w-3 h-3" /></button>
    </span>
  );
}

export function ClassActions({ classId }: { classId: number }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function addSection(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    const res = await fetch("/api/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classId, name: name.trim() }),
    });
    const d = await res.json();
    setBusy(false);
    if (!res.ok) return alert(d.error || "Could not add section");
    setName("");
    router.refresh();
  }

  async function delClass() {
    if (!confirm("Delete this class and its sections?")) return;
    const res = await fetch(`/api/classes/${classId}`, { method: "DELETE" });
    const d = await res.json();
    if (!res.ok) return alert(d.error || "Could not delete");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <form onSubmit={addSection} className="flex gap-1">
        <input className="input !py-1 !w-28 text-sm" placeholder="New section" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
        <button type="submit" disabled={busy} className="btn-secondary !py-1 text-sm"><Plus className="w-3 h-3" /> Add</button>
      </form>
      <button type="button" onClick={delClass} className="ml-auto text-red-600 text-sm inline-flex items-center gap-1 hover:underline">
        <Trash2 className="w-3 h-3" /> Delete class
      </button>
    </div>
  );
}
