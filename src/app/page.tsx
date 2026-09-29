import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ensureBootstrap } from "@/lib/auth";

export default async function Home() {
  await ensureBootstrap();
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (session.role === "parent") redirect("/parent");
  if (session.role === "student") redirect("/student");
  if (session.role === "teacher") redirect("/teacher");
  if (session.role === "super_admin") redirect("/admin/super");
  redirect("/dashboard");
}
