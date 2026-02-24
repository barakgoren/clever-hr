# Monorepo: Next.js + Express.js + TypeScript

A monorepo containing a Next.js frontend, an Express.js backend, and a shared package for common types.

---

## What is a Monorepo?

A **monorepo** (short for "monolithic repository") is a single Git repository that holds multiple projects — in this case, a frontend app, a backend API, and a shared library.

**Why not just have separate repositories?**

| Problem with separate repos | How monorepo solves it |
|---|---|
| Copying types/utilities between projects | One `@repo/shared` package, imported everywhere |
| Keeping versions in sync across repos | All packages live together, always in sync |
| Running everything requires cloning multiple repos | One `git clone`, one `npm install` |
| Refactoring across projects is painful | One editor, one search, one commit |

This setup uses **npm workspaces**, which is npm's built-in monorepo feature. No extra tools required.

---

## Project Structure

```
./
├── apps/
│   ├── web/          ← Next.js app (frontend, runs on :3000)
│   └── api/          ← Express.js app (backend, runs on :3001)
├── packages/
│   └── shared/       ← Shared TypeScript types and utilities
├── package.json      ← Root: declares workspaces
└── tsconfig.json     ← Base TypeScript config (all packages extend this)
```

### How the pieces relate

```
apps/web  ──┐
             ├── both import from ──→  packages/shared
apps/api  ──┘
```

`packages/shared` is not a separate npm package you publish — it's a local package that npm symlinks automatically so you can import it like any other package.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm v8 or higher (comes with Node.js)

### 1. Install dependencies

Run this **once from the root** of the project:

```bash
npm install
```

This installs dependencies for **all** packages (web, api, shared) in one step. npm workspaces handles symlinking `@repo/shared` into `node_modules` so the other apps can import it.

### 2. Start the API server

```bash
npm run dev:api
```

The Express server starts on [http://localhost:3001](http://localhost:3001).

Test it:
```bash
curl http://localhost:3001/api/health
# → { "success": true, "data": { "status": "ok", "timestamp": "..." } }
```

### 3. Start the web app

In a **separate terminal**:

```bash
npm run dev:web
```

The Next.js app starts on [http://localhost:3000](http://localhost:3000).

---

## Available Scripts

Run these from the **root directory**:

| Command | What it does |
|---|---|
| `npm run dev:api` | Start Express API in dev mode (auto-restarts on file changes) |
| `npm run dev:web` | Start Next.js in dev mode (hot reload) |
| `npm run build:api` | Compile the API to JavaScript (`apps/api/dist/`) |
| `npm run build:web` | Build the Next.js app for production |

You can also run scripts directly inside a workspace:

```bash
# These are equivalent:
npm run dev:api
npm run dev --workspace=apps/api
```

---

## The Shared Package (`@repo/shared`)

This is where you put code that both the frontend and backend need — typically TypeScript types, but also utilities, constants, or validation schemas.

**Location:** `packages/shared/src/index.ts`

**Current exports:**
```typescript
// A generic API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Shape of the /api/health response body
export interface HealthResponse {
  status: string;
  timestamp: string;
}
```

**How to import it** (from any app in this repo):
```typescript
import type { ApiResponse, HealthResponse } from '@repo/shared';
```

This works because npm workspaces creates a symlink:
`node_modules/@repo/shared` → `packages/shared`

### Adding something to shared

1. Open `packages/shared/src/index.ts`
2. Export your new type or function
3. Import it in `apps/web` or `apps/api` — no rebuild needed

```typescript
// packages/shared/src/index.ts
export interface User {
  id: string;
  email: string;
}
```

```typescript
// apps/api/src/index.ts
import type { User } from '@repo/shared';
```

---

## Adding a New API Route

Open `apps/api/src/index.ts` and add a route:

```typescript
app.get('/api/hello', (_req, res) => {
  const response: ApiResponse<{ message: string }> = {
    success: true,
    data: { message: 'Hello, world!' },
  };
  res.json(response);
});
```

The server restarts automatically (nodemon watches for file changes).

---

## Adding a New Page (Next.js)

Next.js uses **file-based routing**. Every file inside `apps/web/src/app/` becomes a route.

```
src/app/page.tsx        → http://localhost:3000/
src/app/about/page.tsx  → http://localhost:3000/about
src/app/blog/page.tsx   → http://localhost:3000/blog
```

To add an `/about` page:

1. Create the folder and file:
   ```
   apps/web/src/app/about/page.tsx
   ```

2. Add the component:
   ```tsx
   export default function AboutPage() {
     return <h1>About</h1>;
   }
   ```

3. Visit [http://localhost:3000/about](http://localhost:3000/about) — it's live.

---

## TypeScript Configuration

There are three levels of TypeScript config:

| File | Purpose |
|---|---|
| `tsconfig.json` (root) | Base settings shared by all packages (`strict: true`, etc.) |
| `packages/shared/tsconfig.json` | Extends root, compiles to `dist/` |
| `apps/api/tsconfig.json` | Extends root, uses CommonJS modules (required by Node.js) |
| `apps/web/tsconfig.json` | Extends root, adds Next.js and JSX settings |

You generally don't need to touch these. If you add a new package, copy one of the existing `tsconfig.json` files and adjust `outDir`/`rootDir`.

---

## Common Questions

**Q: I added a package to `packages/shared` but the import isn't found.**

Run `npm install` from the root again. This re-links the workspace.

**Q: Can I add a new workspace (e.g., a mobile app)?**

Yes. Create a folder under `apps/` or `packages/`, add a `package.json` with a `name` field, and it's automatically picked up as a workspace.

```bash
mkdir apps/mobile
# add apps/mobile/package.json with { "name": "@repo/mobile" }
npm install  # re-links workspaces
```

**Q: Can the frontend call the API directly?**

Yes — from the browser, `fetch('http://localhost:3001/api/health')` works during development. For production, you'd typically put both behind a reverse proxy (like nginx) or use Next.js API routes to forward requests.

**Q: Why does the shared package use `"main": "src/index.ts"` instead of compiled JS?**

For development convenience: no build step needed. Both `ts-node` (API) and Next.js (web) can import TypeScript source directly. If you ever publish `@repo/shared` to npm, you'd compile it first.

---

## Folder Conventions

- `apps/` — runnable applications (things you deploy)
- `packages/` — libraries shared between apps (not deployed on their own)
- Keep business logic in `apps/`, keep shared contracts/types in `packages/shared`
