import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { ideas } from "@/db/schema";
import { MAX_ATTACHMENT_BYTES } from "@/lib/attachments";
import { auth } from "@/lib/auth";
import { getUserRoles } from "@/lib/authorization";
import {
  createPresignedDownloadUrl,
  deleteStagedAttachment,
  uploadDraftAttachment,
  uploadStagedResubmissionAttachment,
  verifyRequestOrigin,
  verifyStagedAttachmentToken,
} from "@/lib/server/attachments";

const uuidPattern = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
const MAX_MULTIPART_OVERHEAD_BYTES = 128 * 1024; // 128 KB multipart header allowance

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function GET(request: Request) {
  const currentUser = await getSessionUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Sign in to download this file." }, { status: 401 });
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const format = url.searchParams.get("format");
  const payload = verifyStagedAttachmentToken(token);

  if (!payload || payload.userId !== currentUser.id) {
    return NextResponse.json({ error: "Staged attachment not found or expired." }, { status: 404 });
  }

  try {
    const signedUrl = await createPresignedDownloadUrl(payload.storageKey, payload.fileName);
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
  } catch {
    return NextResponse.json({ error: "Unable to generate a download link right now." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!verifyRequestOrigin(request)) {
    return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_ATTACHMENT_BYTES + MAX_MULTIPART_OVERHEAD_BYTES) {
    return NextResponse.json(
      { error: "File exceeds the 4 MB upload limit." },
      { status: 413 },
    );
  }

  const currentUser = await getSessionUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Sign in to upload supporting documents." }, { status: 401 });
  }

  const roles = await getUserRoles(currentUser.id);
  if (!roles.includes("submitter")) {
    return NextResponse.json({ error: "Submitter access is required to upload files." }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid file upload request." }, { status: 400 });
  }

  const ideaId = String(formData.get("ideaId") ?? "").trim();
  const mode = String(formData.get("mode") ?? "draft").trim();
  const file = formData.get("file");

  if (!uuidPattern.test(ideaId)) {
    return NextResponse.json({ error: "Save your draft before uploading documents." }, { status: 400 });
  }
  if (mode !== "draft" && mode !== "resubmission") {
    return NextResponse.json({ error: "Invalid upload mode." }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Select a file to upload." }, { status: 400 });
  }

  const [idea] = await db
    .select({
      id: ideas.id,
      status: ideas.status,
      currentVersionId: ideas.currentVersionId,
    })
    .from(ideas)
    .where(and(eq(ideas.id, ideaId), eq(ideas.submitterId, currentUser.id)))
    .limit(1);

  if (!idea) {
    return NextResponse.json({ error: "Submission not found." }, { status: 404 });
  }

  try {
    if (mode === "draft") {
      if (idea.status !== "draft" || !idea.currentVersionId) {
        return NextResponse.json(
          { error: "Files can only be attached to an open draft." },
          { status: 409 },
        );
      }

      const result = await uploadDraftAttachment({
        ideaId: idea.id,
        ideaVersionId: idea.currentVersionId,
        userId: currentUser.id,
        file,
      });

      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }

      return NextResponse.json(
        {
          attachment: result.attachment,
          downloadUrl: `/api/attachments/${encodeURIComponent(result.attachment.id)}`,
        },
        { status: 201, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    if (idea.status !== "changes_requested") {
      return NextResponse.json(
        { error: "New documents can only be staged when changes have been requested." },
        { status: 409 },
      );
    }

    const result = await uploadStagedResubmissionAttachment({
      ideaId: idea.id,
      userId: currentUser.id,
      file,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(
      {
        stagedAttachment: result.stagedAttachment,
        downloadUrl: `/api/attachments?token=${encodeURIComponent(result.stagedAttachment.token)}`,
      },
      { status: 201, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Attachment upload failed:", error);
    return NextResponse.json(
      { error: "The file could not be stored right now. Please try again." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!verifyRequestOrigin(request)) {
    return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  }

  const currentUser = await getSessionUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Sign in to remove uploaded files." }, { status: 401 });
  }

  const url = new URL(request.url);
  let token = url.searchParams.get("token") ?? "";
  if (!token) {
    const body = (await request.json().catch(() => null)) as { token?: unknown } | null;
    if (body && typeof body.token === "string") token = body.token;
  }

  if (!token) {
    return NextResponse.json({ error: "Missing staged attachment token." }, { status: 400 });
  }

  const result = await deleteStagedAttachment({ token, userId: currentUser.id });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
}
