import "server-only";

import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  auditLogs,
  categories,
  evaluatorAssignments,
  ideaVersions,
  ideas,
  innovationCalls,
  roles,
  user,
  userRoles,
  workflowStages,
} from "@/db/schema";
import { formatPortalDate } from "@/lib/format";

export interface AuditEntryRecord {
  id: string;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: unknown;
  ipAddress: string | null;
  createdAt: Date;
}

export async function loadAuditEntries(limit = 200): Promise<AuditEntryRecord[]> {
  return db
    .select({
      id: auditLogs.id,
      actorName: user.name,
      actorEmail: user.email,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      metadata: auditLogs.metadata,
      ipAddress: auditLogs.ipAddress,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(user, eq(auditLogs.actorId, user.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

export async function loadApprovedIdeasForAwards() {
  return db
    .select({
      id: ideas.id,
      referenceNo: ideas.referenceNo,
      title: ideaVersions.title,
      callTitle: innovationCalls.title,
    })
    .from(ideas)
    .innerJoin(ideaVersions, eq(ideas.currentVersionId, ideaVersions.id))
    .innerJoin(innovationCalls, eq(ideas.callId, innovationCalls.id))
    .where(eq(ideas.status, "approved"))
    .orderBy(desc(ideas.updatedAt));
}

export async function loadAdminCategories() {
  return db
    .select()
    .from(categories)
    .orderBy(asc(categories.position), asc(categories.name));
}

export async function loadAdminReviewPipeline(limit = 200) {
  const submissions = await db
    .select({
      id: ideas.id,
      referenceNo: ideas.referenceNo,
      status: ideas.status,
      callTitle: innovationCalls.title,
      title: ideaVersions.title,
      stageName: workflowStages.name,
    })
    .from(ideas)
    .innerJoin(innovationCalls, eq(ideas.callId, innovationCalls.id))
    .leftJoin(ideaVersions, eq(ideas.currentVersionId, ideaVersions.id))
    .leftJoin(workflowStages, eq(ideas.currentStageId, workflowStages.id))
    .where(
      inArray(ideas.status, ["submitted", "in_review", "changes_requested"]),
    )
    .orderBy(desc(ideas.submittedAt))
    .limit(limit);

  const activeIds = submissions.map((item) => item.id);
  const assignments = activeIds.length
    ? await db
        .select({
          ideaId: evaluatorAssignments.ideaId,
          name: user.name,
          status: evaluatorAssignments.status,
        })
        .from(evaluatorAssignments)
        .innerJoin(user, eq(evaluatorAssignments.evaluatorId, user.id))
        .where(inArray(evaluatorAssignments.ideaId, activeIds))
    : [];

  const assignmentsByIdea = new Map<
    string,
    { name: string; status: string }[]
  >();
  for (const assignment of assignments) {
    const existing = assignmentsByIdea.get(assignment.ideaId) ?? [];
    existing.push({ name: assignment.name, status: assignment.status });
    assignmentsByIdea.set(assignment.ideaId, existing);
  }

  return submissions.map((submission) => ({
    ...submission,
    assignments: assignmentsByIdea.get(submission.id) ?? [],
  }));
}

export async function loadAdminUsersDirectory(limit = 200) {
  const [users, roleOptions] = await Promise.all([
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(desc(user.createdAt))
      .limit(limit),
    db
      .select({ id: roles.id, key: roles.key, name: roles.name })
      .from(roles)
      .orderBy(roles.name),
  ]);

  const roleRows = users.length
    ? await db
        .select({
          userId: userRoles.userId,
          id: roles.id,
          key: roles.key,
          name: roles.name,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(
          inArray(
            userRoles.userId,
            users.map((item) => item.id),
          ),
        )
    : [];

  const assignedByUser = new Map<string, { id: string; key: string; name: string }[]>();
  for (const row of roleRows) {
    const existing = assignedByUser.get(row.userId) ?? [];
    existing.push({ id: row.id, key: row.key, name: row.name });
    assignedByUser.set(row.userId, existing);
  }

  return {
    roleOptions,
    users: users.map((account) => {
      const currentRoles = assignedByUser.get(account.id) ?? [];
      const availableRoles = roleOptions.filter(
        (role) => !currentRoles.some((item) => item.id === role.id),
      );
      return {
        id: account.id,
        name: account.name,
        email: account.email,
        emailVerified: account.emailVerified,
        createdAtIso: account.createdAt.toISOString(),
        createdAtLabel: formatPortalDate(account.createdAt),
        currentRoles,
        availableRoles,
      };
    }),
  };
}
