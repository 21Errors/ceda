import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { and, asc, count, eq, gt, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  attachments,
  auditLogs,
  evaluatorAssignments,
  ideaCollaborators,
  ideas,
  ideaVersions,
} from "@/db/schema";
import {
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS_PER_VERSION,
  sanitizeFileName,
  validateAttachmentMetadata,
  type AttachmentSummary,
  type StagedAttachmentSummary,
} from "@/lib/attachments";
import { getUserRoles, type PortalRole } from "@/lib/authorization";
import { isUploadsStorageConfigured, uploadsBucket } from "@/lib/storage";
import { writeAudit, type DatabaseTransaction } from "@/lib/server/audit";

const UPLOAD_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const UPLOAD_RATE_LIMIT_MAX = 20;
const STAGED_TOKEN_TTL_SECONDS = 2 * 60 * 60; // 2 hours
const PRESIGNED_DOWNLOAD_TTL_SECONDS = 300; // 5 minutes
const STORAGE_KEY_PREFIX = "ideas/";

const OOXML_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const OLE2_MIME_TYPES = new Set([
  "application/vnd.ms-powerpoint",
  "application/msword",
  "application/vnd.ms-excel",
]);

function startsWithBytes(bytes: Uint8Array, signature: readonly number[], offset = 0): boolean {
  if (bytes.length < offset + signature.length) return false;
  for (let i = 0; i < signature.length; i += 1) {
    if (bytes[offset + i] !== signature[i]) return false;
  }
  return true;
}

export function verifyFileSignature(bytes: Uint8Array, canonicalMimeType: string): boolean {
  if (bytes.length < 4) return false;

  if (canonicalMimeType === "application/pdf") {
    // %PDF-
    return startsWithBytes(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]);
  }
  if (canonicalMimeType === "image/png") {
    return startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  }
  if (canonicalMimeType === "image/jpeg") {
    return startsWithBytes(bytes, [0xff, 0xd8, 0xff]);
  }
  if (canonicalMimeType === "image/webp") {
    return (
      startsWithBytes(bytes, [0x52, 0x49, 0x46, 0x46], 0) &&
      startsWithBytes(bytes, [0x57, 0x45, 0x42, 0x50], 8)
    );
  }
  if (OOXML_MIME_TYPES.has(canonicalMimeType)) {
    // OOXML documents are ZIP archives (PK\x03\x04)
    return startsWithBytes(bytes, [0x50, 0x4b, 0x03, 0x04]);
  }
  if (OLE2_MIME_TYPES.has(canonicalMimeType)) {
    // Legacy Office Binary File Format (OLE2 Compound Document)
    return startsWithBytes(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  }
  return false;
}

export function buildAttachmentStorageKey(
  ideaId: string,
  scope: string,
  fileName: string,
): string {
  const safeScope = scope.replace(/[^a-zA-Z0-9/_-]+/g, "").replace(/^\/+|\/+$/g, "");
  const safeFile = sanitizeFileName(fileName);
  return `${STORAGE_KEY_PREFIX}${ideaId}/${safeScope}/${randomUUID()}-${safeFile}`;
}

