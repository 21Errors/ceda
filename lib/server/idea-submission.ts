import "server-only";

import { and, asc, desc, eq, gte, isNotNull, isNull, lte, or } from "drizzle-orm";
import { db } from "@/db";
import {
  categories,
  awards,
  criteria,
  evaluationScores,
  evaluations,
  evaluatorAssignments,
  feedback,
  formFields,
  ideaVersions,
  ideas,
  ideaStageHistory,
  innovationCalls,
  workflowStages,
  user,
} from "@/db/schema";

export async function getOpenSubmissionOptions(requestedCallId?: string) {
  const now = new Date();
  const calls = await db
    .select({
      id: innovationCalls.id,
      title: innovationCalls.title,
      description: innovationCalls.description,
      closesAt: innovationCalls.closesAt,
    })
    .from(innovationCalls)
    .where(requestedCallId ? eq(innovationCalls.id, requestedCallId) : and(
        eq(innovationCalls.status, "open"),
        or(isNull(innovationCalls.opensAt), lte(innovationCalls.opensAt, now)),
        or(isNull(innovationCalls.closesAt), gte(innovationCalls.closesAt, now)),
      ))
    .orderBy(asc(innovationCalls.closesAt));

  if (!calls.length) return null;
  const call = calls[0];
  const [fields, categoryOptions, stages] = await Promise.all([
    db
      .select({
        key: formFields.key,
        label: formFields.label,
        helpText: formFields.helpText,
        type: formFields.type,
        required: formFields.required,
        options: formFields.options,
        sectionKey: formFields.sectionKey,
        sectionPosition: formFields.sectionPosition,
        position: formFields.position,
      })
      .from(formFields)
      .where(and(eq(formFields.callId, call.id), eq(formFields.isActive, true)))
      .orderBy(asc(formFields.sectionPosition), asc(formFields.position)),
    db
      .select({ id: categories.id, name: categories.name, description: categories.description })
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.position), asc(categories.name)),
    db
      .select({ id: workflowStages.id })
      .from(workflowStages)
      .where(eq(workflowStages.callId, call.id))
      .orderBy(asc(workflowStages.position))
      .limit(1),
  ]);

  return { call, fields, categories: categoryOptions, firstStageId: stages[0]?.id ?? null };
}

export async function getSubmitterIdeas(submitterId: string) {
  return db
    .select({
      id: ideas.id,
      callId: ideas.callId,
      referenceNo: ideas.referenceNo,
      status: ideas.status,
      categoryId: ideas.categoryId,
      updatedAt: ideas.updatedAt,
      callTitle: innovationCalls.title,
      title: ideaVersions.title,
      summary: ideaVersions.summary,
    })
    .from(ideas)
    .innerJoin(innovationCalls, eq(ideas.callId, innovationCalls.id))
    .leftJoin(ideaVersions, eq(ideas.currentVersionId, ideaVersions.id))
    .where(eq(ideas.submitterId, submitterId))
    .orderBy(desc(ideas.updatedAt));
}

export async function getSubmitterDraft(ideaId: string, submitterId: string) {
  const [draft] = await db.select({
    id: ideas.id,
    callId: ideas.callId,
    categoryId: ideas.categoryId,
    currentVersionId: ideas.currentVersionId,
    status: ideas.status,
    title: ideaVersions.title,
    summary: ideaVersions.summary,
    answers: ideaVersions.answers,
    termsAcceptedAt: ideaVersions.termsAcceptedAt,
  }).from(ideas)
    .innerJoin(ideaVersions, eq(ideas.currentVersionId, ideaVersions.id))
    .where(and(eq(ideas.id, ideaId), eq(ideas.submitterId, submitterId), eq(ideas.status, "draft")))
    .limit(1);
  return draft ?? null;
}

export async function getSubmitterIdea(ideaId: string, submitterId: string) {
  const [idea] = await db
    .select({
      id: ideas.id,
      callId: ideas.callId,
      currentVersionId: ideas.currentVersionId,
      referenceNo: ideas.referenceNo,
      status: ideas.status,
      submittedAt: ideas.submittedAt,
      createdAt: ideas.createdAt,
      categoryId: ideas.categoryId,
      callTitle: innovationCalls.title,
      versionNo: ideaVersions.versionNo,
      title: ideaVersions.title,
      summary: ideaVersions.summary,
      answers: ideaVersions.answers,
    })
    .from(ideas)
    .innerJoin(innovationCalls, eq(ideas.callId, innovationCalls.id))
    .leftJoin(ideaVersions, eq(ideas.currentVersionId, ideaVersions.id))
    .where(and(eq(ideas.id, ideaId), eq(ideas.submitterId, submitterId)))
    .limit(1);

  return idea ?? null;
}

