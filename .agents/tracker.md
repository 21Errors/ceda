# CEDA Innovation Portal — Project Progress Tracker

> **Source of truth:** Derived from [`.agents/Tasks.md`](.agents/Tasks.md) and audited against the current repository state.  
> **Deadline:** 23 November 2026 at 17:00 CAT  
> **Ordering rule:** Features are numbered strictly from **highest priority (1)** to **lowest priority (14)** based on core functionality, security/compliance criticality, and hackathon judging impact.

---

## Status Overview

| Priority | # | Feature Area | Status | Key Remaining Gap |
| :---: | :-: | --- | :---: | --- |
| **P0** | 1 | Authentication, Self-Registration & Account Recovery | In Progress | Passkey enrollment UI, OTP sign-in UI, verified phone flow, session revocation |
| **P0** | 2 | Role-Based Access Control (RBAC) | Mostly Done | Collaborator-level per-idea access rules |
| **P0** | 3 | Dynamic Idea Submission Portal & File Uploads | Done | — |
| **P0** | 4 | Multi-Level Evaluation, Adjudication & Iteration Workflow | Mostly Done | Adjudication rationale/history view & interactive E2E QA |
| **P0** | 5 | Cloud Deployment & Live Hosted URL | In Progress | Deploy Next.js app to 24/7 cloud host; document region & storage costs |
| **P1** | 6 | Live Status Dashboard & Free Alert Subscriptions | In Progress | Implement `/track` lookup page (stub); verify live Gmail SMTP / SMS |
| **P1** | 7 | Live Support Chat System | In Progress | Public holidays, "all agents busy" fallback, chat analytics |
| **P1** | 8 | Admin Content, Form & Criteria Management | Mostly Done | Downloadable document templates & remaining public page CMS |
| **P1** | 9 | Audit Trail & Data Protection Compliance (DPA 2024) | Mostly Done | Legal review sign-off, `timestamptz` cleanup |
| **P2** | 10 | Reporting & Analytics Dashboards | In Progress | Visual charts, exportable reports, stage turnaround times, chat & demographic metrics |
| **P2** | 11 | FAQs, Regulatory Directory & Support Channels | Mostly Done | CEDA approval of demo turnaround targets |
| **P2** | 12 | System Architecture, Responsiveness & Performance | Mostly Done | Cross-browser (Chrome/Edge/Firefox/Safari/mobile) & a11y QA |
| **P3** | 13 | Innovation & Creativity Differentiators (10% Criteria) | Not Started | Pick & build 1–2 differentiators (e.g., completeness check, duplicate detection) |
| **P3** | 14 | Technical Submission Deliverables & Packaging | In Progress | Live URL, final README/cost docs, build scripts, `< 150 MB` zip check |

---

## Priority 0 — Core Portal, Security & Launch Blockers

### 1. Authentication, Self-Registration & Account Recovery
- [x] Configure Better Auth with Drizzle/Neon adapter, hashed 6-digit email OTP verification, and rate limiting (`lib/auth.ts`).
- [x] Implement self-registration flow with mandatory email verification and DPA 2024 consent (`app/(auth)/signup`, `components/auth/SignupForm.tsx`).
- [x] Implement password sign-in, unverified-email OTP re-verification, and passkey sign-in (`app/(auth)/login`, `components/auth/LoginForm.tsx`).
- [x] Implement forgotten-password recovery flow (`app/(auth)/forgot-password`, `components/auth/ForgotPasswordForm.tsx`).
- [x] Implement authenticated password change in account settings (`app/(account)/account/settings`, `components/profile/PasswordChangeForm.tsx`).
- [x] Restore Better Auth `passkey` table via migration `0004_restore_passkey_table.sql` (35/35 tables verified).
- [x] Configure Gmail SMTP mailer (`lib/server/mailer.ts`) with fail-closed production check and dev console fallback.


### 2. Role-Based Access Control (RBAC)
- [x] Seed all built-in roles and permissions (`submitter`, `evaluator`, `adjudicator`, `admin`, `committee`, `consultant`) via `npm run db:seed`.
- [x] Enforce server-side role guards (`lib/authorization.ts`) and `/forbidden` access-denied page across all workspaces.
- [x] Implement verified-account-only initial administrator bootstrap (`npm run db:bootstrap-admin`) and `/admin/users` role assignment screen.
- [x] Enforce strict workspace boundaries:
  - [x] **Submitters:** Create, draft, edit, track, and resubmit own ideas; view public feedback; use live chat (`/dashboard`, `/submit`).
  - [x] **Evaluators:** Claim/view assigned submissions, score customizable criteria, leave private notes (`/evaluator`).
  - [x] **Adjudicators:** Review aggregated scores, request changes, approve/reject submissions (`/adjudicator`).
  - [x] **Administrators:** Manage users/roles, calls, forms, criteria, categories, FAQs, awards, reports, and audit logs (`/admin/*`).