export function buildContentDisposition(fileName: string): string {
  const sanitized = sanitizeFileName(fileName)
    .replace(/[\r\n"\\;]/g, "_")
    .trim();
  const asciiFallback = sanitized.replace(/[^\x20-\x7e]/g, "_") || "attachment";
  const encoded = encodeURIComponent(sanitized || "attachment");
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}

export function verifyRequestOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  const allowedOrigins = new Set<string>();
  const configured = process.env.BETTER_AUTH_URL?.trim();
  if (configured) {
    try {
      allowedOrigins.add(new URL(configured).origin);
    } catch {
      /* ignore invalid BETTER_AUTH_URL */
    }
  } else {
    allowedOrigins.add("http://localhost:3000");
  }

  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? (request.url.startsWith("https:") ? "https" : "http");
  if (forwardedHost) {
    try {
      allowedOrigins.add(new URL(`${forwardedProto}://${forwardedHost}`).origin);
    } catch {
      /* ignore malformed host header */
    }
  }

  return allowedOrigins.has(origin);
}

function getStagedTokenSecret(): string {
  const configured = process.env.BETTER_AUTH_SECRET?.trim();
  const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";
  if (process.env.NODE_ENV === "production" && !isProductionBuild && (!configured || configured.length < 32)) {
    throw new Error("BETTER_AUTH_SECRET must be configured before signing attachment tokens in production.");
  }
  return configured || "ceda-local-development-secret-change-before-deploy";
}

export type StagedAttachmentPayload = {
  storageKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  ideaId: string;
  userId: string;
  exp: number;
};

export function signStagedAttachmentToken(
  payload: Omit<StagedAttachmentPayload, "exp">,
  ttlSeconds = STAGED_TOKEN_TTL_SECONDS,
): string {
  const fullPayload: StagedAttachmentPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(fullPayload), "utf8").toString("base64url");
  const sig = createHmac("sha256", getStagedTokenSecret())
    .update(`ceda-staged-attachment-v1:${encoded}`)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifyStagedAttachmentToken(token: string): StagedAttachmentPayload | null {
  if (!token || typeof token !== "string" || token.length > 4096) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, providedSig] = parts;
  if (!encoded || !providedSig) return null;

  const expectedSig = createHmac("sha256", getStagedTokenSecret())
    .update(`ceda-staged-attachment-v1:${encoded}`)
    .digest("base64url");

  const providedBuf = Buffer.from(providedSig, "utf8");
  const expectedBuf = Buffer.from(expectedSig, "utf8");
  if (providedBuf.length !== expectedBuf.length || !timingSafeEqual(providedBuf, expectedBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<StagedAttachmentPayload>;
    if (
      typeof parsed.storageKey !== "string" ||
      typeof parsed.fileName !== "string" ||
      typeof parsed.fileSize !== "number" ||
      typeof parsed.mimeType !== "string" ||
      typeof parsed.ideaId !== "string" ||
      typeof parsed.userId !== "string" ||
      typeof parsed.exp !== "number"
    ) {
      return null;
    }
    if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
    if (!parsed.storageKey.startsWith(`${STORAGE_KEY_PREFIX}${parsed.ideaId}/resubmission/${parsed.userId}/`)) {
      return null;
    }
    return parsed as StagedAttachmentPayload;
  } catch {
    return null;
  }
}

export async function validateAndInspectAttachmentFile(file: File): Promise<
  | { ok: true; bytes: Uint8Array; fileName: string; mimeType: string; fileSize: number }
  | { ok: false; error: string }
> {
  const metaCheck = validateAttachmentMetadata({
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  });
  if (!metaCheck.ok) return metaCheck;

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  if (bytes.byteLength <= 0 || bytes.byteLength > MAX_ATTACHMENT_BYTES) {
    return {
      ok: false,
      error: "Uploaded file size is invalid or exceeds the maximum limit.",
    };
  }

  if (!verifyFileSignature(bytes, metaCheck.spec.mimeType)) {
    return {
      ok: false,
      error: `The file "${metaCheck.sanitizedFileName}" does not match its declared ${metaCheck.spec.label} format and was rejected for security reasons.`,
    };
  }

  return {
    ok: true,
    bytes,
    fileName: metaCheck.sanitizedFileName,
    mimeType: metaCheck.spec.mimeType,
    fileSize: bytes.byteLength,
  };
}

export async function checkUploadRateLimit(userId: string): Promise<boolean> {
  const cutoff = new Date(Date.now() - UPLOAD_RATE_LIMIT_WINDOW_MS);
  const [[persisted], [staged]] = await Promise.all([
    db
      .select({ total: count() })
      .from(attachments)
      .where(and(eq(attachments.uploadedBy, userId), gt(attachments.createdAt, cutoff))),
    db
      .select({ total: count() })
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.actorId, userId),
          eq(auditLogs.action, "attachment.staged"),
          gt(auditLogs.createdAt, cutoff),
        ),
      ),
  ]);
  const totalRecent = Number(persisted?.total ?? 0) + Number(staged?.total ?? 0);
  return totalRecent < UPLOAD_RATE_LIMIT_MAX;
}

