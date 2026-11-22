import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getUserRoles } from "@/lib/authorization";
import { createPresignedDownloadUrl } from "@/lib/server/attachments";

const uuidPattern = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!uuidPattern.test(id)) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  const [doc] = await db
    .select({
      id: documents.id,
      fileName: documents.fileName,
      fileUrl: documents.fileUrl,
      isPublished: documents.isPublished,
    })
    .from(documents)
    .where(eq(documents.id, id))
    .limit(1);

  if (!doc) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  if (!doc.isPublished) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }
    const roles = await getUserRoles(session.user.id);
    if (!roles.includes("admin")) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }
  }

  try {
    const downloadUrl = await createPresignedDownloadUrl(
      doc.fileUrl,
      doc.fileName,
    );
    return NextResponse.redirect(downloadUrl, {
      status: 302,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Document download is temporarily unavailable." },
      { status: 503 },
    );
  }
}
