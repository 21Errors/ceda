import { asc, count, countDistinct, desc, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/db";
import {
  auditLogs,
  awards,
  categories,
  chatConversations,
  contentBlocks,
  documents,
  evaluatorAssignments,
  faqs,
  formFields,
  ideas,
  innovationCalls,
  roles,
  user,
  userRoles,
  workflowStages,
} from "@/db/schema";

export type CallStatus = (typeof innovationCalls.$inferSelect)["status"];

export interface AdminCallSummary {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: CallStatus;
  opensAt: Date | null;
  closesAt: Date | null;
  deadlineHint: string | null;
  submissionsTotal: number;
  submissionsInPipeline: number;
  stageCount: number;
  fieldCount: number;
}

export interface AdminAuditItem {
  id: string;
  action: string;
  entityType: string;
  actorName: string | null;
  createdAt: Date;
}

export interface AdminPipelineBreakdown {
  drafts: number;
  submitted: number;
  inReview: number;
  changesRequested: number;
  approved: number;
  awarded: number;
}

export interface AdminOverviewData {
  calls: AdminCallSummary[];
  openCallsCount: number;
  draftCallsCount: number;
  totalSubmissions: number;
  activePipelineCount: number;
  changesRequestedCount: number;
  pipelineBreakdown: AdminPipelineBreakdown;
  pendingReviewsCount: number;
  totalUsersCount: number;
  staffUsersCount: number;
  awardsCount: number;
  activeCategoriesCount: number;
  publishedFaqsCount: number;
  publishedDocumentsCount: number;
  publishedPagesCount: number;
  openChatsCount: number;
  recentAudit: AdminAuditItem[];
}

function formatDeadlineHint(
  closesAt: Date | null,
  status: CallStatus,
  nowMs: number,
): string | null {
  if (!closesAt || status !== "open") return null;
  const diffDays = Math.ceil((closesAt.getTime() - nowMs) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "Past closing date";
  if (diffDays === 0) return "Closes today";
  if (diffDays === 1) return "Closes tomorrow";
  if (diffDays <= 14) return `${diffDays} days left`;
  return null;
}

export async function loadAdminOverviewData(): Promise<AdminOverviewData> {
  const [
    rawCalls,
    ideaCountsByCallAndStatus,
    activeFieldCountsByCall,
    stageCountsByCall,
    pendingAssignmentRow,
    totalUsersRow,
    staffUsersRow,
    awardsRow,
    activeCategoriesRow,
    publishedFaqsRow,
    publishedDocumentsRow,
    publishedPagesRow,
    openChatsRow,
    recentAudit,
  ] = await Promise.all([
    db
      .select({
        id: innovationCalls.id,
        title: innovationCalls.title,
        slug: innovationCalls.slug,
        description: innovationCalls.description,
        status: innovationCalls.status,
        opensAt: innovationCalls.opensAt,
        closesAt: innovationCalls.closesAt,
      })
      .from(innovationCalls)
      .orderBy(asc(innovationCalls.createdAt)),
    db
      .select({
        callId: ideas.callId,
        status: ideas.status,
        total: count(),
      })
      .from(ideas)
      .groupBy(ideas.callId, ideas.status),
    db
      .select({
        callId: formFields.callId,
        total: count(),
      })
      .from(formFields)
      .where(eq(formFields.isActive, true))
      .groupBy(formFields.callId),
    db
      .select({
        callId: workflowStages.callId,
        total: count(),
      })
      .from(workflowStages)
      .groupBy(workflowStages.callId),
    db
      .select({ total: count() })
      .from(evaluatorAssignments)
      .where(inArray(evaluatorAssignments.status, ["pending", "in_progress"])),
    db.select({ total: count() }).from(user),
    db
      .select({ total: countDistinct(userRoles.userId) })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(ne(roles.key, "submitter")),
    db.select({ total: count() }).from(awards),
    db
      .select({ total: count() })
      .from(categories)
      .where(eq(categories.isActive, true)),
    db.select({ total: count() }).from(faqs).where(eq(faqs.isPublished, true)),
    db
      .select({ total: count() })
      .from(documents)
      .where(eq(documents.isPublished, true)),
    db
      .select({ total: count() })
      .from(contentBlocks)
      .where(eq(contentBlocks.isPublished, true)),
    db
      .select({ total: count() })
      .from(chatConversations)
      .where(inArray(chatConversations.status, ["waiting", "active"])),
    db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        actorName: user.name,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(user, eq(auditLogs.actorId, user.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(5),
  ]);

  const nowMs = Date.now();
  const submissionsByCall = new Map<string, { total: number; inPipeline: number }>();
  let totalSubmissions = 0;
  let activePipelineCount = 0;
  const pipelineBreakdown: AdminPipelineBreakdown = {
    drafts: 0,
    submitted: 0,
    inReview: 0,
    changesRequested: 0,
    approved: 0,
    awarded: 0,
  };

  for (const row of ideaCountsByCallAndStatus) {
    const qty = Number(row.total);
    totalSubmissions += qty;

    if (row.status === "draft") pipelineBreakdown.drafts += qty;
    else if (row.status === "submitted") pipelineBreakdown.submitted += qty;
    else if (row.status === "in_review") pipelineBreakdown.inReview += qty;
    else if (row.status === "changes_requested") pipelineBreakdown.changesRequested += qty;
    else if (row.status === "approved") pipelineBreakdown.approved += qty;
    else if (row.status === "awarded") pipelineBreakdown.awarded += qty;

    const isPipeline =
      row.status === "submitted" ||
      row.status === "in_review" ||
      row.status === "changes_requested";

    if (isPipeline) activePipelineCount += qty;

    const current = submissionsByCall.get(row.callId) ?? { total: 0, inPipeline: 0 };
    current.total += qty;
    if (isPipeline) current.inPipeline += qty;
    submissionsByCall.set(row.callId, current);
  }

  const changesRequestedCount = pipelineBreakdown.changesRequested;

  const fieldsByCall = new Map(
    activeFieldCountsByCall.map((row) => [row.callId, Number(row.total)]),
  );
  const stagesByCall = new Map(
    stageCountsByCall.map((row) => [row.callId, Number(row.total)]),
  );

  const calls: AdminCallSummary[] = rawCalls.map((call) => {
    const subStats = submissionsByCall.get(call.id) ?? { total: 0, inPipeline: 0 };
    return {
      ...call,
      deadlineHint: formatDeadlineHint(call.closesAt, call.status, nowMs),
      submissionsTotal: subStats.total,
      submissionsInPipeline: subStats.inPipeline,
      stageCount: stagesByCall.get(call.id) ?? 0,
      fieldCount: fieldsByCall.get(call.id) ?? 0,
    };
  });

  return {
    calls,
    openCallsCount: calls.filter((call) => call.status === "open").length,
    draftCallsCount: calls.filter((call) => call.status === "draft").length,
    totalSubmissions,
    activePipelineCount,
    changesRequestedCount,
    pipelineBreakdown,
    pendingReviewsCount: Number(pendingAssignmentRow[0]?.total ?? 0),
    totalUsersCount: Number(totalUsersRow[0]?.total ?? 0),
    staffUsersCount: Number(staffUsersRow[0]?.total ?? 0),
    awardsCount: Number(awardsRow[0]?.total ?? 0),
    activeCategoriesCount: Number(activeCategoriesRow[0]?.total ?? 0),
    publishedFaqsCount: Number(publishedFaqsRow[0]?.total ?? 0),
    publishedDocumentsCount: Number(publishedDocumentsRow[0]?.total ?? 0),
    publishedPagesCount: Number(publishedPagesRow[0]?.total ?? 0),
    openChatsCount: Number(openChatsRow[0]?.total ?? 0),
    recentAudit,
  };
}