### 3. Dynamic Idea Submission Portal & File Uploads
- [x] Build multi-section dynamic submission wizard driven by active call fields (`app/(submissions)/submit`, `components/submit/SubmissionForm.tsx`).
- [x] Implement client-side and server-side mandatory field validation (`lib/server/submission-validation.ts`).
- [x] Support saving and resuming submission drafts (`saveSubmissionDraft`).
- [x] Write idea version 1, reference number, initial stage history, owner subscription, in-app notification, and audit event in a single DB transaction (`lib/server/idea-submission.ts`).
- [x] Provision Neon Object Storage `uploads` bucket (`neon.ts`), pull branch S3 credentials, and verify upload/list/download via `files-sdk` (`lib/storage.ts`).
- [x] Wire real file/attachment uploads (pitch decks, supporting docs) into `SubmissionForm` and `ResubmissionForm` using `uploadsBucket` (`lib/storage.ts`) with MIME type, file-size, and presigned download URL controls.

### 4. Multi-Level Evaluation, Adjudication & Iteration Workflow
- [x] Implement full 5-stage lifecycle pipeline: `Submission → Review → Feedback → Approval → Award`.
- [x] Implement evaluator assignment queue, self-claim, and immutable version-locked scoring against customizable weighted criteria (`app/(dashboards)/evaluator/*`, `components/evaluator/EvaluationForm.tsx`).
- [x] Implement evaluator-only internal notes isolated from submitter-visible feedback.
- [x] Implement adjudicator workspace with aggregated score overview, stage progression, approval/rejection, and structured public change requests (`app/(dashboards)/adjudicator/*`).
- [x] Implement submitter resubmission loop creating immutable `idea_versions` and returning revised submissions to review (`components/submit/ResubmissionForm.tsx`).
- [x] Implement administrator award granting with final stage history and submitter-visible recognition (`app/(dashboards)/admin/awards/*`).
- [ ] Add dedicated adjudication rationale/decision history view on submission details.
- [ ] Execute full 6-role interactive browser walkthrough.

