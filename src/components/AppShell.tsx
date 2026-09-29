"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Calendar,
  Wallet,
  BookOpen,
  GraduationCap,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  Library,
  Bus,
  Package,
  ClipboardList,
  MessageSquare,
  PieChart,
  ChevronRight,
  Sparkles,
  UserCog,
  Building2,
  Headphones,
} from "lucide-react";
import { cn } from "@/lib/utils";
import AssistantPanel from "./AssistantPanel";
import GlobalSearch from "./GlobalSearch";

interface SessionUser {
  id: number;
  schoolId: number | null;
  branchId: number | null;
  email: string | null;
  username: string | null;
  role: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  isSuperAdmin: boolean;
  photoUrl: string | null;
}

interface SchoolInfo {
  id: number;
  name: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
}

const simpleNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Students", href: "/students", icon: Users },
  { name: "Teachers & Staff", href: "/staff", icon: UserCheck },
  { name: "Attendance", href: "/attendance", icon: Calendar },
  { name: "Fees", href: "/fees", icon: Wallet },
  { name: "Exams & Results", href: "/exams", icon: ClipboardList },
  { name: "LMS / Courses", href: "/lms", icon: BookOpen },
  { name: "Assignments", href: "/assignments", icon: FileText },
  { name: "Parents", href: "/parents", icon: UserCog },
  { name: "Timetable", href: "/timetable", icon: GraduationCap },
  { name: "Reports", href: "/reports", icon: PieChart },
  { name: "Messages", href: "/messages", icon: MessageSquare },
  { name: "Settings", href: "/settings", icon: Settings },
];

const advancedNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Academics", icon: GraduationCap, children: [
    { name: "Classes & Sections", href: "/academics/classes" },
    { name: "Subjects", href: "/academics/subjects" },
    { name: "Departments", href: "/academics/departments" },
    { name: "Academic Sessions", href: "/academics/sessions" },
  ]},
  { name: "Students", href: "/students", icon: Users },
  { name: "Teachers & Staff", href: "/staff", icon: UserCheck },
  { name: "Parents", href: "/parents", icon: UserCog },
  { name: "Attendance", href: "/attendance", icon: Calendar },
  { name: "Fees & Finance", icon: Wallet, children: [
    { name: "Fee Categories", href: "/fees/categories" },
    { name: "Fee Invoices", href: "/fees/invoices" },
    { name: "Payments", href: "/fees/payments" },
    { name: "Expenses", href: "/fees/expenses" },
    { name: "Daily Closing", href: "/fees/daily-closing" },
  ]},
  { name: "Exams", icon: ClipboardList, children: [
    { name: "Exams", href: "/exams" },
    { name: "Question Bank", href: "/exams/questions" },
    { name: "Results", href: "/exams/results" },
    { name: "Report Cards", href: "/exams/report-cards" },
  ]},
  { name: "LMS", icon: BookOpen, children: [
    { name: "Courses", href: "/lms" },
    { name: "Lessons", href: "/lms/lessons" },
    { name: "Assignments", href: "/assignments" },
    { name: "Live Classes", href: "/lms/live" },
    { name: "Materials Library", href: "/lms/library" },
  ]},
  { name: "Library", href: "/library", icon: Library },
  { name: "Transport", href: "/transport", icon: Bus },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Timetable", href: "/timetable", icon: GraduationCap },
  { name: "Calendar & Events", href: "/calendar", icon: Calendar },
  { name: "Announcements", href: "/announcements", icon: MessageSquare },
  { name: "Certificates", href: "/certificates", icon: FileText },
  { name: "Reports Center", href: "/reports", icon: PieChart },
  { name: "Branches", href: "/branches", icon: Building2 },
  { name: "Audit Logs", href: "/audit-logs", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
];

const teacherNav = [
  { name: "Dashboard", href: "/teacher", icon: LayoutDashboard },
  { name: "My Classes", href: "/teacher/classes", icon: GraduationCap },
  { name: "Attendance", href: "/attendance", icon: Calendar },
  { name: "Assignments", href: "/assignments", icon: FileText },
  { name: "My Exams", href: "/exams", icon: ClipboardList },
  { name: "My Courses", href: "/lms", icon: BookOpen },
  { name: "Students", href: "/students", icon: Users },
  { name: "Messages", href: "/messages", icon: MessageSquare },
  { name: "Profile", href: "/profile", icon: UserCog },
];

const parentNav = [
  { name: "Dashboard", href: "/parent", icon: LayoutDashboard },
  { name: "My Children", href: "/parent/children", icon: Users },
  { name: "Attendance", href: "/parent/attendance", icon: Calendar },
  { name: "Fees", href: "/parent/fees", icon: Wallet },
  { name: "Results", href: "/parent/results", icon: ClipboardList },
  { name: "Assignments", href: "/parent/assignments", icon: FileText },
  { name: "Courses", href: "/parent/courses", icon: BookOpen },
  { name: "Announcements", href: "/announcements", icon: MessageSquare },
  { name: "Profile", href: "/profile", icon: UserCog },
];

