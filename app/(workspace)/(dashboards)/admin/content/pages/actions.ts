"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { contentBlocks } from "@/db/schema";
import { requireRole } from "@/lib/authorization";
import {
  isCoreContentKey,
  isValidContentBlockKey,
  slugifyAnnouncementKey,
} from "@/lib/portal-content";
import { writeAudit } from "@/lib/server/audit";

const uuidPattern = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

function refreshPublicContentPaths() {
  revalidatePath("/admin/content/pages");
  revalidatePath("/guidelines");
  revalidatePath("/news");
}

export async function saveContentBlock(formData: FormData) {
  const admin = await requireRole("admin", "/admin/content/pages");
  const key = String(formData.get("key") ?? "").trim().toLowerCase();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const isPublished = formData.get("isPublished") === "true";

  if (
    !isValidContentBlockKey(key) ||
    title.length > 255 ||
    !body ||
    body.length > 10_000
  ) {
    redirect("/admin/content/pages?error=invalid");
  }

  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: contentBlocks.id })
      .from(contentBlocks)
      .where(eq(contentBlocks.key, key))
      .limit(1);

    let blockId: string;
    let action: string;
    if (existing) {
      await tx
        .update(contentBlocks)
        .set({
          title: title || null,
          body,
          isPublished,
          updatedBy: admin.id,
        })
        .where(eq(contentBlocks.id, existing.id));
      blockId = existing.id;
      action = "content_block.updated";
    } else {
      const [created] = await tx
        .insert(contentBlocks)
        .values({
          key,
          title: title || null,
          body,
          isPublished,
          updatedBy: admin.id,
        })
        .returning({ id: contentBlocks.id });
      if (!created) throw new Error("Unable to create content block.");
      blockId = created.id;
      action = "content_block.created";
    }

    await writeAudit(tx, {
      actorId: admin.id,
      action,
      entityType: "content_block",
      entityId: blockId,
      metadata: { key, isPublished },
    });
  });

  refreshPublicContentPaths();
  redirect("/admin/content/pages?notice=saved");
}

export async function createAnnouncementBlock(formData: FormData) {
  const admin = await requireRole("admin", "/admin/content/pages");
  const section = String(formData.get("section") ?? "news").trim();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const isPublished = formData.get("isPublished") === "true";

  if (
    (section !== "news" && section !== "guidelines") ||
    !title ||
    title.length > 255 ||
    !body ||
    body.length > 10_000
  ) {
    redirect("/admin/content/pages?error=invalid");
  }

  const baseKey =
    section === "news"
      ? slugifyAnnouncementKey(title)
      : slugifyAnnouncementKey(title).replace(/^news\./, "guidelines.");

  await db.transaction(async (tx) => {
    let finalKey = baseKey;
    const [collision] = await tx
      .select({ id: contentBlocks.id })
      .from(contentBlocks)
      .where(eq(contentBlocks.key, finalKey))
      .limit(1);
    if (collision) {
      const suffix = Math.floor(Date.now() / 1000).toString(36).slice(-5);
      finalKey = `${baseKey.slice(0, 92)}-${suffix}`;
    }

    const [created] = await tx
      .insert(contentBlocks)
      .values({
        key: finalKey,
        title,
        body,
        isPublished,
        updatedBy: admin.id,
      })
      .returning({ id: contentBlocks.id });
    if (!created) throw new Error("Unable to create announcement.");

    await writeAudit(tx, {
      actorId: admin.id,
      action: "content_block.created",
      entityType: "content_block",
      entityId: created.id,
      metadata: { key: finalKey, section, isPublished },
    });
  });

  refreshPublicContentPaths();
  redirect("/admin/content/pages?notice=created");
}

export async function deleteContentBlock(formData: FormData) {
  const admin = await requireRole("admin", "/admin/content/pages");
  const blockId = String(formData.get("blockId") ?? "");
  if (!uuidPattern.test(blockId)) {
    redirect("/admin/content/pages?error=invalid");
  }

  const deleted = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: contentBlocks.id, key: contentBlocks.key })
      .from(contentBlocks)
      .where(eq(contentBlocks.id, blockId))
      .limit(1);
    if (!existing) return null;

    await tx.delete(contentBlocks).where(eq(contentBlocks.id, existing.id));
    await writeAudit(tx, {
      actorId: admin.id,
      action: isCoreContentKey(existing.key)
        ? "content_block.reset_to_default"
        : "content_block.deleted",
      entityType: "content_block",
      entityId: existing.id,
      metadata: { key: existing.key },
    });
    return existing;
  });

  if (!deleted) {
    redirect("/admin/content/pages?error=notfound");
  }

  refreshPublicContentPaths();
  redirect("/admin/content/pages?notice=deleted");
}
