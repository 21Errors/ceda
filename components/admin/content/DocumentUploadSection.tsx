import { Upload } from "lucide-react";
import { createDocument } from "@/app/(workspace)/(dashboards)/admin/content/documents/actions";
import {
  ATTACHMENT_ACCEPT_ATTRIBUTE,
  ATTACHMENT_ALLOWED_SUMMARY,
  MAX_ATTACHMENT_SIZE_LABEL,
} from "@/lib/attachments";

interface CallOption {
  id: string;
  title: string;
}

export function DocumentUploadSection({
  calls,
  storageReady,
}: {
  calls: readonly CallOption[];
  storageReady: boolean;
}) {
  return (
    <section
      aria-labelledby="upload-doc-heading"
      className="mt-7 rounded-2xl border border-ceda-line bg-white p-5 shadow-sm sm:p-7"
    >
      <h2
        id="upload-doc-heading"
        className="flex items-center gap-2 text-xl font-bold text-ceda-ink"
      >
        <Upload aria-hidden="true" className="h-5 w-5 text-ceda-burgundy" />
        Upload a document template
      </h2>
      <p className="mt-1 text-xs text-ceda-muted">
        Accepted formats: {ATTACHMENT_ALLOWED_SUMMARY} (max{" "}
        {MAX_ATTACHMENT_SIZE_LABEL}).
      </p>

      <form action={createDocument} className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label
            htmlFor="doc-title"
            className="block text-sm font-semibold text-ceda-ink"
          >
            Template title
          </label>
          <input
            id="doc-title"
            name="title"
            type="text"
            required
            maxLength={255}
            placeholder="e.g. CEDA Innovation Pitch Deck Template"
            className="ds-input mt-1.5"
          />
        </div>

        <div>
          <label
            htmlFor="doc-call"
            className="block text-sm font-semibold text-ceda-ink"
          >
            Innovation call (optional)
          </label>
          <select
            id="doc-call"
            name="callId"
            defaultValue=""
            className="ds-input mt-1.5"
          >
            <option value="">General portal resource (all calls)</option>
            {calls.map((call) => (
              <option key={call.id} value={call.id}>
                {call.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="doc-file"
            className="block text-sm font-semibold text-ceda-ink"
          >
            Template file
          </label>
          <input
            id="doc-file"
            name="file"
            type="file"
            required
            accept={ATTACHMENT_ACCEPT_ATTRIBUTE}
            className="mt-1.5 block w-full rounded-xl border border-ceda-line bg-[#FFFDFC] px-3 py-2.5 text-sm text-ceda-ink file:mr-3 file:rounded-full file:border-0 file:bg-ceda-cream-mid file:px-4 file:py-1.5 file:text-xs file:font-bold file:text-ceda-burgundy hover:file:bg-ceda-peach-light"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 sm:col-span-2">
          <label className="inline-flex items-center gap-2.5 text-sm text-ceda-ink">
            <input
              type="checkbox"
              name="isPublished"
              value="true"
              defaultChecked
              className="h-4 w-4 accent-ceda-burgundy"
            />
            <span>Publish immediately on public Guidelines page</span>
          </label>

          <button
            type="submit"
            disabled={!storageReady}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ceda-burgundy px-6 text-sm font-bold text-white hover:bg-[#5C150D] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-orange"
          >
            <Upload aria-hidden="true" className="h-4 w-4" />
            Upload template
          </button>
        </div>
      </form>
    </section>
  );
}
