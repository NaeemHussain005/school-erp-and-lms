import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { students, classes, schools } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { formatDate, studentFullName } from "@/lib/utils";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

const NAVY = "#1e3a8a";
const GOLD = "#b8902f";

export default async function StudentCertificatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const session = await requireAuth();
  const { id } = await params;
  const { type = "bonafide" } = await searchParams;
  const studentId = parseInt(id);
  if (isNaN(studentId)) return notFound();
  const schoolId = session.schoolId!;

  const [sRows, cRows, schoolRows] = await Promise.all([
    db.select().from(students).where(and(eq(students.id, studentId), eq(students.schoolId, schoolId))).limit(1),
    db.select().from(classes).where(eq(classes.schoolId, schoolId)),
    db.select().from(schools).where(eq(schools.id, schoolId)).limit(1),
  ]);
  if (sRows.length === 0) return notFound();

  const s = sRows[0];
  const school: any = schoolRows[0] || {};
  const schoolName: string = school.name || "My School";
  const logo: string | null = school.logoUrl || school.logo || null;
  const contactLine = [school.phone, school.email].filter(Boolean).join("  |  ");
  const className = cRows.find((c) => c.id === s.classId)?.name || "";
  const name = studentFullName(s);
  const today = formatDate(new Date());
  const year = new Date().getFullYear();

  const titles: Record<string, string> = {
    bonafide: "Bonafide Certificate",
    character: "Character Certificate",
    transfer: "School Leaving Certificate",
  };
  const title = titles[type] || titles.bonafide;
  const certNo = `${(titles[type] ? type : "bonafide").slice(0, 3).toUpperCase()}-${year}-${String(s.id).padStart(4, "0")}`;

  const fatherText = s.fatherName || "—";
  const classPhrase = className ? `class ${className}` : "";

  let body: React.ReactNode;
  if (type === "character") {
    body = (
      <>
        This is to certify that <strong>{name}</strong>, son/daughter of <strong>{fatherText}</strong>, Admission No.{" "}
        <strong>{s.admissionNo}</strong>, has been a student of this school{classPhrase ? `, in ${classPhrase}` : ""}.
        During this period, the conduct and character of the student has been found to be <strong>good</strong>.
      </>
    );
  } else if (type === "transfer") {
    body = (
      <>
        This is to certify that <strong>{name}</strong>, son/daughter of <strong>{fatherText}</strong>, Admission No.{" "}
        <strong>{s.admissionNo}</strong>, was admitted to this school on <strong>{formatDate(s.admissionDate)}</strong>
        {classPhrase ? ` and last studied in ${classPhrase}` : ""}. The student is leaving the school and all dues have
        been cleared.
      </>
    );
  } else {
    body = (
      <>
        This is to certify that <strong>{name}</strong>, son/daughter of <strong>{fatherText}</strong>, is a bonafide
        student of this school{classPhrase ? `, currently studying in ${classPhrase}` : ""}, bearing Admission No.{" "}
        <strong>{s.admissionNo}</strong>.
      </>
    );
  }

  const details: [string, string][] = [
    ["Student Name", name],
    ["Father Name", s.fatherName || "—"],
    ["Admission No.", s.admissionNo || "—"],
    ["Class", className || "—"],
    ["Date of Birth", s.dateOfBirth ? formatDate(s.dateOfBirth) : "—"],
    ["Admission Date", s.admissionDate ? formatDate(s.admissionDate) : "—"],
  ];

  const serif = "Georgia, 'Times New Roman', serif";

  return (
    <div className="space-y-4">
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 0; }
          body * { visibility: hidden; }
          #certificate, #certificate * { visibility: visible; }
          #certificate { position: fixed; left: 0; top: 0; width: 100vw; height: 100vh; margin: 0 !important; box-shadow: none !important; }
        }
      `}</style>

      <div className="print:hidden flex flex-wrap items-center gap-2">
        <Link href={`/students/${studentId}`} className="btn-secondary">Back</Link>
        {Object.entries(titles).map(([key, label]) => (
          <Link
            key={key}
            href={`/certificates/student/${studentId}?type=${key}`}
            className={type === key ? "btn-primary" : "btn-secondary"}
          >
            {label}
          </Link>
        ))}
        <PrintButton />
      </div>

      <div
        id="certificate"
        className="mx-auto shadow-xl"
        style={{
          maxWidth: 1000,
          background: "#fffdf8",
          padding: 14,
          border: `8px solid ${NAVY}`,
          fontFamily: serif,
          position: "relative",
        }}
      >
        <div style={{ border: `2px solid ${GOLD}`, padding: 10, position: "relative" }}>
          <div style={{ border: `1px solid ${NAVY}`, padding: "28px 48px 32px", position: "relative", overflow: "hidden", minHeight: 600 }}>
            {/* corner ornaments */}
            {[
              { top: 6, left: 6 },
              { top: 6, right: 6 },
              { bottom: 6, left: 6 },
              { bottom: 6, right: 6 },
            ].map((pos, i) => (
              <div
                key={i}
                style={{ position: "absolute", width: 34, height: 34, border: `3px solid ${GOLD}`, transform: "rotate(45deg)", opacity: 0.6, ...pos }}
              />
            ))}

            {/* watermark */}
            {logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt=""
                style={{ position: "absolute", top: "50%", left: "50%", width: 340, height: 340, objectFit: "contain", transform: "translate(-50%, -50%)", opacity: 0.06 }}
              />
            )}

            {/* header: logo | school name | student photo */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, position: "relative" }}>
              <div style={{ width: 120, display: "flex", justifyContent: "flex-start" }}>
                {logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt="logo" style={{ height: 90, width: "auto", maxWidth: 120, objectFit: "contain" }} />
                )}
              </div>

              <div style={{ flex: 1, textAlign: "center" }}>
                <h1 style={{ fontSize: 32, fontWeight: 700, color: NAVY, letterSpacing: 2, textTransform: "uppercase", margin: 0, lineHeight: 1.2 }}>
                  {schoolName}
                </h1>
                {school.address && <div style={{ fontSize: 13, color: "#475569", marginTop: 6 }}>{school.address}</div>}
                {contactLine && <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{contactLine}</div>}
              </div>

              <div style={{ width: 120, display: "flex", justifyContent: "flex-end" }}>
                {s.photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.photoUrl}
                    alt={name}
                    style={{
                      width: 100,
                      height: 124,
                      objectFit: "cover",
                      border: `3px solid ${GOLD}`,
                      padding: 3,
                      background: "#fff",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }}
                  />
                )}
              </div>
            </div>
            <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`, margin: "16px auto 0", width: "80%", position: "relative" }} />

            {/* title */}
            <div style={{ textAlign: "center", marginTop: 22, position: "relative" }}>
              <div style={{ fontSize: 13, letterSpacing: 6, color: GOLD, textTransform: "uppercase" }}>Certificate of</div>
              <h2 style={{ fontSize: 38, fontWeight: 700, color: NAVY, margin: "2px 0 0", fontStyle: "italic" }}>
                {title.replace(" Certificate", "")}
              </h2>
            </div>

            {/* cert no + date */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#475569", marginTop: 18, position: "relative" }}>
              <div>Certificate No: <strong style={{ color: NAVY }}>{certNo}</strong></div>
              <div>Date of Issue: <strong style={{ color: NAVY }}>{today}</strong></div>
            </div>

            {/* body */}
            <p style={{ fontSize: 19, lineHeight: 2, color: "#1e293b", textAlign: "justify", marginTop: 18, position: "relative" }}>
              {body}
            </p>

            {/* details table */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                border: `1px solid ${GOLD}`,
                marginTop: 14,
                position: "relative",
                background: "rgba(255,255,255,0.6)",
              }}
            >
              {details.map(([label, value], i) => (
                <div key={label} style={{ padding: "8px 14px", borderRight: i % 3 !== 2 ? `1px solid ${GOLD}55` : "none", borderBottom: i < 3 ? `1px solid ${GOLD}55` : "none" }}>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: "#64748b" }}>{label}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: NAVY }}>{value}</div>
                </div>
              ))}
            </div>

            {/* signatures + seal */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 44, position: "relative" }}>
              <div style={{ textAlign: "center", width: 200 }}>
                <div style={{ borderTop: `1.5px solid ${NAVY}`, paddingTop: 4, fontSize: 14, color: NAVY, fontWeight: 600 }}>
  {school.principal ? <div>{school.principal}</div> : null}
  <div style={{ fontSize: 12, fontWeight: 400, color: "#64748b" }}>Principal</div>
</div>
              </div>

              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: "50%",
                  background: `radial-gradient(circle at 30% 30%, #f5d77a, ${GOLD})`,
                  border: "4px double #fff",
                  boxShadow: `0 0 0 2px ${GOLD}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1,
                  lineHeight: 1.3,
                  textTransform: "uppercase",
                }}
              >
                Official<br />Seal
              </div>

              <div style={{ textAlign: "center", width: 200 }}>
                <div style={{ borderTop: `1.5px solid ${NAVY}`, paddingTop: 4, fontSize: 14, color: NAVY, fontWeight: 600 }}>
  {school.principal ? <div>{school.principal}</div> : null}
  <div style={{ fontSize: 12, fontWeight: 400, color: "#64748b" }}>Principal</div>
</div>
              </div>
            </div>

            <div style={{ textAlign: "center", fontSize: 10, color: "#94a3b8", marginTop: 18, position: "relative" }}>
              This is a computer-generated certificate issued by {schoolName}.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
