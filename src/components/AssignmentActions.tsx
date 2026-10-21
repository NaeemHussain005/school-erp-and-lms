"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

export default function AssignmentActions({ assignmentId }: { assignmentId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!confirm("Delete this assignment? This cannot be undone.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/assignments/${assignmentId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete");
      router.push("/assignments");
      router.refresh();
    } catch (e: any) {
      alert(e.message);
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={onDelete} disabled={busy} className="btn-secondary">
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete
    </button>
  );
}
