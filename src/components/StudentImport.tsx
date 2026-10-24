"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Download, Loader2, Upload } from "lucide-react";

type ClassInfo = { name: string; sections: string[] };

const COLUMNS = [
  "first_name",
  "last_name",
  "father_name",
  "mother_name",
  "gender",
  "date_of_birth",
  "class",
  "section",
  "roll_no",
  "admission_no",
  "admission_date",
  "phone",
  "email",
  "cnic",
  "blood_group",
  "address",
];
const REQUIRED = ["first_name", "last_name"];

const EXTRA_ALIASES: Record<string, string> = {
  first: "first_name",
  surname: "last_name",
  last: "last_name",
  father: "father_name",
  mother: "mother_name",
  dob: "date_of_birth",
  birthdate: "date_of_birth",
  grade: "class",
  classname: "class",
  roll: "roll_no",
  rollnumber: "roll_no",
  admissionnumber: "admission_no",
  admno: "admission_no",
  mobile: "phone",
  contact: "phone",
  phonenumber: "phone",
  bform: "cnic",
  cnicbform: "cnic",
  sex: "gender",
};

function canon(h: string): string | null {
  const compact = h.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const direct = COLUMNS.find((c) => c.replace(/_/g, "") === compact);
  return direct || EXTRA_ALIASES[compact] || null;
}

function parseCsv(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, "");
  const firstLine = text.split(/\r?\n/)[0] || "";
  const delim = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === delim) {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      rows.push(row);
      row = [];
    } else cell += c;
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((x) => x.trim() !== ""));
}

const csvCell = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

type CheckResult =
  | { ok: true; ready: number }
  | { ok: false; errorCount: number; errors: { row: number; message: string }[] };

