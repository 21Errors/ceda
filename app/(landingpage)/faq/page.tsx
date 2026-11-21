import { asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { faqs } from "@/db/schema";
import { FaqBrowser } from "@/components/faq/FaqBrowser";

async function getPublishedFaqs() {
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

export default async function FaqPage() {
  const questions = await getPublishedFaqs();

  return <FaqBrowser questions={questions} />;
}
