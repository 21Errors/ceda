import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { attachments, ideas, ideaVersions } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getUserRoles } from "@/lib/authorization";
import {
  canUserAccessIdeaAttachment,
  createPresignedDownloadUrl,
  deleteDraftAttachment,
  verifyRequestOrigin,
} from "@/lib/server/attachments";
import { writeAuditEvent } from "@/lib/server/audit";

const uuidPattern = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const currentUser = await getSessionUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Sign in to access submission documents." }, { status: 401 });
  }

  const { id } = await params;
  if (!uuidPattern.test(id)) {
    return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
  }

  const [record] = await db
    .select({
      id: attachments.id,
      fileName: attachments.fileName,
      fileUrl: attachments.fileUrl,
      ideaVersionId: attachments.ideaVersionId,
      ideaId: ideas.id,
      submitterId: ideas.submitterId,
      status: ideas.status,
    })
    .from(attachments)
    .innerJoin(ideaVersions, eq(attachments.ideaVersionId, ideaVersions.id))
    .innerJoin(ideas, eq(ideaVersions.ideaId, ideas.id))
    .where(eq(attachments.id, id))
    .limit(1);

  if (!record) {
    return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
  }

  const allowed = await canUserAccessIdeaAttachment(currentUser.id, {
    id: record.ideaId,
    submitterId: record.submitterId,
    status: record.status,
  });
  if (!allowed) {
    return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
  }

  try {
    const signedUrl = await createPresignedDownloadUrl(record.fileUrl, record.fileName);
    await writeAuditEvent({
      actorId: currentUser.id,
      action: "attachment.downloaded",
      entityType: "attachment",
      entityId: record.id,
      metadata: {
        ideaId: record.ideaId,
        ideaVersionId: record.ideaVersionId,
        fileName: record.fileName,
      },
    }).catch(() => undefined);

    const format = new URL(request.url).searchParams.get("format");
    if (format === "json") {
      return NextResponse.json(
        { url: signedUrl, expiresIn: 300 },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

    return NextResponse.redirect(signedUrl, {
      status: 302,
      headers: {
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Failed to generate attachment download URL:", error);
    return NextResponse.json(
      { error: "Unable to generate a download link right now." },
      { status: 503 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifyRequestOrigin(request)) {
    return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  }

  const currentUser = await getSessionUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Sign in to manage submission documents." }, { status: 401 });
  }

  const roles = await getUserRoles(currentUser.id);
  if (!roles.includes("submitter")) {
    return NextResponse.json({ error: "Submitter access is required." }, { status: 403 });
  }

  const { id } = await params;
  if (!uuidPattern.test(id)) {
    return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
  }

  const result = await deleteDraftAttachment({
    attachmentId: id,
    userId: currentUser.id,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
}
