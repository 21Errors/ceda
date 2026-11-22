import { Suspense } from "react";
import { WorkspacePageSkeleton } from "@/components/workspace/WorkspacePageSkeleton";
import { ChatQueue } from "@/components/consultant/ChatQueue";
import { requireRole } from "@/lib/authorization";
import {
  getChatAnalyticsSummary,
  getConsultantQueueData,
  getLiveDeskAvailability,
} from "@/lib/server/chat-service";

export default function ConsultantPage({
  searchParams,
}: PageProps<"/consultant">) {
  return (
    <Suspense fallback={<WorkspacePageSkeleton variant="list" />}>
      <ConsultantContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ConsultantContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const consultant = await requireRole("consultant", "/consultant");
  const [queue, availability, analytics, query] = await Promise.all([
    getConsultantQueueData(consultant.id),
    getLiveDeskAvailability(),
    getChatAnalyticsSummary(),
    searchParams,
  ]);

  const rawSelected = Array.isArray(query.conversation)
    ? query.conversation[0]
    : query.conversation;

  return (
    <main
      id="main-content"
      className="flex-1 bg-white px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-275">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-ceda-burgundy">
          CEDA service desk
        </p>
        <h1 className="mt-2 text-3xl font-bold text-ceda-ink">
          Consultant chat queue
        </h1>
        <p className="mt-2 text-sm leading-6 text-ceda-muted">
          Claim a waiting conversation to reply. Your active assigned chats stay
          pinned across page refreshes. The service desk operates weekdays from
          09:00 to 16:00 CAT (excluding Botswana public holidays).
        </p>

        <ChatQueue
          currentUserId={consultant.id}
          initialSelectedId={rawSelected ?? ""}
          initialQueue={queue}
          initialAvailability={availability}
          initialAnalytics={analytics}
        />
      </div>
    </main>
  );
}
