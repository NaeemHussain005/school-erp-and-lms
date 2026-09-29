import Link from "next/link";
import { db } from "@/db";
import { feeInvoices, students, feePayments, feeCategories, feeStructures } from "@/db/schema";
import { eq, desc, and, sql, sum, count } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Wallet, FileText, Plus, CreditCard, AlertTriangle, Receipt, TrendingUp, DollarSign } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FeesPage() {
  const session = await requireAuth();
  const schoolId = session.schoolId!;

  const [
    totalInvoicesRes,
    paidRes,
    unpaidRes,
    overdueRes,
    todayCollRes,
    monthCollRes,
    recent,
    cats,
  ] = await Promise.all([
    db.select({ c: count(), total: sql<number>`COALESCE(SUM(total_amount),0)` }).from(feeInvoices).where(eq(feeInvoices.schoolId, schoolId)),
    db.select({ total: sql<number>`COALESCE(SUM(paid_amount),0)` }).from(feeInvoices).where(and(eq(feeInvoices.schoolId, schoolId), eq(feeInvoices.status, "paid"))),
    db.select({ total: sql<number>`COALESCE(SUM(balance_amount),0)` }).from(feeInvoices).where(and(eq(feeInvoices.schoolId, schoolId), sql`balance_amount > 0`, sql`status != 'cancelled'`)),
    db.select({ total: sql<number>`COALESCE(SUM(balance_amount),0)` }).from(feeInvoices).where(and(eq(feeInvoices.schoolId, schoolId), sql`balance_amount > 0`, sql`due_date < CURRENT_DATE`, sql`status != 'cancelled'`)),
    db.select({ total: sql<number>`COALESCE(SUM(amount),0)` }).from(feePayments).where(and(eq(feePayments.schoolId, schoolId), sql`created_at::date = CURRENT_DATE`)),
    db.select({ total: sql<number>`COALESCE(SUM(amount),0)` }).from(feePayments).where(and(eq(feePayments.schoolId, schoolId), sql`created_at >= DATE_TRUNC('month', CURRENT_DATE)`)),
    db
      .select({
        id: feeInvoices.id,
        invoiceNo: feeInvoices.invoiceNo,
        month: feeInvoices.month,
        totalAmount: feeInvoices.totalAmount,
        paidAmount: feeInvoices.paidAmount,
        balanceAmount: feeInvoices.balanceAmount,
        status: feeInvoices.status,
        dueDate: feeInvoices.dueDate,
        studentFirst: students.firstName,
        studentLast: students.lastName,
        className: sql<string>`(SELECT name FROM classes WHERE id = ${feeInvoices.classId})`,
      })
      .from(feeInvoices)
      .leftJoin(students, eq(students.id, feeInvoices.studentId))
      .where(eq(feeInvoices.schoolId, schoolId))
      .orderBy(desc(feeInvoices.createdAt))
      .limit(10),
    db.select().from(feeCategories).where(eq(feeCategories.schoolId, schoolId)),
  ]);

  const statCards = [
    { label: "Today's Collection", value: formatCurrency(Number(todayCollRes[0]?.total || 0)), icon: Wallet, color: "from-emerald-500 to-emerald-600", href: "/fees/payments" },
    { label: "This Month", value: formatCurrency(Number(monthCollRes[0]?.total || 0)), icon: TrendingUp, color: "from-blue-500 to-blue-600", href: "/fees/payments" },
    { label: "Outstanding", value: formatCurrency(Number(unpaidRes[0]?.total || 0)), icon: CreditCard, color: "from-amber-500 to-orange-600", href: "/fees/invoices?status=unpaid" },
    { label: "Overdue", value: formatCurrency(Number(overdueRes[0]?.total || 0)), icon: AlertTriangle, color: "from-red-500 to-red-600", href: "/fees/invoices?status=overdue" },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Fee Management"
        description="Manage fee categories, structures, invoices, payments and financial reports."
        action="New Invoice"
        actionHref="/fees/invoices/new"
        actionIcon={<Plus className="w-4 h-4" />}
      >
        <Link href="/fees/categories" className="btn-secondary">
          <Receipt className="w-4 h-4" /> Categories
        </Link>
        <Link href="/fees/payments" className="btn-secondary">
          <DollarSign className="w-4 h-4" /> Payments
        </Link>
        <Link href="/fees/expenses" className="btn-secondary">
          <FileText className="w-4 h-4" /> Expenses
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((c) => (
          <Link key={c.label} href={c.href} className="card-hover p-5 block">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-slate-500 font-medium">{c.label}</div>
                <div className="text-2xl font-bold mt-1">{c.value}</div>
              </div>
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.color} text-white flex items-center justify-center`}>
                <c.icon className="w-5 h-5" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">Recent Invoices</h3>
            <Link href="/fees/invoices" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          {recent.length === 0 ? (
            <div className="py-10 text-center text-slate-500">
              <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p>No invoices yet. <Link href="/fees/invoices/new" className="text-blue-600 hover:underline">Create your first invoice</Link>.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Student</th>
                    <th>Month</th>
                    <th>Due</th>
                    <th>Total</th>
                    <th>Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r) => {
                    const name = [r.studentFirst, r.studentLast].filter(Boolean).join(" ");
                    return (
                      <tr key={r.id}>
                        <td className="font-mono text-xs font-semibold">
                          <Link href={`/fees/invoices/${r.id}`} className="text-blue-600 hover:underline">{r.invoiceNo}</Link>
                        </td>
                        <td className="font-medium">{name}</td>
                        <td className="text-sm">{r.month}</td>
                        <td className="text-sm">{formatDate(r.dueDate)}</td>
                        <td className="font-semibold text-sm">{formatCurrency(Number(r.totalAmount))}</td>
                        <td className="font-semibold text-sm">{formatCurrency(Number(r.balanceAmount))}</td>
                        <td>
                          <span className={
                            r.status === "paid" ? "badge badge-green"
                            : r.status === "overdue" ? "badge badge-red"
                            : r.status === "partial" ? "badge badge-yellow"
                            : "badge badge-blue"
                          }>{r.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-bold text-slate-900 mb-4">Fee Categories</h3>
          {cats.length === 0 ? (
            <div className="text-sm text-slate-500">
              <p className="mb-2">No categories yet.</p>
              <Link href="/fees/categories" className="btn-primary text-sm">Create Categories</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {cats.slice(0, 8).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-2 rounded bg-slate-50 text-sm">
                  <span className="font-medium text-slate-800">{c.name}</span>
                  <span className={`badge ${c.isActive ? "badge-green" : "badge-slate"}`}>{c.isActive ? "Active" : "Inactive"}</span>
                </div>
              ))}
            </div>
          )}
          <Link href="/fees/categories" className="btn-secondary w-full mt-4 text-sm justify-center">Manage Categories</Link>
        </div>
      </div>
    </div>
  );
}
