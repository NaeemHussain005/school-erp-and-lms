"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, X, Loader2, Upload } from "lucide-react";
import { toISODateInput } from "@/lib/utils";

export default function StudentForm({
  student,
  classes,
  sessions,
  currentSessionId,
  schoolId,
}: {
  student?: any;
  classes: any[];
  sections?: any[];
  sessions: any[];
  currentSessionId?: number;
  schoolId: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(() => ({
    firstName: student?.firstName || "",
    lastName: student?.lastName || "",
    fatherName: student?.fatherName || "",
    motherName: student?.motherName || "",
    gender: student?.gender || "male",
    dateOfBirth: toISODateInput(student?.dateOfBirth) || "",
    cnic: student?.cnic || "",
    bloodGroup: student?.bloodGroup || "",
    phone: student?.phone || "",
    email: student?.email || "",
    address: student?.address || "",
    emergencyContact: student?.emergencyContact || "",
    emergencyName: student?.emergencyName || "",
    admissionDate: toISODateInput(student?.admissionDate) || new Date().toISOString().slice(0, 10),
    previousSchool: student?.previousSchool || "",
    rollNo: student?.rollNo || "",
    classId: student?.classId || "",
    sectionId: student?.sectionId || "",
    academicSessionId: student?.academicSessionId || currentSessionId || "",
    house: student?.house || "",
    medicalInfo: student?.medicalInfo || "",
    notes: student?.notes || "",
  }));
  const [sectionList, setSectionList] = useState<any[]>([]);

  useEffect(() => {
    if (form.classId) {
      fetch(`/api/classes/${form.classId}/sections`)
        .then((r) => r.json())
        .then((d) => setSectionList(d.sections || []));
    } else {
      setSectionList([]);
    }
  }, [form.classId]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const url = student ? `/api/students/${student.id}` : "/api/students";
      const method = student ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, schoolId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save student");
      setSuccess(student ? "Student updated." : "Student added successfully.");
      if (!student) {
        setTimeout(() => router.push(`/students/${data.studentId}`), 800);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card p-6 space-y-6">
      {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
      {success && <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">{success}</div>}

      <Section title="Personal Information">
        <Field label="First Name *">
          <input required className="input" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} />
        </Field>
        <Field label="Last Name *">
          <input required className="input" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} />
        </Field>
        <Field label="Gender">
          <select className="input" value={form.gender} onChange={(e) => update("gender", e.target.value)}>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Date of Birth">
          <input type="date" className="input" value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} />
        </Field>
        <Field label="CNIC / B-Form">
          <input className="input" value={form.cnic} onChange={(e) => update("cnic", e.target.value)} />
        </Field>
        <Field label="Blood Group">
          <select className="input" value={form.bloodGroup} onChange={(e) => update("bloodGroup", e.target.value)}>
            <option value="">—</option>
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </Field>
      </Section>

      <Section title="Parent / Guardian">
        <Field label="Father Name">
          <input className="input" value={form.fatherName} onChange={(e) => update("fatherName", e.target.value)} />
        </Field>
        <Field label="Mother Name">
          <input className="input" value={form.motherName} onChange={(e) => update("motherName", e.target.value)} />
        </Field>
        <Field label="Emergency Contact Name">
          <input className="input" value={form.emergencyName} onChange={(e) => update("emergencyName", e.target.value)} />
        </Field>
        <Field label="Emergency Contact Phone">
          <input className="input" value={form.emergencyContact} onChange={(e) => update("emergencyContact", e.target.value)} />
        </Field>
      </Section>

      <Section title="Contact & Address">
        <Field label="Phone">
          <input className="input" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
        </Field>
        <Field label="Email">
          <input type="email" className="input" value={form.email} onChange={(e) => update("email", e.target.value)} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Address">
            <textarea className="input" rows={2} value={form.address} onChange={(e) => update("address", e.target.value)} />
          </Field>
        </div>
      </Section>

      <Section title="Academic Details">
        <Field label="Admission Date">
          <input type="date" className="input" value={form.admissionDate} onChange={(e) => update("admissionDate", e.target.value)} />
        </Field>
        <Field label="Academic Session">
          <select className="input" value={form.academicSessionId} onChange={(e) => update("academicSessionId", e.target.value)}>
            <option value="">—</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Class">
          <select className="input" value={form.classId} onChange={(e) => { update("classId", e.target.value); update("sectionId", ""); }}>
            <option value="">— Select Class —</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Section">
          <select className="input" value={form.sectionId} onChange={(e) => update("sectionId", e.target.value)} disabled={!form.classId}>
            <option value="">—</option>
            {sectionList.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Roll Number">
          <input className="input" value={form.rollNo} onChange={(e) => update("rollNo", e.target.value)} />
        </Field>
        <Field label="House">
          <input className="input" value={form.house} onChange={(e) => update("house", e.target.value)} />
        </Field>
        <Field label="Previous School">
          <input className="input" value={form.previousSchool} onChange={(e) => update("previousSchool", e.target.value)} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Medical Information">
            <textarea className="input" rows={2} value={form.medicalInfo} onChange={(e) => update("medicalInfo", e.target.value)} placeholder="Allergies, conditions, etc." />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Notes">
            <textarea className="input" rows={2} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
          </Field>
        </div>
      </Section>

      <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          <X className="w-4 h-4" /> Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-primary px-6">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {student ? "Save Changes" : "Save Student"}
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold text-slate-900 mb-3">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
