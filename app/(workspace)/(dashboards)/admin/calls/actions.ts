"use server";

import { and, asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { criteria, evaluationScores, formFields, innovationCalls, workflowStages } from "@/db/schema";
import { requireRole } from "@/lib/authorization";
import { writeAudit } from "@/lib/server/audit";

const initialStages = [
  { key: "submitted", name: "Submitted", type: "intake" as const, position: 0 },
  { key: "screening", name: "Screening", type: "screening" as const, position: 1 },
  { key: "level_1", name: "Level 1 Evaluation", type: "evaluation" as const, position: 2 },
  { key: "level_2", name: "Level 2 Evaluation", type: "evaluation" as const, position: 3 },
  { key: "adjudication", name: "Adjudication", type: "adjudication" as const, position: 4 },
  { key: "feedback", name: "Feedback", type: "feedback" as const, position: 5 },
  { key: "decision", name: "Decision", type: "decision" as const, position: 6 },
  { key: "award", name: "Award", type: "award" as const, position: 7, isTerminal: true },
];
const uuidPattern = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
const fieldSections = ["general_information", "solution_status", "solution_overview", "type_of_innovation", "additional_information", "solution_documents"] as const;
const workflowTypes = ["intake", "screening", "evaluation", "adjudication", "feedback", "decision", "award"] as const;

function asGaboroneDate(value: string) {
  if (!value) return null;
  const parsed = new Date(`${value}:00+02:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export async function createCall(formData: FormData) {
  const user = await requireRole("admin", "/admin/calls/new");
  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "draft");
  const opensAt = asGaboroneDate(String(formData.get("opensAt") ?? ""));
  const closesAt = asGaboroneDate(String(formData.get("closesAt") ?? ""));
  const validStatuses = ["draft", "open", "closed", "archived"] as const;

  if (title.length < 3 || title.length > 255) redirect("/admin/calls/new?error=title");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) redirect("/admin/calls/new?error=slug");
  if (!validStatuses.includes(status as (typeof validStatuses)[number])) redirect("/admin/calls/new?error=status");
  if (opensAt === undefined || closesAt === undefined || (opensAt && closesAt && opensAt >= closesAt)) redirect("/admin/calls/new?error=dates");
  const [slugConflict] = await db.select({ id: innovationCalls.id }).from(innovationCalls).where(eq(innovationCalls.slug, slug)).limit(1);
  if (slugConflict) redirect("/admin/calls/new?error=duplicate");

  const [call] = await db.transaction(async (tx) => {
    const [created] = await tx.insert(innovationCalls).values({
      title,
      slug,
      description: description || null,
      status: status as (typeof validStatuses)[number],
      opensAt,
      closesAt,
      createdBy: user.id,
    }).returning({ id: innovationCalls.id, title: innovationCalls.title });
    if (!created) throw new Error("The call could not be created.");

    await tx.insert(workflowStages).values(initialStages.map((stage) => ({ ...stage, callId: created.id })));
    await writeAudit(tx, {
      actorId: user.id,
      action: "call.created",
      entityType: "innovation_call",
      entityId: created.id,
      metadata: { title: created.title, slug, status },
    });
    return [created];
  });

  revalidatePath("/admin");
  revalidatePath("/admin/calls");
  redirect(`/admin/calls/${call.id}`);
}

export async function addFormField(formData: FormData) {
  const user = await requireRole("admin", "/admin");
  const callId = String(formData.get("callId") ?? "");
  const key = String(formData.get("key") ?? "").trim().toLowerCase();
  const label = String(formData.get("label") ?? "").trim();
  const helpText = String(formData.get("helpText") ?? "").trim();
  const type = String(formData.get("type") ?? "text");
  const required = formData.get("required") === "on";
  const sectionKey = String(formData.get("sectionKey") ?? "general_information");
  const options = String(formData.get("options") ?? "").split(",").map((item) => item.trim()).filter(Boolean);
  const validTypes = ["text", "textarea", "number", "select", "multiselect", "checkbox", "date", "url"] as const;

  if (!uuidPattern.test(callId)) redirect("/admin?error=call");
  if (!/^[a-z][a-z0-9_]{1,79}$/.test(key) || label.length < 2 || label.length > 255) redirect(`/admin/calls/${callId}?error=field`);
  if (!validTypes.includes(type as (typeof validTypes)[number])) redirect(`/admin/calls/${callId}?error=field`);
  if (!fieldSections.includes(sectionKey as (typeof fieldSections)[number])) redirect(`/admin/calls/${callId}?error=field`);
  if ((type === "select" || type === "multiselect") && (!options.length || options.some((item) => item.length > 255))) redirect(`/admin/calls/${callId}?error=options`);
  if (new Set(options).size !== options.length) redirect(`/admin/calls/${callId}?error=options`);

  const [call] = await db.select({ id: innovationCalls.id }).from(innovationCalls).where(eq(innovationCalls.id, callId)).limit(1);
  if (!call) redirect("/admin?error=call");
  const [duplicate] = await db.select({ id: formFields.id }).from(formFields)
    .where(and(eq(formFields.callId, call.id), eq(formFields.key, key))).limit(1);
  if (duplicate) redirect(`/admin/calls/${callId}?error=duplicate`);
  const [lastField] = await db.select({ position: formFields.position }).from(formFields)
    .where(eq(formFields.callId, call.id)).orderBy(desc(formFields.position)).limit(1);
  const position = lastField ? lastField.position + 1 : 0;

  await db.transaction(async (tx) => {
    await tx.insert(formFields).values({
      callId: call.id,
      key,
      label,
      helpText: helpText || null,
      type: type as (typeof validTypes)[number],
      required,
      options: options.length ? options : null,
      sectionKey: sectionKey as (typeof fieldSections)[number],
      sectionPosition: position,
      position,
    });
    await writeAudit(tx, {
      actorId: user.id,
      action: "call.form_field.created",
      entityType: "innovation_call",
      entityId: call.id,
      metadata: { key, label, type, required, sectionKey },
    });
  });

  revalidatePath(`/admin/calls/${call.id}`);
  revalidatePath("/submit");
}

export async function updateCallStatus(formData: FormData) {
  const user = await requireRole("admin", "/admin");
  const callId = String(formData.get("callId") ?? "");
  const status = String(formData.get("status") ?? "");
  const allowed = ["draft", "open", "closed", "archived"] as const;
  if (!uuidPattern.test(callId)) redirect("/admin?error=call");
  if (!allowed.includes(status as (typeof allowed)[number])) redirect(`/admin/calls/${callId}?error=status`);

  const [existing] = await db.select({ status: innovationCalls.status }).from(innovationCalls)
    .where(eq(innovationCalls.id, callId)).limit(1);
  if (!existing) redirect("/admin?error=call");
  await db.transaction(async (tx) => {
    await tx.update(innovationCalls).set({ status: status as (typeof allowed)[number] }).where(eq(innovationCalls.id, callId));
    await writeAudit(tx, {
      actorId: user.id,
      action: "call.status_changed",
      entityType: "innovation_call",
      entityId: callId,
      metadata: { from: existing.status, to: status },
    });
  });
  revalidatePath("/admin");
  revalidatePath("/admin/calls");
  revalidatePath(`/admin/calls/${callId}`);
  revalidatePath("/submit");
}

export async function setFormFieldActive(formData: FormData) {
  const user = await requireRole("admin", "/admin");
  const callId = String(formData.get("callId") ?? "");
  const fieldId = String(formData.get("fieldId") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (!uuidPattern.test(callId) || !uuidPattern.test(fieldId)) redirect("/admin?error=field");
  const [field] = await db.select({ id: formFields.id, key: formFields.key, isActive: formFields.isActive })
    .from(formFields).where(and(eq(formFields.id, fieldId), eq(formFields.callId, callId))).limit(1);
  if (!field) redirect("/admin?error=field");

  await db.transaction(async (tx) => {
    await tx.update(formFields).set({ isActive: active }).where(eq(formFields.id, field.id));
    await writeAudit(tx, {
      actorId: user.id,
      action: "call.form_field.updated",
      entityType: "innovation_call",
      entityId: callId,
      metadata: { key: field.key, active },
    });
  });
  revalidatePath(`/admin/calls/${callId}`);
  revalidatePath("/submit");
}

export async function addEvaluationCriterion(formData: FormData) {
  const user = await requireRole("admin", "/admin");
  const callId = String(formData.get("callId") ?? "");
  const stageId = String(formData.get("stageId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const maxScore = Number(formData.get("maxScore"));
  const weight = Number(formData.get("weight"));
  if (!uuidPattern.test(callId) || !uuidPattern.test(stageId)) redirect("/admin?error=workflow");
  if (name.length < 2 || name.length > 150 || !Number.isInteger(maxScore) || maxScore < 1 || maxScore > 1000 || !Number.isFinite(weight) || weight <= 0 || weight > 100) {
    redirect(`/admin/calls/${callId}?error=criterion`);
  }
  const [stage] = await db.select({ id: workflowStages.id, name: workflowStages.name, type: workflowStages.type })
    .from(workflowStages).where(and(eq(workflowStages.id, stageId), eq(workflowStages.callId, callId))).limit(1);
  if (!stage || stage.type !== "evaluation") redirect(`/admin/calls/${callId}?error=stage`);
  const [last] = await db.select({ position: criteria.position }).from(criteria)
    .where(eq(criteria.stageId, stage.id)).orderBy(desc(criteria.position)).limit(1);
  const position = last ? last.position + 1 : 0;

  await db.transaction(async (tx) => {
    await tx.insert(criteria).values({ stageId, name, description: description || null, maxScore, weight: weight.toFixed(2), position });
    await writeAudit(tx, {
      actorId: user.id,
      action: "evaluation.criterion.created",
      entityType: "workflow_stage",
      entityId: stageId,
      metadata: { name, maxScore, weight },
    });
  });
  revalidatePath(`/admin/calls/${callId}`);
}

export async function addWorkflowStage(formData: FormData) {
  const admin = await requireRole("admin", "/admin");
  const callId = String(formData.get("callId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const key = String(formData.get("key") ?? "").trim().toLowerCase();
  const description = String(formData.get("description") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  if (!uuidPattern.test(callId)) redirect("/admin?error=workflow");
  if (name.length < 2 || name.length > 150 || !/^[a-z][a-z0-9_]{1,79}$/.test(key) || description.length > 2000 || !workflowTypes.includes(type as (typeof workflowTypes)[number])) {
    redirect(`/admin/calls/${callId}?error=stage`);
  }
  const [duplicate] = await db.select({ id: workflowStages.id }).from(workflowStages)
    .where(and(eq(workflowStages.callId, callId), eq(workflowStages.key, key))).limit(1);
  if (duplicate) redirect(`/admin/calls/${callId}?error=stage_duplicate`);
  const [created] = await db.transaction(async (tx) => {
    const existingStages = await tx.select({ id: workflowStages.id, position: workflowStages.position, isTerminal: workflowStages.isTerminal })
      .from(workflowStages).where(eq(workflowStages.callId, callId)).orderBy(asc(workflowStages.position));
    const terminalStage = existingStages.find(({ isTerminal }) => isTerminal);
    const position = terminalStage?.position ?? Math.max(-1, ...existingStages.map(({ position }) => position)) + 1;
    for (const stage of existingStages.filter(({ position: stagePosition }) => stagePosition >= position)) {
      await tx.update(workflowStages).set({ position: stage.position + 1 }).where(eq(workflowStages.id, stage.id));
    }
    const [stage] = await tx.insert(workflowStages).values({
      callId, key, name, description: description || null, type: type as (typeof workflowTypes)[number],
      position,
      isTerminal: type === "award",
    }).returning({ id: workflowStages.id });
    if (stage) await writeAudit(tx, { actorId: admin.id, action: "workflow.stage.created", entityType: "workflow_stage", entityId: stage.id, metadata: { callId, key, name, type } });
    return [stage];
  });
  if (!created) redirect(`/admin/calls/${callId}?error=stage`);
  revalidatePath(`/admin/calls/${callId}`);
}

export async function updateWorkflowStage(formData: FormData) {
  const admin = await requireRole("admin", "/admin");
  const callId = String(formData.get("callId") ?? "");
  const stageId = String(formData.get("stageId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!uuidPattern.test(callId) || !uuidPattern.test(stageId)) redirect("/admin?error=workflow");
  if (name.length < 2 || name.length > 150 || description.length > 2000) redirect(`/admin/calls/${callId}?error=stage`);
  const [stage] = await db.select({ id: workflowStages.id }).from(workflowStages)
    .where(and(eq(workflowStages.id, stageId), eq(workflowStages.callId, callId))).limit(1);
  if (!stage) redirect(`/admin/calls/${callId}?error=stage`);
  await db.transaction(async (tx) => {
    await tx.update(workflowStages).set({ name, description: description || null }).where(eq(workflowStages.id, stageId));
    await writeAudit(tx, { actorId: admin.id, action: "workflow.stage.updated", entityType: "workflow_stage", entityId: stageId, metadata: { callId, name } });
  });
  revalidatePath(`/admin/calls/${callId}`);
}

export async function moveWorkflowStage(formData: FormData) {
  const admin = await requireRole("admin", "/admin");
  const callId = String(formData.get("callId") ?? "");
  const stageId = String(formData.get("stageId") ?? "");
  const direction = String(formData.get("direction") ?? "");
  if (!uuidPattern.test(callId) || !uuidPattern.test(stageId) || !["up", "down"].includes(direction)) redirect("/admin?error=workflow");

  const reordered = await db.transaction(async (tx) => {
    const stages = await tx.select({ id: workflowStages.id, position: workflowStages.position, name: workflowStages.name })
      .from(workflowStages).where(eq(workflowStages.callId, callId)).orderBy(asc(workflowStages.position));
    const index = stages.findIndex(({ id }) => id === stageId);
    const neighbor = stages[index + (direction === "up" ? -1 : 1)];
    if (index < 0 || !neighbor) return false;
    const selected = stages[index];
    const temporaryPosition = Math.max(...stages.map(({ position }) => position)) + stages.length + 1;
    await tx.update(workflowStages).set({ position: temporaryPosition }).where(eq(workflowStages.id, selected.id));
    await tx.update(workflowStages).set({ position: selected.position }).where(eq(workflowStages.id, neighbor.id));
    await tx.update(workflowStages).set({ position: neighbor.position }).where(eq(workflowStages.id, selected.id));
    await writeAudit(tx, { actorId: admin.id, action: "workflow.stage.reordered", entityType: "workflow_stage", entityId: selected.id, metadata: { callId, direction, swappedWith: neighbor.id } });
    return true;
  });
  if (!reordered) redirect(`/admin/calls/${callId}?error=stage`);
  revalidatePath(`/admin/calls/${callId}`);
}

export async function updateEvaluationCriterion(formData: FormData) {
  const admin = await requireRole("admin", "/admin");
  const callId = String(formData.get("callId") ?? "");
  const criterionId = String(formData.get("criterionId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const maxScore = Number(formData.get("maxScore"));
  const weight = Number(formData.get("weight"));
  if (!uuidPattern.test(callId) || !uuidPattern.test(criterionId)) redirect("/admin?error=workflow");
  if (name.length < 2 || name.length > 150 || description.length > 2000 || !Number.isInteger(maxScore) || maxScore < 1 || maxScore > 1000 || !Number.isFinite(weight) || weight <= 0 || weight > 100) redirect(`/admin/calls/${callId}?error=criterion`);
  const [criterion] = await db.select({ id: criteria.id, stageId: criteria.stageId }).from(criteria)
    .innerJoin(workflowStages, eq(criteria.stageId, workflowStages.id))
    .where(and(eq(criteria.id, criterionId), eq(workflowStages.callId, callId))).limit(1);
  if (!criterion) redirect(`/admin/calls/${callId}?error=criterion`);
  const [existingScore] = await db.select({ evaluationId: evaluationScores.evaluationId }).from(evaluationScores)
    .where(eq(evaluationScores.criterionId, criterion.id)).limit(1);
  if (existingScore) redirect(`/admin/calls/${callId}?error=criterion_locked`);
  await db.transaction(async (tx) => {
    await tx.update(criteria).set({ name, description: description || null, maxScore, weight: weight.toFixed(2) }).where(eq(criteria.id, criterion.id));
    await writeAudit(tx, { actorId: admin.id, action: "evaluation.criterion.updated", entityType: "criterion", entityId: criterion.id, metadata: { stageId: criterion.stageId, name, maxScore, weight } });
  });
  revalidatePath(`/admin/calls/${callId}`);
}

export async function setEvaluationCriterionArchived(formData: FormData) {
  const admin = await requireRole("admin", "/admin");
  const callId = String(formData.get("callId") ?? "");
  const criterionId = String(formData.get("criterionId") ?? "");
  const archived = String(formData.get("archived") ?? "") === "true";
  if (!uuidPattern.test(callId) || !uuidPattern.test(criterionId)) redirect("/admin?error=workflow");
  const [criterion] = await db.select({ id: criteria.id, stageId: criteria.stageId }).from(criteria)
    .innerJoin(workflowStages, eq(criteria.stageId, workflowStages.id))
    .where(and(eq(criteria.id, criterionId), eq(workflowStages.callId, callId))).limit(1);
  if (!criterion) redirect(`/admin/calls/${callId}?error=criterion`);
  await db.transaction(async (tx) => {
    await tx.update(criteria).set({ isArchived: archived }).where(eq(criteria.id, criterion.id));
    await writeAudit(tx, { actorId: admin.id, action: archived ? "evaluation.criterion.archived" : "evaluation.criterion.restored", entityType: "criterion", entityId: criterion.id, metadata: { stageId: criterion.stageId } });
  });
  revalidatePath(`/admin/calls/${callId}`);
}