export async function getVersionAttachments(ideaVersionId: string | null | undefined): Promise<AttachmentSummary[]> {
  if (!ideaVersionId) return [];
  const rows = await db
    .select({
      id: attachments.id,
      fileName: attachments.fileName,
      fileSize: attachments.fileSize,
      mimeType: attachments.mimeType,
      createdAt: attachments.createdAt,
    })
    .from(attachments)
    .where(eq(attachments.ideaVersionId, ideaVersionId))
    .orderBy(asc(attachments.createdAt));

  return rows.map((row) => ({
    id: row.id,
    fileName: row.fileName,
    fileSize: row.fileSize,
    mimeType: row.mimeType,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function getAttachmentsByVersionIds(
  versionIds: string[],
): Promise<Map<string, AttachmentSummary[]>> {
  const grouped = new Map<string, AttachmentSummary[]>();
  if (!versionIds.length) return grouped;

  const rows = await db
    .select({
      id: attachments.id,
      ideaVersionId: attachments.ideaVersionId,
      fileName: attachments.fileName,
      fileSize: attachments.fileSize,
      mimeType: attachments.mimeType,
      createdAt: attachments.createdAt,
    })
    .from(attachments)
    .where(inArray(attachments.ideaVersionId, versionIds))
    .orderBy(asc(attachments.createdAt));

  for (const row of rows) {
    const list = grouped.get(row.ideaVersionId) ?? [];
    list.push({
      id: row.id,
      fileName: row.fileName,
      fileSize: row.fileSize,
      mimeType: row.mimeType,
      createdAt: row.createdAt.toISOString(),
    });
    grouped.set(row.ideaVersionId, list);
  }
  return grouped;
}

export type AttachmentAccessContext = {
  userId: string;
  roles: PortalRole[];
  idea: { id: string; submitterId: string; status: string };
  isCollaborator: boolean;
  isAssignedEvaluator: boolean;
};

export function evaluateAttachmentAccess(ctx: AttachmentAccessContext): boolean {
  if (ctx.idea.submitterId === ctx.userId) return true;
  if (ctx.roles.includes("admin")) return true;
  if (ctx.isCollaborator) return true;
  if (ctx.idea.status === "draft") return false;
  if (ctx.roles.includes("adjudicator") || ctx.roles.includes("committee_member")) return true;
  if (ctx.roles.includes("evaluator") && ctx.isAssignedEvaluator) return true;
  return false;
}

export async function canUserAccessIdeaAttachment(
  userId: string,
  idea: { id: string; submitterId: string; status: string },
): Promise<boolean> {
  if (idea.submitterId === userId) return true;

  const [roles, collaboratorRows, assignmentRows] = await Promise.all([
    getUserRoles(userId),
    db
      .select({ userId: ideaCollaborators.userId })
      .from(ideaCollaborators)
      .where(and(eq(ideaCollaborators.ideaId, idea.id), eq(ideaCollaborators.userId, userId)))
      .limit(1),
    idea.status !== "draft"
      ? db
          .select({ id: evaluatorAssignments.id })
          .from(evaluatorAssignments)
          .where(
            and(
              eq(evaluatorAssignments.ideaId, idea.id),
              eq(evaluatorAssignments.evaluatorId, userId),
            ),
          )
          .limit(1)
      : Promise.resolve([]),
  ]);

  return evaluateAttachmentAccess({
    userId,
    roles,
    idea,
    isCollaborator: collaboratorRows.length > 0,
    isAssignedEvaluator: assignmentRows.length > 0,
  });
}

export async function createPresignedDownloadUrl(
  storageKey: string,
  fileName: string,
  expiresInSeconds = PRESIGNED_DOWNLOAD_TTL_SECONDS,
): Promise<string> {
  if (storageKey.startsWith("https://") || storageKey.startsWith("http://")) {
    const parsed = new URL(storageKey);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.href;
    }
  }
  if (!isUploadsStorageConfigured()) {
    throw new Error("File storage is not configured in this environment.");
  }
  return uploadsBucket.url(storageKey, {
    expiresIn: expiresInSeconds,
    responseContentDisposition: buildContentDisposition(fileName),
  });
}

export async function uploadDraftAttachment(input: {
  ideaId: string;
  ideaVersionId: string;
  userId: string;
  file: File;
}): Promise<{ ok: true; attachment: AttachmentSummary } | { ok: false; error: string; status: number }> {
  if (!isUploadsStorageConfigured()) {
    return { ok: false, error: "Document storage is currently unavailable. Please contact CEDA support.", status: 503 };
  }

  const withinLimit = await checkUploadRateLimit(input.userId);
  if (!withinLimit) {
    return { ok: false, error: "You have uploaded too many files recently. Please wait a few minutes and try again.", status: 429 };
  }

  const [existingCount] = await db
    .select({ total: count() })
    .from(attachments)
    .where(eq(attachments.ideaVersionId, input.ideaVersionId));
  if (Number(existingCount?.total ?? 0) >= MAX_ATTACHMENTS_PER_VERSION) {
    return {
      ok: false,
      error: `You can attach up to ${MAX_ATTACHMENTS_PER_VERSION} files per submission.`,
      status: 400,
    };
  }

  const inspected = await validateAndInspectAttachmentFile(input.file);
  if (!inspected.ok) {
    return { ok: false, error: inspected.error, status: 400 };
  }

  const storageKey = buildAttachmentStorageKey(input.ideaId, input.ideaVersionId, inspected.fileName);

  await uploadsBucket.upload(storageKey, inspected.bytes, {
    contentType: inspected.mimeType,
    cacheControl: "private, no-store",
    metadata: {
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      uploadedBy: input.userId,
    },
  });

  try {
    const inserted = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(attachments)
        .values({
          ideaVersionId: input.ideaVersionId,
          uploadedBy: input.userId,
          fileName: inspected.fileName,
          fileUrl: storageKey,
          fileSize: inspected.fileSize,
          mimeType: inspected.mimeType,
        })
        .returning({
          id: attachments.id,
          fileName: attachments.fileName,
          fileSize: attachments.fileSize,
          mimeType: attachments.mimeType,
          createdAt: attachments.createdAt,
        });
      if (!created) throw new Error("Failed to record uploaded attachment.");
      await writeAudit(tx, {
        actorId: input.userId,
        action: "attachment.uploaded",
        entityType: "attachment",
        entityId: created.id,
        metadata: {
          ideaId: input.ideaId,
          ideaVersionId: input.ideaVersionId,
          fileName: created.fileName,
          fileSize: created.fileSize,
          mimeType: created.mimeType,
        },
      });
      return created;
    });

    return {
      ok: true,
      attachment: {
        id: inserted.id,
        fileName: inserted.fileName,
        fileSize: inserted.fileSize,
        mimeType: inserted.mimeType,
        createdAt: inserted.createdAt.toISOString(),
      },
    };
  } catch (error) {
    await uploadsBucket.delete(storageKey).catch(() => undefined);
    throw error;
  }
}

export async function uploadStagedResubmissionAttachment(input: {
  ideaId: string;
  userId: string;
  file: File;
}): Promise<{ ok: true; stagedAttachment: StagedAttachmentSummary } | { ok: false; error: string; status: number }> {
  if (!isUploadsStorageConfigured()) {
    return { ok: false, error: "Document storage is currently unavailable. Please contact CEDA support.", status: 503 };
  }

  const withinLimit = await checkUploadRateLimit(input.userId);
  if (!withinLimit) {
    return { ok: false, error: "You have uploaded too many files recently. Please wait a few minutes and try again.", status: 429 };
  }

  const inspected = await validateAndInspectAttachmentFile(input.file);
  if (!inspected.ok) {
    return { ok: false, error: inspected.error, status: 400 };
  }

  const storageKey = buildAttachmentStorageKey(
    input.ideaId,
    `resubmission/${input.userId}`,
    inspected.fileName,
  );

  await uploadsBucket.upload(storageKey, inspected.bytes, {
    contentType: inspected.mimeType,
    cacheControl: "private, no-store",
    metadata: {
      ideaId: input.ideaId,
      uploadedBy: input.userId,
      mode: "resubmission",
    },
  });

  try {
    await db.transaction(async (tx) => {
      await writeAudit(tx, {
        actorId: input.userId,
        action: "attachment.staged",
        entityType: "idea",
        entityId: input.ideaId,
        metadata: {
          fileName: inspected.fileName,
          fileSize: inspected.fileSize,
          mimeType: inspected.mimeType,
        },
      });
    });

    const token = signStagedAttachmentToken({
      storageKey,
      fileName: inspected.fileName,
      fileSize: inspected.fileSize,
      mimeType: inspected.mimeType,
      ideaId: input.ideaId,
      userId: input.userId,
    });

    return {
      ok: true,
      stagedAttachment: {
        token,
        fileName: inspected.fileName,
        fileSize: inspected.fileSize,
        mimeType: inspected.mimeType,
      },
    };
  } catch (error) {
    await uploadsBucket.delete(storageKey).catch(() => undefined);
    throw error;
  }
}

export async function deleteDraftAttachment(input: {
  attachmentId: string;
  userId: string;
}): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const [record] = await db
    .select({
      id: attachments.id,
      fileUrl: attachments.fileUrl,
      fileName: attachments.fileName,
      ideaVersionId: attachments.ideaVersionId,
      ideaId: ideas.id,
      submitterId: ideas.submitterId,
      status: ideas.status,
    })
    .from(attachments)
    .innerJoin(ideaVersions, eq(attachments.ideaVersionId, ideaVersions.id))
    .innerJoin(ideas, eq(ideaVersions.ideaId, ideas.id))
    .where(eq(attachments.id, input.attachmentId))
    .limit(1);

  if (!record || record.submitterId !== input.userId) {
    return { ok: false, error: "Attachment not found.", status: 404 };
  }
  if (record.status !== "draft") {
    return {
      ok: false,
      error: "Attachments on submitted applications cannot be deleted.",
      status: 409,
    };
  }

  const remainingRefs = await db.transaction(async (tx) => {
    await tx.delete(attachments).where(eq(attachments.id, record.id));
    await writeAudit(tx, {
      actorId: input.userId,
      action: "attachment.deleted",
      entityType: "attachment",
      entityId: record.id,
      metadata: {
        ideaId: record.ideaId,
        ideaVersionId: record.ideaVersionId,
        fileName: record.fileName,
      },
    });
    const [refs] = await tx
      .select({ total: count() })
      .from(attachments)
      .where(eq(attachments.fileUrl, record.fileUrl));
    return Number(refs?.total ?? 0);
  });

  if (remainingRefs === 0 && record.fileUrl.startsWith(STORAGE_KEY_PREFIX) && isUploadsStorageConfigured()) {
    await uploadsBucket.delete(record.fileUrl).catch(() => undefined);
  }

  return { ok: true };
}

