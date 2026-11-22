"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { documents, innovationCalls } from "@/db/schema";
import { requireRole } from "@/lib/authorization";
import { writeAudit } from "@/lib/server/audit";
import {
  removePortalDocumentFile,
  uploadPortalDocumentFile,
} from "@/lib/server/portal-content";

const uuidPattern = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

function refreshDocumentPaths() {
  revalidatePath("/admin/content/documents");
  revalidatePath("/guidelines");
}

async function resolveOptionalCallId(rawCallId: string): Promise<string | null> {
  const trimmed = rawCallId.trim();
  if (!trimmed) return null;
  if (!uuidPattern.test(trimmed)) return null;
  const [call] = await db
    .select({ id: innovationCalls.id })
    .from(innovationCalls)
    .where(eq(innovationCalls.id, trimmed))
    .limit(1);
  return call?.id ?? null;
}

export async function createDocument(formData: FormData) {
  const admin = await requireRole("admin", "/admin/content/documents");
  const title = String(formData.get("title") ?? "").trim();
  const rawCallId = String(formData.get("callId") ?? "");
  const isPublished = formData.get("isPublished") === "true";
  const fileEntry = formData.get("file");

  if (!title || title.length > 255) {
    redirect("/admin/content/documents?error=title");
  }
  if (!(fileEntry instanceof File) || fileEntry.size <= 0) {
    redirect("/admin/content/documents?error=file");
  }

  const callId = await resolveOptionalCallId(rawCallId);
  const uploaded = await uploadPortalDocumentFile(fileEntry, admin.id);
  if (!uploaded.ok) {
    redirect(
      `/admin/content/documents?error=upload&detail=${encodeURIComponent(uploaded.error)}`,
    );
  }

  try {
    await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(documents)
        .values({
          callId,
          title,
          fileName: uploaded.fileName,
          fileUrl: uploaded.storageKey,
          isPublished,
          uploadedBy: admin.id,
        })
        .returning({ id: documents.id });
      if (!created) throw new Error("Failed to insert document.");

      await writeAudit(tx, {
        actorId: admin.id,
        action: "document.created",
        entityType: "document",
        entityId: created.id,
        metadata: {
          title,
          fileName: uploaded.fileName,
          callId,
          isPublished,
        },
      });
    });
  } catch (error) {
    await removePortalDocumentFile(uploaded.storageKey);
    throw error;
  }

  refreshDocumentPaths();
  redirect("/admin/content/documents?notice=created");
}

export async function updateDocument(formData: FormData) {
  const admin = await requireRole("admin", "/admin/content/documents");
  const documentId = String(formData.get("documentId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const rawCallId = String(formData.get("callId") ?? "");
  const isPublished = formData.get("isPublished") === "true";
  const replacementEntry = formData.get("file");

  if (!uuidPattern.test(documentId) || !title || title.length > 255) {
    redirect("/admin/content/documents?error=invalid");
  }

  const [existing] = await db
    .select({
      id: documents.id,
      fileName: documents.fileName,
      fileUrl: documents.fileUrl,
    })
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);

  if (!existing) {
    redirect("/admin/content/documents?error=notfound");
  }

  const callId = await resolveOptionalCallId(rawCallId);
  let nextFileName = existing.fileName;
  let nextFileUrl = existing.fileUrl;
  let newlyUploadedKey: string | null = null;

  if (replacementEntry instanceof File && replacementEntry.size > 0) {
    const uploaded = await uploadPortalDocumentFile(replacementEntry, admin.id);
    if (!uploaded.ok) {
      redirect(
        `/admin/content/documents?error=upload&detail=${encodeURIComponent(uploaded.error)}`,
      );
    }
    nextFileName = uploaded.fileName;
    nextFileUrl = uploaded.storageKey;
    newlyUploadedKey = uploaded.storageKey;
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(documents)
        .set({
          title,
          callId,
          isPublished,
          fileName: nextFileName,
          fileUrl: nextFileUrl,
        })
        .where(eq(documents.id, existing.id));

      await writeAudit(tx, {
        actorId: admin.id,
        action: "document.updated",
        entityType: "document",
        entityId: existing.id,
        metadata: {
          title,
          fileName: nextFileName,
          replacedFile: Boolean(newlyUploadedKey),
          callId,
          isPublished,
        },
      });
    });
  } catch (error) {
    if (newlyUploadedKey) {
      await removePortalDocumentFile(newlyUploadedKey);
    }
    throw error;
  }

  if (newlyUploadedKey && existing.fileUrl !== newlyUploadedKey) {
    await removePortalDocumentFile(existing.fileUrl);
  }

  refreshDocumentPaths();
  redirect("/admin/content/documents?notice=saved");
}

export async function deleteDocument(formData: FormData) {
  const admin = await requireRole("admin", "/admin/content/documents");
  const documentId = String(formData.get("documentId") ?? "");
  if (!uuidPattern.test(documentId)) {
    redirect("/admin/content/documents?error=invalid");
  }

  const deleted = await db.transaction(async (tx) => {
    const [row] = await tx
      .delete(documents)
      .where(eq(documents.id, documentId))
      .returning({
        id: documents.id,
        title: documents.title,
        fileUrl: documents.fileUrl,
      });
    if (!row) return null;

    await writeAudit(tx, {
      actorId: admin.id,
      action: "document.deleted",
      entityType: "document",
      entityId: row.id,
      metadata: { title: row.title },
    });
    return row;
  });

  if (!deleted) {
    redirect("/admin/content/documents?error=notfound");
  }

  await removePortalDocumentFile(deleted.fileUrl);
  refreshDocumentPaths();
  redirect("/admin/content/documents?notice=deleted");
}
