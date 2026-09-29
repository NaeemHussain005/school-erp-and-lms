"use client";

import Link from "next/link";
import { Plus, ArrowLeft } from "lucide-react";
import { ReactNode } from "react";

export default function PageHeader({
  title,
  description,
  action,
  actionHref,
  backHref,
  actionIcon = <Plus className="w-4 h-4" />,
  children,
}: {
  title: string;
  description?: string;
  action?: string;
  actionHref?: string;
  backHref?: string;
  actionIcon?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          {backHref && (
            <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 mb-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
          )}
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {description && <p className="text-slate-500 mt-1 text-sm">{description}</p>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {children}
          {action && actionHref && (
            <Link href={actionHref} className="btn-primary">
              {actionIcon}
              {action}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
