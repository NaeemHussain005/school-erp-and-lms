"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ChevronRight, Building2, GraduationCap, UserCheck, Users, UserCog, Wallet, ClipboardList, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { key: "schoolInfo", label: "School Info", icon: Building2 },
  { key: "academicStructure", label: "Academic", icon: GraduationCap },
  { key: "staff", label: "Staff", icon: UserCheck },
  { key: "students", label: "Students", icon: Users },
  { key: "parents", label: "Parents", icon: UserCog },
  { key: "fees", label: "Fees", icon: Wallet },
  { key: "exams", label: "Exams", icon: ClipboardList },
];

export default function SetupWizard() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [schoolForm, setSchoolForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    principal: "",
    currency: "PKR",
    morningStart: "08:00",
    morningEnd: "14:00",
  });
  const [academicForm, setAcademicForm] = useState({
    sessionName: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    classes: "Nursery, KG, Prep, Class 1, Class 2, Class 3, Class 4, Class 5, Class 6, Class 7, Class 8, Class 9, Class 10",
    sectionsPerClass: "A, B",
  });

  async function saveSchool() {
    setSaving(true);
    try {
      const res = await fetch("/api/setup/school", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schoolForm),
      });
      if (!res.ok) throw new Error();
      setCompleted((c) => ({ ...c, schoolInfo: true }));
      setCurrent(1);
    } catch (err) {
      alert("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function saveAcademic() {
    setSaving(true);
    try {
      const res = await fetch("/api/setup/academic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(academicForm),
      });
      if (!res.ok) throw new Error();
      setCompleted((c) => ({ ...c, academicStructure: true }));
      setCurrent(2);
    } catch (err) {
      alert("Failed to create academic structure");
    } finally {
      setSaving(false);
    }
  }

  async function skipStep(key: string) {
    await fetch("/api/setup/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: key }),
    });
    setCompleted((c) => ({ ...c, [key]: true }));
    setCurrent((c) => c + 1);
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="card p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Let's configure your school</h1>
        <p className="text-slate-500 mt-1">Complete these steps and you'll be ready to go. You can skip any step and come back later.</p>

        {/* Progress */}
        <div className="mt-6 overflow-x-auto pb-2">
          <div className="flex items-center gap-1 md:gap-2 min-w-max">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isDone = completed[s.key] || i < current;
              const isActive = i === current;
              return (
                <div key={s.key} className="flex items-center gap-1 md:gap-2">
                  <div className={cn(
                    "flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-full text-xs md:text-sm font-medium whitespace-nowrap",
                    isDone ? "bg-emerald-100 text-emerald-700" : isActive ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                  )}>
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    <span className="hidden sm:inline">{i + 1}. {s.label}</span>
                    <span className="sm:hidden">{i + 1}</span>
                  </div>
                  {i < steps.length - 1 && <ChevronRight className="w-4 h-4 text-slate-300" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 min-h-[300px]">
          {current === 0 && (
            <Step num={1} title="School Information" desc="Basic details about your school.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="School Name *">
                  <input className="input" value={schoolForm.name} onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })} placeholder="e.g. City School" />
                </Field>
                <Field label="Phone">
                  <input className="input" value={schoolForm.phone} onChange={(e) => setSchoolForm({ ...schoolForm, phone: e.target.value })} />
                </Field>
                <Field label="Email">
                  <input type="email" className="input" value={schoolForm.email} onChange={(e) => setSchoolForm({ ...schoolForm, email: e.target.value })} />
                </Field>
                <Field label="Principal Name">
                  <input className="input" value={schoolForm.principal} onChange={(e) => setSchoolForm({ ...schoolForm, principal: e.target.value })} />
                </Field>
                <Field label="Currency">
                  <select className="input" value={schoolForm.currency} onChange={(e) => setSchoolForm({ ...schoolForm, currency: e.target.value })}>
                    <option value="PKR">PKR (Rs)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="AED">AED</option>
                  </select>
                </Field>
                <Field label="Start Time"><input type="time" className="input" value={schoolForm.morningStart} onChange={(e) => setSchoolForm({ ...schoolForm, morningStart: e.target.value })} /></Field>
                <Field label="End Time"><input type="time" className="input" value={schoolForm.morningEnd} onChange={(e) => setSchoolForm({ ...schoolForm, morningEnd: e.target.value })} /></Field>
                <div className="md:col-span-2">
                  <Field label="Address">
                    <textarea className="input" rows={2} value={schoolForm.address} onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })} />
                  </Field>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => skipStep("schoolInfo")} className="btn-secondary">Skip for now</button>
                <button onClick={saveSchool} disabled={!schoolForm.name || saving} className="btn-primary">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save & Continue
                </button>
              </div>
            </Step>
          )}

          {current === 1 && (
            <Step num={2} title="Academic Structure" desc="Create the current academic session, classes and sections. You can edit these later.">
              <div className="space-y-4">
                <Field label="Academic Session Name">
                  <input className="input" value={academicForm.sessionName} onChange={(e) => setAcademicForm({ ...academicForm, sessionName: e.target.value })} />
                </Field>
                <Field label="Classes (comma-separated)">
                  <textarea className="input" rows={3} value={academicForm.classes} onChange={(e) => setAcademicForm({ ...academicForm, classes: e.target.value })} />
                  <p className="text-xs text-slate-500 mt-1">Example: Nursery, KG, Class 1, Class 2, ... Class 10</p>
                </Field>
                <Field label="Sections per class (comma-separated)">
                  <input className="input" value={academicForm.sectionsPerClass} onChange={(e) => setAcademicForm({ ...academicForm, sectionsPerClass: e.target.value })} />
                  <p className="text-xs text-slate-500 mt-1">Example: A, B, C</p>
                </Field>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => skipStep("academicStructure")} className="btn-secondary">Skip</button>
                <button onClick={saveAcademic} disabled={saving} className="btn-primary">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Create & Continue
                </button>
              </div>
            </Step>
          )}

          {current === 2 && (
            <Step num={3} title="Teachers & Staff" desc="Add teachers, accountants, librarians, and other staff. You can do this later from the Staff page.">
              <EmptyContent message="You can add staff anytime from the Staff page." href="/staff/new" cta="Add first staff member" onSkip={() => skipStep("staff")} />
            </Step>
          )}
          {current === 3 && (
            <Step num={4} title="Students" desc="Add students individually or import from Excel/CSV.">
              <EmptyContent message="You can add or import students from the Students page." href="/students" cta="Go to Students" onSkip={() => skipStep("students")} />
            </Step>
          )}
          {current === 4 && (
            <Step num={5} title="Parents" desc="Link parents to students for parent portal access.">
              <EmptyContent message="Parents can be added from the Parents page." href="/parents" cta="Go to Parents" onSkip={() => skipStep("parents")} />
            </Step>
          )}
          {current === 5 && (
            <Step num={6} title="Fees" desc="Set up fee categories and class-wise fee structures.">
              <EmptyContent message="Configure fee categories and structures from the Fees page." href="/fees" cta="Go to Fees" onSkip={() => skipStep("fees")} />
            </Step>
          )}
          {current === 6 && (
            <Step num={7} title="Exams" desc="You're almost done! Configure exam types and grading later.">
              <EmptyContent message="You're ready to start using the system. You can set up exams anytime." href="/dashboard" cta="Go to Dashboard" onSkip={async () => {
                await fetch("/api/setup/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ step: "exams", done: true }) });
                router.push("/dashboard");
                router.refresh();
              }} isFinal />
            </Step>
          )}
        </div>
      </div>
    </div>
  );
}

function Step({ num, title, desc, children }: { num: number; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">{num}</span>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      </div>
      <p className="text-sm text-slate-500 ml-9 mb-5">{desc}</p>
      <div className="ml-9">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="label">{label}</label>{children}</div>;
}

function EmptyContent({ message, href, cta, onSkip, isFinal }: any) {
  return (
    <div className="py-6 text-center">
      <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
      <p className="text-slate-600">{message}</p>
      <div className="flex gap-2 justify-center mt-4">
        <button onClick={onSkip} className="btn-secondary">{isFinal ? "Finish Setup" : "Skip for now"}</button>
        <Link href={href} className="btn-primary">{cta}</Link>
      </div>
    </div>
  );
}
