import "server-only";

import { and, asc, desc, eq, inArray, isNotNull, ne, or } from "drizzle-orm";
import { db } from "@/db";
import { attachments, categories, criteria, evaluations, evaluatorAssignments, feedback, formFields, ideaVersions, ideas, innovationCalls, user, workflowStages } from "@/db/schema";
import { findSimilarIdeasForReview } from "@/lib/server/idea-similarity";

export async function getAvailableEvaluatorIdeas(evaluatorId: string) {
  const submissions = await db.select({
    ideaId: ideas.id,
    stageId: workflowStages.id,
    versionId: ideaVersions.id,
    referenceNo: ideas.referenceNo,
    status: ideas.status,
    title: ideaVersions.title,
    summary: ideaVersions.summary,
    callTitle: innovationCalls.title,
    stageName: workflowStages.name,
    categoryName: categories.name,
  })
    .from(ideas)
    .innerJoin(ideaVersions, eq(ideas.currentVersionId, ideaVersions.id))
    .innerJoin(innovationCalls, eq(ideas.callId, innovationCalls.id))
    .innerJoin(workflowStages, eq(ideas.currentStageId, workflowStages.id))
    .leftJoin(categories, eq(ideas.categoryId, categories.id))
    .where(and(
      inArray(ideas.status, ["submitted", "in_review"]),
      eq(workflowStages.type, "evaluation"),
      ne(ideas.submitterId, evaluatorId),
    ))
    .orderBy(desc(ideas.submittedAt)).limit(200);
  if (!submissions.length) return [];

  const ideaIds = [...new Set(submissions.map(({ ideaId }) => ideaId))];
  const versionIds = [...new Set(submissions.map(({ versionId }) => versionId))];
  const [activeAssignments, completedEvaluations] = await Promise.all([
    db.select({ ideaId: evaluatorAssignments.ideaId, stageId: evaluatorAssignments.stageId })
      .from(evaluatorAssignments)
      .where(and(
        inArray(evaluatorAssignments.ideaId, ideaIds),
        inArray(evaluatorAssignments.status, ["pending", "in_progress"]),
      )),
    db.select({ ideaId: evaluatorAssignments.ideaId, stageId: evaluatorAssignments.stageId })
      .from(evaluations)
      .innerJoin(evaluatorAssignments, eq(evaluations.assignmentId, evaluatorAssignments.id))
      .where(and(inArray(evaluations.ideaVersionId, versionIds), isNotNull(evaluations.submittedAt))),
  ]);
  const occupied = new Set([
    ...activeAssignments.map(({ ideaId, stageId }) => `${ideaId}:${stageId}`),
    ...completedEvaluations.map(({ ideaId, stageId }) => `${ideaId}:${stageId}`),
  ]);
  return submissions.filter(({ ideaId, stageId }) => !occupied.has(`${ideaId}:${stageId}`));
}

export async function getEvaluatorAssignments(evaluatorId: string) {
  return db.select({
    id: evaluatorAssignments.id,
    status: evaluatorAssignments.status,
    dueAt: evaluatorAssignments.dueAt,
    ideaId: ideas.id,
    referenceNo: ideas.referenceNo,
    ideaStatus: ideas.status,
    title: ideaVersions.title,
    summary: ideaVersions.summary,
    callTitle: innovationCalls.title,
    stageName: workflowStages.name,
  })
    .from(evaluatorAssignments)
    .innerJoin(ideas, eq(evaluatorAssignments.ideaId, ideas.id))
    .innerJoin(ideaVersions, eq(ideas.currentVersionId, ideaVersions.id))
    .innerJoin(innovationCalls, eq(ideas.callId, innovationCalls.id))
    .innerJoin(workflowStages, eq(evaluatorAssignments.stageId, workflowStages.id))
    .where(and(
      eq(evaluatorAssignments.evaluatorId, evaluatorId),
      inArray(evaluatorAssignments.status, ["pending", "in_progress", "submitted"]),
      or(eq(ideas.currentStageId, evaluatorAssignments.stageId), eq(evaluatorAssignments.status, "submitted")),
    ))
    .orderBy(asc(evaluatorAssignments.status), asc(evaluatorAssignments.dueAt));
}

export async function getEvaluatorAssignment(assignmentId: string, evaluatorId: string) {
  const [assignment] = await db.select({
    id: evaluatorAssignments.id,
    status: evaluatorAssignments.status,
    ideaId: ideas.id,
    referenceNo: ideas.referenceNo,
    ideaStatus: ideas.status,
    currentVersionId: ideaVersions.id,
    versionNo: ideaVersions.versionNo,
    title: ideaVersions.title,
    summary: ideaVersions.summary,
    answers: ideaVersions.answers,
    categoryName: categories.name,
    callId: innovationCalls.id,
    callTitle: innovationCalls.title,
    stageId: workflowStages.id,
    stageName: workflowStages.name,
  })
    .from(evaluatorAssignments)
    .innerJoin(ideas, eq(evaluatorAssignments.ideaId, ideas.id))
    .innerJoin(ideaVersions, eq(ideas.currentVersionId, ideaVersions.id))
    .innerJoin(innovationCalls, eq(ideas.callId, innovationCalls.id))
    .leftJoin(categories, eq(ideas.categoryId, categories.id))
    .innerJoin(workflowStages, eq(evaluatorAssignments.stageId, workflowStages.id))
    .where(and(
      eq(evaluatorAssignments.id, assignmentId),
      eq(evaluatorAssignments.evaluatorId, evaluatorId),
      or(
        eq(evaluatorAssignments.status, "submitted"),
        and(inArray(evaluatorAssignments.status, ["pending", "in_progress"]), eq(ideas.currentStageId, evaluatorAssignments.stageId), eq(ideas.status, "in_review")),
      ),
    ))
    .limit(1);
  if (!assignment) return null;

  const scoringCriteria = await db.select({
    id: criteria.id,
    name: criteria.name,
    description: criteria.description,
    maxScore: criteria.maxScore,
    weight: criteria.weight,
  })
    .from(criteria)
    .where(and(eq(criteria.stageId, assignment.stageId), eq(criteria.isArchived, false)))
    .orderBy(asc(criteria.position));

  const internalNotes = await db.select({ id: feedback.id, body: feedback.body, authorName: user.name, createdAt: feedback.createdAt })
    .from(feedback)
    .innerJoin(user, eq(feedback.authorId, user.id))
    .where(and(
      eq(feedback.ideaId, assignment.ideaId),
      eq(feedback.ideaVersionId, assignment.currentVersionId),
      eq(feedback.stageId, assignment.stageId),
      eq(feedback.isInternal, true),
    ))
    .orderBy(asc(feedback.createdAt));

  const [submissionFields, submissionAttachments, similarIdeas] = await Promise.all([
    db.select({ key: formFields.key, label: formFields.label, helpText: formFields.helpText, sectionKey: formFields.sectionKey, position: formFields.position })
      .from(formFields).where(eq(formFields.callId, assignment.callId)).orderBy(asc(formFields.sectionPosition), asc(formFields.position)),
    db.select({ id: attachments.id, fileName: attachments.fileName, mimeType: attachments.mimeType, fileSize: attachments.fileSize })
      .from(attachments).where(eq(attachments.ideaVersionId, assignment.currentVersionId)).orderBy(asc(attachments.createdAt)),
    findSimilarIdeasForReview(assignment.ideaId),
  ]);

  return { assignment, criteria: scoringCriteria, internalNotes, submissionFields, submissionAttachments, similarIdeas };
}
