"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { Save, Loader2, Palette, Building2, Users, Calendar, Wallet, ClipboardList, Bell, FileText, Shield, Database } from "lucide-react";

const tabs = [
  { key: "general", label: "General", icon: Building2 },
  { key: "branding", label: "Branding", icon: Palette },
  { key: "academic", label: "Academic", icon: Calendar },
  { key: "users", label: "Users & Roles", icon: Users },
  { key: "fees", label: "Fees", icon: Wallet },
  { key: "exams", label: "Exams", icon: ClipboardList },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "pdf", label: "PDF & Reports", icon: FileText },
  { key: "security", label: "Security", icon: Shield },
  { key: "backup", label: "Backup", icon: Database },
];

export default function SettingsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [active, setActive] = useState(params.get("tab") || "general");
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setForm(d.school || {});
        setLoading(false);
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Settings" description="Configure your school, branding, academics, fees and system preferences." />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="card p-2">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition ${
                  active === t.key ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={save} className="card p-6 lg:col-span-3 space-y-4">
          {loading ? (
            <div className="text-sm text-slate-500">Loading…</div>
          ) : (
            <>
              {active === "general" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="School Name"><input required className="input" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                  <Field label="Phone"><input className="input" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
                  <Field label="Email"><input type="email" className="input" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                  <Field label="Principal"><input className="input" value={form.principal || ""} onChange={(e) => setForm({ ...form, principal: e.target.value })} /></Field>
                  <Field label="Website"><input className="input" value={form.website || ""} onChange={(e) => setForm({ ...form, website: e.target.value })} /></Field>
                  <Field label="Registration #"><input className="input" value={form.registrationNo || ""} onChange={(e) => setForm({ ...form, registrationNo: e.target.value })} /></Field>
                  <Field label="Currency">
                    <select className="input" value={form.currency || "PKR"} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                      <option value="PKR">PKR</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option><option value="INR">INR</option><option value="AED">AED</option>
                    </select>
                  </Field>
                  <Field label="Timezone"><input className="input" value={form.timezone || "Asia/Karachi"} onChange={(e) => setForm({ ...form, timezone: e.target.value })} /></Field>
                  <Field label="Start Time"><input type="time" className="input" value={form.morningStart || ""} onChange={(e) => setForm({ ...form, morningStart: e.target.value })} /></Field>
                  <Field label="End Time"><input type="time" className="input" value={form.morningEnd || ""} onChange={(e) => setForm({ ...form, morningEnd: e.target.value })} /></Field>
                  <div className="md:col-span-2"><Field label="Address"><textarea className="input" rows={2} value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field></div>
                  <div className="md:col-span-2"><Field label="Footer Text (for PDFs)"><textarea className="input" rows={2} value={form.footerText || ""} onChange={(e) => setForm({ ...form, footerText: e.target.value })} /></Field></div>
                </div>
              )}

              {active === "branding" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Primary Color"><input type="color" className="input h-12 p-1" value={form.primaryColor || "#2563eb"} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} /></Field>
                  <Field label="Secondary Color"><input type="color" className="input h-12 p-1" value={form.secondaryColor || "#7c3aed"} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })} /></Field>
                  <Field label="Theme Preset">
                    <select className="input" value={form.themePreset || "school_blue"} onChange={(e) => {
                      const presets: Record<string, { primary: string; secondary: string }> = {
                        school_blue: { primary: "#2563eb", secondary: "#7c3aed" },
                        royal: { primary: "#1e40af", secondary: "#7c2d12" },
                        emerald: { primary: "#059669", secondary: "#0891b2" },
                        modern_purple: { primary: "#7c3aed", secondary: "#db2777" },
                        academic: { primary: "#334155", secondary: "#0f766e" },
                        minimal: { primary: "#0f172a", secondary: "#475569" },
                      };
                      const p = presets[e.target.value];
                      setForm({ ...form, themePreset: e.target.value, primaryColor: p?.primary || form.primaryColor, secondaryColor: p?.secondary || form.secondaryColor });
                    }}>
                      <option value="school_blue">School Blue</option>
                      <option value="royal">Royal</option>
                      <option value="emerald">Emerald</option>
                      <option value="modern_purple">Modern Purple</option>
                      <option value="academic">Academic</option>
                      <option value="minimal">Minimal</option>
                    </select>
                  </Field>
                  <div className="md:col-span-2 p-4 rounded-lg border border-slate-200">
                    <div className="text-sm font-semibold text-slate-900 mb-2">Preview</div>
                    <div className="flex gap-2">
                      <div className="px-4 py-2 rounded text-white text-sm" style={{ backgroundColor: form.primaryColor || "#2563eb" }}>Primary</div>
                      <div className="px-4 py-2 rounded text-white text-sm" style={{ backgroundColor: form.secondaryColor || "#7c3aed" }}>Secondary</div>
                    </div>
                  </div>
                </div>
              )}

              {active === "backup" && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">Download a full backup of your school data. This includes students, staff, fees, attendance, exams, and all records.</p>
                  <button type="button" className="btn-primary"><Database className="w-4 h-4" /> Create & Download Backup</button>
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
                    Backups include database records. For full production backups, also back up uploaded files separately.
                  </div>
                </div>
              )}

              {active !== "general" && active !== "branding" && active !== "backup" && (
                <div className="py-8 text-center text-slate-500">
                  <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm">Settings for {active} are configurable here. General and branding settings are saved above.</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                {saved && <span className="text-sm text-emerald-600 self-center">✓ Saved</span>}
                <button type="submit" disabled={saving} className="btn-primary px-6">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Settings
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="label">{label}</label>{children}</div>;
}
