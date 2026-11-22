export interface ContentBlockRecord {
  id?: string;
  key: string;
  title: string | null;
  body: string;
  isPublished: boolean;
  updatedAt?: Date | null;
}

export interface DefaultContentSlot {
  key: string;
  section: "guidelines" | "news";
  label: string;
  description: string;
  defaultTitle: string;
  defaultBody: string;
}

export const CORE_CONTENT_SLOTS: readonly DefaultContentSlot[] = [
  {
    key: "guidelines.overview",
    section: "guidelines",
    label: "Guidelines overview",
    description:
      "Introductory overview displayed at the top of the public Application Guidelines page.",
    defaultTitle: "How the CEDA Innovation Portal works",
    defaultBody:
      "The CEDA Innovation Portal provides a transparent, end-to-end pathway for Botswana citizens, citizen-owned enterprises, and innovation teams to propose scalable solutions. Every submission is logged with a unique CEDA reference number, reviewed against published weighted criteria, and tracked across all five lifecycle stages: Submission, Review, Feedback, Approval, and Award.",
  },
  {
    key: "guidelines.eligibility",
    section: "guidelines",
    label: "Eligibility & requirements",
    description:
      "Who may apply and what core criteria applicants must satisfy before submitting.",
    defaultTitle: "Eligibility & core requirements",
    defaultBody:
      "Applicants must register a verified portal account and accept Botswana Data Protection Act 2024 consent terms. Proposals should clearly state the problem being solved, the target market or community impact in Botswana, technical and operational feasibility, and any supporting links or pitch documents configured for the open innovation call.",
  },
  {
    key: "guidelines.submission_steps",
    section: "guidelines",
    label: "Preparing your submission",
    description:
      "Step-by-step instructions for drafting, attaching documents, and submitting an idea.",
    defaultTitle: "Preparing & submitting your proposal",
    defaultBody:
      "1. Review the active innovation call and download any required templates below.\n2. Complete all mandatory sections in the dynamic submission studio; you may save drafts and return at any time before the closing deadline.\n3. Attach supporting pitch decks or financial schedules (PDF, Word, PowerPoint, Excel, or images up to 4 MB each).\n4. Submit to receive your CEDA reference number and track live progress on the Track Submission page.",
  },
  {
    key: "guidelines.evaluation_process",
    section: "guidelines",
    label: "Evaluation & adjudication",
    description:
      "Explains multi-level scoring, revision cycles, and final award recognition.",
    defaultTitle: "Evaluation, revisions & adjudication",
    defaultBody:
      "Assigned evaluators score each proposal against the call's weighted rubric while keeping internal notes confidential. Adjudicators review aggregated scores and either approve the proposal, request structured revisions (allowing you to submit a new immutable version), or record a formal rationale. Approved submissions proceed to award recognition.",
  },
  {
    key: "news.banner",
    section: "news",
    label: "News page featured announcement",
    description:
      "Optional highlighted notice shown above the latest stories on the public News page.",
    defaultTitle: "CEDA Innovation Management Portal Hackathon 2026",
    defaultBody:
      "Applications for the CEDA Innovation Management Portal Hackathon are open. Review the Application Guidelines and download any supporting templates before submitting your proposal.",
  },
] as const;

const CONTENT_KEY_PATTERN = /^[a-z0-9][a-z0-9._-]{1,98}[a-z0-9]$/;

export function isValidContentBlockKey(key: string): boolean {
  return CONTENT_KEY_PATTERN.test(key.trim());
}

export function slugifyAnnouncementKey(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `news.${slug || "announcement"}`;
}

export function getContentBlockSection(
  key: string,
): "guidelines" | "news" | "portal" {
  if (key.startsWith("guidelines.")) return "guidelines";
  if (key.startsWith("news.")) return "news";
  return "portal";
}

export function isCoreContentKey(key: string): boolean {
  return CORE_CONTENT_SLOTS.some((slot) => slot.key === key);
}

export interface ResolvedPublicBlock {
  key: string;
  title: string;
  body: string;
  updatedAt: Date | null;
}

export function resolveGuidelinesBlocks(
  dbBlocks: readonly ContentBlockRecord[],
): ResolvedPublicBlock[] {
  const byKey = new Map(dbBlocks.map((block) => [block.key, block]));
  const result: ResolvedPublicBlock[] = [];

  for (const slot of CORE_CONTENT_SLOTS) {
    if (slot.section !== "guidelines") continue;
    const saved = byKey.get(slot.key);
    if (saved) {
      if (!saved.isPublished) continue;
      result.push({
        key: saved.key,
        title: saved.title?.trim() || slot.defaultTitle,
        body: saved.body,
        updatedAt: saved.updatedAt ?? null,
      });
    } else {
      result.push({
        key: slot.key,
        title: slot.defaultTitle,
        body: slot.defaultBody,
        updatedAt: null,
      });
    }
  }

  for (const block of dbBlocks) {
    if (
      block.key.startsWith("guidelines.") &&
      !isCoreContentKey(block.key) &&
      block.isPublished
    ) {
      result.push({
        key: block.key,
        title: block.title?.trim() || "Additional guideline",
        body: block.body,
        updatedAt: block.updatedAt ?? null,
      });
    }
  }

  return result;
}

export function getPublishedNewsAnnouncements(
  dbBlocks: readonly ContentBlockRecord[],
): ResolvedPublicBlock[] {
  return dbBlocks
    .filter((block) => block.key.startsWith("news.") && block.isPublished)
    .sort((a, b) => {
      if (a.key === "news.banner" && b.key !== "news.banner") return -1;
      if (b.key === "news.banner" && a.key !== "news.banner") return 1;
      const timeA = a.updatedAt ? a.updatedAt.getTime() : 0;
      const timeB = b.updatedAt ? b.updatedAt.getTime() : 0;
      return timeB - timeA;
    })
    .map((block) => ({
      key: block.key,
      title: block.title?.trim() || "CEDA Announcement",
      body: block.body,
      updatedAt: block.updatedAt ?? null,
    }));
}

export function getDocumentDownloadPath(documentId: string): string {
  return `/api/documents/${encodeURIComponent(documentId)}`;
}