const studentNav = [
  { name: "Dashboard", href: "/student", icon: LayoutDashboard },
  { name: "My Courses", href: "/lms", icon: BookOpen },
  { name: "Assignments", href: "/assignments", icon: FileText },
  { name: "Attendance", href: "/student/attendance", icon: Calendar },
  { name: "Exams", href: "/student/exams", icon: ClipboardList },
  { name: "Results", href: "/student/results", icon: GraduationCap },
  { name: "Library", href: "/library", icon: Library },
  { name: "Timetable", href: "/timetable", icon: GraduationCap },
  { name: "Profile", href: "/profile", icon: UserCog },
];

export default function AppShell({
  session,
  school,
  children,
}: {
  session: SessionUser;
  school: SchoolInfo | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mode, setMode] = useState<"simple" | "advanced">("simple");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("ui-mode") as "simple" | "advanced" | null;
    if (saved) setMode(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("ui-mode", mode);
  }, [mode]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const nav =
    session.role === "teacher"
      ? teacherNav
      : session.role === "parent"
      ? parentNav
      : session.role === "student"
      ? studentNav
      : mode === "simple"
      ? simpleNav
      : advancedNav;

  const isAdmin = ["school_admin", "principal", "vice_principal", "accountant", "exam_controller", "super_admin"].includes(session.role);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  const userName = [session.firstName, session.lastName].filter(Boolean).join(" ") || session.username || "User";

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform lg:translate-x-0 lg:static",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-slate-900">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: school?.primaryColor || "#2563eb" }}
            >
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold truncate max-w-[140px]">
                {school?.name || "SchoolGuide"}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                ERP + LMS
              </div>
            </div>
          </Link>
          <button
            className="lg:hidden text-slate-500"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {nav.map((item: any) => {
            if (item.children) {
              const isExpanded = expandedGroups[item.name] ?? item.children.some((c: any) => isActive(c.href));
              return (
                <div key={item.name}>
                  <button
                    onClick={() =>
                      setExpandedGroups((g) => ({ ...g, [item.name]: !g[item.name] }))
                    }
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
                  >
                    <span className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      {item.name}
                    </span>
                    <ChevronRight
                      className={cn(
                        "w-4 h-4 transition-transform",
                        isExpanded && "rotate-90"
                      )}
                    />
                  </button>
                  {isExpanded && (
                    <div className="ml-7 mt-0.5 space-y-0.5 border-l border-slate-200 pl-3">
                      {item.children.map((child: any) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "block px-3 py-1.5 rounded-md text-sm",
                            isActive(child.href)
                              ? "bg-blue-50 text-blue-700 font-medium"
                              : "text-slate-600 hover:bg-slate-100"
                          )}
                          onClick={() => setSidebarOpen(false)}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  isActive(item.href) ? "nav-item-active" : "nav-item"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200 space-y-2">
          {isAdmin && (
            <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-medium">
              <button
                className={cn(
                  "flex-1 py-1.5 rounded-md transition",
                  mode === "simple" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"
                )}
                onClick={() => setMode("simple")}
              >
                Simple
              </button>
              <button
                className={cn(
                  "flex-1 py-1.5 rounded-md transition",
                  mode === "advanced" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"
                )}
                onClick={() => setMode("advanced")}
              >
                Advanced
              </button>
            </div>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 font-medium"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center gap-3 px-4 lg:px-6 sticky top-0 z-20">
          <button
            className="lg:hidden text-slate-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-500 w-80 transition"
          >
            <Search className="w-4 h-4" />
            <span className="flex-1 text-left">Search students, teachers, classes…</span>
            <kbd className="text-xs bg-white border border-slate-200 px-1.5 py-0.5 rounded">
              Ctrl K
            </kbd>
          </button>

          <div className="flex-1 md:hidden" />

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setAssistantOpen(true)}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-medium hover:opacity-90 shadow-sm pulse-ring"
              title="SchoolGuide AI Assistant"
            >
              <Sparkles className="w-4 h-4" />
              Guide
            </button>

            <Link
              href="/notifications"
              className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <Bell className="w-5 h-5" />
              {notifications.filter((n: any) => !n.isRead).length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </Link>

            <div className="flex items-center gap-2 pl-2 ml-1 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-semibold text-sm uppercase">
                {userName.slice(0, 2)}
              </div>
              <div className="hidden md:block leading-tight">
                <div className="text-sm font-semibold text-slate-900">{userName}</div>
                <div className="text-xs text-slate-500 capitalize">
                  {session.role.replace("_", " ")}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>

      {/* Assistant */}
      {assistantOpen && (
        <AssistantPanel onClose={() => setAssistantOpen(false)} currentPath={pathname} />
      )}

      {/* Global search */}
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
