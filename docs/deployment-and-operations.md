# Deployment & Operations Guide

This document covers local setup, cloud deployment on **Vercel** and **Neon**, environment variable configuration, region & cost estimates, containerization, and operational checks.

---

## Production Topology

- **Application URL:** [https://ceda-alpha.vercel.app/](https://ceda-alpha.vercel.app/)
- **Health Readiness Probe:** [https://ceda-alpha.vercel.app/api/health](https://ceda-alpha.vercel.app/api/health)
- **App Host:** Vercel (Global Edge Network + Serverless Functions, configured via [`vercel.json`](../vercel.json))
- **Managed Database:** Neon Serverless Postgres (`polished-king-73646944`, `production` branch) in **`aws-eu-central-1`** (Frankfurt)
- **Object Storage:** Neon Object Storage (`uploads` private bucket, declared in [`neon.ts`](../neon.ts)) co-located in **`aws-eu-central-1`**
- **Email Transport:** Gmail / Google Workspace SMTP via `nodemailer` (`lib/server/mailer.ts`)

---

## Hosting Region & Estimated Monthly Costs

| Service | Provider | Region | Prototype / Hackathon Tier | Production Scale Estimate |
| :--- | :--- | :--- | :--- | :--- |
| **Web Hosting & CDN** | Vercel | Global Edge | **$0 / mo** (Hobby) | **$20 / mo** (Pro, 1 seat) |
| **Postgres Database** | Neon | `aws-eu-central-1` | **$0 / mo** (Free tier, scale-to-zero) | **$19 – $35 / mo** (Launch, autoscaling compute + 10–25 GB storage) |
| **Object Storage (`uploads`)** | Neon Object Storage | `aws-eu-central-1` | **$0 / mo** (within free quota) | **$1 – $5 / mo** (25–100 GB stored decks/templates + presigned downloads) |
| **Transactional Email** | Gmail SMTP / Workspace | Global | **$0 / mo** | **$0 – $6 / mo** |
| **Total Estimate** | — | **`aws-eu-central-1` + Edge** | **$0 / month** | **~$40 – $66 / month** |

> **Why `aws-eu-central-1`?** Co-locating Neon Postgres and Neon Object Storage in Frankfurt eliminates cross-region egress charges, provides reliable peering to Botswana/Southern Africa, and operates under GDPR-aligned controls compatible with **Botswana's Data Protection Act 2024**.

---

## Environment Variables

Use [`.env.example`](../.env.example) as your template. Never commit `.env` or `.env.local`.

| Variable | Required In Prod | Notes |
| :--- | :---: | :--- |
| `DATABASE_URL` | Yes | Pooled Neon Postgres URL (`?sslmode=require`) |
| `DATABASE_URL_UNPOOLED` | Recommended | Direct Neon URL for `drizzle-kit migrate` |
| `BETTER_AUTH_URL` | Yes | Exact canonical origin (e.g. `https://ceda-alpha.vercel.app`) — startup throws if omitted in production |
| `BETTER_AUTH_SECRET` | Yes | Minimum 32 random characters — startup throws if missing/short in production |
| `PASSKEY_RP_ID` | Yes | Hostname only (e.g. `ceda-alpha.vercel.app` or `localhost`) |
| `PASSKEY_ORIGIN` | Yes | Full origin matching `BETTER_AUTH_URL` |
| `GMAIL_USER` | Yes | Sender address for OTP verification and lifecycle/chat email alerts |
| `GMAIL_APP_PASSWORD` | Yes | 16-char Gmail App Password (production fails closed if omitted; dev prints OTPs to console) |
| `CEDA_BOOTSTRAP_ADMIN_EMAIL` | Bootstrap only | Verified user email granted initial `admin` role by `npm run db:bootstrap-admin` |
| `AWS_ENDPOINT_URL_S3` | Uploads | Neon Object Storage S3 endpoint |
| `AWS_ACCESS_KEY_ID` | Uploads | Neon Object Storage access key |
| `AWS_SECRET_ACCESS_KEY` | Uploads | Neon Object Storage secret key |
| `AWS_REGION` | Uploads | `auto` or `eu-central-1` |
| `NEON_BRANCH` / `NEON_BRANCH_ID` | Optional | Active Neon branch metadata |

---

## Deployment Workflows

### Deploying to Vercel (Primary)
1. Connect the repository in Vercel and configure all production environment variables above.
2. Vercel automatically applies [`vercel.json`](../vercel.json) (`npm ci` → `npm run build`) and disables caching on `/api/health`.
3. Run migrations and initial seed once against the production `DATABASE_URL`:
   ```powershell
   npm run db:migrate
   npm run db:seed
   ```
4. Configure an uptime monitor (e.g., UptimeRobot, Better Stack, or Vercel Checks) against `GET https://ceda-alpha.vercel.app/api/health` expecting HTTP `200` and `"database":"ok"`.

### Portable Docker Deployment (Optional)
A multi-stage [`Dockerfile`](../Dockerfile) with built-in `/api/health` `HEALTHCHECK` is included:

```powershell
docker build -t ceda-innovation-portal .
docker run --env-file .env.local -p 3000:3000 ceda-innovation-portal
```

---

## Verification & Quality Gates

Run the complete local verification suite before every release:

```powershell
npm run verify
```

This executes in order:
1. `npm run lint` — ESLint (`eslint-config-next`)
2. `npm run typecheck` — `next typegen && tsc --noEmit`
3. `npm test` — Vitest unit test suite (13 test files, 48 tests covering auth validation, attachments, RBAC navigation, notification gates, pipeline tracking, chat availability & Botswana public holidays, chat analytics, portal content CMS, executive reporting analytics, idea readiness scoring, and TF-IDF duplicate detection)
4. `npm run build` — Optimized Next.js 16 Turbopack production build

---

## Troubleshooting

- **`BETTER_AUTH_URL` / `BETTER_AUTH_SECRET` startup error in production:** Ensure both env vars are set in Vercel Production scope and `BETTER_AUTH_SECRET` is ≥ 32 characters.
- **`Request origin could not be verified` (HTTP 403 on `/api/chat` or `/api/attachments`):** Confirm `BETTER_AUTH_URL` matches the exact browser origin (protocol + host, no trailing slash).
- **Document uploads return HTTP 503:** Verify `AWS_ENDPOINT_URL_S3`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY` are populated from `npx neon env pull`.
- **OTP verification emails not received locally:** When `GMAIL_USER` / `GMAIL_APP_PASSWORD` are unset in development, check the `next dev` terminal logs where the 6-digit OTP code is printed.