export async function deleteStagedAttachment(input: {
  token: string;
  userId: string;
}): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const payload = verifyStagedAttachmentToken(input.token);
  if (!payload || payload.userId !== input.userId) {
    return { ok: false, error: "Staged attachment not found or expired.", status: 404 };
  }

  if (isUploadsStorageConfigured()) {
    await uploadsBucket.delete(payload.storageKey).catch(() => undefined);
  }

  await db.transaction(async (tx) => {
    await writeAudit(tx, {
      actorId: input.userId,
      action: "attachment.staged_removed",
      entityType: "idea",
      entityId: payload.ideaId,
      metadata: { fileName: payload.fileName },
    });
  });

  return { ok: true };
}

export async function verifyStagedAttachmentsForResubmission(input: {
  tokens: string[];
  ideaId: string;
  userId: string;
}): Promise<{ ok: true; payloads: StagedAttachmentPayload[] } | { ok: false; error: string }> {
  const uniqueTokens = [...new Set(input.tokens.filter(Boolean))];
  if (!uniqueTokens.length) return { ok: true, payloads: [] };

  const payloads: StagedAttachmentPayload[] = [];
  const seenKeys = new Set<string>();
  for (const token of uniqueTokens) {
    const payload = verifyStagedAttachmentToken(token);
    if (!payload || payload.ideaId !== input.ideaId || payload.userId !== input.userId) {
      return { ok: false, error: "One or more uploaded files expired. Please re-upload them and try again." };
    }
    if (seenKeys.has(payload.storageKey)) continue;
    seenKeys.add(payload.storageKey);
    payloads.push(payload);
  }

  if (!isUploadsStorageConfigured()) {
    return { ok: false, error: "Document storage is currently unavailable. Please contact CEDA support." };
  }

  const existenceChecks = await Promise.all(
    payloads.map(async (item) => ({
      item,
      exists: await uploadsBucket.exists(item.storageKey),
    })),
  );
  const missing = existenceChecks.find((check) => !check.exists);
  if (missing) {
    return {
      ok: false,
      error: `Uploaded file "${missing.item.fileName}" could not be verified in storage. Please upload it again.`,
    };
  }

  return { ok: true, payloads };
}

