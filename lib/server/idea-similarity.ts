import "server-only";

import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { categories, ideaVersions, ideas, innovationCalls } from "@/db/schema";
import {
  extractAnswersText,
  findSimilarSubmissions,
  type SimilarIdeaMatch,
  type SimilarityCandidate,
} from "@/lib/idea-similarity";

async function loadSubmittedCorpus(): Promise<SimilarityCandidate[]> {
  const rows = await db
    .select({
      ideaId: ideas.id,
      referenceNo: ideas.referenceNo,
      status: ideas.status,
      callId: ideas.callId,
      callTitle: innovationCalls.title,
      categoryName: categories.name,
      title: ideaVersions.title,
      summary: ideaVersions.summary,
      answers: ideaVersions.answers,
    })
    .from(ideas)
    .innerJoin(ideaVersions, eq(ideas.currentVersionId, ideaVersions.id))
    .innerJoin(innovationCalls, eq(ideas.callId, innovationCalls.id))
    .leftJoin(categories, eq(ideas.categoryId, categories.id))
    .where(and(ne(ideas.status, "draft"), ne(ideas.status, "withdrawn")));

  return rows.map((row) => ({
    ideaId: row.ideaId,
    referenceNo: row.referenceNo,
    title: row.title,
    summary: row.summary,
    categoryName: row.categoryName,
    callId: row.callId,
    callTitle: row.callTitle,
    status: row.status,
    answersText: extractAnswersText(row.answers),
  }));
}

export async function findSimilarIdeasForReview(
  targetIdeaId: string,
  limit = 3,
): Promise<SimilarIdeaMatch[]> {
  const corpus = await loadSubmittedCorpus();
  return findSimilarSubmissions(targetIdeaId, corpus, { limit });
}

export async function findSimilarIdeasMap(
  targetIdeaIds: readonly string[],
  limit = 3,
): Promise<Map<string, SimilarIdeaMatch[]>> {
  const result = new Map<string, SimilarIdeaMatch[]>();
  if (!targetIdeaIds.length) return result;

  const corpus = await loadSubmittedCorpus();
  for (const ideaId of targetIdeaIds) {
    result.set(ideaId, findSimilarSubmissions(ideaId, corpus, { limit }));
  }
  return result;
}
