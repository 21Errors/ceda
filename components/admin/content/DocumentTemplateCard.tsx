import { Download, FileText, Trash2 } from "lucide-react";
import {
  deleteDocument,
  updateDocument,
} from "@/app/(workspace)/(dashboards)/admin/content/documents/actions";
import {
  ATTACHMENT_ACCEPT_ATTRIBUTE,
  getAttachmentTypeLabel,
} from "@/lib/attachments";
import { formatPortalDate } from "@/lib/format";
import { getDocumentDownloadPath } from "@/lib/portal-content";

interface AdminDocumentRecord {
  id: string;
  title: string;
  fileName: string;
  callId: string | null;
  isPublished: boolean;
  createdAt: Date;
  uploaderName: string | null;
}

interface CallOption {
  id: string;
  title: string;
}

export function DocumentTemplateCard({
  doc,
  calls,
}: {
  doc: AdminDocumentRecord;
  calls: readonly CallOption[];
}) {
  return (
    <article className="rounded-2xl border border-ceda-line bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ceda-line pb-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ceda-cream-mid text-ceda-burgundy">
            <FileText aria-hidden="true" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-ceda-ink">
              {doc.title}
            </p>
            <p className="mt-0.5 text-xs text-ceda-muted">
              {doc.fileName} · {getAttachmentTypeLabel(null, doc.fileName)} ·
              Uploaded {formatPortalDate(doc.createdAt)}
              {doc.uploaderName ? ` by ${doc.uploaderName}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              doc.isPublished
                ? "bg-emerald-50 text-emerald-900"
                : "bg-surface-muted text-ceda-muted"
            }`}
          >
            {doc.isPublished ? "Published" : "Hidden"}
          </span>
          <a
            href={getDocumentDownloadPath(doc.id)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-ceda-line bg-white px-4 text-xs font-semibold text-ceda-burgundy hover:bg-[#FFF9F4]"
          >
            <Download aria-hidden="true" className="h-3.5 w-3.5" />
            Download
          </a>
        </div>
      </div>

      <form action={updateDocument} className="mt-4 grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="documentId" value={doc.id} />
        <div>
          <label
            htmlFor={`title-${doc.id}`}
            className="block text-xs font-semibold text-ceda-ink"
          >
            Title
          </label>
          <input
            id={`title-${doc.id}`}
            name="title"
            type="text"
            required
            maxLength={255}
            defaultValue={doc.title}
            className="ds-input mt-1"
          />
        </div>

        <div>
          <label
            htmlFor={`call-${doc.id}`}
            className="block text-xs font-semibold text-ceda-ink"
          >
            Innovation call
          </label>
          <select
            id={`call-${doc.id}`}
            name="callId"
            defaultValue={doc.callId ?? ""}
            className="ds-input mt-1"
          >
            <option value="">General portal resource (all calls)</option>
            {calls.map((call) => (
              <option key={call.id} value={call.id}>
                {call.title}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor={`replace-${doc.id}`}
            className="block text-xs font-semibold text-ceda-ink"
          >
            Replace file (optional)
          </label>
          <input
            id={`replace-${doc.id}`}
            name="file"
            type="file"
            accept={ATTACHMENT_ACCEPT_ATTRIBUTE}
            className="mt-1 block w-full rounded-xl border border-ceda-line bg-[#FFFDFC] px-3 py-2 text-xs text-ceda-ink file:mr-3 file:rounded-full file:border-0 file:bg-ceda-cream-mid file:px-3 file:py-1 file:text-xs file:font-bold file:text-ceda-burgundy"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
          <label className="inline-flex items-center gap-2 text-sm text-ceda-ink">
            <input
              type="checkbox"
              name="isPublished"
              value="true"
              defaultChecked={doc.isPublished}
              className="h-4 w-4 accent-ceda-burgundy"
            />
            <span>Visible publicly</span>
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
        action={deleteDocument}
        aria-label={`Delete template: ${doc.title}`}
        className="mt-3 border-t border-ceda-line pt-3"
      >
        <input type="hidden" name="documentId" value={doc.id} />
        <button
          type="submit"
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-red-800/30 px-4 text-xs font-semibold text-red-900 hover:bg-red-50"
        >
          <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
          Delete template
        </button>
      </form>
    </article>
  );
}
