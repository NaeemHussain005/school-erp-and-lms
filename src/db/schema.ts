import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  numeric,
  boolean,
  date,
  timestamp,
  pgEnum,
  jsonb,
  uuid,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============ ENUMS ============
export const roleEnum = pgEnum("role", [
  "super_admin",
  "school_admin",
  "principal",
  "vice_principal",
  "teacher",
  "accountant",
  "receptionist",
  "exam_controller",
  "librarian",
  "transport_manager",
  "hr_manager",
  "parent",
  "student",
]);

export const attendanceStatusEnum = pgEnum("attendance_status", [
  "present",
  "absent",
  "late",
  "leave",
  "holiday",
]);

export const genderEnum = pgEnum("gender", ["male", "female", "other"]);

export const examTypeEnum = pgEnum("exam_type", [
  "mid_term",
  "final_term",
  "monthly",
  "weekly",
  "quiz",
  "assignment",
  "annual",
  "unit_test",
]);

export const questionTypeEnum = pgEnum("question_type", [
  "mcq",
  "true_false",
  "short_answer",
  "long_answer",
  "fill_blank",
  "matching",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "paid",
  "unpaid",
  "partial",
  "overdue",
  "cancelled",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "bank",
  "card",
  "online",
  "cheque",
  "other",
]);

export const assignmentStatusEnum = pgEnum("assignment_status", [
  "pending",
  "submitted",
  "graded",
  "late",
  "resubmit",
]);

export const admissionStatusEnum = pgEnum("admission_status", [
  "inquiry",
  "application",
  "interview",
  "approved",
  "admitted",
  "rejected",
  "waitlisted",
]);

export const leaveStatusEnum = pgEnum("leave_status", [
  "pending",
  "approved",
  "rejected",
  "cancelled",
]);

export const leaveTypeEnum = pgEnum("leave_type", [
  "casual",
  "sick",
  "annual",
  "unpaid",
  "half_day",
]);

