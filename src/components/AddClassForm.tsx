"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";

export default function AddClassForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [numericLevel, setNumericLevel] = useState("");
  const [sections, setSections] = useState("A, B");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          numericLevel: numericLevel ? parseInt(numericLevel) : null,
          sections: sections.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed");
      setName("");
      setNumericLevel("");
      setSections("A, B");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div>
        <label className="label">Class Name *</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Grade 5" />
      </div>
      <div>
        <label className="label">Numeric Level</label>
        <input type="number" className="input" value={numericLevel} onChange={(e) => setNumericLevel(e.target.value)} placeholder="e.g. 5" />
      </div>
      <div>
        <label className="label">Sections (comma-separated)</label>
        <input className="input" value={sections} onChange={(e) => setSections(e.target.value)} placeholder="A, B, C" />
      </div>
      <button className="btn-primary w-full justify-center" disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add Class
      </button>
    </form>
  );
}
