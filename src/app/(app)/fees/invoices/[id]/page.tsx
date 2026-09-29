import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { feeInvoices, feeInvoiceItems, students, classes } from "@/db/schema";
import { eq } from "drizzle-orm";
import PageHeader from "@/components/PageHeader";
import { formatCurrency, formatDate, whatsappLink, studentFullName } from "@/lib/utils";
import { Download, MessageCircle, ArrowLeft, Printer } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoiceId = parseInt(id);

  const invRows = await db.select().from(feeInvoices).where(eq(feeInvoices.id, invoiceId)).limit(1);
  if (invRows.length === 0) return notFound();
  const inv = invRows[0] as any;

  const [items, allStudents, allClasses] = await Promise.all([
    db.select().from(feeInvoiceItems).where(eq(feeInvoiceItems.invoiceId, invoiceId)),
    db.select().from(students),
    db.select().from(classes),
  ]);
  const student = allStudents.find((s: any) => s.id === inv.studentId) as any;
  const cls = allClasses.find((c: any) => c.id === inv.classId) as any;
  const name = student ? studentFullName(student) : "Unknown";

  const message = `Dear Parent,\n\nThis is to inform you that the fee invoice for ${name}${cls?.name ? ", " + cls.name : ""}, for ${inv.month || "the current period"} has been generated.\n\nInvoice No: ${inv.invoice_no}\nAmount: PKR ${Number(inv.total_amount).toFixed(2)}\nDue Date: ${formatDate(inv.due_date)}\n\nYou can view it here:\n${"https://your-school-domain"}/fees/invoices/${inv.id}\n\nThank you,\nSchool Administration.`;
  const waLink = student?.phone ? whatsappLink(student.phone, message) : "#";

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <PageHeader
        title={`Invoice ${inv.invoice_no}`}
        description={`${name} · ${cls?.name || ""} · ${inv.month || ""}`}
        backHref="/fees/invoices"
      >
        <Link href={`/api/pdf/invoice/${inv.id}`} target="_blank" className="btn-secondary">
          <Download className="w-4 h-4" /> PDF
        </Link>
        <button onClick={() => window.print()} className="btn-secondary"><Printer className="w-4 h-4" /> Print</button>
        {waLink !== "#" && (
          <a href={waLink} target="_blank" rel="noreferrer" className="btn-success">
            <MessageCircle className="w-4 h-4" /> Send via WhatsApp
          </a>
        )}
      </PageHeader>

      <div className="card p-8 print-area">
        <div className="flex justify-between items-start pb-6 border-b border-slate-200">
          <div>
            <div className="text-sm uppercase tracking-wider text-slate-500">Invoice</div>
            <div className="text-3xl font-bold text-slate-900">{inv.invoice_no}</div>
            <div className="text-sm text-slate-500 mt-1">Issued: {formatDate(inv.issue_date)}</div>
            <div className="text-sm text-slate-500">Due: {formatDate(inv.due_date)}</div>
          </div>
          <div className="text-right">
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
              inv.status === "paid" ? "bg-emerald-100 text-emerald-700"
              : inv.status === "overdue" ? "bg-red-100 text-red-700"
              : inv.status === "partial" ? "bg-amber-100 text-amber-700"
              : "bg-blue-100 text-blue-700"
            }`}>
              {(inv.status || "").toUpperCase()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 py-6 border-b border-slate-200">
          <div>
            <div className="text-xs uppercase text-slate-500 font-semibold mb-1">Billed To</div>
            <div className="font-semibold text-slate-900">{name}</div>
            {student?.fatherName && <div className="text-sm text-slate-600">S/O {student.fatherName}</div>}
            <div className="text-sm text-slate-600">{cls?.name || ""}</div>
            {student?.phone && <div className="text-sm text-slate-600 mt-1">{student.phone}</div>}
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500 font-semibold mb-1">For</div>
            <div className="font-semibold text-slate-900">{inv.month || "—"}</div>
            {inv.notes && <div className="text-sm text-slate-600 mt-1">{inv.notes}</div>}
          </div>
        </div>

        <table className="w-full my-6 text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 text-xs uppercase text-slate-500">#</th>
              <th className="text-left py-2 text-xs uppercase text-slate-500">Description</th>
              <th className="text-right py-2 text-xs uppercase text-slate-500">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it: any, i: number) => (
              <tr key={it.id} className="border-b border-slate-100">
                <td className="py-2 text-slate-500">{i + 1}</td>
                <td className="py-2 font-medium text-slate-900">{it.title}</td>
                <td className="py-2 text-right">{formatCurrency(Number(it.amount))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-72 space-y-1 text-sm">
            <Row label="Subtotal" value={formatCurrency(Number(inv.subtotal))} />
            {Number(inv.discount_amount) > 0 && <Row label="Discount" value={"- " + formatCurrency(Number(inv.discount_amount))} tone="red" />}
            {Number(inv.fine_amount) > 0 && <Row label="Late Fine" value={"+ " + formatCurrency(Number(inv.fine_amount))} tone="amber" />}
            <div className="border-t border-slate-200 pt-1 mt-1 flex justify-between font-bold text-base">
              <span>Total</span>
              <span>{formatCurrency(Number(inv.total_amount))}</span>
            </div>
            <Row label="Paid" value={formatCurrency(Number(inv.paid_amount))} />
            <div className="flex justify-between font-bold text-base">
              <span className={Number(inv.balance_amount) > 0 ? "text-red-600" : "text-emerald-600"}>Balance Due</span>
              <span className={Number(inv.balance_amount) > 0 ? "text-red-600" : "text-emerald-600"}>{formatCurrency(Number(inv.balance_amount))}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "red" | "amber" }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-600">{label}</span>
      <span className={tone === "red" ? "text-red-600 font-medium" : tone === "amber" ? "text-amber-600 font-medium" : "font-medium text-slate-900"}>{value}</span>
    </div>
  );
}
