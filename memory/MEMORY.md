# Clever HR Project Memory

## Project Overview
Full-stack multi-tenant HR management platform. Monorepo with:
- `apps/api` — Express REST API (port 3001), TypeScript, Prisma + PostgreSQL
- `apps/web` — Next.js 16 App Router frontend (port 3000)
- `packages/shared` — Shared TypeScript types + Zod schemas (`@repo/shared`)

## Key Architecture Patterns

### Backend
- Route → Service → Prisma pattern (thin controllers)
- Error handling: `throw new AppError(statusCode, message)` anywhere, caught by global errorHandler
- Auth: `requireAuth` middleware attaches `req.user = { userId, companyId, role }` to AuthRequest
- Prisma client generated to `src/generated/prisma/` (non-standard path), singleton in `src/lib/prisma.ts`

### Frontend
- Access token stored in-memory (`src/lib/api.ts`), refresh token in HttpOnly cookie
- TanStack React Query v5 for all server state
- Services layer: `src/services/*.service.ts` for all API calls
- Auth: `src/contexts/AuthContext.tsx`

## Plan-Based Restrictions (Implemented Feb 2026)

### Plans
- **Team** (default): 50 emails/month, 4 stages/role, 5 active roles
- **Ultimate**: no restrictions

### Key Files
- `packages/shared/src/types/plan.ts` — `Plan`, `PlanLimits`, `PLAN_LIMITS`, `CompanyUsage` types
- `apps/api/src/services/plan.service.ts` — `checkEmailLimit`, `checkStageLimit`, `checkActiveRoleLimit`, `getUsage`
- `apps/web/src/hooks/usePlan.ts` — `usePlan()` hook for frontend limit state
- `apps/web/src/app/(main)/dashboard/usage/page.tsx` — Usage display page

### Backend Enforcement Points
- `POST /api/roles` → `checkActiveRoleLimit` (roles always start active)
- `PATCH /api/roles/:id/active` → `checkActiveRoleLimit` (only when activating)
- `POST /api/roles/:roleId/stages` → `checkStageLimit`
- `POST /api/applications/:id/email` → `checkEmailLimit`
- `GET /api/company/usage` → returns `CompanyUsage`
- `PATCH /api/admin/companies/:id/plan` → change plan (protected by admin secret)

### Frontend Enforcement Points
- Templates page: Add Template button + Switch disabled when at limit
- RoleForm: Add Stage input/button disabled when at limit
- EmailComposerModal: Send button disabled + usage counter shown

### Query Invalidation
After mutations that affect limits, invalidate `['company-usage']` queryKey.
