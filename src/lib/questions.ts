import { db } from "@/db";
import { classes, subjects } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const QUESTION_TYPES = ["mcq", "true_false", "short_answer", "long_answer", "fill_blank"];
export const DIFFICULTIES = ["easy", "medium", "hard"];

export async function cleanQuestion(
  body: any,
  schoolId: number
): Promise<{ error: string } | { data: any }> {
  const questionText = String(body?.questionText || "").trim();
  if (!questionText) return { error: "Question text is required" };
  if (questionText.length > 5000) return { error: "Question text is too long" };

  const type = String(body?.type || "");
  if (!QUESTION_TYPES.includes(type)) return { error: "Select a question type" };

  const marks = parseInt(body?.marks);
  if (isNaN(marks) || marks < 1 || marks > 100) return { error: "Marks must be between 1 and 100" };

  const difficulty = DIFFICULTIES.includes(body?.difficulty) ? body.difficulty : "medium";
  const chapter = String(body?.chapter || "").trim().slice(0, 255) || null;
  const topic = String(body?.topic || "").trim().slice(0, 255) || null;
  const explanation = String(body?.explanation || "").trim().slice(0, 2000) || null;

  let options: string[] | null = null;
  const correctAnswer = String(body?.correctAnswer ?? "").trim().slice(0, 5000);

  if (type === "mcq") {
    const raw = Array.isArray(body?.options) ? body.options : [];
    options = raw.map((o: any) => String(o ?? "").trim().slice(0, 500)).filter(Boolean);
    if (!options || options.length < 2 || options.length > 6) return { error: "Add between 2 and 6 options" };
    if (!options.includes(correctAnswer)) return { error: "Select the correct option" };
  } else if (type === "true_false") {
    if (correctAnswer !== "True" && correctAnswer !== "False") return { error: "Select True or False" };
  } else if (type === "fill_blank" && !correctAnswer) {
    return { error: "Enter the correct answer" };
  }

  let classId: number | null = null;
  if (body?.classId) {
    const id = parseInt(body.classId);
    const rows = await db
      .select({ id: classes.id })
      .from(classes)
      .where(and(eq(classes.id, id), eq(classes.schoolId, schoolId)))
      .limit(1);
    if (rows.length === 0) return { error: "Class not found" };
    classId = id;
  }

  let subjectId: number | null = null;
  if (body?.subjectId) {
    const id = parseInt(body.subjectId);
    const rows = await db
      .select({ id: subjects.id })
      .from(subjects)
      .where(and(eq(subjects.id, id), eq(subjects.schoolId, schoolId)))
      .limit(1);
    if (rows.length === 0) return { error: "Subject not found" };
    subjectId = id;
  }

  return {
    data: { type, questionText, marks, difficulty, chapter, topic, explanation, options, correctAnswer, classId, subjectId },
  };
}
