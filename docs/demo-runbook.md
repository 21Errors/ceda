# End-to-End 6-Role Demo Runbook

Use this walkthrough to demonstrate the entire **CEDA Innovation Management Portal** lifecycle live at **[https://ceda-alpha.vercel.app/](https://ceda-alpha.vercel.app/)** or locally at `http://localhost:3000`.

---

## 1. Quick Demo Setup & Credentials

Run migrations, seed portal configuration, and seed the 6 pre-verified role accounts:

```powershell
npm run db:migrate
npm run db:seed
npm run db:seed-users
```

All 6 accounts sign in at **`/login`** using password **`Password123!`**:

| Role | Email | Password | Primary Workspace |
| :--- | :--- | :--- | :--- |
| **Submitter** | `submitter@ceda.test` | `Password123!` | `/dashboard` |
| **Evaluator** | `evaluator@ceda.test` | `Password123!` | `/evaluator` |
| **Adjudicator** | `adjudicator@ceda.test` | `Password123!` | `/adjudicator` |
| **Administrator** | `admin@ceda.test` | `Password123!` | `/admin` |
| **Service Consultant** | `consultant@ceda.test` | `Password123!` | `/consultant` |
| **Committee Member** | `committee@ceda.test` | `Password123!` | `/committee` |

---

## 2. Public Portal & Admin Content Management

1. Browse **`/`**, **`/guidelines`**, **`/news`**, **`/faq`**, **`/support`**, and **`/privacy`**.
2. Sign in as **Administrator** (`admin@ceda.test`):
   - Open **`/admin/content/documents`**: upload a sample PDF/DOCX template (stored in Neon Object Storage), publish it, and verify it appears for download on **`/guidelines`**.
   - Open **`/admin/content/pages`**: edit a guideline section or publish a news announcement and verify it renders live on **`/guidelines`** and **`/news`**.
   - Open **`/admin/content/faqs`** and **`/admin/categories`**: confirm audited create/edit/publish controls.
   - Open **`/admin/calls/<id>`**: inspect dynamic form fields, workflow stages, and weighted scoring criteria.

---

## 3. Idea Submission, File Upload & Readiness Checker

1. Sign in as **Submitter** (`submitter@ceda.test`) and navigate to **`/submit`**.
2. Fill out the 7-section wizard:
   - Observe the live **Idea Completeness & Readiness Checker** in the right sidebar updating from `0/100` to `Ready to submit` with one-click section jump links.
   - Upload a supporting PDF/pitch deck in Section 7 (`Solution Documents` → Neon Object Storage) and review the full pre-submission readiness checklist.
3. Submit the application and note the generated reference number (`CEDA-2026-XXXXXXXX`).
4. Open **`/track?ref=<referenceNo>`**: verify the 5-stage visual `PipelineStepper`, stage history timeline, and free alert subscription toggle.

---

## 4. Multi-Level Evaluation & Duplicate Detection

1. Sign in as **Evaluator** (`evaluator@ceda.test`) and open **`/evaluator`**.
2. Claim the newly submitted idea from the evaluation queue and open the assignment.
3. Point out the **Automated Duplicate / Similar Proposal Check** banner at the top of the review page (create a second overlapping proposal if you want to demonstrate a live `% match` alert with shared keywords!).
4. Add a **private evaluator note** (never visible to the submitter), download the supporting attachment, score each weighted criterion, and submit the evaluation.
5. Claim and complete Level 2 Evaluation so the submission automatically advances to **Adjudication**.

---

## 5. Adjudication, Revision Loop & Award Recognition

1. Sign in as **Adjudicator** (`adjudicator@ceda.test`) and open **`/adjudicator`**.
2. Inspect the aggregated Level 1 + Level 2 scores, attachments, and automated overlap alert.
3. **Optional Revision Loop:** Choose **Request changes** with ≥ 20-character rationale → sign back in as **Submitter**, view the new **Adjudication decisions** history panel on `/dashboard/submissions/[id]`, upload a revised file, and submit Version 2.
4. **Approval & Award:** Approve the submission in `/adjudicator` with rationale → sign in as **Administrator**, open **`/admin/awards`**, and grant a formal award.
5. Return to **Submitter** (`/dashboard/submissions/[id]` and `/track`) to confirm the final **Awarded** status, adjudication rationale history, full progress timeline, and award recognition card.

---

## 6. Committee Monitoring, Live Chat & Executive Reports

1. **Committee Member (`committee@ceda.test`):** Open **`/committee`**. Confirm public workflow status visibility (with zero evaluation scores or private notes exposed) and toggle **Follow** to subscribe to lifecycle alerts.
2. **Live Support Chat:**
   - As **Submitter**, open the floating **CEDA Service Consultant** chat modal, start a conversation, and send a message (notice business hours / Botswana public holiday / all-agents-busy status banners).
   - As **Service Consultant (`consultant@ceda.test`)**, open **`/consultant`**, claim the waiting chat, reply, refresh the browser (confirming active chat retention across refreshes), inspect the live response/resolution metrics, and close the chat.
3. **Executive Reports & Audit (`admin@ceda.test`):**
   - Open **`/admin/reports`** to view the Recharts dashboard (activity trend, stage conversion funnel, sector bar chart, stage turnarounds, applicant demographics, evaluator workload, and chat analytics) and test **Export CSV** and **Download PDF**.
   - Open **`/admin/audit`** to inspect the immutable audit trail of every action performed during the demo.
