"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  CheckCircle2,
  Clock3,
  MessageSquare,
  RefreshCw,
  Users,
} from "lucide-react";
import {
  FieldErrorMessage,
  FormErrorAnnouncer,
} from "@/components/ui/FormErrorFeedback";
import type { ChatAnalyticsSummary } from "@/lib/chat-analytics-calc";
import { formatDurationSeconds } from "@/lib/chat-analytics-calc";
import type { DeskAvailability } from "@/lib/chat-availability";
import {
  chatMessageSchema,
  type ChatMessageFormValues,
} from "@/lib/form-schemas";
import type { QueueConversationItem } from "@/lib/server/chat-service";
import { zodResolver } from "@/lib/zod-resolver";

type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
};

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
  messages: ChatMessage[];
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, submitCount },
  } = useForm<ChatMessageFormValues>({
    resolver: zodResolver(chatMessageSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: { body: "" },
  });

  // Restore last selected conversation from sessionStorage on initial mount if URL had none
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

  const refreshQueue = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) setRefreshingQueue(true);
      const response = await fetch("/api/chat?scope=queue", {
        cache: "no-store",
      }).catch(() => null);
      const data = (await response?.json().catch(() => null)) as
        | QueuePayload
        | null;
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
    },
    [],
  );

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

  async function onSend(values: ChatMessageFormValues) {
    if (busy) return;
    if (await act("message", values.body)) reset();
  }

  const allItems = useMemo(
    () => [...queue.myActive, ...queue.waiting, ...queue.recentClosed],
    [queue],
  );
  const selectedItem = allItems.find((item) => item.id === selectedId) ?? null;
  const activeConversation = chat?.conversation;
  const effectiveStatus =
    activeConversation?.status ?? selectedItem?.status ?? null;
  const assignedToMe =
    (activeConversation?.agentId ?? selectedItem?.agentId) === currentUserId;

  const deskStatusLabel =
    availability.status === "public_holiday"
      ? `Public holiday (${availability.holidayName})`
      : availability.status === "offline_hours"
        ? "Offline (09:00–16:00 CAT)"
        : availability.status === "busy"
          ? "All agents at capacity"
          : "Desk open & accepting chats";

  const deskStatusTone =
    availability.status === "open"
      ? "border-emerald-700/25 bg-emerald-50 text-emerald-900"
      : availability.status === "busy"
        ? "border-amber-600/30 bg-amber-50 text-amber-950"
        : "border-ceda-line bg-[#FFF9F4] text-ceda-burgundy";

  return (
    <div className="mt-6 space-y-6">
      {/* Desk status & live chat analytics summary */}
      <section aria-label="Service desk status and chat analytics">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold ${deskStatusTone}`}>
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full ${
                availability.status === "open"
                  ? "bg-emerald-600"
                  : availability.status === "busy"
                    ? "bg-amber-600"
                    : "bg-ceda-burgundy"
              }`}
            />
            {deskStatusLabel} · Your active load: {queue.myActive.length} /{" "}
            {availability.maxConcurrentPerAgent}
          </span>
          <button
            type="button"
            onClick={() => void refreshQueue(true)}
            disabled={refreshingQueue}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-ceda-line bg-white px-4 text-xs font-semibold text-ceda-burgundy hover:bg-[#FFF9F4] disabled:opacity-60">
            <RefreshCw
              aria-hidden="true"
              className={`h-3.5 w-3.5 ${refreshingQueue ? "animate-spin" : ""}`}
            />
            Refresh queue
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-2xl border border-ceda-line bg-[#FFFDFC] p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-ceda-muted">
              <MessageSquare aria-hidden="true" className="h-3.5 w-3.5 text-ceda-burgundy" />
              Total chats (7d)
            </p>
            <p className="mt-1.5 text-2xl font-bold text-ceda-ink">
              {analytics.totalConversations}
              <span className="ml-2 text-xs font-normal text-ceda-muted">
                ({analytics.conversationsLast7Days} last 7d)
              </span>
            </p>
          </article>

          <article className="rounded-2xl border border-ceda-line bg-[#FFFDFC] p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-ceda-muted">
              <Users aria-hidden="true" className="h-3.5 w-3.5 text-ceda-burgundy" />
              Queue &amp; active
            </p>
            <p className="mt-1.5 text-2xl font-bold text-ceda-ink">
              {analytics.waitingCount} waiting
              <span className="ml-2 text-xs font-normal text-ceda-muted">
                · {analytics.activeCount} active
              </span>
            </p>
          </article>

          <article className="rounded-2xl border border-ceda-line bg-[#FFFDFC] p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-ceda-muted">
              <Clock3 aria-hidden="true" className="h-3.5 w-3.5 text-ceda-burgundy" />
              Avg first response
            </p>
            <p className="mt-1.5 text-2xl font-bold text-ceda-ink">
              {formatDurationSeconds(analytics.averageFirstResponseSeconds)}
              <span className="ml-2 text-xs font-normal text-ceda-muted">
                (median{" "}
                {formatDurationSeconds(analytics.medianFirstResponseSeconds)})
              </span>
            </p>
          </article>

          <article className="rounded-2xl border border-ceda-line bg-[#FFFDFC] p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-ceda-muted">
              <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 text-ceda-burgundy" />
              Resolution rate
            </p>
            <p className="mt-1.5 text-2xl font-bold text-ceda-ink">
              {analytics.resolutionRatePercent !== null
                ? `${analytics.resolutionRatePercent}%`
                : "—"}
              <span className="ml-2 text-xs font-normal text-ceda-muted">
                · avg {formatDurationSeconds(analytics.averageResolutionSeconds)}
              </span>
            </p>
          </article>
        </div>
      </section>

      {/* Queue sidebar + active thread */}
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <nav aria-label="Consultant chat queue" className="space-y-5">
          {/* Assigned active chats */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-ceda-burgundy">
              My active chats ({queue.myActive.length})
            </h2>
            <div className="mt-2 space-y-2">
              {queue.myActive.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectConversation(item.id)}
                  aria-pressed={item.id === selectedId}
                  className={`w-full rounded-xl border p-3.5 text-left transition ${
                    item.id === selectedId
                      ? "border-ceda-burgundy bg-[#FFF9F4] ring-1 ring-ceda-burgundy/20"
                      : "border-ceda-line bg-white hover:bg-[#FFFDFC]"
                  }`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-bold text-ceda-ink">
                      {item.requesterName}
                    </span>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-900">
                      Active
                    </span>
                  </div>
                  <span className="mt-1 block text-xs text-ceda-muted">
                    {item.messageCount}{" "}
                    {item.messageCount === 1 ? "message" : "messages"} · Started{" "}
                    {new Date(item.startedAt).toLocaleString("en-BW", {
                      dateStyle: "short",
                      timeStyle: "short",
                      timeZone: "Africa/Gaborone",
                    })}
                  </span>
                </button>
              ))}
              {queue.myActive.length === 0 && (
                <p className="rounded-xl border border-dashed border-ceda-line bg-[#FFFDFC] p-3.5 text-xs text-ceda-muted">
                  No active chats assigned to you right now.
                </p>
              )}
            </div>
          </div>

          {/* Waiting queue */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-ceda-muted">
              Waiting queue ({queue.waiting.length})
            </h2>
            <div className="mt-2 space-y-2">
              {queue.waiting.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectConversation(item.id)}
                  aria-pressed={item.id === selectedId}
                  className={`w-full rounded-xl border p-3.5 text-left transition ${
                    item.id === selectedId
                      ? "border-ceda-burgundy bg-[#FFF9F4] ring-1 ring-ceda-burgundy/20"
                      : "border-ceda-line bg-white hover:bg-[#FFFDFC]"
                  }`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-bold text-ceda-ink">
                      #{idx + 1} · {item.requesterName}
                    </span>
                    <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900">
                      Waiting
                    </span>
                  </div>
                  <span className="mt-1 block text-xs text-ceda-muted">
                    {item.messageCount}{" "}
                    {item.messageCount === 1 ? "message" : "messages"} · Since{" "}
                    {new Date(item.startedAt).toLocaleString("en-BW", {
                      dateStyle: "short",
                      timeStyle: "short",
                      timeZone: "Africa/Gaborone",
                    })}
                  </span>
                </button>
              ))}
              {queue.waiting.length === 0 && (
                <p className="rounded-xl bg-[#FFF9F4] p-3.5 text-xs text-ceda-muted">
                  No applicants are waiting in the queue.
                </p>
              )}
            </div>
          </div>

          {/* Recently closed by this consultant */}
          {queue.recentClosed.length > 0 && (
            <details className="rounded-xl border border-ceda-line bg-[#FFFDFC] p-3">
              <summary className="text-xs font-bold uppercase tracking-[0.14em] text-ceda-muted">
                Recently closed ({queue.recentClosed.length})
              </summary>
              <div className="mt-2.5 space-y-2">
                {queue.recentClosed.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectConversation(item.id)}
                    aria-pressed={item.id === selectedId}
                    className={`w-full rounded-lg border p-2.5 text-left text-xs ${
                      item.id === selectedId
                        ? "border-ceda-burgundy bg-[#FFF9F4]"
                        : "border-ceda-line bg-white"
                    }`}>
                    <span className="block font-semibold text-ceda-ink">
                      {item.requesterName}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-ceda-muted">
                      Closed{" "}
                      {item.closedAt
                        ? new Date(item.closedAt).toLocaleDateString("en-BW", {
                            dateStyle: "medium",
                            timeZone: "Africa/Gaborone",
                          })
                        : "—"}
                    </span>
                  </button>
                ))}
              </div>
            </details>
          )}
        </nav>

        <section
          aria-label="Selected conversation"
          className="flex min-h-125 flex-col rounded-2xl border border-ceda-line bg-white">
          {!selectedItem ? (
            <p className="m-auto p-6 text-sm text-ceda-muted">
              Select a conversation from your active chats or the waiting queue.
            </p>
          ) : (
            <>
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ceda-line p-4">
                <div>
                  <h2 className="font-bold text-ceda-ink">
                    {selectedItem.requesterName}
                  </h2>
                  <p className="text-xs capitalize text-ceda-muted">
                    {effectiveStatus ?? selectedItem.status}
                    {assignedToMe ? " · Assigned to you" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {effectiveStatus === "waiting" &&
                    !(activeConversation?.agentId ?? selectedItem.agentId) && (
                      <button
                        type="button"
                        onClick={() => void act("claim")}
                        disabled={busy}
                        className="min-h-10 rounded-full bg-ceda-burgundy px-4 text-sm font-bold text-white hover:bg-[#5C150D] disabled:opacity-60">
                        Claim chat
                      </button>
                    )}
                  {assignedToMe && effectiveStatus === "active" && (
                    <button
                      type="button"
                      onClick={() => void act("close")}
                      disabled={busy}
                      className="min-h-10 rounded-full border border-ceda-line px-4 text-sm font-semibold text-ceda-burgundy hover:bg-[#FFF9F4] disabled:opacity-60">
                      Close chat
                    </button>
                  )}
                </div>
              </header>

              {error && (
                <p
                  role="alert"
                  className="border-b border-red-800/20 bg-red-50 px-4 py-3 text-sm text-red-900">
                  {error}
                </p>
              )}

              <div
                className="flex-1 space-y-3 overflow-y-auto p-4"
                aria-live="polite"
                aria-label="Conversation messages">
                {chat?.messages.map((item) => (
                  <article
                    key={item.id}
                    className={`max-w-[85%] rounded-xl p-3 ${
                      item.senderId === currentUserId
                        ? "ml-auto bg-[#7A1F14] text-white"
                        : "border border-ceda-line bg-[#FFF9F4] text-ceda-ink"
                    }`}>
                    <p className="text-xs font-semibold">{item.senderName}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6">
                      {item.body}
                    </p>
                    <time
                      className="mt-1 block text-right text-[10px] opacity-70"
                      dateTime={item.createdAt}>
                      {new Date(item.createdAt).toLocaleTimeString("en-BW", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Africa/Gaborone",
                      })}
                    </time>
                  </article>
                ))}
                {chat && chat.messages.length === 0 && (
                  <p className="text-sm text-ceda-muted">
                    No messages have been sent yet.
                  </p>
                )}
              </div>

              {assignedToMe && effectiveStatus === "active" && (
                <>
                  <FormErrorAnnouncer
                    errors={errors}
                    submitCount={submitCount}
                  />
                  <form
                    noValidate
                    onSubmit={handleSubmit(onSend)}
                    className="border-t border-ceda-line p-3">
                    <div className="flex gap-2">
                      <label htmlFor="consultant-reply" className="sr-only">
                        Reply to requester
                      </label>
                      <input
                        id="consultant-reply"
                        maxLength={2000}
                        aria-invalid={errors.body ? "true" : "false"}
                        aria-describedby={
                          errors.body ? "consultant-reply-error" : undefined
                        }
                        className="ds-field-control min-h-11 flex-1 rounded-lg border border-ceda-line px-3 text-sm"
                        placeholder="Write a reply"
                        {...register("body")}
                      />
                      <button
                        type="submit"
                        disabled={busy}
                        className="min-h-11 rounded-full bg-ceda-burgundy px-4 text-sm font-bold text-white hover:bg-[#5C150D] disabled:opacity-60">
                        Send
                      </button>
                    </div>
                    <FieldErrorMessage
                      id="consultant-reply-error"
                      message={errors.body?.message}
                    />
                  </form>
                </>
              )}

              {effectiveStatus === "closed" && (
                <p className="border-t border-ceda-line bg-[#FFFDFC] px-4 py-3 text-center text-xs text-ceda-muted">
                  This conversation has been resolved and closed.
                </p>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
