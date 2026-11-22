"use client";

import { useForm } from "react-hook-form";
import {
  FieldErrorMessage,
  FormErrorAnnouncer,
} from "@/components/ui/FormErrorFeedback";
import {
  chatMessageSchema,
  type ChatMessageFormValues,
} from "@/lib/form-schemas";
import type { QueueConversationItem } from "@/lib/server/chat-service";
import { zodResolver } from "@/lib/zod-resolver";

export interface ThreadMessage {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
}

interface ChatThreadPanelProps {
  currentUserId: string;
  selectedItem: QueueConversationItem | null;
  effectiveStatus: "waiting" | "active" | "closed" | null;
  assignedToMe: boolean;
  hasAgent: boolean;
  messages: ThreadMessage[] | null;
  busy: boolean;
  error: string;
  onClaim: () => void;
  onClose: () => void;
  onSendMessage: (body: string) => Promise<boolean>;
}

export function ChatThreadPanel({
  currentUserId,
  selectedItem,
  effectiveStatus,
  assignedToMe,
  hasAgent,
  messages,
  busy,
  error,
  onClaim,
  onClose,
  onSendMessage,
}: ChatThreadPanelProps) {
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

  async function onSend(values: ChatMessageFormValues) {
    if (busy) return;
    if (await onSendMessage(values.body)) reset();
  }

  return (
    <section
      aria-label="Selected conversation"
      className="flex min-h-125 flex-col rounded-2xl border border-ceda-line bg-white"
    >
      {!selectedItem ? (
        <p className="m-auto p-6 text-sm text-ceda-muted">
          Select a conversation from your active chats or the waiting queue.
        </p>
      ) : (
        <>
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ceda-line p-4">
            <div>
              <h2 className="font-bold text-ceda-ink">{selectedItem.requesterName}</h2>
              <p className="text-xs capitalize text-ceda-muted">
                {effectiveStatus ?? selectedItem.status}
                {assignedToMe ? " · Assigned to you" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {effectiveStatus === "waiting" && !hasAgent && (
                <button
                  type="button"
                  onClick={onClaim}
                  disabled={busy}
                  className="min-h-10 rounded-full bg-ceda-burgundy px-4 text-sm font-bold text-white hover:bg-[#5C150D] disabled:opacity-60"
                >
                  Claim chat
                </button>
              )}
              {assignedToMe && effectiveStatus === "active" && (
                <button
                  type="button"
                  onClick={onClose}
                  disabled={busy}
                  className="min-h-10 rounded-full border border-ceda-line px-4 text-sm font-semibold text-ceda-burgundy hover:bg-[#FFF9F4] disabled:opacity-60"
                >
                  Close chat
                </button>
              )}
            </div>
          </header>

          {error && (
            <p
              role="alert"
              className="border-b border-red-800/20 bg-red-50 px-4 py-3 text-sm text-red-900"
            >
              {error}
            </p>
          )}

          <div
            className="flex-1 space-y-3 overflow-y-auto p-4"
            aria-live="polite"
            aria-label="Conversation messages"
          >
            {messages?.map((item) => (
              <article
                key={item.id}
                className={`max-w-[85%] rounded-xl p-3 ${
                  item.senderId === currentUserId
                    ? "ml-auto bg-[#7A1F14] text-white"
                    : "border border-ceda-line bg-[#FFF9F4] text-ceda-ink"
                }`}
              >
                <p className="text-xs font-semibold">{item.senderName}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6">
                  {item.body}
                </p>
                <time
                  className="mt-1 block text-right text-[10px] opacity-70"
                  dateTime={item.createdAt}
                >
                  {new Date(item.createdAt).toLocaleTimeString("en-BW", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Africa/Gaborone",
                  })}
                </time>
              </article>
            ))}
            {messages && messages.length === 0 && (
              <p className="text-sm text-ceda-muted">
                No messages have been sent yet.
              </p>
            )}
          </div>

          {assignedToMe && effectiveStatus === "active" && (
            <>
              <FormErrorAnnouncer errors={errors} submitCount={submitCount} />
              <form
                noValidate
                onSubmit={handleSubmit(onSend)}
                className="border-t border-ceda-line p-3"
              >
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
                    className="min-h-11 rounded-full bg-ceda-burgundy px-4 text-sm font-bold text-white hover:bg-[#5C150D] disabled:opacity-60"
                  >
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
  );
}
