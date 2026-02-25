### Prompt:

OK, we finalized a major milestone, what we want to do next is a todo list for next features and keep working later.     
                                                                                                                           
  Lets create a "TODO_LATER.md" file, and insert this tasks into it, i will tell you the features and you will insert      
  it with very detailed tasks to complete the features.                                                                    
                                                                                                                           
  - Before keeping working, maintaining and adding features, we will make an organize set of tests both for backend        
  with jest that test all the endpoints in a various options that absolutly makes sure all the functionality on this   
  stable version of the backend is absolutly working well. also for front end, making scripts using playwright that        
  opens a browser (visibly) and browsing throguh the entire app functionallity, creating/editing roles with full           
  details, applying to newly created roles, adding stages with description to applications, etc.                           
  - Create email service. first, foundationaly, create a stable email service that support html templates with             
  "handlebars", in the feature we will create a feature that inside an application, when we will press the "Email"         
  button, it will open a email sent that let the user sent an email to a candidate from the system with optionally         
  templates. 
  
           
# TODO — Future Features


---

## 1. Comprehensive Test Suite

### 1a. Backend — Jest Integration Tests

**Goal:** A complete, self-contained Jest test suite that hits every API endpoint with realistic scenarios and guarantees the stable backend is fully working.

#### Setup
- [ ] Install and configure Jest + `ts-jest` for the `apps/api` package
- [ ] Install `supertest` for HTTP-level integration tests
- [ ] Create a dedicated test database (e.g. `claver-hr-test`) and a `.env.test` file
- [ ] Write a global Jest setup file that:
  - Runs `prisma migrate deploy` against the test DB before all suites
  - Seeds a baseline company, one admin user, and one regular user
  - Truncates all tables (except migrations) between each test file via `afterEach` / `afterAll`
- [ ] Write a global teardown file that disconnects Prisma and clears the test DB

#### Auth endpoints (`/api/auth`)
- [ ] `POST /login` — valid credentials → returns accessToken + user object
- [ ] `POST /login` — wrong password → 401
- [ ] `POST /login` — unknown email → 401
- [ ] `POST /refresh` — valid refresh cookie → returns new accessToken + user
- [ ] `POST /refresh` — missing cookie → 401
- [ ] `POST /refresh` — expired / tampered token → 401
- [ ] `POST /logout` — clears refresh token from DB and cookie

#### User endpoints (`/api/users`)
- [ ] `GET /` — returns all users for the company (admin only)
- [ ] `GET /` — non-admin → 403
- [ ] `POST /` — creates user with valid payload
- [ ] `POST /` — duplicate email → 409
- [ ] `POST /` — missing required field → 422
- [ ] `PATCH /:id` — updates name / email / role
- [ ] `PATCH /:id` — cannot update user from another company → 404
- [ ] `DELETE /:id` — removes user
- [ ] `DELETE /:id` — cannot delete own account while other tests depend on it (assert 400 or document behavior)

#### Company endpoints (`/api/company`)
- [ ] `GET /` — returns own company details
- [ ] `PATCH /` — updates company name
- [ ] `POST /logo` — uploads logo, returns updated company with `logoUrl`
- [ ] `POST /hero` — uploads hero image

#### Role endpoints (`/api/roles`)
- [ ] `POST /` — creates role; verify response contains 3 default stages (Pending/Accepted/Rejected), system customFields (full_name + email), and a random color
- [ ] `POST /` — missing `name` → 422
- [ ] `GET /` — returns roles with stages
- [ ] `GET /:id` — returns role with stages
- [ ] `GET /:id` — role from another company → 404
- [ ] `PATCH /:id` — updates fields; verify `ensureSystemFields` always keeps full_name + email in customFields even if payload omits them
- [ ] `PATCH /:id` — label rename of system field is preserved
- [ ] `DELETE /:id` — deletes role with no applications
- [ ] `DELETE /:id` — role with existing applications → 400 with message
- [ ] `PATCH /:id/active` — toggles isActive

#### Stage endpoints (`/api/roles/:roleId/stages`)
- [ ] `GET /` — returns stages ordered by `order`
- [ ] `POST /` — creates stage; auto-increments order
- [ ] `PATCH /:id` — updates name, color, icon
- [ ] `PATCH /:id` — stage from another role → 404
- [ ] `DELETE /:id` — deletes stage; verify related applications have `currentStageId` set to null

#### Application endpoints (`/api/applications`)
- [ ] `GET /` — returns all applications with role color + currentStage
- [ ] `GET /` — `?roleId=x` filter works
- [ ] `GET /` — `?search=name` filter works (searches formData.full_name)
- [ ] `GET /:id` — returns application with timeline
- [ ] `GET /:id` — application from another company → 404
- [ ] `PATCH /:id/stage` — moves to valid stage
- [ ] `PATCH /:id/stage` — stageId from wrong role → 400
- [ ] `PATCH /:id/stage` — `stageId: null` clears the stage
- [ ] `POST /:id/timeline` — creates entry + updates currentStageId
- [ ] `POST /:id/timeline` — stageId from wrong role → 400
- [ ] `DELETE /:id` — deletes application and S3 file (mock S3)
- [ ] `GET /:id/files/:fieldId` — returns presigned URL (mock S3)
- [ ] `GET /export` — returns valid CSV with correct headers and rows

