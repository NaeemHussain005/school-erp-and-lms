"use client";

import { useState } from "react";
import { X, Sparkles, Send, Lightbulb, BookOpen, HelpCircle, CheckCircle2 } from "lucide-react";

const guides: Record<string, { title: string; steps: string[]; tips?: string[] }> = {
  "/dashboard": {
    title: "Dashboard Overview",
    steps: [
      "This is your home — every important metric in one place.",
      "Click 'Add Student' in Quick Actions to add your first student.",
      "Use Setup Progress to track what still needs configuration.",
      "Switch between Simple and Advanced mode in the sidebar footer.",
    ],
    tips: [
      "Press Ctrl+K anywhere to search.",
      "Click the Guide button anytime for context help.",
    ],
  },
  "/students": {
    title: "Student Management",
    steps: [
      "Step 1: Make sure you have created Classes and Sections first (see Academics).",
      "Step 2: Click 'Add Student' to add one student manually.",
      "Step 3: Use 'Import Excel' to bulk import hundreds of students.",
      "Step 4: Download the template first to ensure correct column mapping.",
      "Step 5: Click any student row to open their full profile.",
    ],
    tips: [
      "Each student has a full profile: attendance, fees, exams, LMS progress, documents.",
      "You can generate ID cards and certificates from the student profile.",
    ],
  },
  "/attendance": {
    title: "Attendance",
    steps: [
      "Pick a class, section and date.",
      "Click 'Mark All Present' for fast entry, then adjust absences/late.",
      "Save — attendance is recorded instantly.",
      "View analytics by day, week, month or term.",
    ],
    tips: ["Teachers can mark attendance for their assigned classes."],
  },
  "/fees": {
    title: "Fee Management",
    steps: [
      "First create Fee Categories (Tuition, Transport, Exam fee, etc.).",
      "Then set Fee Structures per class for the current academic session.",
      "Generate monthly invoices manually or use 'Generate All Invoices'.",
      "Record payments and print receipts.",
      "Send invoices to parents via WhatsApp in one click.",
    ],
    tips: [
      "Supports discounts, scholarships, late fines, installments, partial payments.",
      "All financial numbers come from real invoices and payments.",
    ],
  },
  "/exams": {
    title: "Exams & Results",
    steps: [
      "Create an Exam: choose type, class, subject, date.",
      "Build a question paper manually or from the Question Bank.",
      "For online exams, students can attempt directly.",
      "For paper-based exams, enter marks directly on the result screen.",
      "Publish results for parents to see.",
      "Generate beautiful report cards as PDF.",
    ],
    tips: [
      "MCQs and True/False can be auto-graded.",
      "Question Bank supports easy/medium/hard and topics.",
    ],
  },
  "/lms": {
    title: "LMS — Courses & Lessons",
    steps: [
      "Create a Course: set class, subject, teacher.",
      "Add Modules and Lessons inside each course.",
      "Each lesson can include text, video URL, PDF, and attachments.",
      "Publish when ready for students.",
      "Track student progress and completion.",
    ],
    tips: [
      "You can also create Assignments and Live Classes from the LMS menu.",
    ],
  },
  "/settings": {
    title: "School Settings",
    steps: [
      "General: school name, logo, contact.",
      "Branding: colors, theme, PDF header/footer.",
      "Academic sessions: manage multiple years (history is preserved).",
      "Users & roles: invite staff, control permissions.",
      "Backup: download a full backup anytime.",
    ],
  },
};

function matchGuide(path: string) {
  const keys = Object.keys(guides).sort((a, b) => b.length - a.length);
  for (const k of keys) if (path.startsWith(k)) return guides[k];
  return null;
}

const quickReplies = [
  "How do I add students?",
  "How do I generate fee invoices?",
  "How do I mark attendance?",
  "How do I create an exam?",
  "How do I import from Excel?",
];

