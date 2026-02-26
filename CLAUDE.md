# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claver HR is a full-stack, multi-tenant HR management platform. Companies publish job openings on a branded public job board and track candidates through a customizable hiring pipeline.

## Commands

All commands run from the **project root** unless noted.

### Development

```bash
npm run dev:api          # Express API on http://localhost:3001 (nodemon, ts-node)
npm run dev:web          # Next.js frontend on http://localhost:3000
```

### Build

```bash
npm run build:api        # Compile API TypeScript → apps/api/dist/
npm run build:web        # Next.js production build
```

### Testing

```bash
# Backend unit/integration tests (from apps/api/)
npx vitest run           # run once
npx vitest               # watch mode

# Run a single backend test file
cd apps/api && npx vitest run tests/roles.test.ts

# Frontend E2E (from apps/web/)
npx playwright test
npx playwright test tests/templates.spec.ts   # single spec

# Full suite + HTML report emailed via Resend
node scripts/test-and-report.mjs
```

### Database (from apps/api/)

```bash
npx prisma migrate deploy    # apply migrations
npx prisma generate          # regenerate client after schema changes (outputs to src/generated/prisma/)
npx prisma studio            # GUI
```

## Architecture

### Monorepo structure

```
apps/api/     Express REST API (port 3001)
apps/web/     Next.js 16 App Router frontend (port 3000)
packages/shared/  Shared TypeScript types + Zod schemas imported by both apps as @repo/shared
```

### Backend (`apps/api`)

- **Entry**: `src/index.ts` → `src/app.ts` (Express setup, route mounting, error handler)
- **Route pattern**: `src/routes/*.ts` → thin controllers that call `src/services/*.service.ts`
- **Error handling**: Throw `AppError(statusCode, message)` anywhere; the global `errorHandler` middleware catches it and returns `{ success: false, error: "..." }`. ZodError and JWT errors are also handled centrally.
- **Auth**: `requireAuth` middleware verifies a Bearer access token from the `Authorization` header. `requireAdmin` checks `req.user.role === 'admin'`. Auth state is attached to `req.user` as `AccessTokenPayload`.
- **JWT**: Access token expires in 15 min. Refresh token is a random hex string stored in DB (not a JWT), expires in 7 days, rotated on every use.
- **Prisma client**: Generated to `src/generated/prisma/` (non-standard output path). Singleton in `src/lib/prisma.ts` using `@prisma/adapter-pg`.
- **File uploads**: Multer → S3-compatible Cloudflare R2 (`src/services/s3.service.ts`)
- **Email**: Resend + Handlebars templates in `src/email-templates/*.hbs` (`src/services/email.service.ts`)
- **API docs**: Scalar UI at `http://localhost:3001/docs`, served from `openapi.json`

### Frontend (`apps/web`)

- **Route groups**: `(main)` for auth-required pages (dashboard + login redirect), `(public)` for public job board (`/[companySlug]` and `/[companySlug]/[roleId]`)
- **Auth flow**: Access token stored in memory (`src/lib/api.ts`). On mount, `AuthContext` calls `/api/auth/refresh` to restore session from HttpOnly refresh token cookie. Axios interceptor auto-retries on 401.
- **Data fetching**: TanStack React Query v5 for all server state; raw `apiClient` (Axios) calls live in `src/services/*.service.ts`
- **`@repo/shared`**: Import types (`User`, `Role`, `Application`, etc.) and Zod schemas from here — do not redefine them in either app.

### Data model key relationships

```
Company → Users, Roles, EmailTemplates
Role → Stages (ordered pipeline steps), Applications
Application → current Stage, ApplicationTimeline (history), ApplicationEmails
```

### Testing setup

**Backend** (`apps/api`):
- Uses a real test DB. `globalSetup.ts` seeds a `test-co` company with admin/user accounts before all tests; tears down after.
- Env loaded from `apps/api/.env.test`.
- `singleFork: true` — tests run serially.

**Frontend E2E** (`apps/web`):
- Playwright with `workers: 1` (serial).
- `global-setup.ts` logs in and saves session to `tests/.auth/state.json`; all specs reuse it.
- Credentials from env: `TEST_EMAIL` / `TEST_PASSWORD` (falls back to hardcoded dev values).
- `playwright.config.ts` auto-starts both dev servers if not already running.

## Environment Variables

`apps/api/.env` required keys:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `ADMIN_SECRET` — bootstrap secret for creating the first company/user via `/api/admin`
- `R2_*` — Cloudflare R2 credentials for file storage
- `RESEND_API_KEY`, `RESEND_FROM` — email sending
- `CORS_ORIGIN` — defaults to `http://localhost:3000`

`apps/api/.env.test` — separate env file used by Vitest (same keys, test DB).

`apps/web`: `NEXT_PUBLIC_API_URL` — defaults to `http://localhost:3001`.
