import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { students, classes, sections, parents, studentParents, feeInvoices, attendanceRecords, results } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { formatDate, formatCurrency, studentFullName } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import {
  Wallet,
  Calendar,
  FileText,
  GraduationCap,
  Users,
  Upload,
  QrCode,
  Mail,
  Phone,
  MapPin,
  Edit,
  FileBadge,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  const { id } = await params;
  const studentId = parseInt(id);
  const schoolId = session.schoolId!;

  const [sRows, cRows, secRows] = await Promise.all([
    db.select().from(students).where(and(eq(students.id, studentId), eq(students.schoolId, schoolId))).limit(1),
    db.select({ id: classes.id, name: classes.name }).from(classes).where(eq(classes.schoolId, schoolId)),
    db.select().from(sections).where(eq(sections.schoolId, schoolId)),
  ]);
  if (sRows.length === 0) return notFound();
  const s = sRows[0];
  const className = cRows.find((c) => c.id === s.classId)?.name || "—";
  const sectionName = secRows.find((sec) => sec.id === s.sectionId)?.name || "";

  const [spRows, pRows, invoices, recentResults] = await Promise.all([
    db.select().from(studentParents).where(eq(studentParents.studentId, studentId)),
    db.select().from(parents).where(eq(parents.schoolId, schoolId)),
    db
      .select()
      .from(feeInvoices)
      .where(and(eq(feeInvoices.studentId, studentId), eq(feeInvoices.schoolId, schoolId)))
      .orderBy(desc(feeInvoices.createdAt))
      .limit(5),
    db
      .select({ id: results.id, obtainedMarks: results.obtainedMarks, totalMarks: results.totalMarks, grade: results.grade, subjectName: results.id })
      .from(results)
      .where(and(eq(results.studentId, studentId), eq(results.schoolId, schoolId)))
      .orderBy(desc(results.createdAt))
      .limit(5),
  ]);

  const studentParentsList = spRows
    .map((sp) => pRows.find((p) => p.id === sp.parentId))
    .filter(Boolean) as any[];

  const totalFees = invoices.reduce((sum, inv) => sum + Number(inv.balanceAmount || 0), 0);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title={studentFullName(s)}
        description={`${className} ${sectionName} · Adm #${s.admissionNo}`}
        backHref="/students"
      >
        <Link href={`/students/${s.id}/edit`} className="btn-secondary">
          <Edit className="w-4 h-4" /> Edit
        </Link>
        <Link href={`/api/pdf/student/${s.id}`} className="btn-secondary">
          <FileText className="w-4 h-4" /> PDF
        </Link>
        <Link href={`/certificates/student/${s.id}`} className="btn-secondary">
          <FileBadge className="w-4 h-4" /> Certificate
        </Link>
        <Link href={`/fees/invoices/new?studentId=${s.id}`} className="btn-primary">
          <Wallet className="w-4 h-4" /> Create Invoice
        </Link>
      </PageHeader>

      {/* Top profile card */}
      <div className="card overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-violet-600 relative" />
        <div className="p-6 -mt-16 relative">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            {s.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={s.photoUrl}
                alt={studentFullName(s)}
                className="w-28 h-28 rounded-2xl border-4 border-white shadow-lg object-cover bg-white"
              />
            ) : (
              <div className="w-28 h-28 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-4xl font-bold text-blue-600 bg-gradient-to-br from-blue-100 to-violet-100 uppercase">
                {studentFullName(s).slice(0, 2)}
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900">{studentFullName(s)}</h2>
              <div className="text-slate-500 mt-1">
                {s.rollNo ? `Roll #${s.rollNo} · ` : ""}
                {className} {sectionName}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium">
                {s.isActive ? "Active" : "Inactive"}
              </div>
              {s.isGraduated && (
                <div className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium">
                  Graduated
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left - Info */}
        <div className="card p-5 space-y-4">
          <h3 className="font-bold text-slate-900">Student Information</h3>
          <InfoRow icon={Mail} label="Email" value={s.email} />
          <InfoRow icon={Phone} label="Phone" value={s.phone} />
          <InfoRow icon={Users} label="Father" value={s.fatherName} />
          <InfoRow icon={Users} label="Mother" value={s.motherName} />
          <InfoRow icon={Calendar} label="Date of Birth" value={formatDate(s.dateOfBirth)} />
          <InfoRow icon={Calendar} label="Admission Date" value={formatDate(s.admissionDate)} />
          <InfoRow icon={MapPin} label="Address" value={s.address} />
          {s.cnic && <InfoRow icon={FileText} label="CNIC/B-Form" value={s.cnic} />}
          {s.bloodGroup && <InfoRow icon={QrCode} label="Blood Group" value={s.bloodGroup} />}
          {s.medicalInfo && (
            <div className="pt-3 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Medical</div>
              <div className="text-sm text-slate-700">{s.medicalInfo}</div>
            </div>
          )}
        </div>

        {/* Middle - Financials */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">Fee Overview</h3>
            <Link href={`/fees/invoices?studentId=${s.id}`} className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <StatBox label="Balance Due" value={formatCurrency(totalFees)} tone={totalFees > 0 ? "red" : "green"} />
            <StatBox label="Invoices" value={String(invoices.length)} tone="blue" />
          </div>
          <div className="space-y-2">
            {invoices.length === 0 && <p className="text-sm text-slate-500">No invoices yet.</p>}
            {invoices.map((inv) => (
              <Link
                key={inv.id}
                href={`/fees/invoices/${inv.id}`}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900">{inv.invoiceNo}</div>
                  <div className="text-xs text-slate-500">{inv.month} · Due {formatDate(inv.dueDate)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900">{formatCurrency(Number(inv.totalAmount))}</div>
                  <div className="text-xs">
                    <span
                      className={
                        inv.status === "paid"
                          ? "text-emerald-600 font-medium"
                          : inv.status === "overdue"
                          ? "text-red-600 font-medium"
                          : "text-amber-600 font-medium"
                      }
                    >
                      {inv.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right - Parents */}
        <div className="card p-5">
          <h3 className="font-bold text-slate-900 mb-4">Parents / Guardians</h3>
          {studentParentsList.length === 0 ? (
            <p className="text-sm text-slate-500">No parents linked yet.</p>
          ) : (
            <div className="space-y-3">
              {studentParentsList.map((p) => (
                <div key={p.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                  <div className="font-semibold text-slate-900">
                    {p.fatherName}
                    {p.motherName && <span className="text-slate-500 font-normal"> / {p.motherName}</span>}
                  </div>
                  {p.fatherPhone && <div className="text-sm text-slate-600 flex items-center gap-1 mt-1"><Phone className="w-3 h-3" /> {p.fatherPhone}</div>}
                  {p.fatherEmail && <div className="text-sm text-slate-600 flex items-center gap-1"><Mail className="w-3 h-3" /> {p.fatherEmail}</div>}
                </div>
              ))}
            </div>
          )}

          <h3 className="font-bold text-slate-900 mt-6 mb-3 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-600" /> Recent Results
          </h3>
          {recentResults.length === 0 ? (
            <p className="text-sm text-slate-500">No results yet.</p>
          ) : (
            <div className="space-y-2">
              {recentResults.slice(0, 3).map((r) => (
                <div key={r.id} className="flex items-center justify-between p-2 rounded bg-slate-50 text-sm">
                  <span className="font-medium">{r.grade || "—"}</span>
                  <span className="text-slate-600">{Number(r.obtainedMarks)}/{r.totalMarks}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: any) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 text-sm">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
      <div>
        <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</div>
        <div className="text-slate-800">{value}</div>
      </div>
    </div>
  );
}

function StatBox({ label, value, tone }: any) {
  const colors: Record<string, string> = {
    red: "bg-red-50 text-red-700",
    green: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <div className={`p-3 rounded-lg ${colors[tone] || colors.blue}`}>
      <div className="text-xs font-medium uppercase tracking-wide opacity-80">{label}</div>
      <div className="text-lg font-bold mt-0.5">{value}</div>
    </div>
  );
}
