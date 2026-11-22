import { Trash2 } from "lucide-react";
import {
  deleteContentBlock,
  saveContentBlock,
} from "@/app/(workspace)/(dashboards)/admin/content/pages/actions";
import { getContentBlockSection } from "@/lib/portal-content";

interface CustomContentBlock {
  id: string;
  key: string;
  title: string | null;
  body: string;
  isPublished: boolean;
}

export function CustomContentBlockCard({
  block,
}: {
  block: CustomContentBlock;
}) {
  const section = getContentBlockSection(block.key);

  return (
    <article className="rounded-2xl border border-ceda-line bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[11px] font-bold uppercase tracking-wide text-ceda-burgundy">
          {block.key} · {section}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            block.isPublished
              ? "bg-emerald-50 text-emerald-900"
              : "bg-surface-muted text-ceda-muted"
          }`}
        >
          {block.isPublished ? "Published" : "Hidden"}
        </span>
      </div>

      <form action={saveContentBlock} className="mt-3 space-y-3">
        <input type="hidden" name="key" value={block.key} />
        <div>
          <label
            htmlFor={`custom-title-${block.id}`}
            className="block text-xs font-semibold text-ceda-ink"
          >
            Heading
          </label>
          <input
            id={`custom-title-${block.id}`}
            name="title"
            type="text"
            maxLength={255}
            defaultValue={block.title ?? ""}
            className="ds-input mt-1"
          />
        </div>
        <div>
          <label
            htmlFor={`custom-body-${block.id}`}
            className="block text-xs font-semibold text-ceda-ink"
          >
            Body
          </label>
          <textarea
            id={`custom-body-${block.id}`}
            name="body"
            required
            rows={4}
            maxLength={10000}
            defaultValue={block.body}
            className="ds-input mt-1 min-h-24 py-3"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-ceda-ink">
            <input
              type="checkbox"
              name="isPublished"
              value="true"
              defaultChecked={block.isPublished}
              className="h-4 w-4 accent-ceda-burgundy"
            />
            <span>Published</span>
          </label>
          <button
            type="submit"
            className="inline-flex min-h-10 items-center rounded-full bg-ceda-burgundy px-5 text-xs font-bold text-white hover:bg-[#5C150D]"
          >
            Save changes
          </button>
        </div>
      </form>

      <form
        action={deleteContentBlock}
        className="mt-3 border-t border-ceda-line pt-3"
      >
        <input type="hidden" name="blockId" value={block.id} />
        <button
          type="submit"
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-red-800/30 px-4 text-xs font-semibold text-red-900 hover:bg-red-50"
        >
          <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
          Delete section
        </button>
      </form>
    </article>
  );
}