#### Public endpoints (`/api/public`)
- [ ] `GET /:companySlug` — returns company + active roles only
- [ ] `GET /:companySlug` — unknown slug → 404
- [ ] `GET /:companySlug/roles/:roleId` — returns role with stages
- [ ] `GET /:companySlug/roles/:roleId` — inactive role → 404
- [ ] `POST /:companySlug/roles/:roleId/apply` — submits application with full_name + email
- [ ] `POST /apply` — missing email → 400
- [ ] `POST /apply` — missing full_name → 400
- [ ] `POST /apply` — duplicate email for same role → 409
- [ ] `POST /apply` — same email on different role → 201 (allowed)
- [ ] `POST /apply` — with file upload → application has `resumeS3Key` (mock S3)

---

### 1b. Frontend — Playwright E2E Tests

**Goal:** Visible browser scripts (headed mode) that walk through the entire app, catching regressions in UI, navigation, and data flow.

#### Setup
- [ ] Install `@playwright/test` in `apps/web` (or at workspace root)
- [ ] Create `playwright.config.ts` with:
  - `headless: false` (visible browser as requested)
  - `baseURL: http://localhost:3000`
  - `screenshot: 'only-on-failure'`
  - `video: 'retain-on-failure'`
- [ ] Create a `tests/` directory under `apps/web` for all spec files
- [ ] Write a `global-setup.ts` that logs in once and saves auth state to a file so individual tests can reuse the session
- [ ] Add `npm run test:e2e` script to `apps/web/package.json`

#### Auth flow (`auth.spec.ts`)
- [ ] Visiting `/` while unauthenticated redirects to `/login`
- [ ] Login with invalid credentials shows error message
- [ ] Login with valid credentials redirects to `/dashboard`
- [ ] Visiting `/` while authenticated redirects to `/dashboard`
- [ ] Logout clears session and redirects to `/login`

#### Dashboard home (`dashboard.spec.ts`)
- [ ] Stats cards render with numeric values (not blank/NaN)
- [ ] Charts render (at least one `<svg>` is present)
- [ ] "Recent Applications" section lists applications

#### Templates (roles) CRUD (`templates.spec.ts`)
- [ ] Create a new role:
  - Navigate to `/dashboard/templates/new`
  - Verify Full Name + Email system fields are visible and locked
  - Fill template name, description, location, type, seniority
  - Add 2 qualifications using the input
  - Add 2 custom fields (text + select with options)
  - Submit → redirected to templates list
  - New role card appears with colored accent and dot
- [ ] Edit the newly created role:
  - Click Edit on the new role card
  - Verify system fields still locked
  - Verify default stages (Pending, Accepted, Rejected) exist
  - Rename a stage, change its color and icon, click Save
  - Add a new stage
  - Update template name → submit
  - Verify changes persisted on reload
- [ ] Toggle role active/inactive via the switch on the card
- [ ] View public page link opens `/:companySlug/:roleId` (not `/:roleId`)

#### Public job board (`public.spec.ts`)
- [ ] Navigate to `/:companySlug` — company header and role cards render
- [ ] Click on a role card → role detail page with description, requirements, and form
- [ ] Form contains Full Name and Email fields (rendered from customFields, not hardcoded)
- [ ] Submit with valid data → success screen with role name and company name
- [ ] Submit the same email again → inline error "already exists for this role"
- [ ] Submit with a different email → success

#### Applications (`applications.spec.ts`)
- [ ] Applications list renders with correct columns (name, role pill with color, stage badge, date)
- [ ] Search by applicant name filters the list
- [ ] Filter by role updates the list
- [ ] Click eye icon → navigates to application detail
- [ ] Application detail shows:
  - Applicant name, role badge, stage badge
  - Full form data values
  - Timeline section
  - File / Resume section (if file field exists on role)
- [ ] Change pipeline stage via the select → stage badge updates
- [ ] Add a timeline milestone with stage + description → entry appears in timeline
- [ ] If resume exists: click Preview → `<iframe>` appears inline; click again → collapses
- [ ] If resume exists: click Download → browser download triggered
- [ ] Delete application from the list → removed after confirmation

#### Settings (`settings.spec.ts`)
- [ ] Company name field is pre-filled
- [ ] Admin users checkboxes are pre-checked for current admin users
- [ ] Save changes → success message appears
- [ ] Upload logo / hero (use a fixture PNG) → image preview updates

---

## 2. Email Service

### 2a. Foundation — Backend Email Service

**Goal:** A reusable, template-driven email service that the rest of the backend can call to send HTML emails.

