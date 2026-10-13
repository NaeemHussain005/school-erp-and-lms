"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, Trash2 } from "lucide-react";

export default function ExamActions({
  examId,
  isPublished,
}: {
  examId: number;
  isPublished: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function onTogglePublish() {
    const next = !isPublished;
    if (!confirm(next ? "Publish these results?" : "Unpublish these results?")) return;
    setLoading("publish");
    setError("");
    try {
      const res = await fetch(`/api/exams/${examId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  }

  async function onDelete() {
    if (!confirm("Delete this exam? This cannot be undone.")) return;
    setLoading("delete");
    setError("");
    try {
      const res = await fetch(`/api/exams/${examId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete");
      router.push("/exams");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <button type="button" onClick={onTogglePublish} disabled={loading !== null} className="btn-secondary">
          {loading === "publish" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isPublished ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}{" "}
          {isPublished ? "Unpublish" : "Publish"}
        </button>
        <button type="button" onClick={onDelete} disabled={loading !== null} className="btn-secondary text-red-600">
          {loading === "delete" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete
        </button>
      </div>
      {error && <div className="text-xs text-red-600 max-w-xs text-right">{error}</div>}
    </div>
  );
}
