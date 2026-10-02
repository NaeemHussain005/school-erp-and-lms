import Link from "next/link";
import { db } from "@/db";
import { feePayments, feeInvoices, students } from "@/db/schema";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import { formatCurrency, formatDate, studentFullName } from "@/lib/utils";
import { Download } from "lucide-react";

export const dynamic = "force-dynamic";

const METHODS: Record<string, string> = {
  cash: "Cash", bank: "Bank", card: "Card", online: "Online", cheque: "Cheque", other: "Other",
};

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await requireAuth();
  const schoolId = session.schoolId!;
  const { from, to } = await searchParams;
  const ok = (d?: string) => (d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : undefined);
  const f = ok(from);
  const t = ok(to);

  const rows = await db
    .select({
      id: feePayments.id,
      paymentNo: feePayments.paymentNo,
      amount: feePayments.amount,
      method: feePayments.method,
      paymentDate: feePayments.paymentDate,
      invoiceId: feePayments.invoiceId,
      invoiceNo: feeInvoices.invoiceNo,
      firstName: students.firstName,
      lastName: students.lastName,
    })
    .from(feePayments)
    .leftJoin(feeInvoices, eq(feePayments.invoiceId, feeInvoices.id))
    .leftJoin(students, eq(feePayments.studentId, students.id))
    .where(
      and(
        eq(feePayments.schoolId, schoolId),
        f ? gte(feePayments.paymentDate, f) : undefined,
        t ? lte(feePayments.paymentDate, t) : undefined
      )
    )
    .orderBy(desc(feePayments.id))
    .limit(500);

  const total = rows.reduce((s, r) => s + Number(r.amount || 0), 0);

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Payments" description="All fee payments received." backHref="/fees" />

      <div className="card p-4 flex flex-col md:flex-row md:items-end gap-3">
        <form action="/fees/payments" className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="label">From</label>
            <input type="date" name="from" defaultValue={f} className="input" />
          </div>
          <div>
            <label className="label">To</label>
            <input type="date" name="to" defaultValue={t} className="input" />
          </div>
          <button type="submit" className="btn-primary">Filter</button>
          <Link href="/fees/payments" className="btn-secondary">Reset</Link>
        </form>
        <div className="md:ml-auto text-right">
          <div className="text-xs uppercase text-slate-500 font-semibold">Total Collected</div>
          <div className="text-2xl font-bold text-emerald-600">{formatCurrency(total)}</div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
              <th className="p-3">Receipt</th>
              <th className="p-3">Date</th>
              <th className="p-3">Student</th>
              <th className="p-3">Invoice</th>
              <th className="p-3">Method</th>
              <th className="p-3 text-right">Amount</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-slate-500">No payments found.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-3 font-mono font-semibold">{r.paymentNo}</td>
                <td className="p-3">{formatDate(r.paymentDate)}</td>
                <td className="p-3">
                  {r.firstName ? studentFullName({ firstName: r.firstName, lastName: r.lastName } as any) : "—"}
                </td>
                <td className="p-3">
                  {r.invoiceId ? (
                    <Link href={`/fees/invoices/${r.invoiceId}`} className="text-blue-600 hover:underline">{r.invoiceNo}</Link>
                  ) : "—"}
                </td>
                <td className="p-3">{METHODS[String(r.method)] || r.method}</td>
                <td className="p-3 text-right font-semibold text-emerald-600">{formatCurrency(Number(r.amount))}</td>
                <td className="p-3">
                  <a href={`/api/pdf/receipt/${r.id}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                    <Download className="w-3 h-3" /> Receipt
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