#### Package setup
- [ ] Install `nodemailer` + `@types/nodemailer` in `apps/api`
- [ ] Install `handlebars` + `@types/handlebars` in `apps/api`
- [ ] Add SMTP config to `.env`:
  ```
  SMTP_HOST=
  SMTP_PORT=587
  SMTP_SECURE=false
  SMTP_USER=
  SMTP_PASS=
  SMTP_FROM="Claver HR <noreply@claver.hr>"
  ```
- [ ] Create `apps/api/src/services/email.service.ts` with:
  - A `createTransporter()` function that builds a `nodemailer` transporter from env vars
  - A `sendEmail({ to, subject, templateName, context })` function that:
    1. Loads the Handlebars template from `apps/api/src/email-templates/{templateName}.hbs`
    2. Compiles and renders it with `context`
    3. Sends via the transporter
    4. Logs success / error without throwing (best-effort)
  - A `previewEmail(templateName, context)` helper that returns the rendered HTML string (useful for tests)
- [ ] Create `apps/api/src/email-templates/` directory
- [ ] Create base layout partial `apps/api/src/email-templates/partials/layout.hbs`:
  - Clean responsive HTML email shell (max-width 600px, brand colors, footer)
  - Accepts `{{> body}}` block for content injection
- [ ] Register Handlebars partials automatically on service initialization by scanning the `partials/` directory

#### Templates to create now
- [ ] `apps/api/src/email-templates/application-received.hbs`
  - Subject: "We received your application for {{roleName}}"
  - Content: candidate name, role name, company name, submission date, "we'll be in touch" message
- [ ] `apps/api/src/email-templates/custom-message.hbs`
  - Generic template for HR-sent messages (subject and body provided by the sender)
  - Includes company logo (if available), sender name, message body, and a footer

#### Testing
- [ ] Unit test `email.service.ts` using `nodemailer`'s `createTestAccount` / ethereal.email transport so no real SMTP is needed in CI
- [ ] Test that `sendEmail` renders the correct template and sends to the correct address
- [ ] Test that missing template throws a clear error

---

### 2b. "Email Candidate" Feature — Backend

**Goal:** An authenticated API endpoint that lets HR users compose and send an email to an applicant from within the system.

#### Shared types / schemas
- [ ] Add `sendEmailSchema` to `packages/shared/src/schemas/email.ts`:
  ```ts
  {
    to: z.string().email(),
    subject: z.string().min(1).max(200),
    body: z.string().min(1).max(10000),
    templateId: z.string().optional(),   // optional preset template
  }
  ```
- [ ] Export from `packages/shared/src/index.ts`

#### Email template model (for saved templates)
- [ ] Add `EmailTemplate` Prisma model:
  ```prisma
  model EmailTemplate {
    id        Int      @id @default(autoincrement())
    companyId Int
    name      String
    subject   String
    body      String   // Handlebars-compatible HTML or plain text
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
    company   Company  @relation(...)
  }
  ```
- [ ] Create and run migration
- [ ] Add `emailTemplateService` with `list`, `create`, `getById`, `update`, `delete`

#### API routes
- [ ] `POST /api/applications/:id/email` — send email to the applicant:
  - Resolve applicant email from `application.email` column
  - Validate with `sendEmailSchema`
  - If `templateId` provided, load the template and merge with context
  - Call `emailService.sendEmail()`
  - Return `{ success: true }`
- [ ] `GET /api/email-templates` — list all templates for the company
- [ ] `POST /api/email-templates` — create a new template
- [ ] `PATCH /api/email-templates/:id` — update a template
- [ ] `DELETE /api/email-templates/:id` — delete a template

---

### 2c. "Email Candidate" Feature — Frontend

**Goal:** When the HR user clicks the Email button on an application detail page, a modal opens where they can compose and send an email to the candidate, with optional saved templates.

#### Email composer modal
- [ ] Create `apps/web/src/components/EmailComposerModal.tsx`:
  - Props: `open`, `onClose`, `applicationId`, `candidateEmail`, `candidateName`
  - State: `subject`, `body`, `selectedTemplateId`
  - On open: fetch email templates for the company
  - Template selector: dropdown of saved templates; selecting one fills `subject` + `body`
  - Subject input (pre-fillable)
  - Rich textarea for body (plain text for now; rich text editor later)
  - "Send" button → calls `POST /api/applications/:id/email`
  - Success toast / error message
  - "Save as template" shortcut button

#### Wire into application detail page
- [ ] Replace the plain `<a href="mailto:...">Email</a>` button with a button that opens `EmailComposerModal`
- [ ] Pass `applicationId`, `candidateEmail`, and `candidateName` as props

#### Email templates management page
- [ ] Create `/dashboard/email-templates/page.tsx`:
  - List all saved email templates (name, subject, preview of body)
  - "New Template" button → inline form or modal
  - Edit / Delete per template
- [ ] Add "Email Templates" nav link in the Sidebar under a "Communication" section (or alongside existing items)
- [ ] Create the new/edit form with: name, subject, body (textarea with Handlebars variable hints like `{{candidateName}}`, `{{roleName}}`, `{{companyName}}`)
