"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Library,
  Plus,
  Search,
  Filter,
  Pencil,
  Trash2,
  Loader2,
  FileText,
  Video,
  Link2,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import MaterialForm, { MaterialInitial } from "@/components/MaterialForm";

type ClassOpt = { id: number; name: string };
type SubjectOpt = { id: number; name: string };

type Item = {
  id: number;
  title: string;
  description: string;
  type: string;
  classId: number | null;
  subjectId: number | null;
  className: string;
  subjectName: string;
  fileUrl: string;
  externalUrl: string;
  isPublic: boolean;
};

const TYPE_LABELS: Record<string, string> = {
  pdf: "PDF",
  video: "Video",
  document: "Document",
  link: "Link",
  worksheet: "Worksheet",
  past_paper: "Past Paper",
  book: "Book",
};

const TYPE_ICON: Record<string, any> = {
  pdf: FileText,
  video: Video,
  document: FileText,
  link: Link2,
  worksheet: FileText,
  past_paper: FileText,
  book: BookOpen,
};

export default function LibraryManager({
  items,
  classes,
  subjects,
  canManage,
  filters,
}: {
  items: Item[];
  classes: ClassOpt[];
  subjects: SubjectOpt[];
  canManage: boolean;
  filters: { q: string; type: string; classId: string };
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MaterialInitial | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  function openAdd() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(it: Item) {
    setEditing({
      id: it.id,
      title: it.title,
      description: it.description,
      type: it.type,
      classId: it.classId ? String(it.classId) : "",
      subjectId: it.subjectId ? String(it.subjectId) : "",
      fileUrl: it.fileUrl,
      externalUrl: it.externalUrl,
      isPublic: it.isPublic,
    });
    setShowForm(true);
  }

  async function onDelete(id: number) {
    if (!confirm("Delete this material?")) return;
    setDeletingId(id);
    setError("");
    try {
      const res = await fetch(`/api/materials/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      {canManage ? (
        <PageHeader
          title="Materials Library"
          description="Central library of PDFs, videos, worksheets and past papers."
          action="Add Material"
          actionIcon={<Plus className="w-4 h-4" />}
          actionOnClick={openAdd}
        />
      ) : (
        <PageHeader
          title="Materials Library"
          description="PDFs, videos, worksheets and past papers shared by your school."
        />
      )}

      {error && <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3 mb-4">{error}</div>}

      {/* Add / Edit form */}
      {canManage && showForm && (
        <div className="mb-4">
          <MaterialForm
            initial={editing ?? undefined}
            classes={classes}
            subjects={subjects}
            onDone={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 mb-4">
        <form className="flex flex-col md:flex-row gap-3" action="/lms/library" method="get">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={filters.q}
              placeholder="Search materials…"
              className="input pl-9"
            />
          </div>
          <select name="type" defaultValue={filters.type} className="input md:w-44">
            <option value="">All types</option>
            {Object.entries(TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <select name="class" defaultValue={filters.classId} className="input md:w-44">
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary px-5">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </form>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-blue-50 mx-auto flex items-center justify-center text-blue-600 mb-3">
            <Library className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-900">
            {filters.q || filters.type || filters.classId ? "No materials match your filters" : "No materials yet"}
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {canManage
              ? "Add PDFs, videos, worksheets or past papers for your classes."
              : "No materials have been shared yet."}
          </p>
          {canManage && !showForm && (
            <button type="button" onClick={openAdd} className="btn-primary mt-4">
              <Plus className="w-4 h-4" /> Add Material
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it) => {
            const Icon = TYPE_ICON[it.type] || FileText;
            const openUrl = it.fileUrl || it.externalUrl;
            return (
              <div key={it.id} className="card p-5 flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  {canManage && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(it)}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(it.id)}
                        disabled={deletingId === it.id}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
