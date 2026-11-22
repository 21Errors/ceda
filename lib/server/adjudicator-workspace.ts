import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { evaluatorAssignments, evaluations, ideaVersions, ideas, innovationCalls, user, workflowStages } from "@/db/schema";
import { getAttachmentsByVersionIds } from "@/lib/server/attachments";
import { findSimilarIdeasMap } from "@/lib/server/idea-similarity";

export async function getAdjudicationQueue() {
  const submissions = await db.select({
    id: ideas.id,
    referenceNo: ideas.referenceNo,
    status: ideas.status,
    submitterId: ideas.submitterId,
    callId: ideas.callId,
    versionId: ideaVersions.id,
    title: ideaVersions.title,
    summary: ideaVersions.summary,
    answers: ideaVersions.answers,
    callTitle: innovationCalls.title,
    stageId: workflowStages.id,
  })
    .from(ideas)
    .innerJoin(ideaVersions, eq(ideas.currentVersionId, ideaVersions.id))
    .innerJoin(innovationCalls, eq(ideas.callId, innovationCalls.id))
    .innerJoin(workflowStages, eq(ideas.currentStageId, workflowStages.id))
    .where(and(eq(workflowStages.type, "adjudication"), inArray(ideas.status, ["in_review", "changes_requested"])))
    .orderBy(desc(ideas.updatedAt));

  const versionIds = submissions.map((submission) => submission.versionId);
  const ideaIds = submissions.map((submission) => submission.id);
  const [reviews, attachmentsByVersion, similarByIdea] = await Promise.all([
    versionIds.length
      ? db.select({
          versionId: evaluations.ideaVersionId,
          evaluatorName: user.name,
          stageName: workflowStages.name,
          totalScore: evaluations.totalScore,
          comment: evaluations.overallComment,
        })
          .from(evaluations)
          .innerJoin(evaluatorAssignments, eq(evaluations.assignmentId, evaluatorAssignments.id))
          .innerJoin(user, eq(evaluatorAssignments.evaluatorId, user.id))
          .innerJoin(workflowStages, eq(evaluatorAssignments.stageId, workflowStages.id))
          .where(inArray(evaluations.ideaVersionId, versionIds))
      : Promise.resolve([]),
    getAttachmentsByVersionIds(versionIds),
    findSimilarIdeasMap(ideaIds),
  ]);
  const reviewsByVersion = new Map<string, typeof reviews>();
  for (const review of reviews) reviewsByVersion.set(review.versionId, [...(reviewsByVersion.get(review.versionId) ?? []), review]);
  return submissions.map((submission) => ({
    ...submission,
    reviews: reviewsByVersion.get(submission.versionId) ?? [],
    attachments: attachmentsByVersion.get(submission.versionId) ?? [],
    similarIdeas: similarByIdea.get(submission.id) ?? [],
  }));
}
