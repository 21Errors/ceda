# Authentication, RBAC & Security

The portal enforces defense-in-depth across identity verification, server-side role-based access control, file upload validation, rate limiting, and **Botswana Data Protection Act 2024** compliance.

---

## Authentication (`lib/auth.ts`)

Authentication is powered by **Better Auth** (`better-auth/minimal`) with the Drizzle/Postgres adapter:

- **Email & Password Sign-In:** Enabled with `requireEmailVerification: true` and `revokeSessionsOnPasswordReset: true`. Self-registration (`lib/auth-validation.ts`) enforces a minimum 12-character password and explicit DPA 2024 consent (`dataProtectionConsent: true`).
- **Hashed 6-Digit Email OTP:** Configured via `emailOTP` plugin (`otpLength: 6`, `expiresIn: 300s`, `allowedAttempts: 5`, `storeOTP: "hashed"`). Production requires Gmail SMTP (`GMAIL_USER`, `GMAIL_APP_PASSWORD`) and fails closed if missing; local development prints OTP codes to the server console.
- **WebAuthn Passkeys:** Configured via `@better-auth/passkey` using `PASSKEY_RP_ID` and `PASSKEY_ORIGIN`.
- **Session Cookie Cache:** 5-minute signed cookie cache (`cookieCache.maxAge: 300`) with automatic session creation auditing (`auth.session.created`).
- **Auth Rate Limiting:** Built-in Better Auth rate limiting:
  - Default: 10 requests / 60s
  - `/sign-in/email`: 5 requests / 60s
  - `/sign-up/email`: 3 requests / 60s
  - `/email-otp/send-verification-otp`: 3 requests / 60s

---

## 6-Role RBAC Permission Matrix

Built-in roles are seeded into `roles` and `role_permissions` from [`db/role-data.ts`](../db/role-data.ts) and enforced on every Server Component, Server Action, and API Route via [`lib/authorization.ts`](../lib/authorization.ts) (`requireUser`, `requireRole`, `getUserRoles`). Unauthorized role access redirects to `/forbidden` (or returns HTTP 403/404 on API routes).

| Role | Role Key | Primary Workspace | Permissions & Boundaries |
| :--- | :--- | :--- | :--- |
| **Submitter** | `submitter` | `/dashboard` | Create/save drafts, upload attachments, run readiness checker, submit & resubmit own ideas (`/submit`), track own ideas (`/track`), view own adjudication rationale & public feedback, use live chat. Cannot view other users' submissions or evaluator scores/internal notes. |
| **Evaluator** | `evaluator` | `/evaluator` | Claim unassigned submissions in evaluation stages (cannot evaluate own ideas), view attachments & automated duplicate alerts, record private internal notes (`feedback.isInternal = true`), and submit version-locked weighted criterion scores. |
| **Adjudicator** | `adjudicator` | `/adjudicator` | Review aggregated multi-stage evaluation scores, attachments, and duplicate alerts; approve, reject, or request structured changes (`needs_revision`) with mandatory 20+ character rationale. |
| **Administrator** | `admin` | `/admin` | Full operational control: manage users/roles (`/admin/users`), create/configure calls, dynamic form fields, workflow stages & score-safe criteria (`/admin/calls/*`), categories, FAQs, document templates, public pages/announcements, grant awards (`/admin/awards`), view Recharts reports & export CSV/PDF (`/admin/reports`), and inspect `audit_logs` (`/admin/audit`). |
| **Service Consultant** | `consultant` | `/consultant` | View and claim waiting applicant chats, manage multiple concurrent active conversations, reply, close threads, and monitor desk capacity/analytics. Cannot view other consultants' active chats. |
| **Committee Member** | `committee_member` | `/committee` | Read-only oversight of submitted ideas' public workflow stage and status, plus follow/unfollow lifecycle alerts. Evaluator scores, submitter answers, and internal notes remain strictly hidden. |

> Self-registration always grants **only** the `submitter` role. Staff roles are assigned exclusively by an administrator in `/admin/users` (after bootstrapping the initial verified admin via `npm run db:bootstrap-admin`).

---

## Security Controls

### HTTP Security Headers (`next.config.ts`)
Every response sets:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=31536000` (in production)

### Origin & Abuse Protection
- **Origin Verification:** Mutating API endpoints (`/api/chat`, `/api/attachments`) strictly validate the HTTP `Origin` header against `BETTER_AUTH_URL` / request host.
- **Rate Limits:**
  - Chat messages: max 8 messages per 60 seconds per user (`app/api/chat/route.ts`).
  - File uploads: max 20 uploads per 10 minutes per user (`lib/server/attachments.ts`).
- **Payload Size Caps:** Chat requests capped at 8 KB; file uploads capped at 4 MB (`MAX_ATTACHMENT_BYTES`); Server Actions capped at `6mb` in `next.config.ts`.

### File Upload Security (`lib/attachments.ts`, `lib/server/attachments.ts`)
1. Strict extension & MIME allowlist: `.pdf`, `.pptx`, `.ppt`, `.docx`, `.doc`, `.xlsx`, `.xls`, `.png`, `.jpg`, `.jpeg`, `.webp`.
2. **Magic-byte signature inspection** (`verifyFileSignature`): verifies actual file header bytes (`%PDF-`, PNG header, JPEG SOI, WebP RIFF/WEBP, OOXML `PK\x03\x04`, OLE2 compound header) to block disguised files.
3. Filename sanitization (`sanitizeFileName`) removes path traversal, null bytes, and special characters.
4. Downloads issue 5-minute presigned S3 URLs with `Content-Disposition: attachment` and RBAC checks (`evaluateAttachmentAccess`).

### Export & Lookup Safety
- **CSV Formula Injection Neutralization (`lib/reports-analytics.ts`):** `escapeCsvCell` prefixes values starting with `=`, `+`, `-`, `@`, `\t`, or `\r` with `'` before RFC 4180 quoting.
- **Non-Enumerating `/track` Lookup:** Unauthenticated visitors must sign in before looking up reference numbers; unauthorized or nonexistent reference queries return the same neutral message to prevent reference enumeration.

---

## Botswana Data Protection Act 2024 & Audit Trail

- **Explicit Consent:** Registration requires affirmative DPA 2024 consent, persisted as `user_profiles.dataConsentAt`.
- **Transparent Privacy Notice:** `/privacy` states factual prototype data-handling scope and notes formal legal review requirements before processing live confidential personal data.
- **Immutable Audit Trail (`lib/server/audit.ts`, `/admin/audit`):** Transactional `audit_logs` capture:
  - Sessions (`auth.session.created`), role assignments (`role.bootstrap_assigned`, `role.assigned`), profile/settings updates
  - Submissions (`idea.draft_created`, `idea.submitted`, `idea.resubmitted`, `idea.followed`, `idea.unfollowed`)
  - Attachments (`attachment.uploaded`, `attachment.staged`, `attachment.deleted`, `attachment.downloaded`)
  - Evaluation, adjudication & awards (`evaluation.submitted`, `adjudication.decided`, `award.granted`)
  - Live support chat (`chat.started`, `chat.claimed`, `chat.message_sent`, `chat.closed`)
  - Admin CMS & exports (`faq.*`, `document.*`, `content_block.*`, `report.exported`)
