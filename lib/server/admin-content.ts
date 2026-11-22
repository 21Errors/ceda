import "server-only";

import { asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { faqs, innovationCalls } from "@/db/schema";

export async function loadAdminFaqs() {
  return db
    .select()
    .from(faqs)
    .orderBy(asc(faqs.topic), asc(faqs.position), asc(faqs.question));
}

export async function loadPublishedFaqs() {
  "use cache";
  cacheLife("hours");
  cacheTag("faqs");

  return db
    .select({
      id: faqs.id,
      topic: faqs.topic,
      question: faqs.question,
      answer: faqs.answer,
    })
    .from(faqs)
    .where(eq(faqs.isPublished, true))
    .orderBy(asc(faqs.topic), asc(faqs.position));
}

export async function loadCallOptionsForDocuments() {
  return db
    .select({ id: innovationCalls.id, title: innovationCalls.title })
    .from(innovationCalls)
    .orderBy(asc(innovationCalls.title));
}
