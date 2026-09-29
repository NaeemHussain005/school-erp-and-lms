import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { FileText } from "lucide-react";

export default function PlaceholderPage({ title, description, action, actionHref, icon: Icon = FileText }: {
  title: string;
  description?: string;
  action?: string;
  actionHref?: string;
  icon?: any;
}) {
  const I = Icon;
  return (
    <div className="animate-fade-in">
      <PageHeader title={title} description={description} action={action} actionHref={actionHref} actionIcon={action ? <I className="w-4 h-4" /> : undefined} />
      <div className="card p-10 text-center">
        <div className="w-14 h-14 rounded-full bg-blue-50 mx-auto flex items-center justify-center text-blue-600 mb-3">
          <I className="w-7 h-7" />
        </div>
        <h3 className="font-bold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          This module is part of the SchoolGuide system. Use the quick actions, dashboard widgets, or related modules to get started.
        </p>
        <div className="flex gap-2 justify-center mt-4">
          <Link href="/dashboard" className="btn-secondary">Back to Dashboard</Link>
          {action && actionHref && <Link href={actionHref} className="btn-primary">{action}</Link>}
        </div>
      </div>
    </div>
  );
}
