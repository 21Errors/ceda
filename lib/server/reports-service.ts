import "server-only";

import { asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  categories,
  evaluatorAssignments,
  ideaStageHistory,
  ideaVersions,
  ideas,
  innovationCalls,
  user,
  userProfiles,
  workflowStages,
} from "@/db/schema";
import {
  buildExecutiveReport,
  type ExecutiveReportData,
  type ReportEvaluatorWorkloadRow,
} from "@/lib/reports-analytics";
import { getChatAnalyticsSummary } from "@/lib/server/chat-service";

export async function getExecutiveReportData(): Promise<ExecutiveReportData> {
  const [ideaRows, historyRows, workloadRows, chatAnalytics] =
    await Promise.all([
      db
        .select({
          id: ideas.id,
          status: ideas.status,
          callTitle: innovationCalls.title,
          categoryName: categories.name,
          stageId: ideas.currentStageId,
          stageName: workflowStages.name,
          stageType: workflowStages.type,
          createdAt: ideas.createdAt,
          submittedAt: ideas.submittedAt,
          submitterId: ideas.submitterId,
          isInternal: userProfiles.isInternal,
          organisation: userProfiles.organisation,
          jobTitle: userProfiles.jobTitle,
          answers: ideaVersions.answers,
        })
        .from(ideas)
        .innerJoin(innovationCalls, eq(ideas.callId, innovationCalls.id))
        .leftJoin(categories, eq(ideas.categoryId, categories.id))
        .leftJoin(workflowStages, eq(ideas.currentStageId, workflowStages.id))
        .leftJoin(ideaVersions, eq(ideas.currentVersionId, ideaVersions.id))
        .leftJoin(userProfiles, eq(ideas.submitterId, userProfiles.userId)),
      db
        .select({
          ideaId: ideaStageHistory.ideaId,
          fromStageId: ideaStageHistory.fromStageId,
          toStageId: ideaStageHistory.toStageId,
          toStageName: workflowStages.name,
          toStageType: workflowStages.type,
          toStatus: ideaStageHistory.toStatus,
          createdAt: ideaStageHistory.createdAt,
        })
        .from(ideaStageHistory)
        .leftJoin(workflowStages, eq(ideaStageHistory.toStageId, workflowStages.id))
        .orderBy(asc(ideaStageHistory.createdAt)),
      db
        .select({
          evaluatorName: user.name,
          status: evaluatorAssignments.status,
          total: count(),
        })
        .from(evaluatorAssignments)
        .innerJoin(user, eq(evaluatorAssignments.evaluatorId, user.id))
        .groupBy(user.id, user.name, evaluatorAssignments.status)
        .orderBy(user.name),
      getChatAnalyticsSummary(),
    ]);

  const workloadMap = new Map<string, ReportEvaluatorWorkloadRow>();
  for (const row of workloadRows) {
    const entry = workloadMap.get(row.evaluatorName) ?? {
      evaluatorName: row.evaluatorName,
      pending: 0,
      inProgress: 0,
      submitted: 0,
      declined: 0,
    };
    const key = row.status === "in_progress" ? "inProgress" : row.status;
    entry[key] = Number(row.total ?? 0);
    workloadMap.set(row.evaluatorName, entry);
  }

  return buildExecutiveReport({
    ideas: ideaRows.map((row) => {
      const rawSolution = row.answers?.solution_status;
      return {
        id: row.id,
        status: row.status,
        callTitle: row.callTitle,
        categoryName: row.categoryName,
        stageId: row.stageId,
        stageName: row.stageName,
        stageType: row.stageType,
        createdAt: row.createdAt,
        submittedAt: row.submittedAt,
        submitterId: row.submitterId,
        isInternal: row.isInternal,
        organisation: row.organisation,
        jobTitle: row.jobTitle,
        solutionStatus:
          typeof rawSolution === "string" && rawSolution.trim()
            ? rawSolution.trim()
            : null,
      };
    }),
    stageHistory: historyRows,
    evaluatorWorkload: [...workloadMap.values()],
    chatAnalytics,
  });
}
