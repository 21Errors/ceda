export const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024; // 4 MB per file
export const MAX_ATTACHMENT_SIZE_LABEL = "4 MB";
export const MAX_ATTACHMENTS_PER_VERSION = 5;

export type AttachmentSpec = {
  mimeType: string;
  extensions: readonly string[];
  label: string;
};

export const ALLOWED_ATTACHMENT_SPECS: readonly AttachmentSpec[] = [
  {
    mimeType: "application/pdf",
    extensions: [".pdf"],
    label: "PDF",
  },
  {
    mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    extensions: [".pptx"],
    label: "PowerPoint",
  },
  {
    mimeType: "application/vnd.ms-powerpoint",
    extensions: [".ppt"],
    label: "PowerPoint",
  },
  {
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extensions: [".docx"],
    label: "Word",
  },
  {
    mimeType: "application/msword",
    extensions: [".doc"],
    label: "Word",
  },
  {
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    extensions: [".xlsx"],
    label: "Excel",
  },
  {
    mimeType: "application/vnd.ms-excel",
    extensions: [".xls"],
    label: "Excel",
  },
  {
    mimeType: "image/png",
    extensions: [".png"],
    label: "PNG image",
  },
  {
    mimeType: "image/jpeg",
    extensions: [".jpg", ".jpeg"],
    label: "JPEG image",
  },
  {
    mimeType: "image/webp",
    extensions: [".webp"],
    label: "WebP image",
  },
] as const;

export const ATTACHMENT_ACCEPT_ATTRIBUTE = ALLOWED_ATTACHMENT_SPECS.flatMap((spec) => spec.extensions).join(",");
export const ATTACHMENT_ALLOWED_SUMMARY = "PDF, PowerPoint, Word, Excel, PNG, JPG, or WebP";

export type AttachmentSummary = {
  id: string;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  createdAt?: string;
};

export type StagedAttachmentSummary = {
  token: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
};

const specByExtension = new Map<string, AttachmentSpec>();
const specByMimeType = new Map<string, AttachmentSpec>();

for (const spec of ALLOWED_ATTACHMENT_SPECS) {
  specByMimeType.set(spec.mimeType, spec);
  for (const ext of spec.extensions) {
    specByExtension.set(ext, spec);
  }
}

export function getFileExtension(fileName: string): string {
  const baseName = fileName.split(/[\\/]/).pop() ?? "";
  const lastDot = baseName.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === baseName.length - 1) return "";
  return baseName.slice(lastDot).toLowerCase();
}

export function sanitizeFileName(rawName: string): string {
  const baseName = rawName
    .replaceAll("\0", "")
    .split(/[\\/]/)
    .pop()
    ?.trim() ?? "";
  const ext = getFileExtension(baseName);
  if (!ext && baseName.startsWith(".")) return "attachment";
  const rawStem = ext ? baseName.slice(0, -ext.length) : baseName;
  const cleanStem = rawStem
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/\.{2,}/g, ".")
    .replace(/^[-._]+|[-._]+$/g, "")
    .slice(0, 100);
  const cleanExt = ext.replace(/[^a-z0-9.]/g, "").slice(0, 12);
  return `${cleanStem || "attachment"}${cleanExt}`;
}

export function resolveAllowedAttachmentSpec(
  fileName: string,
  declaredMimeType?: string | null,
): { ok: true; spec: AttachmentSpec } | { ok: false; error: string } {
  const ext = getFileExtension(fileName);
  const extSpec = ext ? specByExtension.get(ext) : undefined;
  if (!extSpec) {
    return {
      ok: false,
      error: `Unsupported file type${ext ? ` (${ext})` : ""}. Upload ${ATTACHMENT_ALLOWED_SUMMARY}.`,
    };
  }

  const normalizedMime = declaredMimeType?.split(";")[0]?.trim().toLowerCase() ?? "";
  if (!normalizedMime || normalizedMime === "application/octet-stream") {
    return { ok: true, spec: extSpec };
  }

  const mimeSpec = specByMimeType.get(normalizedMime);
  if (!mimeSpec) {
    return {
      ok: false,
      error: `Unsupported file format (${normalizedMime}). Upload ${ATTACHMENT_ALLOWED_SUMMARY}.`,
    };
  }

  if (mimeSpec.mimeType !== extSpec.mimeType) {
    return {
      ok: false,
      error: `File extension (${ext}) does not match the file's format (${normalizedMime}).`,
    };
  }

  return { ok: true, spec: extSpec };
}

export function validateAttachmentMetadata(input: {
  fileName: string;
  fileSize: number;
  mimeType?: string | null;
}): { ok: true; spec: AttachmentSpec; sanitizedFileName: string } | { ok: false; error: string } {
  if (!Number.isFinite(input.fileSize) || input.fileSize <= 0) {
    return { ok: false, error: "Empty files cannot be uploaded. Choose a file with content." };
  }
  if (input.fileSize > MAX_ATTACHMENT_BYTES) {
    return {
      ok: false,
      error: `File exceeds the ${MAX_ATTACHMENT_SIZE_LABEL} maximum size (${formatFileSize(input.fileSize)}).`,
    };
  }

  const sanitizedFileName = sanitizeFileName(input.fileName);
  const resolved = resolveAllowedAttachmentSpec(sanitizedFileName, input.mimeType);
  if (!resolved.ok) return resolved;

  return { ok: true, spec: resolved.spec, sanitizedFileName };
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (typeof bytes !== "number" || !Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function getAttachmentTypeLabel(mimeType: string | null | undefined, fileName?: string): string {
  if (mimeType) {
    const byMime = specByMimeType.get(mimeType.split(";")[0].trim().toLowerCase());
    if (byMime) return byMime.label;
  }
  if (fileName) {
    const ext = getFileExtension(fileName);
    const byExt = ext ? specByExtension.get(ext) : undefined;
    if (byExt) return byExt.label;
  }
  return "Document";
}

export function getAttachmentDownloadPath(attachmentId: string): string {
  return `/api/attachments/${encodeURIComponent(attachmentId)}`;
}
