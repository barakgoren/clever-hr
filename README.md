# Claver HR

A full-stack, multi-tenant HR management platform for managing job openings and candidate applications — built with Next.js, Express, and PostgreSQL.

---

## Dashboard
<img src="./screenshots/new/dashboard.png" alt="Dashboard" width="600px" height="350px" style="object-fit: contain;" />

## Public Job Board
<img src="./screenshots/new/company-public.png" alt="Public Job Board" width="600px" height="350px" style="object-fit: contain;" />
<img src="./screenshots/new/company-public-2.png" alt="Public Job Board" width="450px" height="400px" style="object-fit: contain;" />

## Application Detail
<img src="./screenshots/new/application.png" alt="Application Detail" width="600px" height="350px" style="object-fit: contain;" />
<img src="./screenshots/new/application-2.png" alt="Application Detail" width="600px" height="350px" style="object-fit: contain;" />
<img src="./screenshots/new/application-3.png" alt="Application Detail" width="600px" height="350px" style="object-fit: contain;" />

## Template Editor
<img src="./screenshots/new/role.png" alt="Role Editor" width="600px" height="350px" style="object-fit: contain;" />
<img src="./screenshots/new/role-2.png" alt="Role Editor" width="600px" height="350px" style="object-fit: contain;" />
<img src="./screenshots/new/role-3.png" alt="Role Editor" width="600px" height="350px" style="object-fit: contain;" />
<img src="./screenshots/new/role-4.png" alt="Role Editor" width="600px" height="350px" style="object-fit: contain;" />


---

## Overview

Claver HR lets companies publish job openings on a branded public page and track candidates through a fully customizable hiring pipeline.

**For hiring teams:**
- Create job roles with custom application form fields
- Track applicants through configurable pipeline stages (Pending → Accepted → Rejected, or any custom flow)
- View analytics — total applications, trends, stage distribution
- Email candidates directly from the platform
- Export applications to CSV
- Manage team members and company settings

**For candidates:**
- Browse open roles on the company's public job board at `yourapp.com/[company-slug]`
- Submit an application with a role-specific form (no account required)

---

## Features

- **Multi-tenancy** — each company has its own slug, job board, users, and data
- **Dynamic application forms** — define custom fields per role (text, textarea, select, file upload, etc.)
- **Hiring pipeline** — per-role stages with full progression history tracked on a timeline
- **File storage** — résumé uploads to Cloudflare R2 (S3-compatible); served via short-lived presigned URLs
- **Email** — send templated emails to candidates via Resend; full email history on every application
- **Email templates** — reusable Handlebars templates with variable substitution (`{{candidateName}}`, `{{roleName}}`, `{{companyName}}`)
- **JWT auth** — access + refresh token pair; refresh tokens are rotated on every use and stored in the DB
- **Automated test report** — runs Vitest (backend) + Playwright (E2E) and emails an HTML report

---

## Tech Stack

### Frontend (`apps/web`)

| | |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4, Radix UI |
| Data fetching | TanStack React Query v5 + Axios |
| Charts | Recharts |
| Testing | Playwright (E2E) |
| Language | TypeScript 5 |

### Backend (`apps/api`)

| | |
|---|---|
| Framework | Express.js |
| ORM | Prisma 7 |
| Database | PostgreSQL |
| Auth | JWT (HttpOnly cookies) + bcryptjs |
| File storage | Cloudflare R2 / AWS S3 |
| Email | Resend + Handlebars templates |
| Testing | Vitest + Supertest |
| Language | TypeScript 5 |

### Shared (`packages/shared`)

Common TypeScript types and Zod validation schemas imported by both apps.

---

## Project Structure

```
/
├── apps/
│   ├── api/                  # Express.js REST API (port 3001)
│   │   ├── prisma/           # Database schema & migrations
│   │   ├── src/
│   │   │   ├── routes/       # API endpoints
│   │   │   ├── services/     # Business logic (email, storage, etc.)
│   │   │   ├── middleware/   # Auth, error handling
│   │   │   └── lib/          # Prisma client, JWT utilities
│   │   └── tests/            # Vitest integration tests
│   │
│   └── web/                  # Next.js frontend (port 3000)
│       ├── src/
│       │   ├── app/          # Pages & layouts (App Router)
│       │   ├── components/   # React components
│       │   ├── services/     # API client layer
│       │   └── contexts/     # Auth context, React Query provider
│       └── tests/            # Playwright E2E tests
│
├── packages/
│   └── shared/               # Shared types & Zod schemas (@repo/shared)
│
├── scripts/
│   └── test-and-report.mjs   # Full test suite runner + HTML report emailer
│
└── package.json              # npm workspaces root
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- npm v8+
- PostgreSQL (local or remote)
- A [Resend](https://resend.com) API key (for email)
- A Cloudflare R2 or AWS S3 bucket (for file uploads)

### 1. Install dependencies

```bash
npm install
```

This installs dependencies for all workspaces in one step.

### 2. Configure environment variables

Create `apps/api/.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/claver-hr"

