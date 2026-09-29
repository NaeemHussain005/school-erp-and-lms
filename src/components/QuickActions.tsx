"use client";

import Link from "next/link";
import {
  UserPlus,
  UserCheck,
  FileText,
  CalendarCheck,
  ClipboardList,
  FilePlus2,
  Trophy,
  Megaphone,
  FileDown,
  Upload,
  Search,
  QrCode,
  Wallet,
} from "lucide-react";

const actions = [
  { icon: UserPlus, label: "Add Student", href: "/students/new", color: "bg-blue-50 text-blue-600" },
  { icon: UserCheck, label: "Add Teacher", href: "/staff/new", color: "bg-violet-50 text-violet-600" },
  { icon: Wallet, label: "Create Invoice", href: "/fees/invoices/new", color: "bg-emerald-50 text-emerald-600" },
  { icon: CalendarCheck, label: "Mark Attendance", href: "/attendance", color: "bg-amber-50 text-amber-600" },
  { icon: ClipboardList, label: "Create Exam", href: "/exams/new", color: "bg-rose-50 text-rose-600" },
  { icon: FilePlus2, label: "New Assignment", href: "/assignments/new", color: "bg-indigo-50 text-indigo-600" },
  { icon: Trophy, label: "Generate Results", href: "/exams/results", color: "bg-cyan-50 text-cyan-600" },
  { icon: Megaphone, label: "Announcement", href: "/announcements/new", color: "bg-pink-50 text-pink-600" },
  { icon: FileDown, label: "Generate PDF", href: "/pdf-center", color: "bg-orange-50 text-orange-600" },
  { icon: Upload, label: "Import Excel", href: "/import", color: "bg-lime-50 text-lime-600" },
  { icon: Search, label: "Search", href: "#", color: "bg-slate-100 text-slate-600", action: "search" },
  { icon: QrCode, label: "ID Cards", href: "/certificates/id-cards", color: "bg-fuchsia-50 text-fuchsia-600" },
];

export default function QuickActions() {
  return (
    <div className="card p-5">
      <h3 className="font-bold text-slate-900 mb-3">Quick Actions</h3>
      <div className="grid grid-cols-3 gap-2">
        {actions.map((a) => {
          const Icon = a.icon;
          if (a.action === "search") {
            return (
              <button
                key={a.label}
                onClick={() => {
                  const e = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
                  window.dispatchEvent(e);
                }}
                className="flex flex-col items-center gap-1 p-2.5 rounded-lg hover:bg-slate-50 text-center transition"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${a.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-medium text-slate-700 leading-tight">{a.label}</span>
              </button>
            );
          }
          return (
            <Link
              key={a.label}
              href={a.href}
              className="flex flex-col items-center gap-1 p-2.5 rounded-lg hover:bg-slate-50 text-center transition"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${a.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium text-slate-700 leading-tight">{a.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
