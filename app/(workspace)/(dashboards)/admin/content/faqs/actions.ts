"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { faqs, faqSuggestions } from "@/db/schema";
import { requireRole } from "@/lib/authorization";
import { writeAudit } from "@/lib/server/audit";

const uuidPattern = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

function readFields(formData: FormData) {
  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  const topicInput = String(formData.get("topic") ?? "").trim();
  const positionText = String(formData.get("position") ?? "0").trim();
  const position = Number(positionText);
  if (!question || question.length > 500 || !answer || answer.length > 5000 || topicInput.length > 100 || !Number.isInteger(position) || position < 0 || position > 100000) return null;
  return { question, answer, topic: topicInput || null, position, isPublished: formData.get("isPublished") === "true" };
}

function refreshFaqPaths() {
  updateTag("faqs");
  revalidatePath("/admin/content/faqs");
  revalidatePath("/faq");
}

export async function createFaq(formData: FormData) {
  const admin = await requireRole("admin", "/admin/content/faqs");
  const values = readFields(formData);
  if (!values) redirect("/admin/content/faqs?error=invalid");
  const created = await db.transaction(async (tx) => {
    const [row] = await tx.insert(faqs).values(values).returning({ id: faqs.id });
    if (!row) return null;
    await writeAudit(tx, { actorId: admin.id, action: "faq.created", entityType: "faq", entityId: row.id, metadata: { published: values.isPublished } });
    return row;
  });
  if (!created) redirect("/admin/content/faqs?error=invalid");
  refreshFaqPaths();
  redirect("/admin/content/faqs?notice=saved");
}

export async function updateFaq(formData: FormData) {
  const admin = await requireRole("admin", "/admin/content/faqs");
  const id = String(formData.get("faqId") ?? "");
  const values = readFields(formData);
  if (!uuidPattern.test(id) || !values) redirect("/admin/content/faqs?error=invalid");
  const updated = await db.transaction(async (tx) => {
    const [row] = await tx.update(faqs).set(values).where(eq(faqs.id, id)).returning({ id: faqs.id });
    if (!row) return null;
    await writeAudit(tx, { actorId: admin.id, action: "faq.updated", entityType: "faq", entityId: id, metadata: { published: values.isPublished } });
    return row;
  });
  if (!updated) redirect("/admin/content/faqs?error=notfound");
  refreshFaqPaths();
  redirect("/admin/content/faqs?notice=saved");
}

export async function deleteFaq(formData: FormData) {
  const admin = await requireRole("admin", "/admin/content/faqs");
  const id = String(formData.get("faqId") ?? "");
  if (!uuidPattern.test(id)) redirect("/admin/content/faqs?error=invalid");
  const deleted = await db.transaction(async (tx) => {
    const [row] = await tx.delete(faqs).where(eq(faqs.id, id)).returning({ id: faqs.id });
    if (!row) return null;
    await writeAudit(tx, { actorId: admin.id, action: "faq.deleted", entityType: "faq", entityId: id });
    return row;
  });
  if (!deleted) redirect("/admin/content/faqs?error=notfound");
  refreshFaqPaths();
  redirect("/admin/content/faqs?notice=deleted");
}

export async function approveFaqSuggestion(formData: FormData) {
  const admin = await requireRole("admin", "/admin/content/faqs");
  const id = String(formData.get("suggestionId") ?? "");
  if (!uuidPattern.test(id)) redirect("/admin/content/faqs?error=invalid");
  const approved = await db.transaction(async (tx) => {
    const [suggestion] = await tx.select().from(faqSuggestions).where(eq(faqSuggestions.id, id)).limit(1);
    if (!suggestion || suggestion.status !== "pending") return false;
    const [faq] = await tx.insert(faqs).values({ question: suggestion.question, answer: suggestion.answer, topic: "Applicant Support", position: 0, isPublished: true }).returning({ id: faqs.id });
    if (!faq) return false;
    await tx.update(faqSuggestions).set({ status: "approved", reviewedBy: admin.id, reviewedAt: new Date() }).where(eq(faqSuggestions.id, id));
    await writeAudit(tx, { actorId: admin.id, action: "faq.suggestion_approved", entityType: "faq_suggestion", entityId: id, metadata: { faqId: faq.id } });
    return true;
  });
  if (!approved) redirect("/admin/content/faqs?error=notfound");
  refreshFaqPaths();
  redirect("/admin/content/faqs?notice=suggestion-approved");
}

export async function rejectFaqSuggestion(formData: FormData) {
  const admin = await requireRole("admin", "/admin/content/faqs");
  const id = String(formData.get("suggestionId") ?? "");
  if (!uuidPattern.test(id)) redirect("/admin/content/faqs?error=invalid");
  const rejected = await db.transaction(async (tx) => {
    const [row] = await tx.update(faqSuggestions).set({ status: "rejected", reviewedBy: admin.id, reviewedAt: new Date() })
      .where(and(eq(faqSuggestions.id, id), eq(faqSuggestions.status, "pending"))).returning({ id: faqSuggestions.id });
    if (!row) return false;
    await writeAudit(tx, { actorId: admin.id, action: "faq.suggestion_rejected", entityType: "faq_suggestion", entityId: id });
    return true;
  });
  if (!rejected) redirect("/admin/content/faqs?error=notfound");
  revalidatePath("/admin/content/faqs");
  redirect("/admin/content/faqs?notice=suggestion-rejected");
}

