export const STUDENT_IMPORT_ROLES = ["super_admin", "school_admin", "principal", "vice_principal", "receptionist"];

export function canImportStudents(session: any) {
  return !!session?.isSuperAdmin || STUDENT_IMPORT_ROLES.includes(session?.role);
}

/** Returns YYYY-MM-DD, null when empty, or "invalid". Accepts 2018-05-14 and 14/05/2018 (day first). */
export function parseDateStr(v: any): string | null | "invalid" {
  const s = String(v ?? "").trim();
  if (!s) return null;
  let y: number, m: number, d: number;
  let match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (match) {
    y = +match[1];
    m = +match[2];
    d = +match[3];
  } else {
    match = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/.exec(s);
    if (!match) return "invalid";
    d = +match[1];
    m = +match[2];
    y = +match[3];
  }
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return "invalid";
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function cleanGender(v: any): "male" | "female" | "other" | null | "invalid" {
  const s = String(v ?? "").trim().toLowerCase();
  if (!s) return null;
  if (s === "m" || s === "male" || s === "boy") return "male";
  if (s === "f" || s === "female" || s === "girl") return "female";
  if (s === "other") return "other";
  return "invalid";
}

/** Excel drops the leading 0 of Pakistani mobile numbers (3001234567 -> 03001234567). */
export function fixPhone(v: any): string | null {
  let s = String(v ?? "").trim();
  if (!s) return null;
  if (/^3\d{9}$/.test(s)) s = "0" + s;
  return s.slice(0, 50);
}
