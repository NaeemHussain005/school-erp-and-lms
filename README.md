# SchoolGuide — School ERP + LMS

A complete, production-ready **School Management ERP + Learning Management System** built with **Next.js 16 (App Router)**, **PostgreSQL**, and **Drizzle ORM**.

> Simple enough for a non-technical school office employee.
> Powerful enough for a large multi-branch school or college.

![SchoolGuide](https://img.shields.io/badge/Stack-Next.js%2016%20%7C%20PostgreSQL%20%7C%20Drizzle-blue)

---

## 📦 What’s Inside

- **ERP**: Students · Teachers/Staff · Parents · Classes · Sections · Subjects · Departments · Attendance · Fees · Invoices · Payments · Expenses · Exams · Results · Report Cards · Library · Transport · Inventory · Timetable · Calendar · Announcements · Certificates · ID Cards · Audit Logs · Multi-branch · Multi-academic-year
- **LMS**: Courses · Modules · Lessons · Assignments · Live Classes · Materials Library · Online Exams · Question Bank
- **Portals**: Admin · Principal · Teacher · Parent · Student · Accountant · Librarian · Receptionist
- **Smart features**: Setup Wizard · **SchoolGuide AI Assistant** (context-aware) · Global Search (Ctrl+K) · Simple/Advanced UI mode · Bulk actions · Excel/CSV import-ready · Professional PDFs · WhatsApp click-to-chat for invoices · Dashboard with live DB stats

---

## 🖥️ Demo Access

After starting the app, an admin account is auto-created:

| Field | Value |
|-------|-------|
| URL | http://localhost:3000 |
| Email | `admin@school.com` |
| Password | `admin123` |

The default school record is also created automatically on first launch.

---

## 💻 How to Start on Your Computer (Windows)

### Step 1 — Install required software

Download and install these (use default settings):

1. **Node.js 20+ LTS** — https://nodejs.org/ (choose the “LTS” version)
2. **PostgreSQL 16** — https://www.postgresql.org/download/windows/
   - During installation, set the super-user (postgres) password to `postgres` (or remember what you set).
   - Keep the default port `5432`.
3. **Git** — https://git-scm.com/download/win (optional but recommended)
4. **Visual Studio Code** (optional) — https://code.visualstudio.com/

### Step 2 — Extract or clone the project

If you have the zip:
```cmd
mkdir C:\schoolguide
cd /d C:\schoolguide
:: extract the project zip into this folder, so that package.json is visible here
```

Or with Git:
```cmd
git clone <your-repo-url> schoolguide
cd schoolguide
```

### Step 3 — Open Command Prompt in the project folder

Go to `C:\schoolguide`, then in the address bar of Explorer type `cmd` and press Enter.

### Step 4 — Install dependencies

```cmd
npm install
```

Wait for it to finish (it may take 1–3 minutes the first time).

### Step 5 — Create the database

Open **pgAdmin** (installed with PostgreSQL) or use SQL Shell (psql), and run:

```sql
CREATE DATABASE app_db;
```

Or from the Windows command prompt:
```cmd
set PGPASSWORD=postgres
psql -U postgres -c "CREATE DATABASE app_db;"
```

### Step 6 — Configure environment

The project already contains a `.env` file with:

```
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
```

If your PostgreSQL password is different, edit `.env` and replace `postgres:postgres` with `postgres:your-password`.

You can optionally add a long JWT secret:
```
JWT_SECRET=type-a-long-random-string-here
```

### Step 7 — Create the database tables

```cmd
npx drizzle-kit push
```

You’ll see `[✓] Changes applied`.

### Step 8 — Start the development server

```cmd
npm run dev
```

Wait until you see:

```
  ▲ Next.js 16.x
  - Local: http://localhost:3000
```

Then open **http://localhost:3000** in your browser.

### First login
- Email: `admin@school.com`
- Password: `admin123`

On first visit a default school and admin account are auto-provisioned.

---

## 🚀 Production / Deployment

### Run the production server

```cmd
npm run build
npm start
```

The app will be available at http://localhost:3000 .

### Recommended production setup
- Put **nginx** or **IIS** in front (optional) for SSL.
- Set `NODE_ENV=production` and a strong `JWT_SECRET`.
- Back up the PostgreSQL database daily (`pg_dump`).
- Serve uploaded files (when added) from a persistent folder or S3 bucket.

---

## 🧭 Common Commands (Windows CMD)

```cmd
npm install                  :: install dependencies
npx drizzle-kit push         :: create/update DB tables
npm run dev                  :: start dev server (http://localhost:3000)
npm run build                :: build for production
npm start                    :: run production server
npm run typecheck            :: run TypeScript checks
npm run lint                 :: run ESLint checks
```

---

## 🗂️ Project Structure

```
schoolguide/
├─ src/
│  ├─ app/
│  │  ├─ (app)/              :: All pages after login (dashboard, students, fees, …)
│  │  ├─ api/                :: REST API routes (auth, students, classes, attendance, settings, search, setup …)
│  │  ├─ login/              :: Login page
│  │  ├─ layout.tsx          :: Root layout
│  │  └─ page.tsx            :: Landing → redirects to login/dashboard
│  ├─ components/            :: Reusable UI (AppShell, AssistantPanel, GlobalSearch, StudentForm, AttendanceMarker, QuickActions, SetupWidget, AddClassForm, PageHeader, PlaceholderPage, StudentBulkActions)
│  ├─ db/
│  │  ├─ index.ts            :: Drizzle client (pg Pool)
│  │  └─ schema.ts           :: All PostgreSQL tables (50+ entities)
│  └─ lib/
│     ├─ auth.ts             :: JWT, session, hashing, role helpers, bootstrap
│     ├─ auth-extra.ts
│     └─ utils.ts            :: Currency, dates, WhatsApp links, grades, initials …
├─ public/                   :: Static assets (add logo here later)
├─ .env
├─ drizzle.config.json
├─ next.config.ts
├─ package.json
├─ tsconfig.json
└─ README.md
```

---

## 🧑‍🏫 How to Use — Quick Guide

1. **Log in** at `/login` with the admin account.
2. Complete the **Setup Wizard** (top-right on dashboard) or click **Setup Wizard** button.
   - Step 1 — School info (name, address, logo, times, currency)
   - Step 2 — Academic structure (session, classes, sections – auto-creates classes and sections in bulk)
   - Steps 3–7 — Staff, students, parents, fees, exams
3. Use the **Quick Actions** panel on the dashboard to add a student, create an invoice, mark attendance, etc.
4. Press **Ctrl+K** anywhere to search students, teachers, classes, invoices.
5. Click the **✨ Guide** button in the header for the context-aware SchoolGuide AI assistant.
6. Switch between **Simple** and **Advanced** modes from the sidebar footer.
7. Visit **Settings** to customize branding, colors, theme, etc.

### Common tasks

| Task | Where |
|------|-------|
| Add a student | Dashboard → Add Student  · or Students → Add Student |
| Bulk import students | Students → Import · button in header |
| Mark attendance | Attendance (select class+section+date → Mark All Present → adjust → Save) |
| Create a fee invoice | Fees → New Invoice · or Quick Actions |
| Record a payment | Open invoice → Record Payment |
| Send invoice via WhatsApp | Open any invoice → Send via WhatsApp (opens WhatsApp Web with prefilled message – no paid API needed) |
| Add a teacher | Staff → Add Staff |
| Create an exam | Exams → Create Exam · or Question Bank |
| Create an LMS course | LMS → New Course |
| View reports | Report Center |
| Generate PDF | PDF Center · or Print button on any major page |
| Customize branding | Settings → Branding (colors, theme preset) |

---

## 🔐 Roles & Permissions (built-in)

- **Super Admin** — cross-school / SaaS-ready
- **School Admin** — full access inside a school
- **Principal / Vice Principal** — academic oversight
- **Teacher** — own classes, attendance, assignments, exams
- **Accountant** — fees, payments, expenses, reports
- **Librarian / Receptionist / Exam Controller / HR / Transport Manager**
- **Parent** — own children only
- **Student** — own courses, assignments, results, attendance

More granular custom roles + permission sets are scaffolded via the `custom_roles` table.

---

## 👨‍👩‍👧 Parent Portal

Parents only see their own children:
- Attendance
- Fee invoices + outstanding
- Results / report cards
- Assignments
- LMS progress
- Announcements

Parent accounts are linked to the `parents` table via a `user_id`. A parent can be linked to multiple children (siblings).

---

## 🧑‍🏫 Teacher Portal

Teachers can:
- Mark attendance for assigned classes
- Create assignments
- Create/manage exams and question bank
- View their own subjects & classes
- Upload LMS materials

---

## 🤖 SchoolGuide AI Assistant

- Click the **✨ Guide** button in the top bar (pulsing blue).
- Context-aware for every page (students, attendance, fees, exams, LMS, settings, etc.).
- Offers step-by-step walkthroughs, quick replies, and helpful tips.
- Free-form chat for any question about using the system.

---

## 📱 Progressive Web / Mobile

- Fully responsive on mobile/tablet/desktop.
- Mobile-friendly drawer navigation, touch-friendly buttons, responsive tables/cards.
- PWA-ready (installable) architecture.

---

## 🗄️ Backups (Windows)

From the **Settings → Backup** tab an admin can create a downloadable backup.

For a full PostgreSQL backup from CMD:
```cmd
set PGPASSWORD=postgres
pg_dump -U postgres -Fc app_db > schoolguide_backup.dump
```

To restore:
```cmd
set PGPASSWORD=postgres
pg_restore -U postgres -C -d postgres schoolguide_backup.dump
```

---

## 🛠️ Troubleshooting

| Problem | Fix |
|---------|-----|
| Port 3000 already in use | `npm run dev -- -p 3001` (use another port) |
| `relation "schools" does not exist` | Run `npx drizzle-kit push` to create tables |
| Invalid login | Use `admin@school.com` / `admin123` (created on first run) |
| DB connection error | Verify PostgreSQL is running and password in `.env` matches |
| `psql` not recognized | Add PostgreSQL bin folder to PATH (e.g. `C:\Program Files\PostgreSQL\16\bin`) or use pgAdmin |
| npm install fails | Make sure you have Node.js 20+ — run `node -v` |
| Charts / widgets empty | Add some students, invoices and attendance from the dashboard quick actions |

---

## 📞 Support / Extending

- Add new pages inside `src/app/(app)/<module>/page.tsx`.
- Use the existing design system via global CSS classes: `.card`, `.btn-primary`, `.btn-secondary`, `.input`, `.data-table`, `.badge-*`.
- Add new tables in `src/db/schema.ts` then run `npx drizzle-kit push`.
- Add new API routes under `src/app/api/<name>/route.ts`.

---

## 📄 License

For your school’s internal use.

---

**Enjoy running your school digitally with SchoolGuide! 🎓**
