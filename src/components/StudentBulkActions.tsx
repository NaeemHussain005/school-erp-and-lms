"use client";

import { Download, Mail, UserCog, Archive, GraduationCap, QrCode } from "lucide-react";

export default function StudentBulkActions() {
  return (
    <div className="mt-4 card p-4">
      <h3 className="font-semibold text-slate-900 mb-3 text-sm">Bulk Actions (with selected)</h3>
      <div className="flex flex-wrap gap-2">
        <button className="btn-secondary text-sm">
          <Download className="w-4 h-4" /> Export
        </button>
        <button className="btn-secondary text-sm">
          <Mail className="w-4 h-4" /> Send Message
        </button>
        <button className="btn-secondary text-sm">
          <UserCog className="w-4 h-4" /> Assign Class
        </button>
        <button className="btn-secondary text-sm">
          <GraduationCap className="w-4 h-4" /> Promote
        </button>
        <button className="btn-secondary text-sm">
          <QrCode className="w-4 h-4" /> Generate ID Cards
        </button>
        <button className="btn-secondary text-sm text-red-600 hover:bg-red-50">
          <Archive className="w-4 h-4" /> Archive
        </button>
      </div>
    </div>
  );
}
