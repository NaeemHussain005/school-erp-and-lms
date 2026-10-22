import { requireAuth } from "@/lib/auth";
import BranchesBoard from "@/components/BranchesBoard";

export const dynamic = "force-dynamic";

export default async function BranchesPage() {
  await requireAuth();
  return <BranchesBoard />;
}
