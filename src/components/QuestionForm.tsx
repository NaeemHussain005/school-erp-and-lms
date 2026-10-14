"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash2 } from "lucide-react";

type Opt = { id: number; name: string };

export type QuestionInitial = {
  type: string;
  questionText: string;
  marks: string;
  difficulty: string;
  classId: string;
  subjectId: string;
  chapter: string;
  topic: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

const TYPES = [
  { v: "mcq", l: "Multiple Choice (MCQ)" },
  { v: "true_false", l: "True / False" },
  { v: "short_answer", l: "Short Answer" },
  { v: "long_answer", l: "Long Answer" },
  { v: "fill_blank", l: "Fill in the Blank" },
];

const EMPTY: QuestionInitial = {
  type: "mcq",
  questionText: "",
  marks: "1",
  difficulty: "medium",
  classId: "",
  subjectId: "",
  chapter: "",
  topic: "",
  options: [],
  correctAnswer: "",
  explanation: "",
};

export default function QuestionForm({
  questionId,
  initial,
  classes,
  subjects,
}: {
  questionId?: number;
  initial?: QuestionInitial;
  classes: Opt[];
  subjects: Opt[];
}) {
  const router = useRouter();
  const start = initial ?? EMPTY;
  const [f, setF] = useState<QuestionInitial>(start);
  const [opts, setOpts] = useState<string[]>(() =>
    [...start.options, "", "", "", ""].slice(0, Math.max(4, start.options.length))
  );
  const [correctIdx, setCorrectIdx] = useState<string>(() => {
    const i = start.options.indexOf(start.correctAnswer);
    return i >= 0 ? String(i) : "0";
  });
  const [loading, setLoading] = useState<"save" | "delete" | null>(null);
  const [error, setError] = useState("");

  const set = (k: keyof QuestionInitial, v: string) => setF((s) => ({ ...s, [k]: v }));
  const label = "block text-sm font-medium text-slate-700 mb-1";

  function onTypeChange(t: string) {
    setF((s) => ({ ...s, type: t, correctAnswer: t === "true_false" ? "True" : "" }));
  }

  async function onSave(e: React.MouseEvent) {
    e.preventDefault();
    setError("");
    if (!f.questionText.trim()) return setError("Enter the question text");

    const body: any = { ...f };
    if (f.type === "mcq") {
      const correct = opts[Number(correctIdx)]?.trim();
      if (!correct) return setError("Select the correct option (it must not be empty)");
      body.options = opts;
      body.correctAnswer = correct;
    }

    setLoading("save");
    try {
      const res = await fetch(questionId ? `/api/questions/${questionId}` : "/api/questions", {
        method: questionId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      router.push("/exams/questions");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  }

  async function onDelete() {
    if (!confirm("Delete this question? This cannot be undone.")) return;
    setLoading("delete");
    setError("");
    try {
      const res = await fetch(`/api/questions/${questionId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete");
      router.push("/exams/questions");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="card p-6 space-y-5">
      {error && <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={label}>Question Type *</label>
          <select className="input" value={f.type} onChange={(e) => onTypeChange(e.target.value)}>
            {TYPES.map((t) => (
              <option key={t.v} value={t.v}>
                {t.l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Marks *</label>
          <input type="number" min="1" max="100" className="input" value={f.marks} onChange={(e) => set("marks", e.target.value)} />
        </div>

        <div className="md:col-span-2">
          <label className={label}>Question *</label>
          <textarea className="input" rows={3} value={f.questionText} onChange={(e) => set("questionText", e.target.value)} />
        </div>

        {f.type === "mcq" && (
          <div className="md:col-span-2 space-y-2">
            <label className={label}>Options (select the correct one)</label>
            {opts.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct"
                  checked={correctIdx === String(i)}
                  onChange={() => setCorrectIdx(String(i))}
                />
                <input
                  className="input"
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  value={o}
                  onChange={(e) => setOpts((arr) => arr.map((x, j) => (j === i ? e.target.value : x)))}
                />
              </div>
            ))}
            {opts.length < 6 && (
              <button type="button" className="text-sm text-blue-600 hover:underline" onClick={() => setOpts((a) => [...a, ""])}>
                + Add option
              </button>
            )}
          </div>
        )}

        {f.type === "true_false" && (
          <div className="md:col-span-2">
            <label className={label}>Correct Answer *</label>
            <select className="input" value={f.correctAnswer || "True"} onChange={(e) => set("correctAnswer", e.target.value)}>
              <option value="True">True</option>
              <option value="False">False</option>
            </select>
          </div>
        )}

        {(f.type === "short_answer" || f.type === "long_answer" || f.type === "fill_blank") && (
          <div className="md:col-span-2">
            <label className={label}>{f.type === "fill_blank" ? "Correct Answer *" : "Model Answer (optional)"}</label>
            <textarea
              className="input"
              rows={f.type === "long_answer" ? 4 : 2}
              value={f.correctAnswer}
              onChange={(e) => set("correctAnswer", e.target.value)}
            />
          </div>
        )}

        <div>
          <label className={label}>Class</label>
          <select className="input" value={f.classId} onChange={(e) => set("classId", e.target.value)}>
            <option value="">Any class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Subject</label>
          <select className="input" value={f.subjectId} onChange={(e) => set("subjectId", e.target.value)}>
            <option value="">No subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Chapter</label>
          <input className="input" value={f.chapter} onChange={(e) => set("chapter", e.target.value)} />
        </div>
        <div>
          <label className={label}>Topic</label>
          <input className="input" value={f.topic} onChange={(e) => set("topic", e.target.value)} />
        </div>
        <div>
          <label className={label}>Difficulty</label>
          <select className="input" value={f.difficulty} onChange={(e) => set("difficulty", e.target.value)}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className={label}>Explanation (optional)</label>
          <textarea className="input" rows={2} value={f.explanation} onChange={(e) => set("explanation", e.target.value)} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
        <button type="button" onClick={onSave} disabled={loading !== null} className="btn-primary">
          {loading === "save" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{" "}
          {questionId ? "Save Changes" : "Save Question"}
        </button>
        {questionId && (
          <button type="button" onClick={onDelete} disabled={loading !== null} className="btn-secondary text-red-600 md:ml-auto">
            {loading === "delete" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete
          </button>
        )}
      </div>
    </div>
  );
}