export default function StudentImport({ classes }: { classes: ClassInfo[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [ignored, setIgnored] = useState<string[]>([]);
  const [check, setCheck] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState<"check" | "import" | null>(null);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<number | null>(null);

  function reset() {
    setFileName("");
    setRows([]);
    setIgnored([]);
    setCheck(null);
    setError("");
    setCreated(null);
  }

  function downloadTemplate() {
    const sampleClass = classes[0]?.name || "Grade 1";
    const sampleSection = classes[0]?.sections[0] || "A";
    const samples: Record<string, string>[] = [
      {
        first_name: "Ali",
        last_name: "Khan",
        father_name: "Ahmed Khan",
        mother_name: "Sara Khan",
        gender: "male",
        date_of_birth: "2018-05-14",
        class: sampleClass,
        section: sampleSection,
        roll_no: "1",
        phone: "03001234567",
        address: "Jalalabad",
      },
      {
        first_name: "Ayesha",
        last_name: "Bibi",
        father_name: "Karim Ali",
        gender: "female",
        date_of_birth: "2017-11-02",
        class: sampleClass,
        section: sampleSection,
        roll_no: "2",
      },
    ];
    const csv = [COLUMNS.join(","), ...samples.map((o) => COLUMNS.map((c) => csvCell(o[c] ?? "")).join(","))].join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "students-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function send(data: Record<string, string>[], dryRun: boolean) {
    const res = await fetch("/api/students/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: data, dryRun }),
    });
    const json = await res.json();
    if (!res.ok && !("ok" in json && json.errors)) throw new Error(json.error || "Something went wrong");
    return json;
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    reset();
    if (!file) return;

    if (!/\.csv$/i.test(file.name)) {
      return setError("Please choose a .csv file. In Excel use File, then Save As, then CSV.");
    }
    if (file.size > 2 * 1024 * 1024) return setError("File is too large (maximum 2 MB).");

    const table = parseCsv(await file.text());
    if (table.length < 2) return setError("The file has no student rows.");

    const cols = table[0].map(canon);
    const missing = REQUIRED.filter((r) => !cols.includes(r));
    if (missing.length > 0) {
      return setError(`Missing column(s): ${missing.join(", ")}. Please use the template.`);
    }
    const data = table.slice(1).map((r) => {
      const o: Record<string, string> = {};
      cols.forEach((c, i) => {
        if (c) o[c] = (r[i] ?? "").trim();
      });
      return o;
    });
    if (data.length > 300) return setError("Maximum 300 students per file. Please split the file into parts.");

    setFileName(file.name);
    setRows(data);
    setIgnored(table[0].filter((h, i) => !cols[i] && h.trim()).map((h) => h.trim()));

    setLoading("check");
    try {
      setCheck(await send(data, true));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  }

  async function onImport() {
    setLoading("import");
    setError("");
    try {
      const json = await send(rows, false);
      if (json.ok) {
        setCreated(json.created);
        setCheck(null);
        router.refresh();
      } else {
        setCheck(json);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="card p-6 space-y-4">
        <h3 className="font-bold text-slate-900">Step 1: Get the template</h3>
        <button type="button" onClick={downloadTemplate} className="btn-secondary">
          <Download className="w-4 h-4" /> Download CSV template
        </button>
        <ul className="text-sm text-slate-600 space-y-1 list-disc pl-5">
          <li>
            <b>first_name</b> and <b>last_name</b> are required. Everything else is optional.
          </li>
          <li>
            <b>class</b> and <b>section</b> must match the names in Classes &amp; Sections exactly.
            {classes.length > 0 && (
              <span className="text-slate-500">
                {" "}
                Yours: {classes.map((c) => `${c.name}${c.sections.length ? " (" + c.sections.join(", ") + ")" : ""}`).join(", ")}.
              </span>
            )}
          </li>
          <li>
            <b>gender</b>: male, female or other. <b>date_of_birth</b>: 2018-05-14 or 14/05/2018.
          </li>
          <li>Leave <b>admission_no</b> empty to get numbers like ADM-2026-0002 automatically.</li>
          <li>In Excel, save the finished file with File, Save As, <b>CSV (Comma delimited)</b>. Maximum 300 students per file.</li>
        </ul>
      </div>

      <div className="card p-6 space-y-4">
        <h3 className="font-bold text-slate-900">Step 2: Upload the file</h3>
        <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={onFile} className="hidden" />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={loading !== null} className="btn-primary">
          {loading === "check" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Choose CSV file
        </button>
        {fileName && (
          <span className="ml-3 text-sm text-slate-600">
            {fileName} · {rows.length} row{rows.length === 1 ? "" : "s"}
          </span>
        )}

        {error && <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">{error}</div>}

        {ignored.length > 0 && (
          <div className="rounded-lg bg-amber-50 text-amber-700 text-sm px-4 py-3">
            These columns are not recognised and will be ignored: {ignored.join(", ")}
          </div>
        )}

        {check && !check.ok && (
          <div className="space-y-3">
            <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                {check.errorCount} row{check.errorCount === 1 ? " has" : "s have"} problems. <b>Nothing was imported.</b>{" "}
                Fix these in your file and upload it again.
              </div>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                    <th className="p-2 w-20">Row</th>
                    <th className="p-2">Problem</th>
                  </tr>
                </thead>
                <tbody>
                  {check.errors.map((er, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="p-2 font-mono">{er.row}</td>
                      <td className="p-2 text-red-700">{er.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {check.errorCount > check.errors.length && (
              <p className="text-xs text-slate-500">Showing the first {check.errors.length} problems.</p>
            )}
          </div>
        )}

        {check && check.ok && (
          <div className="space-y-3">
            <div className="rounded-lg bg-emerald-50 text-emerald-700 text-sm px-4 py-3 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>The file looks good. {check.ready} student{check.ready === 1 ? " is" : "s are"} ready to import.</div>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                    <th className="p-2">Name</th>
                    <th className="p-2">Father</th>
                    <th className="p-2">Class</th>
                    <th className="p-2">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((r, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="p-2">{`${r.first_name || ""} ${r.last_name || ""}`.trim()}</td>
                      <td className="p-2">{r.father_name || "—"}</td>
                      <td className="p-2">{[r.class, r.section].filter(Boolean).join(" ") || "—"}</td>
                      <td className="p-2">{r.phone || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 5 && <p className="text-xs text-slate-500">Showing the first 5 of {rows.length} rows.</p>}
            <button type="button" onClick={onImport} disabled={loading !== null} className="btn-primary">
              {loading === "import" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Import {check.ready}{" "}
              student{check.ready === 1 ? "" : "s"}
            </button>
          </div>
        )}

        {created !== null && (
          <div className="rounded-lg bg-emerald-50 text-emerald-700 text-sm px-4 py-3 flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {created} student{created === 1 ? "" : "s"} imported successfully.
            </span>
            <Link href="/students" className="font-semibold underline">
              View students
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
