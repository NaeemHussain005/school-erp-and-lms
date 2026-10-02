import Link from "next/link";
import { db } from "@/db";
import { feeInvoices, students } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import DeleteInvoiceButton from "@/components/DeleteInvoiceButton";
import { formatCurrency, formatDate, studentFullName } from "@/lib/utils";
import { Plus, FileText, Download } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUSES = ["all", "unpaid", "partial", "paid", "overdue", "cancelled"];

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; studentId?: string; q?: string }>;
}) {
  const session = await requireAuth();
  const schoolId = session.schoolId!;
  const { status = "all", studentId, q = "" } = await searchParams;

  const rows = await db
    .select({
      id: feeInvoices.id,
      invoiceNo: feeInvoices.invoiceNo,
      month: feeInvoices.month,
      dueDate: feeInvoices.dueDate,
      totalAmount: feeInvoices.totalAmount,
      paidAmount: feeInvoices.paidAmount,
      balanceAmount: feeInvoices.balanceAmount,
      status: feeInvoices.status,
      studentId: feeInvoices.studentId,
      firstName: students.firstName,
      lastName: students.lastName,
      admissionNo: students.admissionNo,
    })
    .from(feeInvoices)
    .leftJoin(students, eq(feeInvoices.studentId, students.id))
    .where(
      and(
        eq(feeInvoices.schoolId, schoolId),
        studentId && !isNaN(parseInt(studentId)) ? eq(feeInvoices.studentId, parseInt(studentId)) : undefined
      )
    )
    .orderBy(desc(feeInvoices.id))
    .limit(500);

  const needle = q.trim().toLowerCase();
  const list = rows.filter((r) => {
    if (status !== "all" && r.status !== status) return false;
    if (!needle) return true;
    const hay = `${r.invoiceNo} ${r.firstName || ""} ${r.lastName || ""} ${r.admissionNo || ""}`.toLowerCase();
    return hay.includes(needle);
  });

  // cancelled invoices are not billed / not due; payments already received still count as collected
  const activeList = list.filter((r) => r.status !== "cancelled");
  const totalBilled = activeList.reduce((s, r) => s + Number(r.totalAmount || 0), 0);
  const totalPaid = list.reduce((s, r) => s + Number(r.paidAmount || 0), 0);
  const totalDue = activeList.reduce((s, r) => s + Number(r.balanceAmount || 0), 0);

  const badge = (st: string | null) =>
    st === "paid"
      ? "bg-emerald-100 text-emerald-700"
      : st === "overdue"
      ? "bg-red-100 text-red-700"
      : st === "partial"
      ? "bg-amber-100 text-amber-700"
      : st === "cancelled"
      ? "bg-slate-200 text-slate-600"
      : "bg-blue-100 text-blue-700";

  const tabHref = (s: string) => {
    const p = new URLSearchParams();
    if (s !== "all") p.set("status", s);
    if (studentId) p.set("studentId", studentId);
    if (q) p.set("q", q);
    const qs = p.toString();
    return `/fees/invoices${qs ? "?" + qs : ""}`;
  };

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Fee Invoices" description="View and manage all generated fee invoices." backHref="/fees">
        <Link href="/fees/invoices/new" className="btn-primary">
          <Plus className="w-4 h-4" /> New Invoice
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="card p-4">
          <div className="text-xs uppercase text-slate-500 font-semibold">Total Billed</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(totalBilled)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs uppercase text-slate-500 font-semibold">Collected</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(totalPaid)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs uppercase text-slate-500 font-semibold">Balance Due</div>
          <div className="text-xl font-bold text-red-600 mt-1">{formatCurrency(totalDue)}</div>
        </div>
      </div>

      <div className="card p-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <Link key={s} href={tabHref(s)} className={status === s ? "btn-primary" : "btn-secondary"}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Link>
          ))}
        </div>
        <form className="md:ml-auto flex gap-2" action="/fees/invoices">
          {status !== "all" && <input type="hidden" name="status" value={status} />}
          {studentId && <input type="hidden" name="studentId" value={studentId} />}
          <input name="q" defaultValue={q} className="input" placeholder="Search invoice / student / adm no." />
          <button type="submit" className="btn-secondary">Search</button>
        </form>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
              <th className="p-3">Invoice</th>
              <th className="p-3">Student</th>
              <th className="p-3">Month</th>
              <th className="p-3">Due</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-right">Paid</th>
              <th className="p-3 text-right">Balance</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-500">
                  <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  No invoices found.
                </td>
              </tr>
            )}
            {list.map((r) => (
              <tr
                key={r.id}
                className={`border-b border-slate-100 hover:bg-slate-50 ${r.status === "cancelled" ? "opacity-60" : ""}`}
              >
                <td className="p-3 font-mono font-semibold">
                  <Link href={`/fees/invoices/${r.id}`} className="text-blue-600 hover:underline">{r.invoiceNo}</Link>
                </td>
                <td className="p-3">
                  <div className="font-medium text-slate-900">
                    {r.firstName ? studentFullName({ firstName: r.firstName, lastName: r.lastName } as any) : "—"}
                  </div>
                  <div className="text-xs text-slate-500">{r.admissionNo || ""}</div>
                </td>
                <td className="p-3">{r.month || "—"}</td>
                <td className="p-3">{formatDate(r.dueDate)}</td>
                <td className="p-3 text-right">{formatCurrency(Number(r.totalAmount))}</td>
                <td className="p-3 text-right text-emerald-600">{formatCurrency(Number(r.paidAmount))}</td>
                <td className="p-3 text-right font-semibold">{formatCurrency(Number(r.balanceAmount))}</td>
                <td className="p-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${badge(r.status)}`}>
                    {(r.status || "").toUpperCase()}
                  </span>
                </td>
                <td className="p-3 whitespace-nowrap">
                  <Link href={`/fees/invoices/${r.id}`} className="text-blue-600 hover:underline mr-3">View</Link>
                  <a href={`/api/pdf/invoice/${r.id}`} target="_blank" rel="noreferrer" className="text-slate-600 hover:underline inline-flex items-center gap-1">
                    <Download className="w-3 h-3" /> PDF
                  </a>
                  {Number(r.paidAmount || 0) <= 0 && (
                    <span className="ml-3"><DeleteInvoiceButton invoiceId={r.id} compact /></span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
