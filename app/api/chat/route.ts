import { and, count, desc, eq, gt, inArray, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { chatConversations, chatMessages, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getUserRoles } from "@/lib/authorization";
import { writeAudit } from "@/lib/server/audit";
import {
  getChatAnalyticsSummary,
  getConsultantQueueData,
  getLiveDeskAvailability,
  getWaitingQueuePosition,
} from "@/lib/server/chat-service";
import {
  dispatchNotificationEmails,
  getUsersWithRole,
  insertInAppNotifications,
} from "@/lib/server/notifications";

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function GET(request: Request) {
  const currentUser = await getSessionUser();
  if (!currentUser) {
    return NextResponse.json(
      { error: "Sign in to use saved consultant chat." },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const scope = url.searchParams.get("scope");

  if (scope === "queue") {
    const roles = await getUserRoles(currentUser.id);
    if (!roles.includes("consultant")) {
      return NextResponse.json(
        { error: "Consultant access is required." },
        { status: 403 },
      );
    }

    const [queue, availability, analytics] = await Promise.all([
      getConsultantQueueData(currentUser.id),
      getLiveDeskAvailability(),
      getChatAnalyticsSummary(),
    ]);

    return NextResponse.json(
      {
        ...queue,
        availability,
        analytics,
        currentUserId: currentUser.id,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const conversationId = url.searchParams.get("conversationId");
  if (conversationId && !/^[\da-f-]{36}$/i.test(conversationId)) {
    return NextResponse.json(
      { error: "Conversation not found." },
      { status: 404 },
    );
  }

  let conversation: typeof chatConversations.$inferSelect | null = null;

  if (conversationId) {
    const [requested] = await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.id, conversationId))
      .limit(1);
    if (!requested) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 },
      );
    }
    const roles = await getUserRoles(currentUser.id);
    const allowed =
      requested.requesterId === currentUser.id ||
      (roles.includes("consultant") &&
        (!requested.agentId || requested.agentId === currentUser.id));
    if (!allowed) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 },
      );
    }
    conversation = requested;
  } else {
    const [latest] = await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.requesterId, currentUser.id))
      .orderBy(desc(chatConversations.startedAt))
      .limit(1);
    conversation = latest ?? null;
  }

  const [messages, availability, queuePosition] = await Promise.all([
    conversation
      ? db
          .select({
            id: chatMessages.id,
            senderId: chatMessages.senderId,
            senderName: user.name,
            body: chatMessages.body,
            createdAt: chatMessages.createdAt,
          })
          .from(chatMessages)
          .innerJoin(user, eq(chatMessages.senderId, user.id))
          .where(eq(chatMessages.conversationId, conversation.id))
          .orderBy(desc(chatMessages.createdAt))
          .limit(100)
      : Promise.resolve([]),
    getLiveDeskAvailability(),
    conversation && conversation.status === "waiting" && !conversation.agentId
      ? getWaitingQueuePosition(conversation.id)
      : Promise.resolve(null),
  ]);

  return NextResponse.json(
    {
      conversation,
      messages: messages.reverse(),
      isConsultantOpen: availability.isOpen,
      availability,
      queuePosition,
      currentUserId: currentUser.id,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const trustedOrigin = new URL(
    process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  ).origin;
  if (!origin || origin !== trustedOrigin) {
    return NextResponse.json(
      { error: "Request origin could not be verified." },
      { status: 403 },
    );
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 8_000) {
    return NextResponse.json({ error: "Request is too large." }, { status: 413 });
  }

  const currentUser = await getSessionUser();
  if (!currentUser) {
    return NextResponse.json(
      { error: "Sign in to use saved consultant chat." },
      { status: 401 },
    );
  }
  const payload = (await request.json().catch(() => null)) as {
    action?: string;
    conversationId?: string;
    body?: string;
  } | null;
  if (!payload || typeof payload.action !== "string") {
    return NextResponse.json(
      { error: "Invalid chat request." },
      { status: 400 },
    );
  }

  if (payload.action === "start") {
    const [active] = await db
      .select({ id: chatConversations.id })
      .from(chatConversations)
      .where(
        and(
          eq(chatConversations.requesterId, currentUser.id),
          inArray(chatConversations.status, ["waiting", "active"]),
        ),
      )
      .orderBy(desc(chatConversations.startedAt))
      .limit(1);
    if (active) {
      const [availability, queuePosition] = await Promise.all([
        getLiveDeskAvailability(),
        getWaitingQueuePosition(active.id),
      ]);
      return NextResponse.json({
        conversationId: active.id,
        availability,
        queuePosition,
      });
    }

    const { conversation, events } = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(chatConversations)
        .values({ requesterId: currentUser.id, status: "waiting" })
        .returning({ id: chatConversations.id });
      if (!created) {
        throw new Error("The consultant conversation could not be created.");
      }
      await writeAudit(tx, {
        actorId: currentUser.id,
        action: "chat.started",
        entityType: "chat_conversation",
        entityId: created.id,
      });
      const consultants = await getUsersWithRole(tx, "consultant");
      const notificationEvents = consultants
        .filter(({ id }) => id !== currentUser.id)
        .map(({ id }) => ({
          userId: id,
          type: "chat_waiting",
          title: "A submitter requested a consultant",
          body: "A new conversation is waiting in the consultant queue.",
        }));
      await insertInAppNotifications(tx, notificationEvents);
      return { conversation: created, events: notificationEvents };
    });
    await dispatchNotificationEmails(events);
    const [availability, queuePosition] = await Promise.all([
      getLiveDeskAvailability(),
      getWaitingQueuePosition(conversation.id),
    ]);
    return NextResponse.json(
      { conversationId: conversation.id, availability, queuePosition },
      { status: 201 },
    );
  }

  if (payload.action === "claim" || payload.action === "close") {
    const roles = await getUserRoles(currentUser.id);
    if (!roles.includes("consultant")) {
      return NextResponse.json(
        { error: "Consultant access is required." },
        { status: 403 },
      );
    }
    if (
      !payload.conversationId ||
      !/^[\da-f-]{36}$/i.test(payload.conversationId)
    ) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 },
      );
    }
    const [conversation] = await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.id, payload.conversationId))
      .limit(1);
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 },
      );
    }
    if (
      payload.action === "claim" &&
      conversation.status === "waiting" &&
      !conversation.agentId
    ) {
      const result = await db.transaction(async (tx) => {
        const [updated] = await tx
          .update(chatConversations)
          .set({ agentId: currentUser.id, status: "active" })
          .where(
            and(
              eq(chatConversations.id, conversation.id),
              eq(chatConversations.status, "waiting"),
              isNull(chatConversations.agentId),
            ),
          )
          .returning({ id: chatConversations.id });
        if (!updated) return null;
        const event = {
          userId: conversation.requesterId,
          type: "chat_agent_joined",
          title: "A CEDA consultant joined your chat",
          body: "A consultant is now available in your conversation.",
        };
        await insertInAppNotifications(tx, [event]);
        await writeAudit(tx, {
          actorId: currentUser.id,
          action: "chat.claimed",
          entityType: "chat_conversation",
          entityId: conversation.id,
        });
        return event;
      });
      if (!result) {
        return NextResponse.json(
          { error: "Another consultant claimed this conversation first." },
          { status: 409 },
        );
      }
      await dispatchNotificationEmails([result]);
    } else if (
      payload.action === "close" &&
      conversation.agentId === currentUser.id &&
      conversation.status === "active"
    ) {
      const closed = await db.transaction(async (tx) => {
        const [updated] = await tx
          .update(chatConversations)
          .set({ status: "closed", closedAt: new Date() })
          .where(
            and(
              eq(chatConversations.id, conversation.id),
              eq(chatConversations.status, "active"),
              eq(chatConversations.agentId, currentUser.id),
            ),
          )
          .returning({ id: chatConversations.id });
        if (!updated) return false;
        await writeAudit(tx, {
          actorId: currentUser.id,
          action: "chat.closed",
          entityType: "chat_conversation",
          entityId: conversation.id,
        });
        return true;
      });
      if (!closed) {
        return NextResponse.json(
          { error: "Conversation state has changed. Refresh the queue." },
          { status: 409 },
        );
      }
    } else {
      return NextResponse.json(
        { error: "Conversation state has changed. Refresh the queue." },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: true });
  }

  if (
    payload.action !== "message" ||
    !payload.conversationId ||
    !/^[\da-f-]{36}$/i.test(payload.conversationId) ||
    typeof payload.body !== "string"
  ) {
    return NextResponse.json({ error: "Invalid chat message." }, { status: 400 });
  }
  const body = payload.body.trim();
  if (!body || body.length > 2000) {
    return NextResponse.json(
      { error: "Messages must be between 1 and 2,000 characters." },
      { status: 400 },
    );
  }
  const [conversation] = await db
    .select()
    .from(chatConversations)
    .where(eq(chatConversations.id, payload.conversationId))
    .limit(1);
  if (!conversation || conversation.status === "closed") {
    return NextResponse.json(
      { error: "This conversation is closed." },
      { status: 409 },
    );
  }
  const roles = await getUserRoles(currentUser.id);
  const isRequester = conversation.requesterId === currentUser.id;
  const isAssignedConsultant =
    roles.includes("consultant") && conversation.agentId === currentUser.id;
  if (!isRequester && !isAssignedConsultant) {
    return NextResponse.json(
      { error: "Conversation not found." },
      { status: 404 },
    );
  }

  const cutoff = new Date(Date.now() - 60_000);
  const [recent] = await db
    .select({ total: count() })
    .from(chatMessages)
    .where(
      and(
        eq(chatMessages.senderId, currentUser.id),
        gt(chatMessages.createdAt, cutoff),
      ),
    );
  if (Number(recent?.total ?? 0) >= 8) {
    return NextResponse.json(
      { error: "Please wait a moment before sending another message." },
      { status: 429 },
    );
  }

  const notificationEvents = await db.transaction(async (tx) => {
    await tx
      .insert(chatMessages)
      .values({ conversationId: conversation.id, senderId: currentUser.id, body });
    const recipientId = isRequester
      ? conversation.agentId
      : conversation.requesterId;
    const events = recipientId
      ? [
          {
            userId: recipientId,
            type: "chat_message",
            title: "New consultant chat message",
            body: "There is a new message in your CEDA consultant conversation.",
          },
        ]
      : isRequester
        ? (await getUsersWithRole(tx, "consultant"))
            .filter(({ id }) => id !== currentUser.id)
            .map(({ id }) => ({
              userId: id,
              type: "chat_message",
              title: "New message in the consultant queue",
              body: "A submitter sent a message in a conversation waiting to be claimed.",
            }))
        : [];
    await insertInAppNotifications(tx, events);
    await writeAudit(tx, {
      actorId: currentUser.id,
      action: "chat.message_sent",
      entityType: "chat_conversation",
      entityId: conversation.id,
      metadata: { senderRole: isRequester ? "requester" : "consultant" },
    });
    return events;
  });
  await dispatchNotificationEmails(notificationEvents);
  return NextResponse.json({ ok: true });
}
