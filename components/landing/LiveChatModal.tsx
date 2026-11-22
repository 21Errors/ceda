"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  AlertTriangle,
  CalendarOff,
  Clock,
  MessageSquare,
  Send,
  Users,
  X,
} from "lucide-react";
import {
  FieldErrorMessage,
  FormErrorAnnouncer,
} from "@/components/ui/FormErrorFeedback";
import type { DeskAvailability } from "@/lib/chat-availability";
import {
  chatMessageSchema,
  type ChatMessageFormValues,
} from "@/lib/form-schemas";
import { zodResolver } from "@/lib/zod-resolver";

type Message = {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
};
type Conversation = {
  id: string;
  status: "waiting" | "active" | "closed";
  startedAt: string;
};
type ChatState = {
  conversation: Conversation | null;
  messages: Message[];
  currentUserId: string;
  isConsultantOpen: boolean;
  availability?: DeskAvailability;
  queuePosition?: number | null;
};

interface LiveChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LiveChatModal({ isOpen, onClose }: LiveChatModalProps) {
  if (!isOpen) return null;
  return <LiveChatWindow onClose={onClose} />;
}

function LiveChatWindow({ onClose }: Pick<LiveChatModalProps, "onClose">) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [chat, setChat] = useState<ChatState | null>(null);
  const [signedOut, setSignedOut] = useState(false);
  const [busy, setBusy] = useState(false);
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

  const refresh = useCallback(async () => {
    const response = await fetch("/api/chat", { cache: "no-store" }).catch(
      () => null,
    );
    if (response?.status === 401) {
      setSignedOut(true);
      return;
    }
    const data = await response?.json().catch(() => null);
    if (!response?.ok || !data) {
      setError("We could not load your conversation. Please try again.");
      return;
    }
    setSignedOut(false);
    setChat(data as ChatState);
    setError("");
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    let active = true;
    const poll = () => {
      void fetch("/api/chat", { cache: "no-store" })
        .then(async (response) => ({
          response,
          data:
            response.status === 401
              ? null
              : await response.json().catch(() => null),
        }))
        .then(({ response, data }) => {
          if (!active) return;
          if (response.status === 401) {
            setSignedOut(true);
            return;
          }
          if (!response.ok || !data) {
            setError("We could not load your conversation. Please try again.");
            return;
          }
          setSignedOut(false);
          setChat(data as ChatState);
          setError("");
        })
        .catch(() => {
          if (active) {
            setError("We could not load your conversation. Please try again.");
          }
        });
    };
    queueMicrotask(poll);
    const timer = window.setInterval(poll, 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  async function startConversation() {
    setBusy(true);
    setError("");
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "start" }),
    }).catch(() => null);
    const result = await response?.json().catch(() => null);
    setBusy(false);
    if (!response?.ok) {
      setError(result?.error ?? "We could not start your conversation.");
      return;
    }
    await refresh();
  }

  async function sendMessage(values: ChatMessageFormValues) {
    if (!chat?.conversation || busy) return;
    setBusy(true);
    setError("");
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "message",
        conversationId: chat.conversation.id,
        body: values.body,
      }),
    }).catch(() => null);
    const result = await response?.json().catch(() => null);
    setBusy(false);
    if (!response?.ok) {
      setError(result?.error ?? "Your message was not sent.");
      return;
    }
    reset();
    await refresh();
  }

  const availability = chat?.availability;
  const isOpen = availability?.isOpen ?? chat?.isConsultantOpen ?? false;
  const allAgentsBusy = availability?.allAgentsBusy ?? false;
  const isPublicHoliday = availability?.status === "public_holiday";
  const conversation = chat?.conversation;
  const closed = conversation?.status === "closed";
  const queuePosition = chat?.queuePosition ?? null;

  const headerStatusText = isPublicHoliday
    ? `Public holiday · ${availability?.holidayName ?? "Closed today"}`
    : !isOpen
      ? "Offline · 09:00–16:00 CAT, weekdays"
      : allAgentsBusy
        ? "All consultants busy · Queued"
        : "Available · 09:00–16:00 CAT, weekdays";

  const showBanner = Boolean(
    availability?.bannerMessage ||
      (!isOpen &&
        "Messages are saved to the consultant queue for the next working day."),
  );

  const bannerMessage =
    availability?.bannerMessage ??
    "Messages are saved to the consultant queue for the next working day.";

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="chat-modal-title"
      className="fixed inset-0 m-0 flex h-dvh max-h-none w-screen max-w-none items-center justify-center overflow-hidden bg-transparent p-3 text-inherit backdrop:bg-[#37231A]/60 backdrop:backdrop-blur-sm sm:p-4">
      <section className="relative flex h-[600px] max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-[#7A1F14]/20 bg-[#FFF9F4] shadow-2xl">
        <header className="flex items-center justify-between bg-[#7A1F14] p-4 text-white sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F4B58A] text-sm font-black text-[#7A1F14]">
              C
            </div>
            <div>
              <h2 id="chat-modal-title" className="text-sm font-bold">
                CEDA Service Consultant
              </h2>
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[#F4B58A]">
                <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                {headerStatusText}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
            aria-label="Close chat">
            <X className="h-5 w-5" />
          </button>
        </header>

        {showBanner && (
          <div
            role="status"
            className={`flex items-start gap-2.5 border-b px-4 py-2.5 text-xs font-medium ${
              allAgentsBusy
                ? "border-amber-600/25 bg-amber-50 text-amber-950"
                : "border-[#7A1F14]/20 bg-[#FFF0E2] text-[#7A1F14]"
            }`}>
            {isPublicHoliday ? (
              <CalendarOff
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-[#E8710A]"
              />
            ) : allAgentsBusy ? (
              <Users
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"
              />
            ) : (
              <AlertTriangle
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-[#E8710A]"
              />
            )}
            <div className="min-w-0">
              <span>{bannerMessage}</span>
              {conversation?.status === "waiting" && queuePosition !== null && (
                <span className="mt-1 block font-bold">
                  Your queue position: #{queuePosition}
                </span>
              )}
            </div>
          </div>
        )}

        {signedOut ? (
          <div className="flex flex-1 flex-col items-center justify-center px-7 text-center">
            <MessageSquare className="h-9 w-9 text-ceda-burgundy" />
            <h3 className="mt-4 text-lg font-bold text-ceda-ink">
              Sign in to save your conversation
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-ceda-muted">
              Your chat history is attached to your portal account so you can
              return to it later.
            </p>
            <Link
              href="/login?next=%2F"
              className="mt-5 inline-flex min-h-11 items-center rounded-full bg-ceda-burgundy px-5 text-sm font-bold text-white">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="mt-3 text-sm font-semibold text-ceda-burgundy underline underline-offset-4">
              Create an account
            </Link>
          </div>
        ) : (
          <>
            <div
              className="flex-1 space-y-4 overflow-y-auto bg-[#FFF6EE]/60 p-4 text-sm sm:p-5"
              aria-live="polite"
              aria-label="Conversation messages">
              {!conversation && (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <MessageSquare className="h-8 w-8 text-ceda-burgundy" />
                  <h3 className="mt-3 font-bold text-ceda-ink">
                    Get help with your submission
                  </h3>
                  <p className="mt-2 max-w-xs text-xs leading-5 text-ceda-muted">
                    {allAgentsBusy
                      ? "All consultants are currently assisting other applicants, but you can join the queue now and leave your question."
                      : isOpen
                        ? "Start a live conversation with a CEDA service consultant."
                        : "Start a conversation with the CEDA team. Your message will be queued for the next working day."}
                  </p>
                  <button
                    type="button"
                    onClick={startConversation}
                    disabled={busy}
                    className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-ceda-burgundy px-5 text-sm font-bold text-white hover:bg-[#5C150D] disabled:opacity-60">
                    <MessageSquare className="h-4 w-4" />
                    Start a conversation
                  </button>
                </div>
              )}

              {conversation && chat?.messages.length === 0 && (
                <p className="mx-auto mt-4 max-w-xs rounded-2xl bg-[#FFF0E2] px-4 py-3 text-center text-xs leading-5 text-[#7A1F14]">
                  {conversation.status === "closed"
                    ? "This conversation is closed."
                    : isPublicHoliday
                      ? `The service desk is closed for ${availability?.holidayName ?? "a public holiday"}. Send your message and a consultant will follow up on the next working day.`
                      : !isOpen
                        ? "Your conversation is saved in the queue. A consultant will respond during office hours (09:00–16:00 CAT, weekdays)."
                        : allAgentsBusy
                          ? `All consultants are currently busy${queuePosition ? ` (you are #${queuePosition} in the queue)` : ""}. Send your question now so the next available consultant can assist you right away.`
                          : "Your conversation is open. Send a message and a consultant will join shortly."}
                </p>
              )}

              {chat?.messages.map((item) => {
                const ownMessage = item.senderId === chat.currentUserId;
                return (
                  <div
                    key={item.id}
                    className={`flex max-w-[88%] items-start gap-2 ${ownMessage ? "ml-auto justify-end" : ""}`}>
                    {!ownMessage && (
                      <span
                        aria-hidden="true"
                        className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#7A1F14]/20 bg-[#FFF0E2] text-[10px] font-bold text-[#7A1F14]">
                        {item.senderName.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <div
                      className={`space-y-1 rounded-2xl p-3.5 shadow-sm ${ownMessage ? "rounded-tr-none bg-[#7A1F14] text-white" : "rounded-tl-none border border-[#7A1F14]/15 bg-white text-[#37231A]"}`}>
                      <p className="text-[10px] font-semibold opacity-75">
                        {ownMessage ? "You" : item.senderName}
                      </p>
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {item.body}
                      </p>
                      <time
                        className={`block text-right text-[10px] ${ownMessage ? "text-[#F4B58A]" : "text-[#573E32]/60"}`}
                        dateTime={item.createdAt}>
                        {new Date(item.createdAt).toLocaleTimeString("en-BW", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Africa/Gaborone",
                        })}
                      </time>
                    </div>
                  </div>
                );
              })}

              {conversation &&
                conversation.status === "waiting" &&
                (chat?.messages.length ?? 0) > 0 &&
                allAgentsBusy && (
                  <p
                    role="status"
                    className="mx-auto max-w-sm rounded-xl border border-amber-600/20 bg-amber-50 px-3.5 py-2.5 text-center text-xs leading-5 text-amber-950">
                    All consultants are still assisting other applicants
                    {queuePosition ? ` · Queue position #${queuePosition}` : ""}.
                    You can leave this window open or return later — your
                    conversation stays saved.
                  </p>
                )}
            </div>

            {error && (
              <p
                className="border-t border-red-800/20 bg-red-50 px-4 py-2 text-xs text-red-900"
                role="alert">
                {error}
              </p>
            )}

            {conversation && closed ? (
              <div className="border-t border-[#7A1F14]/10 bg-white p-4">
                <p className="text-center text-xs text-ceda-muted">
                  This conversation is closed.
                </p>
                <button
                  type="button"
                  onClick={startConversation}
                  disabled={busy}
                  className="mt-3 min-h-10 w-full rounded-full border border-ceda-line text-sm font-semibold text-ceda-burgundy">
                  Start a new conversation
                </button>
              </div>
            ) : (
              conversation && (
                <>
                  <FormErrorAnnouncer
                    errors={errors}
                    submitCount={submitCount}
                  />
                  <form
                    noValidate
                    onSubmit={handleSubmit(sendMessage)}
                    aria-label="Send a chat message"
                    className="border-t border-[#7A1F14]/10 bg-white p-3.5">
                    <div className="flex items-center gap-2">
                      <label htmlFor="chat-message" className="sr-only">
                        Message to CEDA consultant
                      </label>
                      <input
                        id="chat-message"
                        type="text"
                        maxLength={2000}
                        autoComplete="off"
                        aria-invalid={errors.body ? "true" : "false"}
                        aria-describedby={
                          errors.body ? "chat-message-error" : undefined
                        }
                        placeholder={
                          !isOpen
                            ? "Leave an offline inquiry…"
                            : allAgentsBusy
                              ? "Leave your question for the next consultant…"
                              : "Type your message…"
                        }
                        className="ds-field-control min-h-11 flex-1 rounded-full border border-[#7A1F14]/20 bg-[#FFF9F4] px-4 text-sm text-[#37231A] placeholder:text-[#573E32]/60 focus-visible:outline-2 focus-visible:outline-[#7A1F14]"
                        {...register("body")}
                      />
                      <button
                        type="submit"
                        disabled={busy}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#7A1F14] text-white hover:bg-[#60170E] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A1F14]"
                        aria-label="Send message">
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                    <FieldErrorMessage
                      id="chat-message-error"
                      message={errors.body?.message}
                      className="px-2"
                    />
                  </form>
                </>
              )
            )}
          </>
        )}
      </section>
    </dialog>
  );
}
