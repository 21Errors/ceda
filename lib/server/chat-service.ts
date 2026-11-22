import "server-only";

import { and, asc, count, desc, eq, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  chatConversations,
  chatMessages,
  roles,
  systemSettings,
  user,
  userRoles,
} from "@/db/schema";
import {
  DEFAULT_MAX_CONCURRENT_CHATS_PER_AGENT,
  evaluateDeskAvailability,
  type DeskAvailability,
} from "@/lib/chat-availability";
import {
  computeChatAnalytics,
  type ChatAnalyticsSummary,
} from "@/lib/chat-analytics-calc";

export interface QueueConversationItem {
  id: string;
  requesterId: string;
  requesterName: string;
  agentId: string | null;
  status: "waiting" | "active" | "closed";
  startedAt: string;
  closedAt: string | null;
  messageCount: number;
  lastMessageAt: string | null;
}

function parseExtraHolidays(value: unknown): Map<string, string> {
  const map = new Map<string, string>();
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item)) {
        map.set(item, "Public Holiday");
      } else if (
        item &&
        typeof item === "object" &&
        "date" in item &&
        typeof item.date === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(item.date)
      ) {
        const name =
          "name" in item && typeof item.name === "string" && item.name.trim()
            ? item.name.trim()
            : "Public Holiday";
        map.set(item.date, name);
      }
    }
  }
  return map;
}

export async function getLiveDeskAvailability(): Promise<DeskAvailability> {
  const [consultantRows, activeRows, waitingRows, settingsRows] =
    await Promise.all([
      db
        .select({ userId: userRoles.userId })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(roles.key, "consultant")),
      db
        .select({
          agentId: chatConversations.agentId,
          total: count(),
        })
        .from(chatConversations)
        .where(eq(chatConversations.status, "active"))
        .groupBy(chatConversations.agentId),
      db
        .select({ total: count() })
        .from(chatConversations)
        .where(eq(chatConversations.status, "waiting")),
      db
        .select({ key: systemSettings.key, value: systemSettings.value })
        .from(systemSettings)
        .where(
          inArray(systemSettings.key, [
            "chat.public_holidays",
            "chat.max_concurrent_per_agent",
          ]),
        ),
    ]);

  const activeByConsultant = new Map<string, number>();
  for (const row of activeRows) {
    if (row.agentId) {
      activeByConsultant.set(row.agentId, Number(row.total ?? 0));
    }
  }

  const holidaySetting = settingsRows.find(
    (row) => row.key === "chat.public_holidays",
  )?.value;
  const maxSetting = settingsRows.find(
    (row) => row.key === "chat.max_concurrent_per_agent",
  )?.value;
  const maxConcurrentPerAgent =
    typeof maxSetting === "number" && Number.isFinite(maxSetting) && maxSetting >= 1
      ? Math.floor(maxSetting)
      : DEFAULT_MAX_CONCURRENT_CHATS_PER_AGENT;

  return evaluateDeskAvailability({
    totalConsultants: consultantRows.length,
    activeByConsultant,
    waitingCount: Number(waitingRows[0]?.total ?? 0),
    maxConcurrentPerAgent,
    extraHolidays: parseExtraHolidays(holidaySetting),
  });
}

export async function getWaitingQueuePosition(
  conversationId: string,
): Promise<number | null> {
  const waiting = await db
    .select({ id: chatConversations.id })
    .from(chatConversations)
    .where(
      and(
        eq(chatConversations.status, "waiting"),
        isNull(chatConversations.agentId),
      ),
    )
    .orderBy(asc(chatConversations.startedAt));

  const index = waiting.findIndex((row) => row.id === conversationId);
  return index >= 0 ? index + 1 : null;
}