// ============ BRANCH / SCHOOL ============
export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 255 }),
  principal: varchar("principal", { length: 255 }),
  registrationNo: varchar("registration_no", { length: 100 }),
  morningStart: varchar("morning_start", { length: 10 }),
  morningEnd: varchar("morning_end", { length: 10 }),
  currency: varchar("currency", { length: 10 }).default("PKR"),
  timezone: varchar("timezone", { length: 50 }).default("Asia/Karachi"),
  footerText: text("footer_text"),
  primaryColor: varchar("primary_color", { length: 20 }).default("#2563eb"),
  secondaryColor: varchar("secondary_color", { length: 20 }).default("#7c3aed"),
  themePreset: varchar("theme_preset", { length: 30 }).default("school_blue"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const branches = pgTable("branches", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  isMain: boolean("is_main").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============ ACADEMIC SESSIONS ============
export const academicSessions = pgTable("academic_sessions", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  branchId: integer("branch_id").references(() => branches.id),
  name: varchar("name", { length: 100 }).notNull(), // e.g. 2025-26
  startDate: date("start_date"),
  endDate: date("end_date"),
  isActive: boolean("is_active").default(false),
  isCurrent: boolean("is_current").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============ DEPARTMENTS ============
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  branchId: integer("branch_id").references(() => branches.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  headTeacherId: integer("head_teacher_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============ USERS ============
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  branchId: integer("branch_id").references(() => branches.id),
  email: varchar("email", { length: 255 }).unique(),
  username: varchar("username", { length: 100 }).unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("school_admin"),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  phone: varchar("phone", { length: 50 }),
  whatsapp: varchar("whatsapp", { length: 50 }),
  photoUrl: text("photo_url"),
  address: text("address"),
  gender: genderEnum("gender"),
  dateOfBirth: date("date_of_birth"),
  isActive: boolean("is_active").default(true),
  isSuperAdmin: boolean("is_super_admin").default(false),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  emailIdx: uniqueIndex("email_idx").on(table.email),
  usernameIdx: uniqueIndex("username_idx").on(table.username),
}));

// ============ CLASSES ============
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  branchId: integer("branch_id").references(() => branches.id),
  name: varchar("name", { length: 100 }).notNull(), // e.g. Grade 1, Class 10
  numericLevel: integer("numeric_level"),
  description: text("description"),
  classTeacherId: integer("class_teacher_id"),
  monthlyFee: numeric("monthly_fee", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============ SECTIONS ============
export const sections = pgTable("sections", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  branchId: integer("branch_id").references(() => branches.id),
  classId: integer("class_id").references(() => classes.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 50 }).notNull(), // A, B, C
  roomNo: varchar("room_no", { length: 20 }),
  teacherId: integer("teacher_id"),
  maxStudents: integer("max_students").default(50),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============ SUBJECTS ============
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  branchId: integer("branch_id").references(() => branches.id),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }),
  departmentId: integer("department_id").references(() => departments.id),
  description: text("description"),
  type: varchar("type", { length: 50 }).default("theory"), // theory, practical, lab
  creditHours: numeric("credit_hours", { precision: 4, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============ CLASS SUBJECTS ============
export const classSubjects = pgTable("class_subjects", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  classId: integer("class_id").references(() => classes.id, { onDelete: "cascade" }),
  sectionId: integer("section_id").references(() => sections.id),
  subjectId: integer("subject_id").references(() => subjects.id, { onDelete: "cascade" }),
  teacherId: integer("teacher_id").references(() => users.id),
  academicSessionId: integer("academic_session_id").references(() => academicSessions.id),
  passMarks: integer("pass_marks").default(33),
  totalMarks: integer("total_marks").default(100),
});

// ============ TEACHERS (extra info) ============
export const teacherProfiles = pgTable("teacher_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  employeeId: varchar("employee_id", { length: 50 }),
  qualification: text("qualification"),
  specialization: varchar("specialization", { length: 255 }),
  designation: varchar("designation", { length: 100 }),
  departmentId: integer("department_id").references(() => departments.id),
  joiningDate: date("joining_date"),
  salary: numeric("salary", { precision: 10, scale: 2 }),
  cnic: varchar("cnic", { length: 30 }),
  emergencyContact: varchar("emergency_contact", { length: 50 }),
  emergencyName: varchar("emergency_name", { length: 200 }),
  bloodGroup: varchar("blood_group", { length: 10 }),
  experienceYears: integer("experience_years"),
  bio: text("bio"),
  documents: jsonb("documents").$type<string[]>().default([]),
});

// ============ STUDENTS ============
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  branchId: integer("branch_id").references(() => branches.id),
  admissionNo: varchar("admission_no", { length: 50 }).unique(),
  rollNo: varchar("roll_no", { length: 50 }),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  fatherName: varchar("father_name", { length: 200 }),
  motherName: varchar("mother_name", { length: 200 }),
  gender: genderEnum("gender"),
  dateOfBirth: date("date_of_birth"),
  cnic: varchar("cnic", { length: 30 }),
  bloodGroup: varchar("blood_group", { length: 10 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  emergencyContact: varchar("emergency_contact", { length: 50 }),
  emergencyName: varchar("emergency_name", { length: 200 }),
  admissionDate: date("admission_date"),
  previousSchool: text("previous_school"),
  photoUrl: text("photo_url"),
  classId: integer("class_id").references(() => classes.id),
  sectionId: integer("section_id").references(() => sections.id),
  academicSessionId: integer("academic_session_id").references(() => academicSessions.id),
  house: varchar("house", { length: 100 }),
  routeId: integer("route_id"),
  medicalInfo: text("medical_info"),
  notes: text("notes"),
  documents: jsonb("documents").$type<string[]>().default([]),
  admissionStatus: admissionStatusEnum("admission_status").default("admitted"),
  isActive: boolean("is_active").default(true),
  isGraduated: boolean("is_graduated").default(false),
  graduatedDate: date("graduated_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  admissionNoIdx: uniqueIndex("admission_no_idx").on(table.admissionNo),
}));

// ============ PARENTS ============
export const parents = pgTable("parents", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  fatherName: varchar("father_name", { length: 200 }),
  motherName: varchar("mother_name", { length: 200 }),
  guardianName: varchar("guardian_name", { length: 200 }),
  relation: varchar("relation", { length: 50 }).default("father"),
  fatherPhone: varchar("father_phone", { length: 50 }),
  motherPhone: varchar("mother_phone", { length: 50 }),
  fatherWhatsapp: varchar("father_whatsapp", { length: 50 }),
  motherWhatsapp: varchar("mother_whatsapp", { length: 50 }),
  fatherEmail: varchar("father_email", { length: 255 }),
  motherEmail: varchar("mother_email", { length: 255 }),
  fatherCnic: varchar("father_cnic", { length: 30 }),
  motherCnic: varchar("mother_cnic", { length: 30 }),
  fatherOccupation: varchar("father_occupation", { length: 150 }),
  motherOccupation: varchar("mother_occupation", { length: 150 }),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============ STUDENT-PARENT MAP ============
export const studentParents = pgTable("student_parents", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id, { onDelete: "cascade" }),
  parentId: integer("parent_id").references(() => parents.id, { onDelete: "cascade" }),
  isPrimary: boolean("is_primary").default(true),
  relationship: varchar("relationship", { length: 50 }).default("father"),
});

