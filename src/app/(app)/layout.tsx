import { redirect } from "next/navigation";
import { getSession, getCurrentSchool, ensureBootstrap } from "@/lib/auth";
import AppShell from "@/components/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await ensureBootstrap();
  const session = await getSession();
  if (!session) redirect("/login");
  const school = await getCurrentSchool();
  return (
    <AppShell session={session} school={school}>
      {children}
    </AppShell>
  );
}
