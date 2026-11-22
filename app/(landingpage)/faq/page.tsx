import { Suspense } from "react";
import { FaqBrowser } from "@/components/faq/FaqBrowser";
import { PageStub } from "@/components/PageStub";
import { loadPublishedFaqs } from "@/lib/server/admin-content";
import { io } from "next/cache";

export default function FaqPage() {
  return <Suspense fallback={<PageStub title="Frequently asked questions" description="Loading published answers..." />}>
    <FaqContent />
  </Suspense>;
}

async function FaqContent() {
  await io();
  const questions = await loadPublishedFaqs();

  return <FaqBrowser questions={questions} />;
}
