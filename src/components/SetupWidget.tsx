"use client";

import Link from "next/link";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { key: "schoolInfo", label: "School Profile", href: "/settings?tab=general" },
  { key: "academicStructure", label: "Academic Structure", href: "/academics/classes" },
  { key: "staff", label: "Teachers & Staff", href: "/staff" },
  { key: "students", label: "Students", href: "/students" },
  { key: "parents", label: "Parents", href: "/parents" },
  { key: "fees", label: "Fee Structure", href: "/fees/categories" },
  { key: "exams", label: "Exams Setup", href: "/exams" },
];

export default function SetupWidget({
  percent,
  stepsCompleted,
  setup,
}: {
  percent: number;
  stepsCompleted: number;
  setup: any;
}) {
  return (
    <div className="card p-5 bg-gradient-to-r from-blue-50 via-white to-violet-50 border-blue-200">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white flex items-center justify-center flex-shrink-0 shadow">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="font-bold text-slate-900">School setup progress</h3>
              <span className="text-sm font-semibold text-blue-600">{percent}% complete</span>
            </div>
            <p className="text-sm text-slate-600 mt-0.5">
              {stepsCompleted < 7
                ? "Finish the setup to start using all features. Incomplete items are highlighted."
                : "All set! Your school is fully configured."}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/setup-wizard" className="btn-secondary">
            Open Wizard
          </Link>
          <Link href="/students/import" className="btn-primary">
            Import Data
          </Link>
        </div>
      </div>

      <div className="mt-4 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-violet-600 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {steps.map((s, i) => {
          const done = (setup as any)[s.key];
          return (
            <Link
              key={s.key}
              href={s.href}
              className={cn(
                "flex items-center gap-1.5 p-2 rounded-lg text-xs border",
                done
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50"
              )}
            >
              {done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-slate-400 flex-shrink-0" />
              )}
              <span className="font-medium truncate">
                {i + 1}. {s.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