export default function AssistantPanel({
  onClose,
  currentPath,
}: {
  onClose: () => void;
  currentPath: string;
}) {
  const guide = matchGuide(currentPath);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([
    {
      role: "assistant",
      text: guide
        ? `👋 Hi! You're on ${guide.title.toLowerCase()}. I can walk you through it — just click "Guide Me".`
        : `👋 Hi! I'm your SchoolGuide assistant. Ask me anything or pick a suggestion below.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [guided, setGuided] = useState(false);

  function reply(text: string) {
    setMessages((m) => [...m, { role: "user", text }, { role: "assistant", text: generateReply(text) }]);
  }

  function generateReply(q: string): string {
    const lower = q.toLowerCase();
    if (lower.includes("student") && lower.includes("add")) {
      return "Great! First ensure you have classes and sections set up. Then go to Students → Add Student, or click Import Excel to bulk-add. Download the template first!";
    }
    if (lower.includes("fee") || lower.includes("invoice")) {
      return "Fees in 3 steps: 1) Create Fee Categories, 2) Set Fee Structure per class, 3) Generate invoices. You can then send via WhatsApp or print PDF receipts.";
    }
    if (lower.includes("attendance")) {
      return "Go to Attendance, select class + date, click 'Mark All Present', then adjust any absences. Save. You can view reports in the Reports Center.";
    }
    if (lower.includes("exam")) {
      return "Create an exam, add questions manually or from the Question Bank, then publish. MCQs auto-grade; subjective questions need teacher review. Results → Report Cards for PDF.";
    }
    if (lower.includes("import") || lower.includes("excel")) {
      return "On the Students page, click 'Import Excel'. Download the template first, fill it, upload, match columns, validate, then import. Errors/warnings are shown before import.";
    }
    if (lower.includes("whatsapp")) {
      return "Open any fee invoice and click 'Send via WhatsApp' — it opens WhatsApp Web with a prefilled professional message. No paid API required.";
    }
    if (lower.includes("pdf")) {
      return "Almost every module has a PDF button: invoices, report cards, certificates, ID cards, attendance sheets, exam papers, financial reports — all printable.";
    }
    return "I can help with that! Try the 'Guide Me' button for a step-by-step walkthrough of your current page, or ask about students, fees, attendance, exams, LMS, imports or WhatsApp.";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-end p-0 md:p-6 bg-black/30" onClick={onClose}>
      <div
        className="w-full md:w-[420px] h-[80vh] md:h-[640px] bg-white md:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 bg-gradient-to-br from-blue-600 to-violet-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold">
              <Sparkles className="w-5 h-5" /> SchoolGuide AI
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-blue-100 mt-1">Your virtual school assistant — always ready to help.</p>
        </div>

        {guide && !guided && (
          <div className="p-4 bg-blue-50 border-b border-blue-100">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="flex-1 text-sm">
                <div className="font-semibold text-slate-900">{guide.title}</div>
                <p className="text-slate-600 mt-0.5">Would you like a step-by-step guide for this page?</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setGuided(true)}
                    className="px-3 py-1 rounded-md bg-blue-600 text-white text-xs font-medium"
                  >
                    Guide Me
                  </button>
                  <button onClick={() => setGuided(true)} className="px-3 py-1 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-medium">
                    Show tips
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {guided && guide && (
          <div className="p-4 bg-white border-b border-slate-200 max-h-60 overflow-y-auto">
            <div className="font-semibold text-slate-900 text-sm mb-2 flex items-center gap-1">
              <BookOpen className="w-4 h-4" /> {guide.title}
            </div>
            <ol className="space-y-2">
              {guide.steps.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
            {guide.tips && (
              <div className="mt-3 p-2 bg-amber-50 rounded-lg border border-amber-100 text-xs text-amber-800">
                <HelpCircle className="w-3 h-3 inline mr-1" />
                {guide.tips.join(" ")}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  m.role === "user"
                    ? "max-w-[80%] px-3 py-2 rounded-2xl rounded-br-sm bg-blue-600 text-white text-sm"
                    : "max-w-[90%] px-3 py-2 rounded-2xl rounded-bl-sm bg-white border border-slate-200 text-slate-800 text-sm shadow-sm"
                }
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-slate-200 bg-white">
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {quickReplies.map((q) => (
                <button
                  key={q}
                  onClick={() => reply(q)}
                  className="text-xs px-2 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!input.trim()) return;
              reply(input.trim());
              setInput("");
            }}
            className="flex items-center gap-2"
          >
            <input
              className="input flex-1"
              placeholder="Ask anything about the system…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="btn-primary p-2">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