# JWT secrets (use long random strings)
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Admin bootstrap secret (used when creating the first company/user)
ADMIN_SECRET=your-admin-secret

# Cloudflare R2 / AWS S3
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_ENDPOINT=
R2_PUBLIC_URL=

# Email (Resend)
RESEND_API_KEY=re_...
RESEND_FROM="Claver HR <no-reply@yourdomain.com>"
```

### 3. Set up the database

```bash
cd apps/api
npx prisma migrate deploy
```

### 4. Start the servers

Open two terminals from the project root:

```bash
# Terminal 1 — API
npm run dev:api
# → http://localhost:3001
# → API docs at http://localhost:3001/docs

# Terminal 2 — Web
npm run dev:web
# → http://localhost:3000
```

---

## Available Scripts

Run from the **project root**:

| Command | Description |
|---|---|
| `npm run dev:api` | Start Express API (nodemon, auto-restarts on changes) |
| `npm run dev:web` | Start Next.js frontend (hot reload) |
| `npm run build:api` | Compile API TypeScript to `apps/api/dist/` |
| `npm run build:web` | Build Next.js for production |
| `node scripts/test-and-report.mjs` | Run all tests and email the HTML report |

---

## Routes

### Public (no auth)

| Route | Description |
|---|---|
| `/[companySlug]` | Company's public job board |
| `/[companySlug]/[roleId]` | Role detail page + application form |
| `/login` | Login page |

### Dashboard (auth required)

| Route | Description |
|---|---|
| `/dashboard` | Stats, charts, recent applications |
| `/dashboard/applications` | All applications (search, filter, CSV export) |
| `/dashboard/applications/[id]` | Application detail — timeline, email history, stage |
| `/dashboard/templates` | Job roles list |
| `/dashboard/templates/new` | Create a new role |
| `/dashboard/templates/[id]/edit` | Edit role fields, stages, and settings |
| `/dashboard/email-templates` | Manage reusable email templates |
| `/dashboard/users` | Team member management |
| `/dashboard/settings` | Company name, slug, logo, hero image |

---

## API

The API runs at `http://localhost:3001` and follows a consistent response envelope:

```json
{ "success": true, "data": { ... } }
{ "success": false, "error": "..." }
```

Interactive API documentation (Scalar) is available at `http://localhost:3001/docs`.

---

## Testing

### Run all tests + get an HTML report emailed to you

```bash
node scripts/test-and-report.mjs
```

This runs the full backend (Vitest) and frontend (Playwright) test suites, generates a styled HTML report, and emails it via Resend.

### Backend tests only

```bash
cd apps/api
npx vitest run
```

### Frontend E2E tests only

```bash
cd apps/web
npx playwright test
```

To run a specific spec file:

```bash
npx playwright test tests/templates.spec.ts
```

### Test credentials

The Playwright suite uses credentials from environment variables (with fallbacks):

```env
TEST_EMAIL=your@email.com
TEST_PASSWORD=yourpassword
```

Set these in `apps/api/.env` or export them in your shell before running tests.

---

## Data Model (overview)

```
Company
  └── Users (team members)
  └── Roles (job openings)
        └── Stages (pipeline stages — e.g. Pending, Accepted, Rejected)
        └── Applications (candidate submissions)
              └── ApplicationTimeline (stage change history)
              └── ApplicationEmails (sent email log)
  └── EmailTemplates (reusable Handlebars templates)
  └── RefreshTokens (JWT rotation)
```

---

## Email Templates

Email templates use [Handlebars](https://handlebarsjs.com/) syntax. The following variables are available when sending from an application detail page:

| Variable | Description |
|---|---|
| `{{candidateName}}` | Applicant's full name |
| `{{roleName}}` | The role they applied for |
| `{{companyName}}` | Your company's name |

---

## License

Private — all rights reserved.
