import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { Megaphone } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AnnouncementsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader title="Announcements" description="School-wide announcements for teachers, parents, and students." action="New Announcement" actionHref="/announcements/new" actionIcon={<Megaphone className="w-4 h-4" />} />
      <div className="card p-10 text-center">
        <Megaphone className="w-10 h-10 mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500">No announcements yet. Create one to share news with your school community.</p>
        <Link href="/announcements/new" className="btn-primary mt-4">Create Announcement</Link>
      </div>
    </div>
  );
}
