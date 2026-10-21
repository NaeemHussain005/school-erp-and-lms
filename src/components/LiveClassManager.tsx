"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Video,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ExternalLink,
  Clock,
  Ban,
  RotateCcw,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import LiveClassForm, { LiveClassInitial } from "@/components/LiveClassForm";
import { formatDateTime } from "@/lib/utils";

type ClassOpt = { id: number; name: string };
type SectionOpt = { id: number; classId: number | null; name: string };
type SubjectOpt = { id: number; name: string };
type TeacherOpt = { id: number; name: string };

type Item = {
  id: number;
  title: string;
  classId: number | null;
  sectionId: number | null;
  subjectId: number | null;
  teacherId: number | null;
  className: string;
  sectionName: string;
  subjectName: string;
  teacherName: string;
  meetingUrl: string;
  provider: string;
  scheduledAt: string | null;
  durationMinutes: number;
  description: string;
  isCancelled: boolean;
  isPast: boolean;
};

export default function LiveClassManager({
  items,
  classes,
  sections,
  subjects,
  teachers,
  canManage,
}: {
  items: Item[];
  classes: ClassOpt[];
  sections: SectionOpt[];
  subjects: SubjectOpt[];
  teachers: TeacherOpt[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<LiveClassInitial | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  function openAdd() {
    setEditing(null);
    setShowForm(true);
  }

  function toLocalInput(iso: string | null): string {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    // datetime-local needs yyyy-MM-ddThh:mm in local time
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
      d.getMinutes()
    )}`;
  }

  function openEdit(it: Item) {
    setEditing({
      id: it.id,
      title: it.title,
      classId: it.classId ? String(it.classId) : "",
      sectionId: it.sectionId ? String(it.sectionId) : "",
      subjectId: it.subjectId ? String(it.subjectId) : "",
      teacherId: it.teacherId ? String(it.teacherId) : "",
      meetingUrl: it.meetingUrl,
      provider: it.provider || "external",
      scheduledAt: toLocalInput(it.scheduledAt),
      durationMinutes: String(it.durationMinutes || 45),
      description: it.description,
    });
    setShowForm(true);
  }

  async function call(id: number, method: "PATCH" | "DELETE", body?: any) {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/live-classes/${id}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Delete this live class?")) return;
    await call(id, "DELETE");
  }

  const upcoming = items.filter((i) => !i.isPast);
  const past = items.filter((i) => i.isPast);

  function Card({ it }: { it: Item }) {
    const busy = busyId === it.id;
    return (
      <div className={`card p-5 ${it.isCancelled ? "opacity-60" : ""}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
            <Video className="w-5 h-5" />
          </div>
          {canManage && (
            <div className="flex gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => openEdit(it)}
                disabled={busy}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => call(it.id, "PATCH", { isCancelled: !it.isCancelled })}
                disabled={busy}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                title={it.isCancelled ? "Restore" : "Cancel"}
              >
                {it.isCancelled ? <RotateCcw className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => onDelete(it.id)}
                disabled={busy}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                title="Delete"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>

        <div className="font-bold text-slate-900 mt-3 line-clamp-2">
          {it.title} {it.isCancelled && <span className="badge badge-slate ml-1">Cancelled</span>}
        </div>
        <div className="text-xs text-slate-500 mt-0.5">
          {[it.className, it.sectionName].filter(Boolean).join(" ")}
          {it.subjectName && ` · ${it.subjectName}`}
          {it.teacherName && ` · ${it.teacherName}`}
        </div>

        {it.scheduledAt && (
          <div className="text-sm text-slate-600 mt-2 inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {formatDateTime(it.scheduledAt)} · {it.durationMinutes} min
          </div>
        )}

        {it.description && <p className="text-sm text-slate-500 mt-2 line-clamp-2">{it.description}</p>}

        <div className="mt-3 pt-3 border-t border-slate-100">
          {it.meetingUrl && !it.isCancelled ? (
            <a href={it.meetingUrl} target="_blank" rel="noreferrer" className="btn-primary">
              <Video className="w-4 h-4" /> Join Class
            </a>
          ) : (
            <span className="text-sm text-slate-400">
              {it.isCancelled ? "Class cancelled" : "No meeting link"}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {canManage ? (
        <PageHeader
          title="Live Classes"
          description="Schedule and join online classes via any video provider."
          action="Schedule Live Class"
          actionIcon={<Plus className="w-4 h-4" />}
          actionOnClick={openAdd}
        />
      ) : (
        <PageHeader title="Live Classes" description="Your scheduled online classes." />
      )}

      {error && <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3 mb-4">{error}</div>}

      {canManage && showForm && (
        <div className="mb-4">
          <LiveClassForm
            initial={editing ?? undefined}
            classes={classes}
            sections={sections}
            subjects={subjects}
            teachers={teachers}
            onDone={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {items.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-blue-50 mx-auto flex items-center justify-center text-blue-600 mb-3">
            <Video className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-900">No live classes yet</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {canManage
              ? "Schedule your first online class with a meeting link."
              : "No classes have been scheduled yet."}
          </p>
          {canManage && !showForm && (
            <button type="button" onClick={openAdd} className="btn-primary mt-4">
              <Plus className="w-4 h-4" /> Schedule Live Class
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <h3 className="font-bold text-slate-900 mb-3">Upcoming</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcoming.map((it) => (
                  <Card key={it.id} it={it} />
                ))}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h3 className="font-bold text-slate-900 mb-3">Past</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {past.map((it) => (
                  <Card key={it.id} it={it} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
