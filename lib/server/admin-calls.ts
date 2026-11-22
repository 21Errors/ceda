import "server-only";

import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  criteria,
  formFields,
  ideas,
  innovationCalls,
  workflowStages,
} from "@/db/schema";

export type AdminCallStatus = (typeof innovationCalls.$inferSelect)["status"];

export interface AdminCallListItem {
  id: string;
  title: string;
  description: string | null;
  status: AdminCallStatus;
  opensAtIso: string | null;
  closesAtIso: string | null;
  createdAtIso: string;
  opensAtLabel: string;
  closesAtLabel: string;
  deadlineHint: string | null;
  submissionsTotal: number;
  submissionsInPipeline: number;
  stageCount: number;
  fieldCount: number;
  criteriaCount: number;
}

const DATE_FORMATTER = new Intl.DateTimeFormat("en-BW", {
  dateStyle: "medium",
  timeZone: "Africa/Gaborone",
});

function formatDateLabel(value: Date | null): string {
  return value ? DATE_FORMATTER.format(value) : "Not set";
}

function formatDeadlineHint(
  closesAt: Date | null,
  status: AdminCallStatus,
  nowMs: number,
): string | null {
  if (!closesAt || status !== "open") return null;
  const diffDays = Math.ceil(
    (closesAt.getTime() - nowMs) / (1000 * 60 * 60 * 24),
  );
  if (diffDays < 0) return "Past closing date";
  if (diffDays === 0) return "Closes today";
  if (diffDays === 1) return "Closes tomorrow";
  if (diffDays <= 14) return `${diffDays} days left`;
  return null;
}

export async function loadAdminCallsList(): Promise<AdminCallListItem[]> {
  const [
    rawCalls,
    ideaCountsByCallAndStatus,
    activeFieldCountsByCall,
    stageCountsByCall,
    activeCriteriaCountsByCall,
  ] = await Promise.all([
    db
      .select({
        id: innovationCalls.id,
        title: innovationCalls.title,
        description: innovationCalls.description,
        status: innovationCalls.status,
        opensAt: innovationCalls.opensAt,
        closesAt: innovationCalls.closesAt,
        createdAt: innovationCalls.createdAt,
      })
      .from(innovationCalls)
      .orderBy(desc(innovationCalls.createdAt)),
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
      .select({
        callId: workflowStages.callId,
        total: count(),
      })
      .from(criteria)
      .innerJoin(workflowStages, eq(criteria.stageId, workflowStages.id))
      .where(eq(criteria.isArchived, false))
      .groupBy(workflowStages.callId),
  ]);

  const nowMs = Date.now();
  const submissionsByCall = new Map<
    string,
    { total: number; inPipeline: number }
  >();

  for (const row of ideaCountsByCallAndStatus) {
    const qty = Number(row.total);
    const isPipeline =
      row.status === "submitted" ||
      row.status === "in_review" ||
      row.status === "changes_requested";

    const current = submissionsByCall.get(row.callId) ?? {
      total: 0,
      inPipeline: 0,
    };
    current.total += qty;
    if (isPipeline) current.inPipeline += qty;
    submissionsByCall.set(row.callId, current);
  }

  const fieldsByCall = new Map(
    activeFieldCountsByCall.map((row) => [row.callId, Number(row.total)]),
  );
  const stagesByCall = new Map(
    stageCountsByCall.map((row) => [row.callId, Number(row.total)]),
  );
  const criteriaByCall = new Map(
    activeCriteriaCountsByCall.map((row) => [row.callId, Number(row.total)]),
  );

  return rawCalls.map((call) => {
    const subStats = submissionsByCall.get(call.id) ?? {
      total: 0,
      inPipeline: 0,
    };
    return {
      id: call.id,
      title: call.title,
      description: call.description,
      status: call.status,
      opensAtIso: call.opensAt?.toISOString() ?? null,
      closesAtIso: call.closesAt?.toISOString() ?? null,
      createdAtIso: call.createdAt.toISOString(),
      opensAtLabel: formatDateLabel(call.opensAt),
      closesAtLabel: formatDateLabel(call.closesAt),
      deadlineHint: formatDeadlineHint(call.closesAt, call.status, nowMs),
      submissionsTotal: subStats.total,
      submissionsInPipeline: subStats.inPipeline,
      stageCount: stagesByCall.get(call.id) ?? 0,
      fieldCount: fieldsByCall.get(call.id) ?? 0,
      criteriaCount: criteriaByCall.get(call.id) ?? 0,
    };
  });
}