export async function getConsultantQueueData(consultantId: string): Promise<{
  myActive: QueueConversationItem[];
  waiting: QueueConversationItem[];
  recentClosed: QueueConversationItem[];
}> {
  const [openRows, closedRows] = await Promise.all([
    db
      .select({
        id: chatConversations.id,
        requesterId: chatConversations.requesterId,
        requesterName: user.name,
        agentId: chatConversations.agentId,
        status: chatConversations.status,
        startedAt: chatConversations.startedAt,
        closedAt: chatConversations.closedAt,
      })
      .from(chatConversations)
      .innerJoin(user, eq(chatConversations.requesterId, user.id))
      .where(
        or(
          and(
            eq(chatConversations.status, "active"),
            eq(chatConversations.agentId, consultantId),
          ),
          and(
            eq(chatConversations.status, "waiting"),
            isNull(chatConversations.agentId),
          ),
        ),
      )
      .orderBy(asc(chatConversations.startedAt))
      .limit(200),
    db
      .select({
        id: chatConversations.id,
        requesterId: chatConversations.requesterId,
        requesterName: user.name,
        agentId: chatConversations.agentId,
        status: chatConversations.status,
        startedAt: chatConversations.startedAt,
        closedAt: chatConversations.closedAt,
      })
      .from(chatConversations)
      .innerJoin(user, eq(chatConversations.requesterId, user.id))
      .where(
        and(
          eq(chatConversations.status, "closed"),
          eq(chatConversations.agentId, consultantId),
        ),
      )
      .orderBy(desc(chatConversations.closedAt))
      .limit(10),
  ]);

  const allIds = [...openRows, ...closedRows].map((row) => row.id);
  const messageStats = allIds.length
    ? await db
        .select({
          conversationId: chatMessages.conversationId,
          total: count(),
          lastMessageAt: sql<Date | null>`max(${chatMessages.createdAt})`,
        })
        .from(chatMessages)
        .where(inArray(chatMessages.conversationId, allIds))
        .groupBy(chatMessages.conversationId)
    : [];

  const statsById = new Map(
    messageStats.map((row) => [
      row.conversationId,
      {
        total: Number(row.total ?? 0),
        lastMessageAt: row.lastMessageAt
          ? new Date(row.lastMessageAt).toISOString()
          : null,
      },
    ]),
  );

  const mapItem = (
    row: (typeof openRows)[number],
  ): QueueConversationItem => {
    const stat = statsById.get(row.id);
    return {
      id: row.id,
      requesterId: row.requesterId,
      requesterName: row.requesterName,
      agentId: row.agentId,
      status: row.status,
      startedAt: row.startedAt.toISOString(),
      closedAt: row.closedAt ? row.closedAt.toISOString() : null,
      messageCount: stat?.total ?? 0,
      lastMessageAt: stat?.lastMessageAt ?? null,
    };
  };

  return {
    myActive: openRows
      .filter((row) => row.status === "active" && row.agentId === consultantId)
      .map(mapItem),
    waiting: openRows
      .filter((row) => row.status === "waiting" && !row.agentId)
      .map(mapItem),
    recentClosed: closedRows.map(mapItem),
  };
}

export async function getChatAnalyticsSummary(): Promise<ChatAnalyticsSummary> {
  const [conversations, replyStats, messageCounts] = await Promise.all([
    db
      .select({
        id: chatConversations.id,
        requesterId: chatConversations.requesterId,
        agentId: chatConversations.agentId,
        agentName: user.name,
        status: chatConversations.status,
        startedAt: chatConversations.startedAt,
        closedAt: chatConversations.closedAt,
      })
      .from(chatConversations)
      .leftJoin(user, eq(chatConversations.agentId, user.id)),
    db
      .select({
        conversationId: chatMessages.conversationId,
        firstReplyAt: sql<Date | null>`min(${chatMessages.createdAt})`,
      })
      .from(chatMessages)
      .innerJoin(
        chatConversations,
        eq(chatMessages.conversationId, chatConversations.id),
      )
      .where(ne(chatMessages.senderId, chatConversations.requesterId))
      .groupBy(chatMessages.conversationId),
    db
      .select({
        conversationId: chatMessages.conversationId,
        total: count(),
      })
      .from(chatMessages)
      .groupBy(chatMessages.conversationId),
  ]);

  const firstReplyByConv = new Map(
    replyStats.map((row) => [
      row.conversationId,
      row.firstReplyAt ? new Date(row.firstReplyAt) : null,
    ]),
  );
  const countByConv = new Map(
    messageCounts.map((row) => [row.conversationId, Number(row.total ?? 0)]),
  );

  return computeChatAnalytics(
    conversations.map((conv) => ({
      ...conv,
      firstConsultantReplyAt: firstReplyByConv.get(conv.id) ?? null,
      messageCount: countByConv.get(conv.id) ?? 0,
    })),
  );
}
