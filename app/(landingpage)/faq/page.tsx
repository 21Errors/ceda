import { FaqBrowser } from "@/components/faq/FaqBrowser";
import { loadPublishedFaqs } from "@/lib/server/admin-content";

export default async function FaqPage() {
  const questions = await loadPublishedFaqs();

  return <FaqBrowser questions={questions} />;
}
