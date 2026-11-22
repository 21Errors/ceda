# API & Server Actions Reference

The portal exposes RESTful Route Handlers under `app/api/*` for authentication, binary file uploads/downloads, live chat polling, report exports, and health checks, while form mutations use Next.js Server Actions (`actions.ts`).

---

## HTTP Route Handlers (`app/api/*`)

### 1. Health Check
- **`GET /api/health`** (`app/api/health/route.ts`)
  - **Auth:** Public
  - **Behavior:** Executes `SELECT 1` against Neon Postgres.
  - **Responses:**
    - `200 OK`: `{ "status": "ok", "database": "ok" }` (`Cache-Control: no-store`)
    - `503 Service Unavailable`: `{ "status": "unavailable", "database": "unavailable" }`

---

### 2. Better Auth Endpoints
- **`GET | POST /api/auth/[...all]`** (`app/api/auth/[...all]/route.ts`)
  - Delegates to Better Auth handler (`lib/auth.ts`), supporting `/sign-up/email`, `/sign-in/email`, `/sign-out`, `/get-session`, `/email-otp/*`, `/passkey/*`, and password reset endpoints.

---

### 3. Submission Attachments (Private Neon Object Storage)

#### `POST /api/attachments` (`app/api/attachments/route.ts`)
- **Auth:** Authenticated `submitter` + verified `Origin` header
- **Content-Type:** `multipart/form-data`
- **Fields:**
  - `ideaId` (UUID, required — must belong to caller)
  - `mode`: `"draft"` (when `idea.status === "draft"`) or `"resubmission"` (when `idea.status === "changes_requested"`)
  - `file`: Binary file (max **4 MB**, strict allowlist + magic-byte signature verification)
- **Rate Limit:** 20 uploads per 10 minutes per user (`429`)
- **Responses:**
  - `201 Created` (`draft`): `{ attachment, downloadUrl }`
  - `201 Created` (`resubmission`): `{ stagedAttachment: { token, fileName, fileSize, mimeType }, downloadUrl }`
  - `400 / 401 / 403 / 404 / 409 / 413 / 429 / 503`

#### `GET /api/attachments?token=<signedToken>[&format=json]`
- **Auth:** Authenticated owner of the staged token
- **Behavior:** Verifies HMAC-SHA256 staged token and returns a 302 redirect to a 5-minute presigned S3 URL (or `{ url, expiresIn: 300 }` when `format=json`).

#### `DELETE /api/attachments`
- **Auth:** Authenticated owner + verified `Origin`
- **Body / Query:** `token` (staged resubmission token)
- **Behavior:** Deletes the staged object from Neon Object Storage and writes `attachment.staged_removed` to `audit_logs`.

#### `GET /api/attachments/[id][?format=json]` (`app/api/attachments/[id]/route.ts`)
- **Auth:** Authenticated user passing `canUserAccessIdeaAttachment` (owner, collaborator, admin, adjudicator, committee member for non-drafts, or assigned evaluator)
- **Behavior:** Logs `attachment.downloaded` to `audit_logs` and redirects (`302`) to a 5-minute presigned S3 URL (`Cache-Control: private, no-store`), or returns JSON when `format=json`.

#### `DELETE /api/attachments/[id]`
- **Auth:** Authenticated `submitter` owner (drafts only) + verified `Origin`
- **Behavior:** Deletes DB row, logs `attachment.deleted`, and deletes S3 object if no other version references the same storage key.

---

### 4. Downloadable Portal Document Templates
- **`GET /api/documents/[id]`** (`app/api/documents/[id]/route.ts`)
  - **Auth:** Public if `documents.isPublished === true`; `admin` role required if unpublished (`404` otherwise).
  - **Behavior:** Issues a `302` redirect to a 5-minute presigned Neon Object Storage download URL (`Cache-Control: private, no-store`).

---

### 5. Live Support Chat
- **Endpoint:** `app/api/chat/route.ts`
- **Auth:** Authenticated session required (`401` if signed out)

#### `GET /api/chat`
- **Query Modes:**
  1. `GET /api/chat` — Returns the caller's latest conversation, up to 100 messages, `isConsultantOpen`, full `availability` (`status`, `allAgentsBusy`, `holidayName`, `bannerMessage`, capacity counts), and `queuePosition`.
  2. `GET /api/chat?conversationId=<uuid>` — Loads a specific conversation (accessible to the requester, or to a `consultant` if unassigned or assigned to them).
  3. `GET /api/chat?scope=queue` — **Consultant-only (`403` otherwise)**. Returns `{ myActive, waiting, recentClosed, availability, analytics, currentUserId }` for live queue polling.

