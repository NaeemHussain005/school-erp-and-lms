"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { Save, Loader2, Plus, Trash2, MessageCircle } from "lucide-react";
import { formatCurrency, monthName, whatsappLink } from "@/lib/utils";

interface StudentOption {
  id: number;
  label: string;
  className?: string;
  fatherName?: string;
  whatsapp?: string;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const params = useSearchParams();
  const presetStudent = params.get("studentId");

  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<any>(null);

  const today = new Date();
  const [form, setForm] = useState({
    studentId: presetStudent ? parseInt(presetStudent) : "",
    month: monthName(today.getMonth() + 1),
    issueDate: today.toISOString().slice(0, 10),
    dueDate: new Date(today.getFullYear(), today.getMonth(), 10).toISOString().slice(0, 10),
    discountAmount: 0,
    discountReason: "",
    fineAmount: 0,
    notes: "",
    isScholarship: false,
    scholarshipPercent: 0,
  });
  const [items, setItems] = useState<{ title: string; amount: any }[]>([
    { title: "Tuition Fee", amount: "" },
  ]);

  useEffect(() => {
    fetch("/api/students/options")
      .then((r) => r.json())
      .then((d) => {
        setStudents(d.students || []);
        setLoadingStudents(false);
      })
      .catch(() => setLoadingStudents(false));
  }, [presetStudent]);

  const subtotal = items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
  const discountNum = Number(form.discountAmount) || 0;
  const scholarshipAmount = form.isScholarship ? (subtotal * (Number(form.scholarshipPercent) || 0)) / 100 : 0;
  const totalDiscount = discountNum + scholarshipAmount;
  const fineNum = Number(form.fineAmount) || 0;
  const total = Math.max(0, subtotal - totalDiscount + fineNum);

  function addItem() {
    setItems([...items, { title: "", amount: "" }]);
  }
  function removeItem(i: number) {
    setItems(items.filter((_, idx) => idx !== i));
  }
  function updateItem(i: number, key: "title" | "amount", value: any) {
    const copy = [...items];
    (copy[i] as any)[key] = value;
    setItems(copy);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (subtotal <= 0) {
      setError("Please enter an amount greater than 0.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess(null);
    try {
      const res = await fetch("/api/fees/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: items.map((it) => ({ title: it.title, amount: Number(it.amount) || 0 })),
          subtotal,
          total,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create invoice");
      setSuccess(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (success) {
    const student = students.find((s) => s.id === success.studentId);
    const finalTotal = Number(success.total ?? total);
    const whatsappMsg = `Dear Parent,\n\nThis is to inform you that the fee invoice for ${student?.label || "your child"}${student?.className ? ", " + student.className : ""}, for ${form.month} has been generated.\n\nInvoice No: ${success.invoiceNo}\nAmount: PKR ${finalTotal.toFixed(2)}\nDue Date: ${form.dueDate}\n\nPlease find the fee invoice here:\n${typeof window !== "undefined" ? window.location.origin : ""}/fees/invoices/${success.invoiceId}\n\nThank you,\nSchool Administration.`;
    const waLink = student?.fatherName
      ? whatsappLink(student?.whatsapp || "", whatsappMsg)
      : "#";
    return (
      <div className="animate-fade-in max-w-2xl mx-auto">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-4">
            <Save className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Invoice created successfully</h2>
          <p className="text-slate-500 mt-1">Invoice <span className="font-mono font-semibold">{success.invoiceNo}</span> for {formatCurrency(finalTotal)}</p>
          <div className="flex flex-wrap gap-2 justify-center mt-6">
            <button
              onClick={() => router.push(`/fees/invoices/${success.invoiceId}`)}
              className="btn-primary"
            >
              View Invoice
            </button>
            <a href={`/api/pdf/invoice/${success.invoiceId}`} target="_blank" className="btn-secondary" rel="noreferrer">
              Download PDF
            </a>
            {waLink !== "#" && (
              <a href={waLink} target="_blank" rel="noreferrer" className="btn-success">
                <MessageCircle className="w-4 h-4" /> Send via WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-3xl">
      <PageHeader title="New Fee Invoice" description="Create a fee invoice for a student." backHref="/fees/invoices" />
      <form onSubmit={onSubmit} className="card p-6 space-y-5">
        {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Student *</label>
            <select
              required
              className="input"
              value={form.studentId}
              onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              disabled={loadingStudents}
            >
              <option value="">{loadingStudents ? "Loading…" : "— Select Student —"}</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label} {s.className ? `(${s.className})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Month</label>
            <input className="input" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} required />
          </div>
          <div>
            <label className="label">Issue Date</label>
            <input type="date" className="input" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} required />
          </div>
          <div>
            <label className="label">Due Date</label>
            <input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Invoice Items</label>
            <button type="button" onClick={addItem} className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add item
            </button>
          </div>
          <div className="space-y-2">
            {items.map((it, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className="input flex-1 min-w-0"
                  style={{ minWidth: 180 }}
                  placeholder="e.g. Tuition Fee"
                  autoComplete="off"
                  name={`item-title-${i}`}
                  value={it.title}
                  onChange={(e) => updateItem(i, "title", e.target.value)}
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  className="input w-36"
                  placeholder="Amount"
                  autoComplete="off"
                  name={`item-amount-${i}`}
                  value={it.amount}
                  onChange={(e) => updateItem(i, "amount", e.target.value)}
                  required
                />
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Discount Amount</label>
            <input type="number" step="0.01" className="input" value={form.discountAmount} onChange={(e) => setForm({ ...form, discountAmount: parseFloat(e.target.value) || 0 })} />
          </div>
          <div>
            <label className="label">Discount Reason</label>
            <input className="input" value={form.discountReason} onChange={(e) => setForm({ ...form, discountReason: e.target.value })} />
          </div>
          <div>
            <label className="label">Late Fine</label>
            <input type="number" step="0.01" className="input" value={form.fineAmount} onChange={(e) => setForm({ ...form, fineAmount: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="flex items-center gap-2 mt-6">
            <input
              id="scholarship"
              type="checkbox"
              checked={form.isScholarship}
              onChange={(e) => setForm({ ...form, isScholarship: e.target.checked })}
              className="rounded border-slate-300"
            />
            <label htmlFor="scholarship" className="text-sm font-medium">Scholarship</label>
            {form.isScholarship && (
              <input
                type="number"
                className="input w-20 ml-2"
                value={form.scholarshipPercent}
                onChange={(e) => setForm({ ...form, scholarshipPercent: parseFloat(e.target.value) || 0 })}
                placeholder="%"
              />
            )}
          </div>
          <div className="md:col-span-2">
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1 text-sm">
          <Row label="Subtotal" value={formatCurrency(subtotal)} />
          {(totalDiscount > 0) && <Row label={`Discount${scholarshipAmount > 0 ? " (incl. scholarship)" : ""}`} value={"- " + formatCurrency(totalDiscount)} tone="red" />}
          {fineNum > 0 && <Row label="Late Fine" value={"+ " + formatCurrency(fineNum)} tone="amber" />}
          <div className="border-t border-slate-200 pt-1 mt-1 flex justify-between font-bold text-base">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary px-6">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Create Invoice
          </button>
        </div>
      </form>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "red" | "amber" | "green" }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-600">{label}</span>
      <span className={
        tone === "red" ? "text-red-600 font-semibold" :
        tone === "amber" ? "text-amber-600 font-semibold" :
        tone === "green" ? "text-emerald-600 font-semibold" :
        "text-slate-900 font-medium"
      }>{value}</span>
    </div>
  );
}
