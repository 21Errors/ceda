"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { faqSuggestions } from "@/db/schema";
import { requireRole } from "@/lib/authorization";
import { writeAudit } from "@/lib/server/audit";

export async function submitFaqSuggestion(formData: FormData) {
  const consultant = await requireRole("consultant", "/consultant/knowledge");
  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  if (question.length < 5 || question.length > 500 || answer.length < 5 || answer.length > 5000) {
    redirect("/consultant/knowledge?error=invalid");
  }
  const [suggestion] = await db.transaction(async (tx) => {
    const [created] = await tx.insert(faqSuggestions).values({ question, answer, suggestedBy: consultant.id }).returning({ id: faqSuggestions.id });
    if (created) await writeAudit(tx, { actorId: consultant.id, action: "faq.suggestion_submitted", entityType: "faq_suggestion", entityId: created.id });
    return [created];
  });
  if (!suggestion) redirect("/consultant/knowledge?error=invalid");
  revalidatePath("/admin/content/faqs");
  redirect("/consultant/knowledge?notice=submitted");
}