### 5. Cloud Deployment & Live Hosted URL
- [x] Provision managed Neon Postgres database and Neon Object Storage on the `production` branch (`polished-king-73646944`).
- [x] Add `/api/health` database readiness endpoint (`app/api/health/route.ts`).
- [x] Deploy the Next.js application to a 24/7 accessible cloud hosting environment (e.g., Vercel, AWS, Azure, or GCP).
- [x] Configure production environment variables (`BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `PASSKEY_RP_ID`, `PASSKEY_ORIGIN`, `GMAIL_*`, `DATABASE_URL`, `AWS_*`).
- [ ] Document the hosting region, database/object-storage region (`aws-eu-central-1`), and estimated monthly storage/hosting costs.
- [x] Verify the live hosted URL end-to-end and configure uptime/health monitoring around `/api/health`.

---

## Priority 1 — Real-Time Tracking, Support & Governance

### 6. Live Status Dashboard & Free Alert Subscriptions
- [x] Build submitter dashboard and owner-only submission status detail page (`app/(dashboards)/dashboard/*`, `components/dashboard/SubmitterDashboard.tsx`).
- [x] Build innovation committee monitoring workspace with follow/unfollow controls and lifecycle alerts (`app/(dashboards)/committee/*`).
- [x] Implement in-app notification inbox with read-all action (`app/(account)/notifications/*`).
- [x] Implement notification channel preferences (in-portal, email, SMS) with preference-gate enforcement and unit tests (`app/(account)/account/settings/*`, `lib/server/notifications.test.ts`).
- [x] Wire automated email notification dispatch via Gmail SMTP when configured and user opts in (`lib/server/notifications.ts`).
- [ ] Build the `/track` submission reference lookup & visual pipeline tracker page (currently a `PageStub` in `app/(submissions)/track/page.tsx`).
- [ ] Connect SMS alert delivery (optional/deferred if email + in-app satisfies free alerts).

### 7. Live Support Chat System
- [x] Build persistent multi-user live chat modal for applicants (`components/landing/LiveChatModal.tsx`, `app/api/chat/route.ts`).
- [x] Build consultant chat queue supporting multiple concurrent chats and multiple online consultants (`app/(dashboards)/consultant/page.tsx`, `components/consultant/ChatQueue.tsx`).
- [x] Enforce weekday business-hours logic (`09:00–16:00 CAT`, `Africa/Gaborone`) with automated offline/queued fallback banner.
- [x] Add chat rate limiting, origin validation, notifications, and audit logging.
- [ ] Add Botswana public holiday awareness to business-hours availability checks.
- [ ] Add explicit automated "all agents busy" fallback messaging when consultants are at capacity during office hours.
- [ ] Ensure assigned consultants reliably retain/view their active conversations across page refreshes.
- [ ] Implement chat analytics tracking (chat volume, wait/response times, and resolution metrics).

### 8. Admin Content, Form & Criteria Management
- [x] Build admin call creation, status toggling, and dynamic submission form field builder (`app/(dashboards)/admin/calls/*`).
- [x] Build admin workflow stage editor (create, rename/describe, reorder) and score-safe evaluation criteria editor (edit before scoring, archive/restore after scoring).
- [x] Build admin submission category management with historical-safe deactivation (`app/(dashboards)/admin/categories/*`).
- [x] Build audited admin FAQ CMS (`app/(dashboards)/admin/content/faqs/*`).
- [ ] Add admin management UI for uploading/updating downloadable document templates (backed by Neon Object Storage).
- [ ] Add admin management UI for remaining editable public portal content (e.g., news/announcements, guidelines).

### 9. Audit Trail & Data Protection Compliance (Botswana DPA 2024)
- [x] Implement immutable transactional `audit_events` logging for sessions, registration, submissions, status transitions, evaluations, decisions, awards, chat actions, and admin edits (`lib/server/audit.ts`).
- [x] Build protected audit log viewer (`app/(dashboards)/admin/audit/page.tsx`).
- [x] Implement explicit DPA 2024 consent on registration and factual `/privacy` data-handling notice (`app/(landingpage)/privacy/page.tsx`).
- [x] Add baseline HTTP security headers and auth/chat rate limiting.
- [x] Add server-side file upload security controls (strict allowlist, size limits, sanitized storage keys, abuse protection).

---

## Priority 2 — Analytics, Public Resources & Engineering Quality

### 10. Reporting & Analytics Dashboards
- [x] Build initial protected `/admin/reports` page displaying aggregate submission totals, status outcomes, call participation, and evaluator workload (`app/(dashboards)/admin/reports/page.tsx`).
- [ ] Add visual charts (bar/line/funnel charts) for executive and operational dashboards.
- [ ] Add exportable report downloads (CSV / PDF).
- [ ] Add participation metrics by sector/category and applicant demographic.
- [ ] Add stage conversion rates and average turnaround timelines per workflow stage.
- [ ] Add live support chat analytics and support statistics to the reporting dashboard.

### 11. FAQs, Regulatory Directory & Support Channels
- [x] Build searchable, database-backed `/faq` page with verified official regulatory authority contacts (CEDA, BDIH, CIPA) (`app/(landingpage)/faq/page.tsx`, `components/faq/FaqBrowser.tsx`).
- [x] Build `/support` page with verified CEDA contact channels, privacy contact, and response targets (`app/(landingpage)/support/page.tsx`).
- [x] Build public informational pages (`/`, `/about`, `/guidelines`, `/news`, `/terms`).

### 12. System Architecture, Responsiveness & Performance
- [x] Organize Next.js 16 App Router into clean domain route groups (`(landingpage)`, `(auth)`, `(dashboards)`, `(submissions)`, `(account)`).
- [x] Set up Drizzle ORM with Neon serverless Pool driver for transactional modularity (`db/index.ts`).
- [x] Set up TanStack Query (`lib/query-client.ts`) and Sonner toast notifications (`components/Providers.tsx`) at root layout.
- [x] Optimize hero animation asset (3.76 MB GIF → 1.44 MB animated WebP).
- [ ] Conduct full cross-browser and mobile viewport testing (Chrome, Edge, Firefox, Safari, mobile).
- [ ] Run keyboard navigation & WCAG accessibility review across all public and role workspaces.
- [ ] Profile query performance, asset loading, and concurrent request handling under load.

---

## Priority 3 — Differentiators & Final Hackathon Submission

### 13. Innovation & Creativity Differentiators (10% Judging Criteria)
- [ ] Select and build high-impact value-add features beyond baseline specs, such as:
  - [ ] **AI-assisted idea completeness & readiness checker** before final submission.
  - [ ] **Automated duplicate / similar idea detection** to flag overlapping proposals for reviewers.

### 14. Technical Submission Deliverables & Packaging
- [x] Maintain clean, modular TypeScript codebase passing `npm run typecheck`, `npm run lint`, and `npm test`.
- [x] Provide initial `README.md`, `docs/decisions.md`, `docs/build-log.md`, `docs/implementation-plan.md`, and `docs/demo-runbook.md`.
- [ ] Provide **Live Hosted URL** in `README.md` and submission form.
- [ ] Update `README.md` with complete architecture overview, Neon Object Storage setup, all required env vars, hosting region & cost breakdown, and full tools/frameworks list.
- [ ] Package deployment/installable build scripts (e.g., production build verification / Dockerfile or deployment config).
- [ ] Verify final zipped submission bundle (code + docs + assets, excluding `node_modules`/`.next`) is strictly **under 150 MB**.
