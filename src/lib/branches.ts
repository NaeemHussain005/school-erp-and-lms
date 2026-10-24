export const BRANCH_MANAGER_ROLES = ["super_admin", "school_admin", "principal"];

export function canManageBranches(session: any) {
  return !!session?.isSuperAdmin || BRANCH_MANAGER_ROLES.includes(session?.role);
}

export function cleanBranch(
  body: any
):
  | { error: string }
  | {
      data: {
        name: string;
        address: string | null;
        phone: string | null;
        email: string | null;
        isMain: boolean;
      };
    } {
  const name = String(body?.name || "").trim();
  if (!name) return { error: "Branch name is required" };
  if (name.length > 255) return { error: "Branch name is too long" };

  const address = String(body?.address || "").trim().slice(0, 2000) || null;
  const phone = String(body?.phone || "").trim().slice(0, 50) || null;
  const email = String(body?.email || "").trim().slice(0, 255) || null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address" };
  }

  return { data: { name, address, phone, email, isMain: body?.isMain === true } };
}
