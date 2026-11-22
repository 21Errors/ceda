"use client";

import { Download } from "lucide-react";
import { AttachmentUploader } from "@/components/submit/AttachmentUploader";
import {
  formatFileSize,
  getAttachmentDownloadPath,
  getAttachmentTypeLabel,
  type AttachmentSummary,
} from "@/lib/attachments";

interface ResubmissionAttachmentsSectionProps {
  ideaId: string;
  existingAttachments: AttachmentSummary[];
  keptIds: string[];
  onToggleKept: (id: string) => void;
  onUploadingChange: (uploading: boolean) => void;
  errorMessage?: string;
}

export function ResubmissionAttachmentsSection({
  ideaId,
  existingAttachments,
  keptIds,
  onToggleKept,
  onUploadingChange,
  errorMessage,
}: ResubmissionAttachmentsSectionProps) {
  return (
    <fieldset className="space-y-4 rounded-2xl border border-ceda-line bg-[#FFFDFC] p-4 sm:p-5">
      <legend className="px-1 text-sm font-semibold text-ceda-ink">
        Supporting documents
      </legend>
      {existingAttachments.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-ceda-muted">
            Current version files — uncheck any file you want to omit from the
            revised version
          </p>
          <ul className="space-y-2">
            {existingAttachments.map((file) => {
              const checked = keptIds.includes(file.id);
              const checkboxId = `keep-attachment-${file.id}`;
              return (
                <li
                  key={file.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ceda-line bg-white px-3.5 py-2.5"
                >
                  <label
                    htmlFor={checkboxId}
                    className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3 text-sm text-ceda-body"
                  >
                    <input
                      id={checkboxId}
                      type="checkbox"
                      value={file.id}
                      checked={checked}
                      onChange={() => onToggleKept(file.id)}
                      className="h-5 w-5 shrink-0 accent-ceda-burgundy"
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-ceda-ink">
                        {file.fileName}
                      </span>
                      <span className="block text-xs text-ceda-muted">
                        {getAttachmentTypeLabel(file.mimeType, file.fileName)} ·{" "}
                        {formatFileSize(file.fileSize)} ·{" "}
                        {checked
                          ? "Keeping in revision"
                          : "Will not be carried forward"}
                      </span>
                    </span>
                  </label>
                  <a
                    href={getAttachmentDownloadPath(file.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-ceda-line px-3.5 text-xs font-semibold text-ceda-burgundy hover:bg-[#FFF9F4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-burgundy"
                  >
                    <Download aria-hidden="true" className="h-3.5 w-3.5" />
                    Download
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <AttachmentUploader
        mode="resubmission"
        ideaId={ideaId}
        existingKeptCount={keptIds.length}
        onUploadingChange={onUploadingChange}
      />
      {errorMessage ? (
        <p className="text-sm text-red-800" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </fieldset>
  );
}
