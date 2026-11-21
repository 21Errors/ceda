import { Suspense } from "react";
import { asc, desc, inArray } from "drizzle-orm";
import { WorkspacePageSkeleton } from "@/components/workspace/WorkspacePageSkeleton";
import { ChatQueue } from "@/components/consultant/ChatQueue";
import { db } from "@/db";
import { chatConversations } from "@/db/schema";
import { requireRole } from "@/lib/authorization";

export default function ConsultantPage() {
  return (
    <Suspense fallback={<WorkspacePageSkeleton variant="list" />}>
      <ConsultantContent />
    </Suspense>
  );
}

async function ConsultantContent() {
  await requireRole("consultant", "/consultant");
  const conversations = await db
    .select({
      id: chatConversations.id,
      requesterId: chatConversations.requesterId,
      agentId: chatConversations.agentId,
      status: chatConversations.status,
      startedAt: chatConversations.startedAt,
    })
    .from(chatConversations)
    .where(inArray(chatConversations.status, ["waiting", "active"]))
    .orderBy(desc(chatConversations.status), asc(chatConversations.startedAt))
    .limit(200);

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
          Claim a waiting conversation to reply. The service desk operates
          weekdays from 09:00 to 16:00 CAT; offline messages remain queued.
        </p>
        <ChatQueue
          conversations={conversations.map((conversation) => ({
            ...conversation,
            startedAt: conversation.startedAt.toISOString(),
          }))}
        />
      </div>
    </main>
  );
}
