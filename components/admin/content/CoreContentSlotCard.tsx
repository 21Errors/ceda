import { RotateCcw } from "lucide-react";
import {
  deleteContentBlock,
  saveContentBlock,
} from "@/app/(workspace)/(dashboards)/admin/content/pages/actions";
import { formatPortalDate } from "@/lib/format";
import type { CORE_CONTENT_SLOTS } from "@/lib/portal-content";

type CoreContentSlot = (typeof CORE_CONTENT_SLOTS)[number];

interface SavedContentBlock {
  id: string;
  key: string;
  title: string | null;
  body: string;
  isPublished: boolean;
  updatedAt: Date;
  updatedByName: string | null;
}

export function CoreContentSlotCard({
  slot,
  saved,
}: {
  slot: CoreContentSlot;
  saved: SavedContentBlock | undefined;
}) {
  const currentTitle = saved?.title ?? slot.defaultTitle;
  const currentBody = saved?.body ?? slot.defaultBody;
  const isPublished = saved ? saved.isPublished : slot.section === "guidelines";

  return (
    <article className="rounded-2xl border border-ceda-line bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-wide text-ceda-burgundy">
            {slot.key}
          </p>
          <h3 className="mt-1 text-base font-bold text-ceda-ink">
            {slot.label}
          </h3>
          <p className="mt-0.5 text-xs text-ceda-muted">{slot.description}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            saved
              ? saved.isPublished
                ? "bg-emerald-50 text-emerald-900"
                : "bg-surface-muted text-ceda-muted"
              : "bg-ceda-cream-mid text-ceda-burgundy"
          }`}
        >
          {saved
            ? saved.isPublished
              ? "Customized · Published"
              : "Customized · Hidden"
            : slot.section === "guidelines"
              ? "Using default copy"
              : "Not active"}
        </span>
      </div>

      <form action={saveContentBlock} className="mt-4 space-y-3">
        <input type="hidden" name="key" value={slot.key} />
        <div>
          <label
            htmlFor={`title-${slot.key}`}
            className="block text-xs font-semibold text-ceda-ink"
          >
            Section heading
          </label>
          <input
            id={`title-${slot.key}`}
            name="title"
            type="text"
            maxLength={255}
            defaultValue={currentTitle}
            className="ds-input mt-1"
          />
        </div>
        <div>
          <label
            htmlFor={`body-${slot.key}`}
            className="block text-xs font-semibold text-ceda-ink"
          >
            Section body
          </label>
          <textarea
            id={`body-${slot.key}`}
            name="body"
            required
            rows={4}
            maxLength={10000}
            defaultValue={currentBody}
            className="ds-input mt-1 min-h-28 py-3"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <label className="inline-flex items-center gap-2 text-sm text-ceda-ink">
            <input
              type="checkbox"
              name="isPublished"
              value="true"
              defaultChecked={isPublished}
              className="h-4 w-4 accent-ceda-burgundy"
            />
            <span>Show on public page</span>
          </label>
          <button
            type="submit"
            className="inline-flex min-h-10 items-center rounded-full bg-ceda-burgundy px-5 text-xs font-bold text-white hover:bg-[#5C150D]"
          >
            Save section
          </button>
        </div>
      </form>

      {saved ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-ceda-line pt-3">
          <p className="text-xs text-ceda-muted">
            Last updated {formatPortalDate(saved.updatedAt)}
            {saved.updatedByName ? ` by ${saved.updatedByName}` : ""}
          </p>
          <form action={deleteContentBlock}>
            <input type="hidden" name="blockId" value={saved.id} />
            <button
              type="submit"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-ceda-line px-3.5 text-xs font-semibold text-ceda-body hover:bg-surface-muted"
            >
              <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
              Reset to default
            </button>
          </form>
        </div>
      ) : null}
    </article>
  );
}
