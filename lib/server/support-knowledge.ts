import "server-only";

import { loadPublishedFaqs } from "@/lib/server/admin-content";
import { getAllContentBlocks } from "@/lib/server/portal-content";
import { resolveGuidelinesBlocks } from "@/lib/portal-content";

export async function searchSupportKnowledge(query: string) {
  const words = new Set(query.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? []);
  if (!words.size) return [];
  const [faqs, blocks] = await Promise.all([loadPublishedFaqs(), getAllContentBlocks()]);
  const entries = [
    ...faqs.map((faq) => ({ title: faq.question, body: faq.answer, href: "/faq", source: "Frequently asked question" })),
    ...resolveGuidelinesBlocks(blocks).map((block) => ({ title: block.title, body: block.body, href: "/guidelines", source: "Application guidelines" })),
  ];
  return entries.map((entry) => {
    const text = `${entry.title} ${entry.body}`.toLowerCase();
    let matched = 0;
    for (const word of words) if (text.includes(word)) matched++;
    return { ...entry, score: matched / words.size };
  }).filter((entry) => entry.score > 0.2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((entry) => ({ title: entry.title, body: entry.body, href: entry.href, source: entry.source }));
}
