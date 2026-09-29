import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | null | undefined, currency = "PKR"): string {
  if (amount === null || amount === undefined || amount === "") return `${currency} 0`;
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(n)) return `${currency} 0`;
  return `${currency} ${n.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() || "")
    .join("");
}

export function studentFullName(s: { firstName?: string | null; lastName?: string | null }) {
  return [s.firstName, s.lastName].filter(Boolean).join(" ");
}

export function generateInvoiceNo(id: number): string {
  return `INV-${String(id).padStart(6, "0")}`;
}

export function generatePaymentNo(id: number): string {
  return `PAY-${String(id).padStart(6, "0")}`;
}

export function generateAdmissionNo(id: number): string {
  const year = new Date().getFullYear();
  return `ADM-${year}-${String(id).padStart(4, "0")}`;
}

export function generateEmployeeId(id: number): string {
  return `EMP-${String(id).padStart(5, "0")}`;
}

export function percentage(obtained: number | string | null | undefined, total: number): string {
  if (!obtained) return "0";
  const n = typeof obtained === "string" ? parseFloat(obtained) : obtained;
  if (isNaN(n) || total === 0) return "0";
  return ((n / total) * 100).toFixed(1);
}

export function gradeFromPercentage(pct: number): string {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  if (pct >= 33) return "E";
  return "F";
}

export function gpaFromPercentage(pct: number): number {
  if (pct >= 90) return 4.0;
  if (pct >= 80) return 3.7;
  if (pct >= 70) return 3.3;
  if (pct >= 60) return 2.7;
  if (pct >= 50) return 2.0;
  if (pct >= 33) return 1.0;
  return 0;
}

export function daysBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function whatsappLink(phone: string, message: string): string {
  let clean = phone.replace(/[^0-9]/g, "");
  if (clean.startsWith("03") && clean.length === 11) {
    clean = "92" + clean.slice(1);
  }
  if (!clean.startsWith("92")) {
    // leave as-is
  }
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export function toISODateInput(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function monthName(monthNum: number): string {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[monthNum - 1] || String(monthNum);
}

export function currentMonthName(): string {
  return monthName(new Date().getMonth() + 1);
}
