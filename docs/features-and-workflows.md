# Features & User Workflows

This guide documents every public surface, workspace, and differentiator implemented in the **CEDA Innovation Management Portal**.

---

## 1. Public Portal (`app/(landingpage)/*`)

| Route | Purpose | Data Source |
| :--- | :--- | :--- |
| `/` | CEDA Innovation Portal landing page (hero with animated WebP, benefits, 5-stage process, showcase, consultant chat CTA, news preview, FAQ preview) | Static + live CMS previews |
| `/about` | Agency mission and innovation programme overview | Static |
| `/guidelines` | Application handbook & official downloadable templates | `content_blocks` (`guidelines.*` + built-in defaults) & published `documents` via `/api/documents/[id]` |
| `/news` | Verified CEDA enterprise stories + live admin-published portal announcements | Static stories + `content_blocks` (`news.*`) |
| `/faq` | Searchable FAQ browser + verified Botswana regulatory contacts (CEDA, BDIH, CIPA) | Published `faqs` table |
| `/support` | Verified CEDA contact channels, privacy contact, and response targets | Static |
| `/privacy` | Factual Botswana Data Protection Act 2024 data-handling notice | Static |
| `/terms` | Portal terms of use | Static |

Global floating support actions (`GlobalSupportActions`) appear across public and studio pages to launch the **Live Consultant Chat Modal** (`LiveChatModal`).

---

## 2. Dynamic Submission Studio & Readiness Checker (`/submit`)

- **Route:** `app/(submissions)/submit/page.tsx` (`SubmissionForm.tsx`)
- **Required Role:** `submitter`
- **Multi-Section Wizard (7 Sections):**
  1. Terms and Conditions (idea title + mandatory terms confirmation)
  2. General Information (sector category + call-configured fields)
  3. Solution Status (concept, prototype, pilot, ready to launch, operating)
  4. Solution Overview (detailed summary)
  5. Type of Innovation (product, service, process, technology, business model, social)
  6. Additional Information (dynamic fields configured per call in `form_fields`)
  7. Solution Documents (private file uploads via `AttachmentUploader` backed by Neon Object Storage + URL fields)
- **Save & Resume Drafts:** `saveSubmissionDraft` creates or updates a draft with a unique `CEDA-YYYY-XXXXXXXX` reference number and allows resuming via `/submit?draft=<id>`.
- **Smart Idea Completeness & Readiness Checker (`lib/idea-readiness.ts`, `components/submit/ReadinessChecker.tsx`):**
  - Continuously scores the draft from **0 to 100** across 6 rubric dimensions (title clarity 10 pts, problem/solution/impact/delivery summary depth 25 pts, classification 15 pts, required call fields 25 pts, supporting files/links 15 pts, terms acceptance 10 pts).
  - Assigns a readiness grade (`Early draft`, `Needs detail`, `Strong draft`, `Ready to submit`).
  - Displayed live in the sticky sidebar AND as a full pre-submission checklist on Section 7, with one-click **"Improve this section"** jump links directly to the relevant wizard step.

---

## 3. Live Pipeline Tracker & Free Alert Subscriptions (`/track`)

- **Route:** `app/(submissions)/track/page.tsx` (`lib/track-pipeline.ts`, `lib/server/track-submission.ts`)
- **Access:** Requires sign-in (DPA 2024 protection). Owners can track any of their own submissions (including drafts); oversight roles (`admin`, `committee_member`, `adjudicator`, `evaluator`) can track non-draft, non-withdrawn submissions without seeing private scores or notes.
- **Capabilities:**
  - Case-insensitive reference number lookup (`CEDA-YYYY-XXXXXXXX`) via `GET /track?ref=...`
  - Visual 5-stage **`PipelineStepper`** (`Submission → Review → Feedback → Approval → Award`) with revision-needed warning state
  - Plain-English **"What happens next"** callout with direct action button for owners (e.g., **"Review & resubmit"** when `changes_requested`)
  - Chronological **Stage history** timeline (`idea_stage_history`) formatted in `Africa/Gaborone` time
  - **Free Status Alerts** panel to follow/unfollow the submission (`idea_subscriptions` + audit log) and inspect active notification channels (In-portal / Email / SMS)
  - One-click **"Your submissions"** cards for instant tracking without memorizing reference numbers

---

## 4. Submitter Dashboard & Resubmission Loop (`/dashboard`)

- **Dashboard (`app/(workspace)/(dashboards)/dashboard/page.tsx`):** Tabbed overview (`Drafts`, `In review`, `Decided`), KPI cards, and recent activity feed.
- **Submission Detail (`app/(workspace)/(dashboards)/dashboard/submissions/[id]/page.tsx`):**
  - Displays idea summary, private supporting document downloads (`/api/attachments/[id]`), award recognition, dynamic answers, progress timeline, **Adjudication decisions** (decision badge, stage, version, adjudicator name, and written rationale — never exposing raw scores), evaluator written feedback, and public replies.
  - When `status === "changes_requested"`, renders **`ResubmissionForm`** allowing the submitter to edit fields, keep/upload revised attachments (staged via signed tokens), and submit a new immutable `idea_versions` row (`v2+`), returning the submission to the review queue.

---

## 5. Multi-Level Evaluation & Duplicate Detection (`/evaluator`, `/adjudicator`)

