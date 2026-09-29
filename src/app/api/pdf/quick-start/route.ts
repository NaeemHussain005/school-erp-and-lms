import PDFDocument from "pdfkit";

export const dynamic = "force-dynamic";

export async function GET() {
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const chunks: Uint8Array[] = [];
  doc.on("data", (c: Uint8Array) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks as any))));

  // Title
  doc.fillColor("#2563eb").fontSize(22).text("SchoolGuide ERP + LMS", { align: "center" });
  doc.fillColor("#000").fontSize(12).text("Quick Start Guide", { align: "center" });
  doc.moveDown(1);

  doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(1).strokeColor("#2563eb").stroke();
  doc.moveDown(1);

  const sections: Array<{ title: string; items: string[] }> = [
    {
      title: "1. Start the app (Windows CMD)",
      items: [
        "cd C:\\schoolguide",
        "npm install",
        "npx drizzle-kit push",
        "npm run dev",
        "Open http://localhost:3000 in your browser",
      ],
    },
    {
      title: "2. Default Login",
      items: [
        "Email:    admin@school.com",
        "Password: admin123",
        "The default school and admin are auto-created on first visit.",
      ],
    },
    {
      title: "3. First Run — Setup Wizard",
      items: [
        "After login, click 'Setup Wizard' (top-right on dashboard).",
        "Follow 7 steps: School → Academic → Staff → Students → Parents → Fees → Exams.",
        "You can skip any step and return later; progress is shown on the dashboard.",
      ],
    },
    {
      title: "4. Daily Tasks",
      items: [
        "Add students: Dashboard → Add Student  (or Students page).",
        "Mark attendance: Attendance → pick class/section/date → Mark All Present → save.",
        "Create invoices: Fees → New Invoice → select student → add items → save.",
        "Send via WhatsApp: open the invoice → click 'Send via WhatsApp' (opens WhatsApp Web, no paid API).",
        "Record payment: open invoice → Record Payment (from payments page).",
        "Create exams: Exams → Create Exam.",
      ],
    },
    {
      title: "5. Useful Shortcuts",
      items: [
        "Ctrl+K → Global search (students, teachers, invoices, classes).",
        "Top-right '✨ Guide' button → SchoolGuide AI assistant (context-aware help on every page).",
        "Sidebar footer → switch between Simple and Advanced mode.",
      ],
    },
    {
      title: "6. Portals",
      items: [
        "Admin/Staff: /dashboard",
        "Teacher: /teacher",
        "Parent: /parent",
        "Student: /student",
      ],
    },
    {
      title: "7. Production",
      items: [
        "npm run build",
        "npm start",
        "Set NODE_ENV=production and a long JWT_SECRET in .env for production.",
        "Back up the PostgreSQL database daily (pg_dump).",
      ],
    },
  ];

  for (const sec of sections) {
    doc.font("Helvetica-Bold").fillColor("#2563eb").fontSize(13).text(sec.title);
    doc.moveDown(0.3);
    doc.font("Helvetica").fillColor("#000").fontSize(10);
    for (const it of sec.items) {
      doc.text(`•  ${it}`, { indent: 10 });
    }
    doc.moveDown(0.6);
  }

  doc.moveDown(1);
  doc.fontSize(9).fillColor("#666").text("For full documentation, see README.md in the project folder. More details and advanced features (exams, LMS, library, transport, inventory, multi-branch, audit logs, reports, PDF center, etc.) are documented in the online help.", { align: "center" });

  doc.end();
  const buffer = await done;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="SchoolGuide-QuickStart.pdf"',
    },
  });
}
