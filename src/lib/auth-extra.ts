// Extra small helpers to avoid cluttering auth.ts

export function generateEmployeeId(id: number): string {
  return `EMP-${String(id).padStart(5, "0")}`;
}
