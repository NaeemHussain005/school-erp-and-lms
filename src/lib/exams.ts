export const EXAM_ENTRY_ROLES = [
  "super_admin",
  "school_admin",
  "principal",
  "vice_principal",
  "teacher",
  "exam_controller",
];

export const EXAM_ADMIN_ROLES = [
  "super_admin",
  "school_admin",
  "principal",
  "vice_principal",
  "exam_controller",
];

export const EXAM_TYPES: string[] = [
  "mid_term",
  "final_term",
  "monthly",
  "weekly",
  "quiz",
  "assignment",
  "annual",
  "unit_test",
];

export function canEnterMarks(session: any) {
  return !!session?.isSuperAdmin || EXAM_ENTRY_ROLES.includes(session?.role);
}

export function canAdminExams(session: any) {
  return !!session?.isSuperAdmin || EXAM_ADMIN_ROLES.includes(session?.role);
}

export function gradeFor(obtained: number, total: number, pass: number) {
  const percentage = total > 0 ? (obtained / total) * 100 : 0;
  let grade: string;
  if (obtained < pass) grade = "F";
  else if (percentage >= 90) grade = "A+";
  else if (percentage >= 80) grade = "A";
  else if (percentage >= 70) grade = "B";
  else if (percentage >= 60) grade = "C";
  else grade = "D";
  return { percentage, grade };
}