// ============ STAFF (non-teacher) ============
export const staffProfiles = pgTable("staff_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  employeeId: varchar("employee_id", { length: 50 }),
  designation: varchar("designation", { length: 100 }),
  departmentId: integer("department_id").references(() => departments.id),
  joiningDate: date("joining_date"),
  salary: numeric("salary", { precision: 10, scale: 2 }),
  cnic: varchar("cnic", { length: 30 }),
  emergencyContact: varchar("emergency_contact", { length: 50 }),
  bloodGroup: varchar("blood_group", { length: 10 }),
  documents: jsonb("documents").$type<string[]>().default([]),
});

// ============ ATTENDANCE ============
export const attendanceSessions = pgTable("attendance_sessions", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  classId: integer("class_id").references(() => classes.id),
  sectionId: integer("section_id").references(() => sections.id),
  subjectId: integer("subject_id").references(() => subjects.id),
  teacherId: integer("teacher_id").references(() => users.id),
  academicSessionId: integer("academic_session_id").references(() => academicSessions.id),
  type: varchar("type", { length: 20 }).default("student"), // student or staff
  isHoliday: boolean("is_holiday").default(false),
  note: text("note"),
  markedById: integer("marked_by_id").references(() => users.id),
  markedAt: timestamp("marked_at").defaultNow(),
});

export const attendanceRecords = pgTable("attendance_records", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => attendanceSessions.id, { onDelete: "cascade" }),
  studentId: integer("student_id").references(() => students.id, { onDelete: "cascade" }),
  staffId: integer("staff_id").references(() => users.id),
  status: attendanceStatusEnum("status").notNull(),
  lateMinutes: integer("late_minutes").default(0),
  reason: text("reason"),
}, (table) => ({
  sessionStudentIdx: uniqueIndex("session_student_idx").on(table.sessionId, table.studentId),
}));

// ============ FEE CATEGORIES ============
export const feeCategories = pgTable("fee_categories", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isRecurring: boolean("is_recurring").default(true), // monthly
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============ FEE STRUCTURES ============
export const feeStructures = pgTable("fee_structures", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  classId: integer("class_id").references(() => classes.id),
  categoryId: integer("category_id").references(() => feeCategories.id),
  academicSessionId: integer("academic_session_id").references(() => academicSessions.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  dueDay: integer("due_day").default(10),
  lateFinePerDay: numeric("late_fine_per_day", { precision: 8, scale: 2 }).default("0"),
  lateFineMax: numeric("late_fine_max", { precision: 8, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(true),
});

// ============ FEE INVOICES ============
export const feeInvoices = pgTable("fee_invoices", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  invoiceNo: varchar("invoice_no", { length: 50 }).notNull().unique(),
  studentId: integer("student_id").references(() => students.id, { onDelete: "cascade" }),
  classId: integer("class_id").references(() => classes.id),
  academicSessionId: integer("academic_session_id").references(() => academicSessions.id),
  month: varchar("month", { length: 20 }),
  dueDate: date("due_date"),
  issueDate: date("issue_date"),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).default("0"),
  discountAmount: numeric("discount_amount", { precision: 10, scale: 2 }).default("0"),
  discountReason: text("discount_reason"),
  fineAmount: numeric("fine_amount", { precision: 10, scale: 2 }).default("0"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).default("0"),
  paidAmount: numeric("paid_amount", { precision: 10, scale: 2 }).default("0"),
  balanceAmount: numeric("balance_amount", { precision: 10, scale: 2 }).default("0"),
  status: invoiceStatusEnum("status").default("unpaid"),
  notes: text("notes"),
  isScholarship: boolean("is_scholarship").default(false),
  scholarshipPercent: numeric("scholarship_percent", { precision: 5, scale: 2 }).default("0"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  invoiceNoIdx: uniqueIndex("invoice_no_idx").on(table.invoiceNo),
}));

export const feeInvoiceItems = pgTable("fee_invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => feeInvoices.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").references(() => feeCategories.id),
  title: varchar("title", { length: 255 }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  qty: integer("qty").default(1),
});

