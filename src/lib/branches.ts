// Roles allowed to manage branches (top-level admins only — branches are structural)
const BRANCH_MANAGE_ROLES = [
  "super_admin",
  "school_admin",
  "principal",
];

export function canManageBranches(session: any): boolean {
  if (!session) return false;
  if (session.isSuperAdmin) return true;
  return BRANCH_MANAGE_ROLES.includes(session.role);
}

function cleanEmail(v: any): string | null {
  const s = String(v ?? "").trim().slice(0, 255);
  if (!s) return null;
  // light check — a stricter check isn't needed for an internal record
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : "invalid";
}

export type CleanBranchData = {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  isMain: boolean;
};

type CleanResult = { error: string } | { data: CleanBranchData };

export function cleanBranch(body: any): CleanResult {
  if (!body || typeof body !== "object") return { error: "Invalid request body" };

  const name = String(body.name ?? "").trim().slice(0, 255);
  if (!name) return { error: "Please enter a branch name" };

  const addrRaw = String(body.address ?? "").trim();
  const address = addrRaw.length ? addrRaw : null;

  const phoneRaw = String(body.phone ?? "").trim().slice(0, 50);
  const phone = phoneRaw.length ? phoneRaw : null;

  const email = cleanEmail(body.email);
  if (email === "invalid") return { error: "Email address is not valid" };

  const isMain = body.isMain === true || body.isMain === "true";

  return { data: { name, address, phone, email, isMain } };
}
