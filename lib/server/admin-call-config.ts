import "server-only";

import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  criteria,
  evaluationScores,
  formFields,
  innovationCalls,
  workflowStages,
} from "@/db/schema";
import { formatPortalDateTime } from "@/lib/format";
import type {
  CallConfigSummary,
  CallCriterionItem,
  CallFieldItem,
  CallStageItem,
  CallStatusValue,
} from "@/components/admin/calls/config/types";

export interface AdminCallConfigData {
  call: CallConfigSummary;
  fields: CallFieldItem[];
  stages: CallStageItem[];
  criteria: CallCriterionItem[];
  activeFieldsCount: number;
  activeCriteriaCount: number;
}

export async function loadAdminCallConfig(
  callId: string,
): Promise<AdminCallConfigData | null> {
  const [call] = await db
    .select()
    .from(innovationCalls)
    .where(eq(innovationCalls.id, callId))
    .limit(1);

  if (!call) return null;

  const [fields, stages, scoringCriteria, scoredCriterionRows] =
    await Promise.all([
      db
        .select()
        .from(formFields)
        .where(eq(formFields.callId, callId))
        .orderBy(asc(formFields.position)),
      db
        .select({
          id: workflowStages.id,
          key: workflowStages.key,
          name: workflowStages.name,
          description: workflowStages.description,
          type: workflowStages.type,
          position: workflowStages.position,
          isTerminal: workflowStages.isTerminal,
        })
        .from(workflowStages)
        .where(eq(workflowStages.callId, callId))
        .orderBy(asc(workflowStages.position)),
      db
        .select({
          id: criteria.id,
          stageId: criteria.stageId,
          name: criteria.name,
          description: criteria.description,
          maxScore: criteria.maxScore,
          weight: criteria.weight,
          isArchived: criteria.isArchived,
          stageName: workflowStages.name,
        })
        .from(criteria)
        .innerJoin(workflowStages, eq(criteria.stageId, workflowStages.id))
        .where(eq(workflowStages.callId, callId))
        .orderBy(asc(workflowStages.position), asc(criteria.position)),
      db
        .select({ criterionId: evaluationScores.criterionId })
        .from(evaluationScores)
        .innerJoin(criteria, eq(evaluationScores.criterionId, criteria.id))
        .innerJoin(workflowStages, eq(criteria.stageId, workflowStages.id))
        .where(eq(workflowStages.callId, callId)),
    ]);

  const scoredCriterionIds = new Set(
    scoredCriterionRows.map(({ criterionId }) => criterionId),
  );

  const criteriaItems: CallCriterionItem[] = scoringCriteria.map(
    (criterion) => ({
      ...criterion,
      hasScores: scoredCriterionIds.has(criterion.id),
    }),
  );

  return {
    call: {
      id: call.id,
      title: call.title,
      slug: call.slug,
      status: call.status as CallStatusValue,
      opensAtLabel: formatPortalDateTime(call.opensAt),
      closesAtLabel: formatPortalDateTime(call.closesAt),
    },
    fields,
    stages,
    criteria: criteriaItems,
    activeFieldsCount: fields.filter((field) => field.isActive).length,
    activeCriteriaCount: criteriaItems.filter((item) => !item.isArchived)
      .length,
  };
}