// ============ FEE PAYMENTS ============
export const feePayments = pgTable("fee_payments", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  paymentNo: varchar("payment_no", { length: 50 }).unique().notNull(),
  invoiceId: integer("invoice_id").references(() => feeInvoices.id, { onDelete: "cascade" }),
  studentId: integer("student_id").references(() => students.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  method: paymentMethodEnum("method").default("cash"),
  transactionId: varchar("transaction_id", { length: 100 }),
  chequeNo: varchar("cheque_no", { length: 100 }),
  bankName: varchar("bank_name", { length: 200 }),
  paymentDate: date("payment_date").defaultNow(),
  receivedById: integer("received_by_id").references(() => users.id),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============ EXPENSES ============
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  branchId: integer("branch_id").references(() => branches.id),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  expenseDate: date("expense_date").defaultNow(),
  paidTo: varchar("paid_to", { length: 255 }),
  method: paymentMethodEnum("method").default("cash"),
  note: text("note"),
  attachmentUrl: text("attachment_url"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============ EXAMS ============
export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  type: examTypeEnum("type").default("mid_term"),
  classId: integer("class_id").references(() => classes.id),
  sectionId: integer("section_id").references(() => sections.id),
  subjectId: integer("subject_id").references(() => subjects.id),
  academicSessionId: integer("academic_session_id").references(() => academicSessions.id),
  startDate: date("start_date"),
  endDate: date("end_date"),
  startTime: varchar("start_time", { length: 10 }),
  durationMinutes: integer("duration_minutes").default(60),
  totalMarks: integer("total_marks").default(100),
  passMarks: integer("pass_marks").default(33),
  isOnline: boolean("is_online").default(false),
  isPublished: boolean("is_published").default(false),
  negativeMarking: boolean("negative_marking").default(false),
  negativeMarkingPercent: numeric("negative_marking_percent", { precision: 5, scale: 2 }).default("0"),
  randomizeQuestions: boolean("randomize_questions").default(false),
  instructions: text("instructions"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============ QUESTIONS ============
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  subjectId: integer("subject_id").references(() => subjects.id),
  classId: integer("class_id").references(() => classes.id),
  chapter: varchar("chapter", { length: 255 }),
  topic: varchar("topic", { length: 255 }),
  difficulty: varchar("difficulty", { length: 20 }).default("medium"), // easy, medium, hard
  type: questionTypeEnum("type").default("mcq"),
  questionText: text("question_text").notNull(),
  imageUrl: text("image_url"),
  marks: integer("marks").default(1),
  options: jsonb("options").$type<string[]>(), // for MCQ
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
  createdById: integer("created_by_id").references(() => users.id),
  isApproved: boolean("is_approved").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============ EXAM QUESTIONS ============
export const examQuestions = pgTable("exam_questions", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").references(() => exams.id, { onDelete: "cascade" }),
  questionId: integer("question_id").references(() => questions.id, { onDelete: "cascade" }),
  orderIndex: integer("order_index").default(0),
  marks: integer("marks").default(1),
  section: varchar("section", { length: 100 }),
});

// ============ EXAM ATTEMPTS ============
export const examAttempts = pgTable("exam_attempts", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").references(() => exams.id, { onDelete: "cascade" }),
  studentId: integer("student_id").references(() => students.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at"),
  submittedAt: timestamp("submitted_at"),
  obtainedMarks: numeric("obtained_marks", { precision: 7, scale: 2 }),
  totalMarks: integer("total_marks"),
  percentage: numeric("percentage", { precision: 5, scale: 2 }),
  isChecked: boolean("is_checked").default(false),
  isPassed: boolean("is_passed"),
  checkedById: integer("checked_by_id").references(() => users.id),
  checkedAt: timestamp("checked_at"),
  ipAddress: varchar("ip_address", { length: 50 }),
});

export const examAnswers = pgTable("exam_answers", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id").references(() => examAttempts.id, { onDelete: "cascade" }),
  questionId: integer("question_id").references(() => questions.id),
  answer: text("answer"),
  isCorrect: boolean("is_correct"),
  marksObtained: numeric("marks_obtained", { precision: 7, scale: 2 }).default("0"),
  teacherComment: text("teacher_comment"),
});

// ============ RESULTS ============
export const results = pgTable("results", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  studentId: integer("student_id").references(() => students.id, { onDelete: "cascade" }),
  examId: integer("exam_id").references(() => exams.id, { onDelete: "cascade" }),
  classId: integer("class_id").references(() => classes.id),
  subjectId: integer("subject_id").references(() => subjects.id),
  academicSessionId: integer("academic_session_id").references(() => academicSessions.id),
  totalMarks: integer("total_marks").default(100),
  obtainedMarks: numeric("obtained_marks", { precision: 7, scale: 2 }),
  percentage: numeric("percentage", { precision: 5, scale: 2 }),
  grade: varchar("grade", { length: 5 }),
  gpa: numeric("gpa", { precision: 3, scale: 2 }),
  remarks: text("remarks"),
  isPresent: boolean("is_present").default(true),
  position: integer("position"),
  teacherRemarks: text("teacher_remarks"),
  principalRemarks: text("principal_remarks"),
  attendancePercentage: numeric("attendance_percentage", { precision: 5, scale: 2 }),
  isPublished: boolean("is_published").default(false),
  promoted: boolean("promoted").default(false),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============ LMS - COURSES ============
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }),
  description: text("description"),
  classId: integer("class_id").references(() => classes.id),
  sectionId: integer("section_id").references(() => sections.id),
  subjectId: integer("subject_id").references(() => subjects.id),
  teacherId: integer("teacher_id").references(() => users.id),
  academicSessionId: integer("academic_session_id").references(() => academicSessions.id),
  thumbnailUrl: text("thumbnail_url"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  isPublished: boolean("is_published").default(false),
  enableDiscussions: boolean("enable_discussions").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const courseEnrollments = pgTable("course_enrollments", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "cascade" }),
  studentId: integer("student_id").references(() => students.id, { onDelete: "cascade" }),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  progressPercent: numeric("progress_percent", { precision: 5, scale: 2 }).default("0"),
  completedAt: timestamp("completed_at"),
});

