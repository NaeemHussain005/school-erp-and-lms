"use client";

import { useState, useEffect } from "react";
import { Search, X, Users, UserCheck, BookOpen, Wallet, FileText, GraduationCap, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface ResultItem {
  type: string;
  id: number;
  title: string;
  subtitle?: string;
  meta?: string;
  href: string;
}

const typeIcons: Record<string, any> = {
  student: Users,
  teacher: UserCheck,
  parent: Users,
  class: GraduationCap,
  subject: BookOpen,
  invoice: Wallet,
  assignment: FileText,
};

export default function GlobalSearch({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q || q.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  function open(href: string) {
    router.push(href);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-24 px-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            autoFocus
            className="flex-1 outline-none text-base"
            placeholder="Search students, teachers, parents, classes, invoices…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {q.length < 2 && (
            <div className="p-8 text-center text-slate-500 text-sm">
              Type at least 2 characters to search. Try a student name, teacher, class, or invoice.
            </div>
          )}
          {q.length >= 2 && !loading && results.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">No results found. Try a different search.</div>
          )}
          <div className="p-2">
            {results.map((r, i) => {
              const Icon = typeIcons[r.type] || FileText;
              return (
                <button
                  key={`${r.type}-${r.id}-${i}`}
                  onClick={() => open(r.href)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 truncate">{r.title}</span>
                      <span className="badge badge-slate capitalize">{r.type}</span>
                    </div>
                    {r.subtitle && <div className="text-sm text-slate-500 truncate">{r.subtitle}</div>}
                  </div>
                  {r.meta && <div className="text-xs text-slate-500 flex-shrink-0">{r.meta}</div>}
                </button>
              );
            })}
          </div>
        </div>
        <div className="px-4 py-2 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <div>Search across students, parents, teachers, classes, fees, assignments.</div>
          <div>Press Esc to close</div>
        </div>
      </div>
    </div>
  );
}