export async function getPublicIdeaFeedback(ideaId: string, submitterId: string) {
  return db.select({ id: feedback.id, parentId: feedback.parentId, body: feedback.body, authorName: user.name, createdAt: feedback.createdAt })
    .from(feedback)
    .innerJoin(ideas, eq(feedback.ideaId, ideas.id))
    .innerJoin(user, eq(feedback.authorId, user.id))
    .where(and(eq(ideas.id, ideaId), eq(ideas.submitterId, submitterId), eq(feedback.isInternal, false)))
    .orderBy(asc(feedback.createdAt));
}

export async function getSubmitterEvaluationFeedback(ideaId: string, submitterId: string) {
  const rows = await db.select({
    evaluationId: evaluations.id,
    versionNo: ideaVersions.versionNo,
    stageName: workflowStages.name,
    overallComment: evaluations.overallComment,
    submittedAt: evaluations.submittedAt,
    criterionName: criteria.name,
    criterionComment: evaluationScores.comment,
  })
    .from(evaluations)
    .innerJoin(evaluatorAssignments, eq(evaluations.assignmentId, evaluatorAssignments.id))
    .innerJoin(ideas, eq(evaluatorAssignments.ideaId, ideas.id))
    .innerJoin(ideaVersions, and(eq(evaluations.ideaVersionId, ideaVersions.id), eq(ideaVersions.ideaId, ideas.id)))
    .innerJoin(workflowStages, eq(evaluatorAssignments.stageId, workflowStages.id))
    .leftJoin(evaluationScores, eq(evaluationScores.evaluationId, evaluations.id))
    .leftJoin(criteria, eq(evaluationScores.criterionId, criteria.id))
    .where(and(
      eq(ideas.id, ideaId),
      eq(ideas.submitterId, submitterId),
      isNotNull(evaluations.submittedAt),
    ))
    .orderBy(asc(evaluations.submittedAt), asc(ideaVersions.versionNo), asc(criteria.position));

  const reviews = new Map<string, {
    id: string;
    versionNo: number;
    stageName: string;
    overallComment: string | null;
    submittedAt: Date;
    criterionComments: { name: string; comment: string }[];
  }>();

  for (const row of rows) {
    if (!row.submittedAt) continue;
    let review = reviews.get(row.evaluationId);
    if (!review) {
      review = {
        id: row.evaluationId,
        versionNo: row.versionNo,
        stageName: row.stageName,
        overallComment: row.overallComment,
        submittedAt: row.submittedAt,
        criterionComments: [],
      };
      reviews.set(row.evaluationId, review);
    }
    if (row.criterionName && row.criterionComment?.trim()) {
      review.criterionComments.push({ name: row.criterionName, comment: row.criterionComment });
    }
  }

  return [...reviews.values()];
}

export async function getSubmitterStageHistory(ideaId: string, submitterId: string) {
  return db.select({ id: ideaStageHistory.id, status: ideaStageHistory.toStatus, stageName: workflowStages.name, createdAt: ideaStageHistory.createdAt })
    .from(ideaStageHistory)
    .innerJoin(ideas, eq(ideaStageHistory.ideaId, ideas.id))
    .leftJoin(workflowStages, eq(ideaStageHistory.toStageId, workflowStages.id))
    .where(and(eq(ideas.id, ideaId), eq(ideas.submitterId, submitterId)))
    .orderBy(asc(ideaStageHistory.createdAt));
}

export async function getSubmitterAwards(ideaId: string, submitterId: string) {
  return db.select({ title: awards.title, tier: awards.tier, description: awards.description, awardedAt: awards.awardedAt })
    .from(awards)
    .innerJoin(ideas, eq(awards.ideaId, ideas.id))
    .where(and(eq(ideas.id, ideaId), eq(ideas.submitterId, submitterId)))
    .orderBy(asc(awards.awardedAt));
}

export async function getSubmissionFields(callId: string) {
  return db.select({
    key: formFields.key,
    label: formFields.label,
    helpText: formFields.helpText,
    type: formFields.type,
    required: formFields.required,
    options: formFields.options,
  }).from(formFields)
    .where(and(eq(formFields.callId, callId), eq(formFields.isActive, true)))
    .orderBy(asc(formFields.position));
}

export async function getActiveCategories() {
  return db.select({ id: categories.id, name: categories.name })
    .from(categories).where(eq(categories.isActive, true))
    .orderBy(asc(categories.position), asc(categories.name));
}
