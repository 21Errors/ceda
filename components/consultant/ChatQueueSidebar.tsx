"use client";

import type { QueueConversationItem } from "@/lib/server/chat-service";

interface ChatQueueSidebarProps {
  myActive: QueueConversationItem[];
  waiting: QueueConversationItem[];
  recentClosed: QueueConversationItem[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function ChatQueueSidebar({
  myActive,
  waiting,
  recentClosed,
  selectedId,
  onSelect,
}: ChatQueueSidebarProps) {
  return (
    <nav aria-label="Consultant chat queue" className="space-y-5">
      <div>
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-ceda-burgundy">
          My active chats ({myActive.length})
        </h2>
        <div className="mt-2 space-y-2">
          {myActive.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              aria-pressed={item.id === selectedId}
              className={`w-full rounded-xl border p-3.5 text-left transition ${
                item.id === selectedId
                  ? "border-ceda-burgundy bg-[#FFF9F4] ring-1 ring-ceda-burgundy/20"
                  : "border-ceda-line bg-white hover:bg-[#FFFDFC]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-bold text-ceda-ink">
                  {item.requesterName}
                </span>
                <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-900">
                  Active
                </span>
              </div>
              <span className="mt-1 block text-xs text-ceda-muted">
                {item.messageCount} {item.messageCount === 1 ? "message" : "messages"} ·
                Started{" "}
                {new Date(item.startedAt).toLocaleString("en-BW", {
                  dateStyle: "short",
                  timeStyle: "short",
                  timeZone: "Africa/Gaborone",
                })}
              </span>
            </button>
          ))}
          {myActive.length === 0 && (
            <p className="rounded-xl border border-dashed border-ceda-line bg-[#FFFDFC] p-3.5 text-xs text-ceda-muted">
              No active chats assigned to you right now.
            </p>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-ceda-muted">
          Waiting queue ({waiting.length})
        </h2>
        <div className="mt-2 space-y-2">
          {waiting.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              aria-pressed={item.id === selectedId}
              className={`w-full rounded-xl border p-3.5 text-left transition ${
                item.id === selectedId
                  ? "border-ceda-burgundy bg-[#FFF9F4] ring-1 ring-ceda-burgundy/20"
                  : "border-ceda-line bg-white hover:bg-[#FFFDFC]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-bold text-ceda-ink">
                  #{idx + 1} · {item.requesterName}
                </span>
                <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900">
                  Waiting
                </span>
              </div>
              <span className="mt-1 block text-xs text-ceda-muted">
                {item.messageCount} {item.messageCount === 1 ? "message" : "messages"} ·
                Since{" "}
                {new Date(item.startedAt).toLocaleString("en-BW", {
                  dateStyle: "short",
                  timeStyle: "short",
                  timeZone: "Africa/Gaborone",
                })}
              </span>
            </button>
          ))}
          {waiting.length === 0 && (
            <p className="rounded-xl bg-[#FFF9F4] p-3.5 text-xs text-ceda-muted">
              No applicants are waiting in the queue.
            </p>
          )}
        </div>
      </div>

      {recentClosed.length > 0 && (
        <details className="rounded-xl border border-ceda-line bg-[#FFFDFC] p-3">
          <summary className="text-xs font-bold uppercase tracking-[0.14em] text-ceda-muted">
            Recently closed ({recentClosed.length})
          </summary>
          <div className="mt-2.5 space-y-2">
            {recentClosed.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                aria-pressed={item.id === selectedId}
                className={`w-full rounded-lg border p-2.5 text-left text-xs ${
                  item.id === selectedId
                    ? "border-ceda-burgundy bg-[#FFF9F4]"
                    : "border-ceda-line bg-white"
                }`}
              >
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
  );
}