// ============ LESSONS / MODULES ============
export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").references(() => modules.id, { onDelete: "cascade" }),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  orderIndex: integer("order_index").default(0),
  content: text("content"),
  videoUrl: text("video_url"),
  pdfUrl: text("pdf_url"),
  externalUrl: text("external_url"),
  attachments: jsonb("attachments").$type<string[]>().default([]),
  isPublished: boolean("is_published").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const lessonCompletions = pgTable("lesson_completions", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").references(() => lessons.id, { onDelete: "cascade" }),
  studentId: integer("student_id").references(() => students.id, { onDelete: "cascade" }),
  completedAt: timestamp("completed_at").defaultNow(),
}, (table) => ({
  lessonStudentUnique: uniqueIndex("lesson_student_unique").on(table.lessonId, table.studentId),
}));

// ============ ASSIGNMENTS ============
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  courseId: integer("course_id").references(() => courses.id),
  classId: integer("class_id").references(() => classes.id),
  sectionId: integer("section_id").references(() => sections.id),
  subjectId: integer("subject_id").references(() => subjects.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  instructions: text("instructions"),
  dueDate: timestamp("due_date"),
  totalMarks: integer("total_marks").default(100),
  allowLateSubmission: boolean("allow_late_submission").default(false),
  latePenaltyPercent: numeric("late_penalty_percent", { precision: 5, scale: 2 }).default("0"),
  attachments: jsonb("attachments").$type<string[]>().default([]),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const assignmentSubmissions = pgTable("assignment_submissions", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").references(() => assignments.id, { onDelete: "cascade" }),
  studentId: integer("student_id").references(() => students.id, { onDelete: "cascade" }),
  submissionText: text("submission_text"),
  attachments: jsonb("attachments").$type<string[]>().default([]),
  submittedAt: timestamp("submitted_at").defaultNow(),
  isLate: boolean("is_late").default(false),
  marks: numeric("marks", { precision: 7, scale: 2 }),
  feedback: text("feedback"),
  status: assignmentStatusEnum("status").default("submitted"),
  gradedById: integer("graded_by_id").references(() => users.id),
  gradedAt: timestamp("graded_at"),
}, (table) => ({
  assignmentStudentUnique: uniqueIndex("assignment_student_unique").on(table.assignmentId, table.studentId),
}));

