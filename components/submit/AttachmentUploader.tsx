"use client";

import { useId, useRef, useState } from "react";
import { Download, FileText, Loader2, Trash2, Upload } from "lucide-react";
import {
  ATTACHMENT_ACCEPT_ATTRIBUTE,
  ATTACHMENT_ALLOWED_SUMMARY,
  MAX_ATTACHMENT_SIZE_LABEL,
  MAX_ATTACHMENTS_PER_VERSION,
  formatFileSize,
  getAttachmentDownloadPath,
  getAttachmentTypeLabel,
  validateAttachmentMetadata,
  type AttachmentSummary,
  type StagedAttachmentSummary,
} from "@/lib/attachments";

type DraftUploaderProps = {
  mode: "draft";
  ideaId: string;
  ensureDraftId: () => Promise<string | null>;
  initialAttachments: AttachmentSummary[];
  onUploadingChange?: (uploading: boolean) => void;
  onCountChange?: (count: number) => void;
};

type ResubmissionUploaderProps = {
  mode: "resubmission";
  ideaId: string;
  existingKeptCount: number;
  onUploadingChange?: (uploading: boolean) => void;
};

type Props = DraftUploaderProps | ResubmissionUploaderProps;

export function AttachmentUploader(props: Props) {
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const inputRef = useRef<HTMLInputElement>(null);

  const [draftItems, setDraftItems] = useState<AttachmentSummary[]>(
    props.mode === "draft" ? props.initialAttachments : [],
  );
  const [stagedItems, setStagedItems] = useState<StagedAttachmentSummary[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [removingKey, setRemovingKey] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const currentCount =
    props.mode === "draft"
      ? draftItems.length
      : props.existingKeptCount + stagedItems.length;
  const remainingSlots = Math.max(0, MAX_ATTACHMENTS_PER_VERSION - currentCount);
  const isUploading = uploadingCount > 0;

  function updateUploading(delta: number) {
    setUploadingCount((prev) => {
      const next = Math.max(0, prev + delta);
      props.onUploadingChange?.(next > 0);
      return next;
    });
  }

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (!files.length) return;

    setError("");
    setStatusMessage("");

    if (remainingSlots <= 0) {
      setError(`You have reached the maximum of ${MAX_ATTACHMENTS_PER_VERSION} files for this submission.`);
      return;
    }

    if (files.length > remainingSlots) {
      setError(
        `You can only add ${remainingSlots} more ${remainingSlots === 1 ? "file" : "files"} (maximum ${MAX_ATTACHMENTS_PER_VERSION} per submission).`,
      );
      return;
    }

    for (const file of files) {
      const check = validateAttachmentMetadata({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      });
      if (!check.ok) {
        setError(`${file.name}: ${check.error}`);
        return;
      }
    }

    updateUploading(files.length);
    try {
      let targetIdeaId = props.ideaId;
      if (props.mode === "draft" && !targetIdeaId) {
        setStatusMessage("Saving draft before uploading…");
        const createdId = await props.ensureDraftId();
        if (!createdId) {
          setError("Could not create a draft to attach files. Please try again.");
          return;
        }
        targetIdeaId = createdId;
      }

      const uploadedNames: string[] = [];
      for (const file of files) {
        setStatusMessage(`Uploading ${file.name}…`);
        const body = new FormData();
        body.set("ideaId", targetIdeaId);
        body.set("mode", props.mode);
        body.set("file", file);

        const response = await fetch("/api/attachments", {
          method: "POST",
          body,
        });
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
          attachment?: AttachmentSummary;
          stagedAttachment?: StagedAttachmentSummary;
        };

        if (!response.ok) {
          setError(data.error ?? `Failed to upload ${file.name}.`);
          break;
        }

        if (props.mode === "draft" && data.attachment) {
          setDraftItems((prev) => {
            const next = [...prev, data.attachment!];
            props.onCountChange?.(next.length);
            return next;
          });
          uploadedNames.push(data.attachment.fileName);
        } else if (props.mode === "resubmission" && data.stagedAttachment) {
          setStagedItems((prev) => [...prev, data.stagedAttachment!]);
          uploadedNames.push(data.stagedAttachment.fileName);
        }
      }

      if (uploadedNames.length > 0) {
        setStatusMessage(
          uploadedNames.length === 1
            ? `Uploaded ${uploadedNames[0]}.`
            : `Uploaded ${uploadedNames.length} files.`,
        );
      } else {
        setStatusMessage("");
      }
    } catch {
      setError("Network error while uploading. Please check your connection and try again.");
      setStatusMessage("");
    } finally {
      updateUploading(-files.length);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function removeDraftAttachment(item: AttachmentSummary) {
    setError("");
    setRemovingKey(item.id);
    try {
      const response = await fetch(`/api/attachments/${encodeURIComponent(item.id)}`, {
        method: "DELETE",
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? `Could not remove ${item.fileName}.`);
        return;
      }
      setDraftItems((prev) => {
        const next = prev.filter((entry) => entry.id !== item.id);
        if (props.mode === "draft") props.onCountChange?.(next.length);
        return next;
      });
      setStatusMessage(`Removed ${item.fileName}.`);
    } catch {
      setError(`Network error while removing ${item.fileName}.`);
    } finally {
      setRemovingKey(null);
    }
  }

  async function removeStagedAttachment(item: StagedAttachmentSummary) {
    setError("");
    setRemovingKey(item.token);
    try {
      const response = await fetch("/api/attachments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: item.token }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok && response.status !== 404) {
        setError(data.error ?? `Could not remove ${item.fileName}.`);
        return;
      }
      setStagedItems((prev) => prev.filter((entry) => entry.token !== item.token));
      setStatusMessage(`Removed ${item.fileName}.`);
    } catch {
      setError(`Network error while removing ${item.fileName}.`);
    } finally {
      setRemovingKey(null);
    }
  }

  const describedBy = [hintId, error ? errorId : ""].filter(Boolean).join(" ");

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor={inputId} className="block text-sm font-semibold text-ceda-ink">
          {props.mode === "draft" ? "Upload supporting documents" : "Upload new or revised documents"}
          <span className="ml-1 font-normal text-ceda-muted">(optional)</span>
        </label>
        <p id={hintId} className="mt-1 text-sm text-ceda-muted">
          Attach pitch decks, technical proposals, financials, or prototypes ({ATTACHMENT_ALLOWED_SUMMARY}). Max{" "}
          {MAX_ATTACHMENT_SIZE_LABEL} per file, up to {MAX_ATTACHMENTS_PER_VERSION} files total ({currentCount}/
          {MAX_ATTACHMENTS_PER_VERSION} used).
        </p>

        <div
          onDragOver={(event) => {
            event.preventDefault();
            if (remainingSlots > 0 && !isUploading) setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            if (remainingSlots > 0 && !isUploading && event.dataTransfer.files.length) {
              void handleFiles(event.dataTransfer.files);
            }
          }}
          className={`mt-3 rounded-2xl border-2 border-dashed p-5 transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ceda-burgundy ${
            dragActive
              ? "border-ceda-burgundy bg-[#FFF1E4]"
              : "border-[#9A8175] bg-[#FFFDFC]"
          } ${remainingSlots <= 0 ? "opacity-65" : ""}`}
        >
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            multiple
            accept={ATTACHMENT_ACCEPT_ATTRIBUTE}
            disabled={isUploading || remainingSlots <= 0}
            aria-describedby={describedBy}
            aria-invalid={Boolean(error)}
            onChange={(event) => {
              if (event.target.files?.length) {
                void handleFiles(event.target.files);
              }
            }}
            className="sr-only"
          />
          <label
            htmlFor={inputId}
            className={`flex min-h-12 flex-col items-center justify-center gap-2 text-center ${
              isUploading || remainingSlots <= 0 ? "cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            {isUploading ? (
              <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin text-ceda-burgundy" />
            ) : (
              <Upload aria-hidden="true" className="h-6 w-6 text-ceda-burgundy" />
            )}
            <span className="text-sm font-semibold text-ceda-ink">
              {isUploading
                ? "Uploading document…"
                : remainingSlots <= 0
                  ? `Maximum of ${MAX_ATTACHMENTS_PER_VERSION} files attached`
                  : "Choose files from your device or drop them here"}
            </span>
            <span className="text-xs text-ceda-muted">
              Files are stored privately and scanned for valid format signatures.
            </span>
          </label>
        </div>

        {error && (
          <p
            id={errorId}
            role="alert"
            className="mt-2 rounded-xl border border-red-800/25 bg-red-50 px-3.5 py-2.5 text-sm text-red-900"
          >
            {error}
          </p>
        )}
        {statusMessage && (
          <p role="status" aria-live="polite" className="mt-2 text-xs font-medium text-ceda-muted">
            {statusMessage}
          </p>
        )}
      </div>

      {props.mode === "draft" && draftItems.length > 0 && (
        <ul className="space-y-2" aria-label="Uploaded supporting documents">
          {draftItems.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ceda-line bg-white px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <FileText aria-hidden="true" className="h-5 w-5 shrink-0 text-ceda-burgundy" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ceda-ink">{item.fileName}</p>
                  <p className="text-xs text-ceda-muted">
                    {getAttachmentTypeLabel(item.mimeType, item.fileName)} · {formatFileSize(item.fileSize)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={getAttachmentDownloadPath(item.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center gap-1.5 rounded-full border border-ceda-line px-3.5 text-xs font-semibold text-ceda-ink hover:bg-[#FFF9F4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-burgundy"
                >
                  <Download aria-hidden="true" className="h-3.5 w-3.5" />
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => void removeDraftAttachment(item)}
                  disabled={removingKey === item.id || isUploading}
                  aria-label={`Remove ${item.fileName}`}
                  className="inline-flex min-h-12 items-center gap-1.5 rounded-full border border-red-800/25 px-3.5 text-xs font-semibold text-red-900 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-burgundy disabled:opacity-50"
                >
                  <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                  {removingKey === item.id ? "Removing…" : "Remove"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {props.mode === "resubmission" && stagedItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-ceda-burgundy">
            New files staged for this revision
          </p>
          <ul className="space-y-2" aria-label="New files staged for revised version">
            {stagedItems.map((item) => (
              <li
                key={item.token}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ceda-line bg-[#FFFDFC] px-4 py-3"
              >
                <input type="hidden" name="stagedAttachment" value={item.token} />
                <div className="flex min-w-0 items-center gap-3">
                  <FileText aria-hidden="true" className="h-5 w-5 shrink-0 text-ceda-burgundy" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ceda-ink">{item.fileName}</p>
                    <p className="text-xs text-ceda-muted">
                      {getAttachmentTypeLabel(item.mimeType, item.fileName)} · {formatFileSize(item.fileSize)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/api/attachments?token=${encodeURIComponent(item.token)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 items-center gap-1.5 rounded-full border border-ceda-line px-3.5 text-xs font-semibold text-ceda-ink hover:bg-[#FFF9F4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-burgundy"
                  >
                    <Download aria-hidden="true" className="h-3.5 w-3.5" />
                    Preview
                  </a>
                  <button
                    type="button"
                    onClick={() => void removeStagedAttachment(item)}
                    disabled={removingKey === item.token || isUploading}
                    aria-label={`Remove ${item.fileName}`}
                    className="inline-flex min-h-12 items-center gap-1.5 rounded-full border border-red-800/25 px-3.5 text-xs font-semibold text-red-900 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ceda-burgundy disabled:opacity-50"
                  >
                    <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                    {removingKey === item.token ? "Removing…" : "Remove"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
