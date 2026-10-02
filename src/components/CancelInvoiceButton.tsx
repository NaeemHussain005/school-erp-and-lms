"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Loader2 } from "lucide-react";

export default function CancelInvoiceButton({
  invoiceId,
  compact = false,
}: {
  invoiceId: number;
  compact?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onCancel() {
    if (
      !confirm(
        "Cancel this invoice? Payments already recorded will stay in the history, but the invoice will no longer count as due."
      )
    )
      return;
    setLoading(true);
    try {
      const res = await fetch(`/api/fees/invoices/${invoiceId}`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not cancel invoice");
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
      onClick={onCancel}
      disabled={loading}
      className={compact ? "text-amber-600 hover:underline inline-flex items-center gap-1" : "btn-secondary text-amber-600"}
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />} Cancel Invoice
    </button>
  );
}