- **Evaluator Workspace (`/evaluator`, `/evaluator/assignments/[id]`):**
  - Self-claim unassigned submissions in `evaluation` stages (evaluators cannot claim their own ideas).
  - **Automated Duplicate / Similar Proposal Detection (`lib/idea-similarity.ts`, `components/review/SimilarIdeasAlert.tsx`):** Computes TF-IDF cosine similarity (2.5× title weight) + bigram phrase overlap across all non-draft, non-withdrawn proposals. Flags `high` (≥ 55%) and `moderate` (30–54%) overlaps with match percentage and shared keywords, or confirms no overlaps were detected.
  - Supports **evaluator-only private notes** (`feedback.isInternal = true`) isolated from submitters.
  - Version-locked weighted criterion scoring automatically advances the submission to the next evaluation stage or into `adjudication`.
- **Adjudicator Workspace (`/adjudicator`):**
  - Displays queued submissions with batched duplicate/similarity alerts (`findSimilarIdeasMap`), aggregated multi-stage evaluator scores, supporting documents, and full answers.
  - Adjudicators record `Approve`, `Request changes` (triggers public feedback & submitter resubmission loop), or `Reject` with mandatory ≥ 20-character rationale.

---

## 6. Innovation Committee Monitoring (`/committee`)

- **Route:** `app/(workspace)/(dashboards)/committee/page.tsx`
- Read-only oversight table showing every submitted idea's reference, title, opportunity, current stage, and public status.
- Strict isolation: evaluator scores, full answers, submitter PII, and internal notes are excluded.
- One-click **Follow / Unfollow** buttons subscribe committee members to in-app/email lifecycle notifications and log `idea.followed` / `idea.unfollowed` to `audit_logs`.

---

## 7. Live Support Chat System (`LiveChatModal` & `/consultant`)

- **Applicant Modal (`components/landing/LiveChatModal.tsx`):**
  - Persistent conversation history tied to the user's account, polled every 5 seconds.
  - Displays real-time desk availability (`lib/chat-availability.ts`):
    - **Open:** Weekdays `09:00–16:00 CAT` (`Africa/Gaborone`) with consultant capacity available.
    - **All Agents Busy:** Explicit automated amber banner + live queue position (`#N`) whenever all consultants are at or above capacity (default 3 concurrent active chats per consultant, configurable via `system_settings["chat.max_concurrent_per_agent"]`).
    - **Botswana Public Holiday:** Automatically detects fixed and movable Botswana statutory holidays (New Year's, Good Friday, Easter Monday, Labour Day, Sir Seretse Khama Day, President's Day, Botswana Day, Christmas/Boxing Day + custom `system_settings["chat.public_holidays"]`).
    - **Offline Hours:** Weekends and outside `09:00–16:00 CAT` queue messages for the next working day.
- **Consultant Service Desk (`/consultant`, `components/consultant/ChatQueue.tsx`):**
  - Scoped strictly to the signed-in consultant's **My active chats**, unassigned **Waiting queue** (FIFO), and **Recently closed** conversations.
  - Live 5-second queue polling via `GET /api/chat?scope=queue`.
  - Retains the selected active conversation across page refreshes via URL `?conversation=<id>` and `sessionStorage`.
  - Live analytics strip showing total/7-day volume, queue counts, average & median first-response time, and resolution rate/duration.

---

## 8. Admin Control Center (`/admin/*`)

| Route | Capabilities |
| :--- | :--- |
| `/admin` | Overview of innovation calls and quick navigation to all admin tools |
| `/admin/calls/new`, `/admin/calls/[id]` | Create calls, toggle status (`draft`/`open`/`closed`/`archived`), dynamic form field builder, workflow stage editor (create, rename, reorder), and score-safe criteria editor (edit before scoring; archive/restore after scoring) |
| `/admin/categories` | Create, edit, and deactivate/reactivate submission categories without breaking historical ideas |
| `/admin/users` | Assign and revoke roles across verified user accounts |
| `/admin/reviews` | Monitor the review pipeline across stages |
| `/admin/awards` | Grant formal awards (`title`, `tier`, `description`) to approved ideas, advancing them to the terminal `award` stage |
| `/admin/content/faqs` | Audited CRUD + publish toggle for public `/faq` entries |
| `/admin/content/documents` | Audited upload, replacement, publish toggle, download preview, and deletion of downloadable templates in Neon Object Storage (rendered live on `/guidelines`) |
| `/admin/content/pages` | Audited CMS for core `/guidelines` sections, `/news` featured banner, and custom announcements/guideline sections (`content_blocks`) |
| `/admin/reports` | Executive & operational Recharts analytics suite (activity trend `AreaChart`, conversion `FunnelChart`, sector `BarChart`, turnaround `BarChart` + table, demographics `PieChart` donut, evaluator workload, live chat analytics) + audited **CSV**, **PDF**, and **Print** exports |
| `/admin/audit` | Protected read-only viewer of immutable `audit_logs` |

---

## 9. Account & Notification Settings

- **`/profile`:** Edit display name, organisation, and job title (`user_profiles`).
- **`/notifications`:** In-portal alert inbox with individual and **Mark all read** actions.
- **`/account/settings`:** Authenticated password change and notification channel preferences (`in_app`, `email`, `sms`).
