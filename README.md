# CEDA Innovation Management Portal

A full-stack, role-based innovation management platform built for the **Citizen Entrepreneurial Development Agency (CEDA)** in Botswana. It supports end-to-end idea submission, file uploads, multi-level weighted evaluation, adjudication & iterative revision cycles, live pipeline tracking, free status alert subscriptions, real-time service consultant chat, executive analytics & exports, and Botswana Data Protection Act 2024 governance.

- **Live Hosted URL:** [https://ceda-alpha.vercel.app/](https://ceda-alpha.vercel.app/)
- **Health Readiness Endpoint:** [https://ceda-alpha.vercel.app/api/health](https://ceda-alpha.vercel.app/api/health)
- **Sign-In Portal (All Roles):** [https://ceda-alpha.vercel.app/login](https://ceda-alpha.vercel.app/login)

---

## Architecture Overview

The application is built on **Next.js 16 App Router** (`cacheComponents: true`, `partialPrefetching: true`) with **React 19**, **TypeScript**, **Drizzle ORM** over **Neon Serverless Postgres**, **Better Auth**, and **Neon Object Storage**.

```text
├── app/
│   ├── (landingpage)/     # Public portal: /, /about, /guidelines, /news, /faq, /support, /privacy, /terms
│   ├── (auth)/            # Authentication: /login, /signup, /forgot-password, /forbidden
│   ├── (submissions)/     # Submission studio & live tracker: /submit, /track
│   ├── (workspace)/
│   │   ├── (dashboards)/  # RBAC workspaces: /dashboard, /evaluator, /adjudicator, /committee, /consultant, /admin/*
│   │   └── (account)/     # Account tools: /profile, /notifications, /account/settings
│   └── api/               # Route handlers: /api/auth/*, /api/attachments/*, /api/documents/*, /api/chat, /api/admin/reports/export, /api/health
├── components/            # Modular UI primitives, forms, charts (Recharts), live chat, and review widgets
├── db/                    # Drizzle schema (35 tables), migrations, seed.ts, seed-users.ts, bootstrap-admin.ts
├── lib/                   # Auth config, RBAC guards, Zod validation, readiness & similarity engines, server services
├── docs/                  # Architecture decisions, build log, implementation plan, demo runbook
└── neon.ts                # Neon Object Storage bucket configuration (uploads, assets)
```

### Core Capabilities & Differentiators
- **5-Stage Innovation Lifecycle:** `Submission → Review → Feedback → Approval → Award`, with immutable `idea_versions`, append-only `idea_stage_history`, and structured resubmission loops.
- **Strict 6-Role Separation of Duties (RBAC):** `submitter`, `evaluator`, `adjudicator`, `admin`, `consultant`, and `committee_member` enforced server-side via `lib/authorization.ts`.
- **Smart Idea Completeness & Readiness Checker (`lib/idea-readiness.ts`):** Live 100-point rubric on `/submit` evaluating title clarity, problem/solution/impact/delivery depth, classification, required call fields, supporting documents/links, and DPA 2024 consent with one-click section jump links.
- **Automated Duplicate / Similar Proposal Detection (`lib/idea-similarity.ts`):** TF-IDF cosine + bigram phrase overlap engine flagging overlapping submissions (with match % and shared keywords) for evaluators and adjudicators while strictly excluding private drafts.
- **Live Status Tracker (`/track`) & Free Alerts:** Reference-number lookup (`CEDA-YYYY-XXXXXXXX`) with visual 5-stage pipeline stepper, chronological stage history, and audited alert subscriptions (`idea_subscriptions` + email/in-app notification preferences).
- **Live Service Consultant Chat (`/consultant` & `LiveChatModal`):** Persistent multi-user chat with weekday `09:00–16:00 CAT` (`Africa/Gaborone`) hours, Botswana statutory public holiday detection, automated "all agents busy" capacity fallback with queue positions, active-chat persistence across refreshes, and response/resolution analytics.
- **Executive Analytics & Exports (`/admin/reports`):** Recharts visual dashboards (activity trend, stage conversion funnel, sector/category bar chart, workflow turnaround timelines, applicant demographics, chat analytics) with audited CSV and multi-page PDF downloads (`/api/admin/reports/export`).
- **Admin CMS & Governance:** Dynamic call/form/stage/criteria builders, category management, FAQ CMS, Neon Object Storage downloadable template CMS (`/admin/content/documents`), public guidelines & news CMS (`/admin/content/pages`), and immutable `audit_logs` (`/admin/audit`).

---

## Neon Object Storage Setup

Private file uploads (submission pitch decks, supporting documents, and admin-managed downloadable templates) are backed by **Neon Object Storage** (S3-compatible, branch-isolated storage declared in [`neon.ts`](neon.ts)):

- **Bucket:** `uploads` (`access: "private"`)
- **SDK Client:** [`lib/storage.ts`](lib/storage.ts) using `files-sdk` (`neon({ bucket: "uploads" })`)
- **Security Controls (`lib/attachments.ts`, `lib/server/attachments.ts`):**
  - Strict extension & MIME allowlist (PDF, PowerPoint, Word, Excel, PNG, JPEG, WebP)
  - Magic-byte file signature verification (rejects spoofed extensions/MIME types)
  - 4 MB max file size, sanitized storage keys (`ideas/...` and `documents/...`), per-user upload rate limits
  - Time-limited presigned download URLs served via `/api/attachments/[id]` (RBAC-checked) and `/api/documents/[id]` (published public / unpublished admin-only)

To provision or pull branch storage credentials via the Neon CLI:

```powershell
npx neon init
npx neon env pull
```

---

## Required Environment Variables

Copy `.env.example` to `.env.local` for local development, or configure these in your Vercel project settings for production:

| Variable | Required | Description |
| :--- | :---: | :--- |
| `DATABASE_URL` | Yes | Pooled Neon Postgres connection string (`sslmode=require`) |
| `DATABASE_URL_UNPOOLED` | Recommended | Direct Neon Postgres connection string for Drizzle migrations |
| `BETTER_AUTH_URL` | Yes | Canonical app origin (e.g. `https://ceda-alpha.vercel.app` or `http://localhost:3000`) |
| `BETTER_AUTH_SECRET` | Yes | Random secret (≥ 32 characters in production) for signing sessions & attachment tokens |
| `PASSKEY_RP_ID` | Yes | WebAuthn Relying Party ID matching the deployed hostname (e.g. `ceda-alpha.vercel.app` or `localhost`) |
| `PASSKEY_ORIGIN` | Yes | WebAuthn origin matching `BETTER_AUTH_URL` |
| `GMAIL_USER` | Prod | Gmail / Google Workspace address used to dispatch OTP codes and lifecycle email alerts |
| `GMAIL_APP_PASSWORD` | Prod | 16-character Gmail App Password (dev prints OTP codes to server console when omitted) |
| `CEDA_BOOTSTRAP_ADMIN_EMAIL` | Bootstrap | Verified account email used once by `npm run db:bootstrap-admin` |
| `AWS_ENDPOINT_URL_S3` | Uploads | Neon Object Storage S3 endpoint URL |
| `AWS_ACCESS_KEY_ID` | Uploads | Neon Object Storage access key ID |
| `AWS_SECRET_ACCESS_KEY` | Uploads | Neon Object Storage secret access key |
| `AWS_REGION` | Uploads | Object storage region (e.g. `auto` or `eu-central-1`) |
| `NEON_BRANCH` | Optional | Active Neon branch name (e.g. `production`) |
| `NEON_BRANCH_ID` | Optional | Active Neon branch ID |

---

## Cloud Hosting Region & Monthly Cost Breakdown

| Component | Provider | Region | Hackathon / Prototype Tier | Production Scale Estimate |
| :--- | :--- | :--- | :--- | :--- |
| **Web Application & Edge CDN** | Vercel (`https://ceda-alpha.vercel.app/`) | Global Edge CDN + Serverless Functions | **$0 / mo** (Hobby) | **$20 / mo** (Vercel Pro, 1 seat) |
| **Managed Postgres Database** | Neon Postgres (`polished-king-73646944`) | **`aws-eu-central-1`** (Frankfurt, EU) | **$0 / mo** (Free tier, 0.5 GB storage, scale-to-zero) | **$19 – $35 / mo** (Launch tier, autoscaling compute + 10–25 GB storage) |
| **Object Storage (Attachments & Templates)** | Neon Object Storage (`uploads` bucket) | **`aws-eu-central-1`** (co-located with DB) | **$0 / mo** (included within free quota) | **$1 – $5 / mo** (25–100 GB stored pitch decks/templates & presigned egress) |
| **Transactional Email (OTP & Alerts)** | Gmail SMTP / Google Workspace | Global | **$0 / mo** (App Password SMTP) | **$0 – $6 / mo** (Google Workspace Starter or Resend/SES) |
| **Estimated Total** | — | **`aws-eu-central-1` + Edge** | **$0 / month** | **~$40 – $66 / month** |

> **Region Rationale:** `aws-eu-central-1` (Frankfurt) provides low-latency peering to Southern Africa/Botswana, co-locates compute/Postgres/Object Storage in one region to minimize egress, and operates under strict EU GDPR safeguards aligned with **Botswana's Data Protection Act 2024**.

---

## Tools, Frameworks & Libraries

- **Core Framework:** Next.js `16.4.6` (App Router, Turbopack, Cache Components), React `19.3.0`, TypeScript `5`
- **Styling & UI:** Tailwind CSS `4`, Lucide React icons, Motion (`14.x`), Sonner toast notifications, `@number-flow/react`
- **Database & Storage:** Drizzle ORM `0.45`, Drizzle Kit `0.31`, `@neondatabase/serverless`, Neon Object Storage (`files-sdk`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `@neon/config`)
- **Authentication & Security:** Better Auth `1.7` (`@better-auth/drizzle-adapter`, `@better-auth/passkey`, Email OTP plugin), Zod `4`, Nodemailer `10`
- **Data & Visualization:** Recharts `3.11` (Area, Bar, Funnel, Pie/Donut charts), TanStack Query `5`, TanStack Table `9`, React Hook Form `7`
- **Quality & Testing:** Vitest `4`, ESLint `9` (`eslint-config-next`), `tsx`

---

## Local Setup & Scripts

1. **Install dependencies and configure environment:**

```powershell
npm install
Copy-Item .env.example .env.local
```

2. **Apply database migrations and seed portal configuration:**

```powershell
npm run db:generate   # Generate Drizzle migrations after schema edits
npm run db:migrate    # Apply migrations to Neon Postgres
npm run db:seed       # Seed built-in roles, hackathon call, workflow stages, criteria, categories, and starter FAQs
```

3. **Seed demo / test accounts (one verified account per role):**

```powershell
npm run db:seed-users
```

This idempotent script (`db/seed-users.ts`) hashes passwords with Better Auth, marks each account email-verified (`emailVerified: true`), and assigns each built-in role. All 6 accounts sign in at `/login` (`https://ceda-alpha.vercel.app/login` or `http://localhost:3000/login`) with password **`Password123!`**:

| Role | Role Key | Email | Password | Workspace Route |
| :--- | :--- | :--- | :--- | :--- |
| Submitter | `submitter` | `submitter@ceda.test` | `Password123!` | `/dashboard` |
| Evaluator | `evaluator` | `evaluator@ceda.test` | `Password123!` | `/evaluator` |
| Adjudicator | `adjudicator` | `adjudicator@ceda.test` | `Password123!` | `/adjudicator` |
| Administrator | `admin` | `admin@ceda.test` | `Password123!` | `/admin` |
| Service Consultant | `consultant` | `consultant@ceda.test` | `Password123!` | `/consultant` |
| Committee Member | `committee_member` | `committee@ceda.test` | `Password123!` | `/committee` |

To grant initial administrator access to a custom self-registered, email-verified account instead, set `CEDA_BOOTSTRAP_ADMIN_EMAIL` in `.env.local` and run:

```powershell
npm run db:bootstrap-admin
```

4. **Start the development server:**

```powershell
npm run dev
```

5. **Run full verification suite (lint, typecheck, unit tests, production build):**

```powershell
npm run verify
```

### Production Container Deployment (Optional)

A multi-stage [`Dockerfile`](Dockerfile) and [`vercel.json`](vercel.json) are included for portable cloud deployment:

```powershell
docker build -t ceda-innovation-portal .
docker run --env-file .env.local -p 3000:3000 ceda-innovation-portal
```

---

## Documentation Index

Full technical, API, security, and operational documentation lives in `docs/`:

- [`docs/architecture.md`](docs/architecture.md) — System architecture, Next.js 16 route groups, lifecycle state machine, and storage design
- [`docs/database-schema.md`](docs/database-schema.md) — Complete 35-table Drizzle/Neon Postgres schema, enums, and seed scripts
- [`docs/auth-and-rbac.md`](docs/auth-and-rbac.md) — Better Auth, 6-role RBAC permission matrix, security controls, and Botswana DPA 2024 compliance
- [`docs/features-and-workflows.md`](docs/features-and-workflows.md) — End-to-end feature and route guide across all workspaces
- [`docs/api-reference.md`](docs/api-reference.md) — HTTP Route Handlers (`app/api/*`) and Server Actions map
- [`docs/deployment-and-operations.md`](docs/deployment-and-operations.md) — Vercel + Neon (`aws-eu-central-1`) deployment, env vars, cost estimates, Docker, and troubleshooting
