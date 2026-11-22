import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  awards,
  categories,
  ideaStageHistory,
  ideaSubscriptions,
  ideaVersions,
  ideas,
  innovationCalls,
  notificationPreferences,
  workflowStages,
} from "@/db/schema";
import type { PortalRole } from "@/lib/authorization";
import { normalizeReferenceInput } from "@/lib/track-pipeline";

const OVERSIGHT_ROLES: readonly PortalRole[] = [
  "admin",
  "committee_member",
  "adjudicator",
  "evaluator",
];

export function canAccessTrackedIdea(
  idea: { submitterId: string; status: string },
  userId: string,
  roles: readonly PortalRole[],
): boolean {
  if (idea.submitterId === userId) return true;
  const hasOversight = roles.some((role) => OVERSIGHT_ROLES.includes(role));
  return hasOversight && idea.status !== "draft" && idea.status !== "withdrawn";
}

export async function lookupTrackedSubmission(
  rawReferenceNo: string,
  userId: string,
  roles: readonly PortalRole[],
) {
  const referenceNo = normalizeReferenceInput(rawReferenceNo);
  if (!referenceNo) return null;

  const [idea] = await db
    .select({
      id: ideas.id,
      referenceNo: ideas.referenceNo,
      submitterId: ideas.submitterId,
      status: ideas.status,
      submittedAt: ideas.submittedAt,
      createdAt: ideas.createdAt,
      updatedAt: ideas.updatedAt,
      callTitle: innovationCalls.title,
      categoryName: categories.name,
      title: ideaVersions.title,
      versionNo: ideaVersions.versionNo,
      stageName: workflowStages.name,
      stageType: workflowStages.type,
    })
    .from(ideas)
    .innerJoin(innovationCalls, eq(ideas.callId, innovationCalls.id))
    .leftJoin(ideaVersions, eq(ideas.currentVersionId, ideaVersions.id))
    .leftJoin(workflowStages, eq(ideas.currentStageId, workflowStages.id))
    .leftJoin(categories, eq(ideas.categoryId, categories.id))
    .where(eq(ideas.referenceNo, referenceNo))
    .limit(1);

  if (!idea || !canAccessTrackedIdea(idea, userId, roles)) {
    return null;
  }

  const [history, subscriptionRows, ideaAwards] = await Promise.all([
    db
      .select({
        id: ideaStageHistory.id,
        status: ideaStageHistory.toStatus,
        stageName: workflowStages.name,
        createdAt: ideaStageHistory.createdAt,
      })
      .from(ideaStageHistory)
      .leftJoin(workflowStages, eq(ideaStageHistory.toStageId, workflowStages.id))
      .where(eq(ideaStageHistory.ideaId, idea.id))
      .orderBy(asc(ideaStageHistory.createdAt)),
    db
      .select({ userId: ideaSubscriptions.userId })
      .from(ideaSubscriptions)
      .where(
        and(
          eq(ideaSubscriptions.ideaId, idea.id),
          eq(ideaSubscriptions.userId, userId),
        ),
      )
      .limit(1),
    db
      .select({
        id: awards.id,
        title: awards.title,
        tier: awards.tier,
        description: awards.description,
        awardedAt: awards.awardedAt,
      })
      .from(awards)
      .where(eq(awards.ideaId, idea.id))
      .orderBy(asc(awards.awardedAt)),
  ]);

  return {
    ...idea,
    isOwner: idea.submitterId === userId,
    isFollowing: subscriptionRows.length > 0,
    history,
    awards: ideaAwards,
  };
}

export async function getTrackableUserSubmissions(userId: string) {
  return db
    .select({
      id: ideas.id,
      referenceNo: ideas.referenceNo,
      status: ideas.status,
      updatedAt: ideas.updatedAt,
      title: ideaVersions.title,
      callTitle: innovationCalls.title,
      stageName: workflowStages.name,
    })
    .from(ideas)
    .innerJoin(innovationCalls, eq(ideas.callId, innovationCalls.id))
    .leftJoin(ideaVersions, eq(ideas.currentVersionId, ideaVersions.id))
    .leftJoin(workflowStages, eq(ideas.currentStageId, workflowStages.id))
    .where(eq(ideas.submitterId, userId))
    .orderBy(desc(ideas.updatedAt))
    .limit(12);
}

export async function getUserAlertChannelSummary(userId: string) {
  const rows = await db
    .select({
      channel: notificationPreferences.channel,
      enabled: notificationPreferences.enabled,
    })
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId));

  return {
    inApp: rows.find((row) => row.channel === "in_app")?.enabled ?? true,
    email: rows.find((row) => row.channel === "email")?.enabled ?? true,
    sms: rows.find((row) => row.channel === "sms")?.enabled ?? false,
  };
}
