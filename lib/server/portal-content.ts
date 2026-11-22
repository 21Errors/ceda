import "server-only";

import { randomUUID } from "node:crypto";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { contentBlocks, documents, innovationCalls, user } from "@/db/schema";
import { sanitizeFileName } from "@/lib/attachments";
import { isUploadsStorageConfigured, uploadsBucket } from "@/lib/storage";
import { validateAndInspectAttachmentFile } from "@/lib/server/attachments";

export const DOCUMENT_STORAGE_PREFIX = "documents/";

export function buildDocumentStorageKey(fileName: string): string {
  const safeName = sanitizeFileName(fileName);
  return `${DOCUMENT_STORAGE_PREFIX}${randomUUID()}-${safeName}`;
}

export async function uploadPortalDocumentFile(
  file: File,
  uploadedBy: string,
): Promise<
  | { ok: true; storageKey: string; fileName: string; mimeType: string; fileSize: number }
  | { ok: false; error: string }
> {
  if (!isUploadsStorageConfigured()) {
    return {
      ok: false,
      error: "Object storage is not configured in this environment.",
    };
  }

  const inspected = await validateAndInspectAttachmentFile(file);
  if (!inspected.ok) {
    return inspected;
  }

  const storageKey = buildDocumentStorageKey(inspected.fileName);
  await uploadsBucket.upload(storageKey, inspected.bytes, {
    contentType: inspected.mimeType,
    cacheControl: "private, max-age=300",
    metadata: {
      scope: "portal_document",
      uploadedBy,
    },
  });

  return {
    ok: true,
    storageKey,
    fileName: inspected.fileName,
    mimeType: inspected.mimeType,
    fileSize: inspected.fileSize,
  };
}

export async function removePortalDocumentFile(fileUrl: string): Promise<void> {
  if (
    !fileUrl.startsWith(DOCUMENT_STORAGE_PREFIX) ||
    !isUploadsStorageConfigured()
  ) {
    return;
  }
  await uploadsBucket.delete(fileUrl).catch(() => undefined);
}

export async function getAllAdminDocuments() {
  return db
    .select({
      id: documents.id,
      callId: documents.callId,
      callTitle: innovationCalls.title,
      title: documents.title,
      fileName: documents.fileName,
      fileUrl: documents.fileUrl,
      isPublished: documents.isPublished,
      createdAt: documents.createdAt,
      uploaderName: user.name,
    })
    .from(documents)
    .leftJoin(innovationCalls, eq(documents.callId, innovationCalls.id))
    .leftJoin(user, eq(documents.uploadedBy, user.id))
    .orderBy(desc(documents.createdAt));
}

export async function getPublishedPortalDocuments() {
  return db
    .select({
      id: documents.id,
      callId: documents.callId,
      callTitle: innovationCalls.title,
      title: documents.title,
      fileName: documents.fileName,
      createdAt: documents.createdAt,
    })
    .from(documents)
    .leftJoin(innovationCalls, eq(documents.callId, innovationCalls.id))
    .where(eq(documents.isPublished, true))
    .orderBy(desc(documents.createdAt), asc(documents.title));
}

export async function getAllContentBlocks() {
  return db
    .select({
      id: contentBlocks.id,
      key: contentBlocks.key,
      title: contentBlocks.title,
      body: contentBlocks.body,
      isPublished: contentBlocks.isPublished,
      updatedAt: contentBlocks.updatedAt,
      updatedByName: user.name,
    })
    .from(contentBlocks)
    .leftJoin(user, eq(contentBlocks.updatedBy, user.id))
    .orderBy(asc(contentBlocks.key));
}
