"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChatAnalyticsSummary } from "@/lib/chat-analytics-calc";
import type { DeskAvailability } from "@/lib/chat-availability";
import type { QueueConversationItem } from "@/lib/server/chat-service";
import { ChatDeskStats } from "./ChatDeskStats";
import { ChatQueueSidebar } from "./ChatQueueSidebar";
import { ChatThreadPanel, type ThreadMessage } from "./ChatThreadPanel";

type Conversation = {
  id: string;
  requesterId: string;
  agentId: string | null;
  status: "waiting" | "active" | "closed";
  startedAt: string;
  closedAt?: string | null;
};

type ChatData = {
  conversation: Conversation | null;
  messages: ThreadMessage[];
  currentUserId: string;
  isConsultantOpen: boolean;
  availability?: DeskAvailability;
};

type QueuePayload = {
  myActive: QueueConversationItem[];
  waiting: QueueConversationItem[];
  recentClosed: QueueConversationItem[];
  availability: DeskAvailability;
  analytics: ChatAnalyticsSummary;
  currentUserId: string;
};

interface ChatQueueProps {
  currentUserId: string;
  initialSelectedId: string;
  initialQueue: {
    myActive: QueueConversationItem[];
    waiting: QueueConversationItem[];
    recentClosed: QueueConversationItem[];
  };
  initialAvailability: DeskAvailability;
  initialAnalytics: ChatAnalyticsSummary;
}

const STORAGE_KEY = "ceda:consultant:selected-conversation";

function pickDefaultConversationId(
  preferredId: string,
  queue: {
    myActive: QueueConversationItem[];
    waiting: QueueConversationItem[];
    recentClosed: QueueConversationItem[];
  },
): string {
  const all = [...queue.myActive, ...queue.waiting, ...queue.recentClosed];
  if (preferredId && all.some((item) => item.id === preferredId)) {
    return preferredId;
  }
  return queue.myActive[0]?.id ?? queue.waiting[0]?.id ?? queue.recentClosed[0]?.id ?? "";
}

export function ChatQueue({
  currentUserId,
  initialSelectedId,
  initialQueue,
  initialAvailability,
  initialAnalytics,
}: ChatQueueProps) {
  const [queue, setQueue] = useState(initialQueue);
  const [availability, setAvailability] = useState(initialAvailability);
  const [analytics, setAnalytics] = useState(initialAnalytics);

  const [selectedId, setSelectedId] = useState<string>(() =>
    pickDefaultConversationId(initialSelectedId, initialQueue),
  );
  const [chat, setChat] = useState<ChatData | null>(null);
  const [busy, setBusy] = useState(false);
  const [refreshingQueue, setRefreshingQueue] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialSelectedId) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const saved = window.sessionStorage.getItem(STORAGE_KEY);
        if (!saved) return;
        const all = [
          ...initialQueue.myActive,
          ...initialQueue.waiting,
          ...initialQueue.recentClosed,
        ];
        if (all.some((item) => item.id === saved)) {
          setSelectedId(saved);
        }
      } catch {
        /* Ignore storage access errors in restricted environments. */
      }
    });
    return () => {
      active = false;
    };
  }, [initialSelectedId, initialQueue]);

  const selectConversation = useCallback((id: string) => {
    setSelectedId(id);
    try {
      if (id) {
        window.sessionStorage.setItem(STORAGE_KEY, id);
      } else {
        window.sessionStorage.removeItem(STORAGE_KEY);
      }
      const nextUrl = new URL(window.location.href);
      if (id) nextUrl.searchParams.set("conversation", id);
      else nextUrl.searchParams.delete("conversation");
      window.history.replaceState(null, "", nextUrl.toString());
    } catch {
      /* Ignore URL/storage errors. */
    }
  }, []);

  const refreshQueue = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshingQueue(true);
    const response = await fetch("/api/chat?scope=queue", {
      cache: "no-store",
    }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as QueuePayload | null;
    if (showSpinner) setRefreshingQueue(false);
    if (!response?.ok || !data) return;

    const nextQueue = {
      myActive: data.myActive,
      waiting: data.waiting,
      recentClosed: data.recentClosed,
    };
    setQueue(nextQueue);
    setAvailability(data.availability);
    setAnalytics(data.analytics);

    setSelectedId((current) => {
      const all = [
        ...nextQueue.myActive,
        ...nextQueue.waiting,
        ...nextQueue.recentClosed,
      ];
      if (current && all.some((item) => item.id === current)) {
        return current;
      }
      return pickDefaultConversationId("", nextQueue);
    });
  }, []);

  const refreshThread = useCallback(async (id: string) => {
    if (!id) {
      setChat(null);
      return;
    }
    const response = await fetch(
      `/api/chat?conversationId=${encodeURIComponent(id)}`,
      { cache: "no-store" },
    ).catch(() => null);
    const data = await response?.json().catch(() => null);
    if (!response?.ok || !data) {
      setError(data?.error ?? "Could not load this conversation.");
      return;
    }
    setChat(data as ChatData);
    setError("");
  }, []);

  useEffect(() => {
    let active = true;
    const poll = () => {
      if (!active) return;
      void refreshQueue(false);
      if (selectedId) {
        void refreshThread(selectedId);
      }
    };
    queueMicrotask(() => {
      if (active && selectedId) void refreshThread(selectedId);
    });
    const timer = window.setInterval(poll, 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [refreshQueue, refreshThread, selectedId]);

  async function act(action: "claim" | "close" | "message", body?: string) {
    if (!selectedId) return false;
    setBusy(true);
    setError("");
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action,
        conversationId: selectedId,
        ...(body ? { body } : {}),
      }),
    }).catch(() => null);
    const data = await response?.json().catch(() => null);
    setBusy(false);
    if (!response?.ok) {
      setError(data?.error ?? "The chat action failed.");
      await Promise.all([refreshQueue(false), refreshThread(selectedId)]);
      return false;
    }
    await Promise.all([refreshQueue(false), refreshThread(selectedId)]);
    return true;
  }

  const allItems = useMemo(
    () => [...queue.myActive, ...queue.waiting, ...queue.recentClosed],
    [queue],
  );
  const selectedItem = allItems.find((item) => item.id === selectedId) ?? null;
  const activeConversation = chat?.conversation;
  const effectiveStatus = activeConversation?.status ?? selectedItem?.status ?? null;
  const effectiveAgentId = activeConversation?.agentId ?? selectedItem?.agentId;
  const assignedToMe = effectiveAgentId === currentUserId;

  return (
    <div className="mt-6 space-y-6">
      <ChatDeskStats
        availability={availability}
        analytics={analytics}
        myActiveCount={queue.myActive.length}
        refreshing={refreshingQueue}
        onRefresh={() => void refreshQueue(true)}
      />

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <ChatQueueSidebar
          myActive={queue.myActive}
          waiting={queue.waiting}
          recentClosed={queue.recentClosed}
          selectedId={selectedId}
          onSelect={selectConversation}
        />

        <ChatThreadPanel
          currentUserId={currentUserId}
          selectedItem={selectedItem}
          effectiveStatus={effectiveStatus}
          assignedToMe={assignedToMe}
          hasAgent={Boolean(effectiveAgentId)}
          messages={chat ? chat.messages : null}
          busy={busy}
          error={error}
          onClaim={() => void act("claim")}
          onClose={() => void act("close")}
          onSendMessage={(body) => act("message", body)}
        />
      </div>
    </div>
  );
}