export async function persistResubmissionAttachments(
  tx: DatabaseTransaction,
  input: {
    ideaId: string;
    newVersionId: string;
    userId: string;
    keptAttachments: { fileName: string; fileUrl: string; fileSize: number | null; mimeType: string | null }[];
    newAttachments: { fileName: string; storageKey: string; fileSize: number; mimeType: string }[];
  },
) {
  const rowsToInsert = [
    ...input.keptAttachments.map((item) => ({
      ideaVersionId: input.newVersionId,
      uploadedBy: input.userId,
      fileName: item.fileName,
      fileUrl: item.fileUrl,
      fileSize: item.fileSize,
      mimeType: item.mimeType,
    })),
    ...input.newAttachments.map((item) => ({
      ideaVersionId: input.newVersionId,
      uploadedBy: input.userId,
      fileName: item.fileName,
      fileUrl: item.storageKey,
      fileSize: item.fileSize,
      mimeType: item.mimeType,
    })),
  ];

  if (!rowsToInsert.length) return;

  const inserted = await tx
    .insert(attachments)
    .values(rowsToInsert)
    .returning({ id: attachments.id, fileName: attachments.fileName, fileSize: attachments.fileSize, mimeType: attachments.mimeType });

  const newStartIndex = input.keptAttachments.length;
  for (let i = newStartIndex; i < inserted.length; i += 1) {
    const created = inserted[i];
    await writeAudit(tx, {
      actorId: input.userId,
      action: "attachment.uploaded",
      entityType: "attachment",
      entityId: created.id,
      metadata: {
        ideaId: input.ideaId,
        ideaVersionId: input.newVersionId,
        fileName: created.fileName,
        fileSize: created.fileSize,
        mimeType: created.mimeType,
      },
    });
  }
}
