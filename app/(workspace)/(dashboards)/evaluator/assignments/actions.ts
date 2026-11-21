"use server";

import { and, asc, eq, gt, inArray, isNotNull, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { evaluationScores, evaluations, evaluatorAssignments, feedback, ideaStageHistory, ideas, workflowStages } from "@/db/schema";
import { requireRole } from "@/lib/authorization";
import { getEvaluatorAssignment } from "@/lib/server/evaluator-workspace";
import { writeAudit } from "@/lib/server/audit";
import { notifyIdeaFollowers } from "@/lib/server/idea-alerts";
import { dispatchNotificationEmails, getUsersWithRole, insertInAppNotifications } from "@/lib/server/notifications";

export type EvaluationState = { error?: string; totalScore?: string };
export type InternalNoteState = { error?: string; success?: string };
const uuidPattern = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

export async function claimEvaluation(formData: FormData) {
  const evaluator = await requireRole("evaluator", "/evaluator");
  const ideaId = String(formData.get("ideaId") ?? "");
  if (!uuidPattern.test(ideaId)) redirect("/evaluator?error=unavailable");
  const assignmentId = await db.transaction(async (tx) => {
    const [idea] = await tx.select({ id: ideas.id, submitterId: ideas.submitterId, currentStageId: ideas.currentStageId, currentVersionId: ideas.currentVersionId, status: ideas.status, referenceNo: ideas.referenceNo })
      .from(ideas).where(eq(ideas.id, ideaId)).for("update").limit(1);
    if (!idea || idea.submitterId === evaluator.id || !idea.currentStageId || !idea.currentVersionId || !["submitted", "in_review"].includes(idea.status)) return null;
    const [stage] = await tx.select({ id: workflowStages.id, type: workflowStages.type }).from(workflowStages).where(eq(workflowStages.id, idea.currentStageId!)).limit(1);
    if (!stage || stage.type !== "evaluation") return null;
    const [active] = await tx.select({ id: evaluatorAssignments.id }).from(evaluatorAssignments)
      .where(and(eq(evaluatorAssignments.ideaId, idea.id), eq(evaluatorAssignments.stageId, stage.id), inArray(evaluatorAssignments.status, ["pending", "in_progress"]))).limit(1);
    if (active) return null;
    const [completed] = await tx.select({ id: evaluations.id }).from(evaluations)
      .innerJoin(evaluatorAssignments, eq(evaluations.assignmentId, evaluatorAssignments.id))
      .where(and(eq(evaluatorAssignments.ideaId, idea.id), eq(evaluatorAssignments.stageId, stage.id), eq(evaluations.ideaVersionId, idea.currentVersionId), isNotNull(evaluations.submittedAt))).limit(1);
    if (completed) return null;
    const [existing] = await tx.select({ id: evaluatorAssignments.id }).from(evaluatorAssignments)
      .where(and(eq(evaluatorAssignments.ideaId, idea.id), eq(evaluatorAssignments.stageId, stage.id), eq(evaluatorAssignments.evaluatorId, evaluator.id))).limit(1);
    let id = existing?.id;
    if (id) await tx.update(evaluatorAssignments).set({ status: "in_progress", assignedBy: null }).where(eq(evaluatorAssignments.id, id));
    else {
      const [created] = await tx.insert(evaluatorAssignments).values({ ideaId: idea.id, stageId: stage.id, evaluatorId: evaluator.id, status: "in_progress" }).returning({ id: evaluatorAssignments.id });
      id = created?.id;
    }
    if (!id) return null;
    await tx.update(ideas).set({ status: "in_review" }).where(eq(ideas.id, idea.id));
    await tx.insert(ideaStageHistory).values({ ideaId: idea.id, fromStageId: stage.id, toStageId: stage.id, toStatus: "in_review", actorId: evaluator.id, note: "An evaluator claimed this submission for review." });
    await writeAudit(tx, { actorId: evaluator.id, action: "evaluation.claimed", entityType: "idea", entityId: idea.id, metadata: { stageId: stage.id, referenceNo: idea.referenceNo } });
    const event = { userId: idea.submitterId, ideaId: idea.id, type: "evaluation_started", title: "Your submission is being reviewed", body: `An evaluator has claimed submission ${idea.referenceNo}.` };
    await insertInAppNotifications(tx, [event]);
    return { id, event };
  });
  if (!assignmentId) redirect("/evaluator?error=claimed");
  await dispatchNotificationEmails([assignmentId.event]);
  revalidatePath("/evaluator");
  redirect(`/evaluator/assignments/${assignmentId.id}`);
}

export async function addEvaluatorInternalNote(_previous: InternalNoteState, formData: FormData): Promise<InternalNoteState> {
  const evaluator = await requireRole("evaluator", "/evaluator");
  const assignmentId = String(formData.get("assignmentId") ?? "");
  const versionId = String(formData.get("versionId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!uuidPattern.test(assignmentId)) return { error: "This assignment is unavailable." };
  const result = await getEvaluatorAssignment(assignmentId, evaluator.id);
  if (!result || result.assignment.currentVersionId !== versionId || result.assignment.status === "submitted") {
    return { error: "This review is no longer open for private notes." };
  }
  if (body.length < 3 || body.length > 5000) return { error: "Write between 3 and 5,000 characters." };

  await db.transaction(async (tx) => {
    await tx.insert(feedback).values({
      ideaId: result.assignment.ideaId,
      ideaVersionId: result.assignment.currentVersionId,
      stageId: result.assignment.stageId,
      authorId: evaluator.id,
      body,
      isInternal: true,
    });
    await writeAudit(tx, {
      actorId: evaluator.id,
      action: "evaluation.internal_note_added",
      entityType: "idea",
      entityId: result.assignment.ideaId,
      metadata: { versionId: result.assignment.currentVersionId, stageId: result.assignment.stageId },
    });
  });

  revalidatePath(`/evaluator/assignments/${assignmentId}`);
  return { success: "Private note saved for this review version." };
}

export async function submitEvaluation(_previous: EvaluationState, formData: FormData): Promise<EvaluationState> {
  const evaluator = await requireRole("evaluator", "/evaluator");
  const assignmentId = String(formData.get("assignmentId") ?? "");
  if (!uuidPattern.test(assignmentId)) return { error: "This assignment is unavailable." };
  const result = await getEvaluatorAssignment(assignmentId, evaluator.id);
  if (!result) return { error: "This assignment is unavailable." };
  if (result.assignment.status === "submitted") return { error: "This review has already been submitted." };
  if (String(formData.get("versionId") ?? "") !== result.assignment.currentVersionId) return { error: "The submission changed while you were reviewing it. Reload and review the latest version." };
  if (!result.criteria.length) return { error: "This stage has no active scoring criteria. Contact a portal administrator." };

  const scores: { criterionId: string; score: number; comment: string | null }[] = [];
  const fieldErrors: string[] = [];
  let weightedTotal = 0;
  let totalWeight = 0;
  for (const criterion of result.criteria) {
    const rawScore = formData.get(`score:${criterion.id}`);
    const score = typeof rawScore === "string" ? Number(rawScore) : Number.NaN;
    const commentValue = formData.get(`comment:${criterion.id}`);
    const comment = typeof commentValue === "string" ? commentValue.trim() : "";
    if (!Number.isFinite(score) || score < 0 || score > criterion.maxScore) {
      fieldErrors.push(`${criterion.name}: enter a score from 0 to ${criterion.maxScore}.`);
      continue;
    }
    if (comment.length > 2000) {
      fieldErrors.push(`${criterion.name}: keep comments under 2,000 characters.`);
      continue;
    }
    const weight = Number(criterion.weight);
    weightedTotal += (score / criterion.maxScore) * weight;
    totalWeight += weight;
    scores.push({ criterionId: criterion.id, score, comment: comment || null });
  }
  if (fieldErrors.length) return { error: fieldErrors.join(" ") };
  const overallCommentValue = formData.get("overallComment");
  const overallComment = typeof overallCommentValue === "string" ? overallCommentValue.trim() : "";
  if (overallComment.length > 5000) return { error: "Keep the overall review comment under 5,000 characters." };
  const totalScore = totalWeight ? (weightedTotal / totalWeight) * 100 : 0;
  const now = new Date();
  const { assignment } = result;
  const emailEvents: { userId: string; ideaId: string; type: string; title: string; body: string }[] = [];

  await db.transaction(async (tx) => {
    const [savedEvaluation] = await tx.insert(evaluations).values({
      assignmentId: assignment.id,
      ideaVersionId: assignment.currentVersionId,
      overallComment: overallComment || null,
      totalScore: totalScore.toFixed(2),
      submittedAt: now,
    }).returning({ id: evaluations.id });
    if (!savedEvaluation) throw new Error("The evaluation could not be saved.");

    await tx.insert(evaluationScores).values(scores.map((score) => ({ ...score, evaluationId: savedEvaluation.id, score: score.score.toFixed(2) })));
    await tx.update(evaluatorAssignments).set({ status: "submitted" }).where(eq(evaluatorAssignments.id, assignment.id));

    const [idea] = await tx.select({ id: ideas.id, callId: ideas.callId, submitterId: ideas.submitterId, currentStageId: ideas.currentStageId })
      .from(ideas).where(eq(ideas.id, assignment.ideaId)).limit(1);
    if (!idea) throw new Error("The assigned submission no longer exists.");
    const remaining = await tx.select({ id: evaluatorAssignments.id }).from(evaluatorAssignments)
      .where(and(eq(evaluatorAssignments.ideaId, idea.id), eq(evaluatorAssignments.stageId, assignment.stageId), ne(evaluatorAssignments.status, "submitted")));

    if (!remaining.length && idea.currentStageId === assignment.stageId) {
      const [currentStage] = await tx.select({ position: workflowStages.position }).from(workflowStages)
        .where(eq(workflowStages.id, assignment.stageId)).limit(1);
      if (currentStage) {
        const [nextStage] = await tx.select({ id: workflowStages.id, name: workflowStages.name, type: workflowStages.type }).from(workflowStages)
          .where(and(eq(workflowStages.callId, idea.callId), gt(workflowStages.position, currentStage.position)))
          .orderBy(asc(workflowStages.position)).limit(1);
        if (nextStage) {
          await tx.update(ideas).set({ currentStageId: nextStage.id }).where(eq(ideas.id, idea.id));
          await tx.insert(ideaStageHistory).values({
            ideaId: idea.id,
            fromStageId: assignment.stageId,
            toStageId: nextStage.id,
            toStatus: "in_review",
            actorId: evaluator.id,
            note: `Evaluation completed. Moved to ${nextStage.name}.`,
          });
          const stageEvent = {
            userId: idea.submitterId,
            ideaId: idea.id,
            type: "status_changed",
            title: "Review stage completed",
            body: `Your submission ${assignment.referenceNo} has moved to ${nextStage.name}.`,
          };
          emailEvents.push(stageEvent);
          await insertInAppNotifications(tx, [stageEvent]);
          const nextRole = nextStage.type === "evaluation" ? "evaluator" : nextStage.type === "adjudication" ? "adjudicator" : null;
          if (nextRole) {
            const staff = await getUsersWithRole(tx, nextRole);
            const queueEvents = staff.filter(({ id }) => id !== idea.submitterId).map(({ id }) => ({ userId: id, ideaId: idea.id, type: nextRole === "evaluator" ? "evaluation_available" : "adjudication_available", title: nextRole === "evaluator" ? "Submission available to review" : "Submission ready for adjudication", body: `Submission ${assignment.referenceNo} has reached ${nextStage.name}.` }));
            emailEvents.push(...queueEvents);
            await insertInAppNotifications(tx, queueEvents);
          }
          await notifyIdeaFollowers(tx, {
            ideaId: idea.id,
            actorId: evaluator.id,
            excludeUserIds: [idea.submitterId],
            type: "status_changed",
            title: "Review stage completed",
            body: `Submission ${assignment.referenceNo} has moved to ${nextStage.name}.`,
          });
        }
      }
    }

    const completedEvent = {
      userId: idea.submitterId,
      ideaId: idea.id,
      type: "evaluation_completed",
      title: "An evaluator completed a review",
      body: `A review has been completed for submission ${assignment.referenceNo}.`,
    };
    emailEvents.push(completedEvent);
    await insertInAppNotifications(tx, [completedEvent]);
    await writeAudit(tx, {
      actorId: evaluator.id,
      action: "evaluation.submitted",
      entityType: "evaluation",
      entityId: savedEvaluation.id,
      metadata: { ideaId: idea.id, versionId: assignment.currentVersionId, stageId: assignment.stageId, scoreCount: scores.length, totalScore: totalScore.toFixed(2) },
    });
  });
  await dispatchNotificationEmails(emailEvents);

  revalidatePath("/evaluator");
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/submissions/${assignment.ideaId}`);
  return { totalScore: totalScore.toFixed(2) };
}
