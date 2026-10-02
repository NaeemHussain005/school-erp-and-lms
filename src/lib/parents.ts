export const PARENT_MANAGER_ROLES = [
  "super_admin",
  "school_admin",
  "principal",
  "vice_principal",
  "hr_manager",
  "receptionist",
];

export function canManageParents(session: any) {
  return !!session?.isSuperAdmin || PARENT_MANAGER_ROLES.includes(session?.role);
}

const LIMITS: Record<string, number> = {
  fatherName: 200,
  motherName: 200,
  guardianName: 200,
  relation: 50,
  fatherPhone: 50,
  motherPhone: 50,
  fatherWhatsapp: 50,
  motherWhatsapp: 50,
  fatherEmail: 255,
  motherEmail: 255,
  fatherCnic: 30,
  motherCnic: 30,
  fatherOccupation: 150,
  motherOccupation: 150,
  address: 2000,
};

export function cleanParentBody(body: any) {
  const out: any = {};
  for (const key of Object.keys(LIMITS)) {
    const v = String(body?.[key] ?? "").trim().slice(0, LIMITS[key]);
    out[key] = v || null;
  }
  out.relation = out.relation || "father";
  return out;
}

export function hasAnyParentName(c: any) {
  return !!(c.fatherName || c.motherName || c.guardianName);
}