#### `POST /api/chat`
- **Security:** Requires verified `Origin` (`403`), max body 8 KB (`413`), and 8 messages / 60s rate limit (`429`).
- **JSON Actions:**
  - `{ "action": "start" }` — Returns existing open conversation or creates a new `waiting` conversation, notifies consultants, logs `chat.started`, and returns `{ conversationId, availability, queuePosition }`.
  - `{ "action": "claim", "conversationId": "<uuid>" }` — Consultant-only. Atomically assigns `agentId` and sets `status = "active"`, notifies requester, logs `chat.claimed` (`409` if already claimed).
  - `{ "action": "close", "conversationId": "<uuid>" }` — Assigned consultant only. Sets `status = "closed"` and `closedAt`, logs `chat.closed`.
  - `{ "action": "message", "conversationId": "<uuid>", "body": "..." }` — Requester or assigned consultant on open chat (1–2,000 chars). Inserts `chat_messages`, dispatches in-app & email notifications, and logs `chat.message_sent`.

---

### 6. Executive Report Exports
- **`GET /api/admin/reports/export?format=csv|pdf`** (`app/api/admin/reports/export/route.ts`)
  - **Auth:** Authenticated `admin` (`401` / `403`)
  - **Behavior:** Aggregates live `getExecutiveReportData()`, logs `report.exported` to `audit_logs`, and streams a downloadable attachment (`Cache-Control: private, no-store`):
    - `format=csv` (default): `text/csv; charset=utf-8` (`ceda-analytics-report-YYYY-MM-DD.csv`) with formula-injection escaping.
    - `format=pdf`: `application/pdf` (`ceda-analytics-report-YYYY-MM-DD.pdf`), generated natively via `lib/server/report-pdf.ts`.

---

## Server Actions Map (`actions.ts`)

| Module | Key Actions | Role Guard |
| :--- | :--- | :--- |
| `app/(submissions)/submit/actions.ts` | `saveSubmissionDraft`, `submitIdeaAction` | `submitter` |
| `app/(submissions)/track/actions.ts` | `toggleTrackedIdeaAlert` | Authenticated + idea visibility |
| `app/(workspace)/(dashboards)/dashboard/submissions/actions.ts` | `resubmitIdeaAction` | `submitter` (owner) |
| `app/(workspace)/(dashboards)/evaluator/assignments/actions.ts` | `claimEvaluation`, `submitEvaluation`, `addEvaluatorInternalNote` | `evaluator` |
| `app/(workspace)/(dashboards)/adjudicator/actions.ts` | `recordAdjudicationDecision` | `adjudicator` |
| `app/(workspace)/(dashboards)/committee/actions.ts` | `toggleIdeaFollow` | `committee_member` |
| `app/(workspace)/(dashboards)/admin/users/actions.ts` | Role grant/revoke actions | `admin` |
| `app/(workspace)/(dashboards)/admin/calls/actions.ts` | Call creation, status toggle, form fields, workflow stages, criteria | `admin` |
| `app/(workspace)/(dashboards)/admin/categories/actions.ts` | Category create, edit, activate/deactivate | `admin` |
| `app/(workspace)/(dashboards)/admin/awards/actions.ts` | `grantAward` | `admin` |
| `app/(workspace)/(dashboards)/admin/content/faqs/actions.ts` | `createFaq`, `updateFaq`, `deleteFaq` | `admin` |
| `app/(workspace)/(dashboards)/admin/content/documents/actions.ts` | `createDocument`, `updateDocument`, `deleteDocument` | `admin` |
| `app/(workspace)/(dashboards)/admin/content/pages/actions.ts` | `saveContentBlock`, `createAnnouncementBlock`, `deleteContentBlock` | `admin` |
| `app/(workspace)/(account)/profile/actions.ts` | Profile update | Authenticated user |
| `app/(workspace)/(account)/notifications/actions.ts` | Mark notification(s) read | Authenticated user |
| `app/(workspace)/(account)/account/settings/actions.ts` | `saveNotificationPreferences` | Authenticated user |
