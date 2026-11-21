"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { adjudications, feedback, ideaStageHistory, ideas, workflowStages } from "@/db/schema";
import { requireRole } from "@/lib/authorization";
import { writeAudit } from "@/lib/server/audit";
import { notifyIdeaFollowers } from "@/lib/server/idea-alerts";
import { dispatchNotificationEmails, insertInAppNotifications } from "@/lib/server/notifications";

const uuidPattern = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

export async function decideSubmission(formData: FormData) {
  const adjudicator = await requireRole("adjudicator", "/adjudicator");
  const ideaId = String(formData.get("ideaId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const rationale = String(formData.get("rationale") ?? "").trim();
  const allowed = ["approved", "rejected", "needs_revision"] as const;
  if (!uuidPattern.test(ideaId) || !allowed.includes(decision as (typeof allowed)[number])) redirect("/adjudicator?error=invalid");
  if (rationale.length < 20 || rationale.length > 5000) redirect("/adjudicator?error=rationale");

  const [idea] = await db.select({
    id: ideas.id,
    referenceNo: ideas.referenceNo,
    callId: ideas.callId,
    submitterId: ideas.submitterId,
    currentStageId: ideas.currentStageId,
    currentVersionId: ideas.currentVersionId,
    status: ideas.status,
  }).from(ideas).where(eq(ideas.id, ideaId)).limit(1);
  if (!idea || !idea.currentStageId || !idea.currentVersionId || idea.status !== "in_review") redirect("/adjudicator?error=invalid");
  const [currentStage] = await db.select({ id: workflowStages.id, type: workflowStages.type })
    .from(workflowStages).where(and(eq(workflowStages.id, idea.currentStageId), eq(workflowStages.callId, idea.callId))).limit(1);
  if (!currentStage || currentStage.type !== "adjudication") redirect("/adjudicator?error=invalid");
  const [existingDecision] = await db.select({ id: adjudications.id }).from(adjudications)
    .where(and(eq(adjudications.ideaId, idea.id), eq(adjudications.ideaVersionId, idea.currentVersionId))).limit(1);
  if (existingDecision) redirect("/adjudicator?error=decided");

  const decisionValue = decision as (typeof allowed)[number];
  const targetType = decisionValue === "approved" ? "decision" : decisionValue === "needs_revision" ? "feedback" : null;
  const [targetStage] = targetType ? await db.select({ id: workflowStages.id, name: workflowStages.name }).from(workflowStages)
    .where(and(eq(workflowStages.callId, idea.callId), eq(workflowStages.type, targetType))).limit(1) : [];
  const nextStageId = targetStage?.id ?? currentStage.id;
  const newStatus = decisionValue === "approved" ? "approved" : decisionValue === "rejected" ? "rejected" : "changes_requested";
  const notificationEvent = {
    userId: idea.submitterId,
    ideaId: idea.id,
    type: decisionValue === "needs_revision" ? "changes_requested" : "decision_recorded",
    title: decisionValue === "needs_revision" ? "Changes requested" : `Decision: ${decisionValue}`,
    body: decisionValue === "needs_revision"
      ? `The adjudication team requested changes to ${idea.referenceNo}. Review the feedback and submit a new version.`
      : `A decision has been recorded for submission ${idea.referenceNo}.`,
  };

  await db.transaction(async (tx) => {
    await tx.insert(adjudications).values({
      ideaId: idea.id,
      stageId: currentStage.id,
      ideaVersionId: idea.currentVersionId,
      adjudicatorId: adjudicator.id,
      decision: decisionValue,
      rationale,
    });
    if (decisionValue === "needs_revision") {
      await tx.insert(feedback).values({
        ideaId: idea.id,
        ideaVersionId: idea.currentVersionId,
        stageId: currentStage.id,
        authorId: adjudicator.id,
        body: rationale,
        requiresResponse: true,
        isInternal: false,
      });
    }
    await tx.update(ideas).set({ status: newStatus, currentStageId: nextStageId }).where(eq(ideas.id, idea.id));
    await tx.insert(ideaStageHistory).values({
      ideaId: idea.id,
      fromStageId: currentStage.id,
      toStageId: nextStageId,
      toStatus: newStatus,
      actorId: adjudicator.id,
      note: rationale,
    });
    await insertInAppNotifications(tx, [notificationEvent]);
    await notifyIdeaFollowers(tx, {
      ideaId: idea.id,
      actorId: adjudicator.id,
      excludeUserIds: [idea.submitterId],
      type: decisionValue === "needs_revision" ? "changes_requested" : "decision_recorded",
      title: decisionValue === "needs_revision" ? "Changes requested" : `Decision: ${decisionValue}`,
      body: `A decision has been recorded for submission ${idea.referenceNo}.`,
    });
    await writeAudit(tx, {
      actorId: adjudicator.id,
      action: "adjudication.decided",
      entityType: "idea",
      entityId: idea.id,
      metadata: { decision: decisionValue, versionId: idea.currentVersionId, targetStageId: nextStageId },
    });
  });
  await dispatchNotificationEmails([notificationEvent]);

  revalidatePath("/adjudicator");
  revalidatePath("/dashboard");
}
