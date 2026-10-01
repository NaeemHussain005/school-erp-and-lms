"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

export default function DeleteInvoiceButton({
  invoiceId,
  redirectTo,
  compact = false,
}: {
  invoiceId: number;
  redirectTo?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (!confirm("Delete this invoice? This cannot be undone.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/fees/invoices/${invoiceId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete invoice");
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={loading}
      className={compact ? "text-red-600 hover:underline inline-flex items-center gap-1" : "btn-secondary text-red-600"}
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Delete
    </button>
  );
}