// ============ LIVE CLASSES ============
export const liveClasses = pgTable("live_classes", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  classId: integer("class_id").references(() => classes.id),
  sectionId: integer("section_id").references(() => sections.id),
  subjectId: integer("subject_id").references(() => subjects.id),
  teacherId: integer("teacher_id").references(() => users.id),
  meetingUrl: text("meeting_url"),
  provider: varchar("provider", { length: 50 }).default("external"),
  scheduledAt: timestamp("scheduled_at"),
  durationMinutes: integer("duration_minutes").default(45),
  description: text("description"),
  isCancelled: boolean("is_cancelled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============ LEARNING MATERIALS LIBRARY ============
export const learningMaterials = pgTable("learning_materials", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(), // pdf, video, document, link, worksheet, past_paper, book
  subjectId: integer("subject_id").references(() => subjects.id),
  classId: integer("class_id").references(() => classes.id),
  fileUrl: text("file_url"),
  externalUrl: text("external_url"),
  uploadedById: integer("uploaded_by_id").references(() => users.id),
  isPublic: boolean("is_public").default(false),
  downloads: integer("downloads").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============ TIMETABLE ============
export const timetableSlots = pgTable("timetable_slots", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  classId: integer("class_id").references(() => classes.id),
  sectionId: integer("section_id").references(() => sections.id),
  subjectId: integer("subject_id").references(() => subjects.id),
  teacherId: integer("teacher_id").references(() => users.id),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday..6=Saturday
  periodNo: integer("period_no").notNull(),
  startTime: varchar("start_time", { length: 10 }).notNull(),
  endTime: varchar("end_time", { length: 10 }).notNull(),
  roomNo: varchar("room_no", { length: 20 }),
  academicSessionId: integer("academic_session_id").references(() => academicSessions.id),
});

// ============ HOLIDAYS / EVENTS ============
export const holidays = pgTable("holidays", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  date: date("date"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  isRecurring: boolean("is_recurring").default(false),
  type: varchar("type", { length: 50 }).default("holiday"), // holiday, event
  academicSessionId: integer("academic_session_id").references(() => academicSessions.id),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  location: varchar("location", { length: 255 }),
  audience: varchar("audience", { length: 100 }).default("all"), // all, teachers, parents, students
  classId: integer("class_id").references(() => classes.id),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============ ANNOUNCEMENTS / NOTIFICATIONS ============
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  audience: varchar("audience", { length: 100 }).default("all"),
  classId: integer("class_id").references(() => classes.id),
  sectionId: integer("section_id").references(() => sections.id),
  priority: varchar("priority", { length: 20 }).default("normal"),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  attachmentUrl: text("attachment_url"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  type: varchar("type", { length: 50 }).default("info"),
  link: text("link"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============ LIBRARY ============
export const libraryBooks = pgTable("library_books", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  isbn: varchar("isbn", { length: 50 }),
  author: varchar("author", { length: 255 }),
  publisher: varchar("publisher", { length: 255 }),
  category: varchar("category", { length: 100 }),
  year: integer("year"),
  totalCopies: integer("total_copies").default(1),
  availableCopies: integer("available_copies").default(1),
  shelfNo: varchar("shelf_no", { length: 50 }),
  coverUrl: text("cover_url"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const libraryIssues = pgTable("library_issues", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  bookId: integer("book_id").references(() => libraryBooks.id, { onDelete: "cascade" }),
  studentId: integer("student_id").references(() => students.id),
  userId: integer("user_id").references(() => users.id), // teacher/staff
  issuedById: integer("issued_by_id").references(() => users.id),
  issueDate: date("issue_date").defaultNow(),
  dueDate: date("due_date"),
  returnedDate: date("returned_date"),
  fineAmount: numeric("fine_amount", { precision: 8, scale: 2 }).default("0"),
  finePaid: boolean("fine_paid").default(false),
  status: varchar("status", { length: 20 }).default("issued"), // issued, returned, overdue
  note: text("note"),
});

// ============ TRANSPORT ============
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  vehicleNo: varchar("vehicle_no", { length: 30 }).notNull(),
  type: varchar("type", { length: 50 }), // bus, van, car
  model: varchar("model", { length: 100 }),
  capacity: integer("capacity"),
  driverName: varchar("driver_name", { length: 200 }),
  driverPhone: varchar("driver_phone", { length: 50 }),
  driverLicense: varchar("driver_license", { length: 100 }),
  insuranceExpiry: date("insurance_expiry"),
  fitnessExpiry: date("fitness_expiry"),
  isActive: boolean("is_active").default(true),
  note: text("note"),
  documents: jsonb("documents").$type<string[]>().default([]),
});

export const routes = pgTable("routes", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id),
  monthlyFee: numeric("monthly_fee", { precision: 10, scale: 2 }).default("0"),
  description: text("description"),
  stops: jsonb("stops").$type<{ name: string; time: string; fee?: number }[]>(),
});

// ============ INVENTORY ============
export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  sku: varchar("sku", { length: 50 }),
  unit: varchar("unit", { length: 30 }).default("pcs"),
  quantity: integer("quantity").default(0),
  minQuantity: integer("min_quantity").default(0),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).default("0"),
  location: varchar("location", { length: 200 }),
  condition: varchar("condition", { length: 30 }).default("good"),
  assignedTo: varchar("assigned_to", { length: 200 }),
  purchaseDate: date("purchase_date"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============ LEAVE MANAGEMENT ============
export const leaveRequests = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  leaveType: leaveTypeEnum("leave_type").default("casual"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reason: text("reason"),
  status: leaveStatusEnum("status").default("pending"),
  approvedById: integer("approved_by_id").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  approvedComment: text("approved_comment"),
  attachmentUrl: text("attachment_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============ DISCIPLINE ============
export const disciplineRecords = pgTable("discipline_records", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  studentId: integer("student_id").references(() => students.id, { onDelete: "cascade" }),
  date: date("date"),
  category: varchar("category", { length: 100 }),
  description: text("description").notNull(),
  action: text("action"),
  severity: varchar("severity", { length: 20 }).default("minor"),
  reportedById: integer("reported_by_id").references(() => users.id),
  status: varchar("status", { length: 20 }).default("open"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============ CERTIFICATES ============
export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  studentId: integer("student_id").references(() => students.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }),
  issueDate: date("issue_date"),
  certificateNo: varchar("certificate_no", { length: 50 }),
  content: jsonb("content"),
  issuedById: integer("issued_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============ AUDIT LOG ============
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 255 }).notNull(),
  entityType: varchar("entity_type", { length: 100 }),
  entityId: varchar("entity_id", { length: 100 }),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============ SETUP WIZARD PROGRESS ============
export const setupProgress = pgTable("setup_progress", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }).unique(),
  schoolInfo: boolean("school_info").default(false),
  academicStructure: boolean("academic_structure").default(false),
  staff: boolean("staff").default(false),
  students: boolean("students").default(false),
  parents: boolean("parents").default(false),
  fees: boolean("fees").default(false),
  exams: boolean("exams").default(false),
  completed: boolean("completed").default(false),
  currentStep: integer("current_step").default(1),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============ BACKUPS ============
export const backups = pgTable("backups", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 255 }),
  filePath: text("file_path"),
  sizeBytes: integer("size_bytes"),
  type: varchar("type", { length: 30 }).default("manual"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============ CUSTOM ROLES / PERMISSIONS ============
export const customRoles = pgTable("custom_roles", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  permissions: jsonb("permissions").$type<string[]>().default([]),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});
