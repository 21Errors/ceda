"use server";

import { randomUUID } from "node:crypto";
import { and, asc, count, eq, gte, isNull, lte, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { attachments, categories, formFields, ideaStageHistory, ideaSubscriptions, ideaVersions, ideas, innovationCalls, workflowStages } from "@/db/schema";
import { requireRole } from "@/lib/authorization";
import { writeAudit } from "@/lib/server/audit";
import { validateDynamicAnswers } from "@/lib/server/submission-validation";
import { dispatchNotificationEmails, getUsersWithRole, insertInAppNotifications } from "@/lib/server/notifications";

export type SubmissionState = { error?: string; fieldErrors?: Record<string, string>; referenceNo?: string; draftId?: string; savedAt?: string };
const uuidPattern = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readDraftAnswers(formData: FormData, definitions: { key: string; type: string }[]) {
  const answers: Record<string, unknown> = {};
  for (const field of definitions) {
    const values = formData.getAll(`answer:${field.key}`).filter((value): value is string => typeof value === "string").map((value) => value.trim());
    if (field.type === "multiselect") {
      if (values.length) answers[field.key] = values.slice(0, 30);
    } else if (field.type === "checkbox") {
      if (values.length) answers[field.key] = values[0] === "on" || values[0] === "true";
    } else if (values[0]) {
      answers[field.key] = values[0].slice(0, 5000);
    }
  }
  const solutionStatus = readText(formData, "solutionStatus");
  if (solutionStatus) answers.solution_status = solutionStatus;
  const innovationTypes = formData.getAll("innovationTypes").filter((value): value is string => typeof value === "string");
  if (innovationTypes.length) answers.innovation_types = innovationTypes.slice(0, 10);
  return answers;
}

async function getOpenCall(callId: string) {
  const now = new Date();
  const [call] = await db.select({ id: innovationCalls.id, title: innovationCalls.title })
    .from(innovationCalls)
    .where(and(eq(innovationCalls.id, callId), eq(innovationCalls.status, "open"),
      or(isNull(innovationCalls.opensAt), lte(innovationCalls.opensAt, now)),
      or(isNull(innovationCalls.closesAt), gte(innovationCalls.closesAt, now))))
    .limit(1);
  return call ?? null;
}

export async function saveSubmissionDraft(formData: FormData): Promise<SubmissionState> {
  const user = await requireRole("submitter", "/submit");
  const draftId = readText(formData, "draftId");
  const requestedCallId = readText(formData, "callId");
  const now = new Date();

  let idea: { id: string; callId: string; referenceNo: string; currentVersionId: string | null } | undefined;
  if (draftId) {
    if (!uuidPattern.test(draftId)) return { error: "This draft is unavailable." };
    const [ownedDraft] = await db.select({ id: ideas.id, callId: ideas.callId, referenceNo: ideas.referenceNo, currentVersionId: ideas.currentVersionId })
      .from(ideas).where(and(eq(ideas.id, draftId), eq(ideas.submitterId, user.id), eq(ideas.status, "draft"))).limit(1);
    idea = ownedDraft;
    if (!idea?.currentVersionId) return { error: "This draft is unavailable or has already been submitted." };
  } else {
    if (!uuidPattern.test(requestedCallId)) return { error: "Choose an available innovation opportunity first." };
    const call = await getOpenCall(requestedCallId);
    if (!call) return { error: "This opportunity is closed or unavailable. Refresh and choose an open opportunity." };
    const [stage] = await db.select({ id: workflowStages.id }).from(workflowStages)
      .where(eq(workflowStages.callId, call.id)).orderBy(asc(workflowStages.position)).limit(1);
    if (!stage) return { error: "This opportunity is missing workflow configuration. Contact CEDA for help." };
    const year = new Intl.DateTimeFormat("en-BW", { year: "numeric", timeZone: "Africa/Gaborone" }).format(now);
    const ideaId = randomUUID();
    const versionId = randomUUID();
    const referenceNo = `CEDA-${year}-${randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
    await db.transaction(async (tx) => {
      await tx.insert(ideas).values({ id: ideaId, referenceNo, callId: call.id, submitterId: user.id, currentStageId: stage.id, status: "draft" });
      await tx.insert(ideaVersions).values({ id: versionId, ideaId, versionNo: 1, title: "Untitled submission", summary: "", answers: {}, createdBy: user.id });
      await tx.update(ideas).set({ currentVersionId: versionId }).where(eq(ideas.id, ideaId));
      await writeAudit(tx, { actorId: user.id, action: "idea.draft_created", entityType: "idea", entityId: ideaId, metadata: { referenceNo, callId: call.id } });
    });
    idea = { id: ideaId, callId: call.id, referenceNo, currentVersionId: versionId };
  }

  const [definitions] = await Promise.all([
    db.select({ key: formFields.key, type: formFields.type }).from(formFields)
      .where(and(eq(formFields.callId, idea.callId), eq(formFields.isActive, true))),
  ]);
  const title = readText(formData, "title").slice(0, 255) || "Untitled submission";
  const summary = readText(formData, "summary").slice(0, 5000);
  const categoryId = readText(formData, "categoryId");
  const validCategory = uuidPattern.test(categoryId)
    ? (await db.select({ id: categories.id }).from(categories).where(and(eq(categories.id, categoryId), eq(categories.isActive, true))).limit(1))[0]
    : undefined;
  await db.transaction(async (tx) => {
    await tx.update(ideaVersions).set({ title, summary, answers: readDraftAnswers(formData, definitions), termsAcceptedAt: formData.get("termsAccepted") === "on" ? now : null })
      .where(and(eq(ideaVersions.id, idea.currentVersionId!), eq(ideaVersions.ideaId, idea.id)));
    await tx.update(ideas).set({ categoryId: validCategory?.id ?? null }).where(and(eq(ideas.id, idea.id), eq(ideas.submitterId, user.id), eq(ideas.status, "draft")));
  });
  revalidatePath("/dashboard");
  return { draftId: idea.id, savedAt: now.toISOString() };
}

export async function submitIdeaAction(formData: FormData): Promise<SubmissionState> {
  const user = await requireRole("submitter", "/submit");
  const draftId = readText(formData, "draftId");
  const callId = readText(formData, "callId");
  const title = readText(formData, "title");
  const summary = readText(formData, "summary");
  const categoryId = readText(formData, "categoryId");
  const fieldErrors: Record<string, string> = {};
  if (!uuidPattern.test(draftId)) return { error: "Save this application as a draft before submitting." };
  if (title.length < 5 || title.length > 255) fieldErrors.title = "Use between 5 and 255 characters.";
  if (summary.length < 30 || summary.length > 5000) fieldErrors.summary = "Use between 30 and 5,000 characters.";
  if (formData.get("termsAccepted") !== "on") fieldErrors.termsAccepted = "Accept the terms and conditions to submit.";

  const [idea] = await db.select({ id: ideas.id, callId: ideas.callId, referenceNo: ideas.referenceNo, currentVersionId: ideas.currentVersionId })
    .from(ideas).where(and(eq(ideas.id, draftId), eq(ideas.submitterId, user.id), eq(ideas.status, "draft"))).limit(1);
  if (!idea?.currentVersionId || idea.callId !== callId) return { error: "This draft is unavailable. Return to your dashboard and reopen it." };
  const call = await getOpenCall(idea.callId);
  if (!call) return { error: "This opportunity has closed. Contact CEDA if you need help with your draft." };
  const [fieldDefinitions, stageRows, categoryRows] = await Promise.all([
    db.select({ key: formFields.key, label: formFields.label, type: formFields.type, required: formFields.required, options: formFields.options })
      .from(formFields).where(and(eq(formFields.callId, call.id), eq(formFields.isActive, true))).orderBy(asc(formFields.position)),
    db.select({ id: workflowStages.id }).from(workflowStages).where(and(eq(workflowStages.callId, call.id), eq(workflowStages.type, "evaluation"))).orderBy(asc(workflowStages.position)).limit(1),
    uuidPattern.test(categoryId) ? db.select({ id: categories.id }).from(categories).where(and(eq(categories.id, categoryId), eq(categories.isActive, true))).limit(1) : Promise.resolve([]),
  ]);
  if (!stageRows[0]) return { error: "This opportunity has no evaluation stage configured. Contact CEDA for help." };
  if (!categoryRows[0]) fieldErrors.categoryId = "Choose a valid category.";
  const { answers: validatedAnswers, fieldErrors: answerErrors } = validateDynamicAnswers(formData, fieldDefinitions);
  Object.assign(fieldErrors, answerErrors);
  if (!readText(formData, "solutionStatus")) fieldErrors.solutionStatus = "Choose the current status of your solution.";
  if (!formData.getAll("innovationTypes").length) fieldErrors.innovationTypes = "Choose at least one type of innovation.";
  if (Object.keys(fieldErrors).length) return { error: "Review the highlighted sections and try again.", fieldErrors };

  const now = new Date();
  const answers = {
    ...validatedAnswers,
    solution_status: readText(formData, "solutionStatus"),
    innovation_types: formData.getAll("innovationTypes").filter((value): value is string => typeof value === "string").slice(0, 10),
  };
  const emailEvents = [{ userId: user.id, ideaId: idea.id, type: "idea_submitted", title: "Submission received", body: `Your submission ${idea.referenceNo} has been received for ${call.title}.` }];
  await db.transaction(async (tx) => {
    await tx.update(ideaVersions).set({ title, summary, answers, termsAcceptedAt: now, submittedAt: now })
      .where(and(eq(ideaVersions.id, idea.currentVersionId!), eq(ideaVersions.ideaId, idea.id)));
    await tx.update(ideas).set({ currentStageId: stageRows[0].id, currentVersionId: idea.currentVersionId, categoryId, status: "submitted", submittedAt: now })
      .where(and(eq(ideas.id, idea.id), eq(ideas.submitterId, user.id), eq(ideas.status, "draft")));
    await tx.insert(ideaStageHistory).values({ ideaId: idea.id, toStageId: stageRows[0].id, toStatus: "submitted", actorId: user.id, note: "Innovation submission received." });
    await tx.insert(ideaSubscriptions).values({ userId: user.id, ideaId: idea.id }).onConflictDoNothing();
    const evaluatorUsers = await getUsersWithRole(tx, "evaluator");
    const queueEvents = evaluatorUsers.filter(({ id }) => id !== user.id).map(({ id }) => ({ userId: id, ideaId: idea.id, type: "evaluation_available", title: "Submission available to review", body: `Submission ${idea.referenceNo} is ready to claim in the evaluator queue.` }));
    emailEvents.push(...queueEvents);
    await insertInAppNotifications(tx, [emailEvents[0], ...queueEvents]);
    const [attachmentTotals] = await tx
      .select({ total: count() })
      .from(attachments)
      .where(eq(attachments.ideaVersionId, idea.currentVersionId!));
    await writeAudit(tx, { actorId: user.id, action: "idea.submitted", entityType: "idea", entityId: idea.id, metadata: { referenceNo: idea.referenceNo, callId: call.id, versionNo: 1, attachmentCount: Number(attachmentTotals?.total ?? 0) } });
  });
  await dispatchNotificationEmails(emailEvents);
  revalidatePath("/dashboard");
  return { referenceNo: idea.referenceNo };
}
