import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  listUserNotifications,
  mutateUserNotifications,
  type NotificationMutationAction,
  type NotificationView,
} from "@/lib/server/notifications-inbox";

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

const VALID_ACTIONS = new Set<NotificationMutationAction>([
  "mark_read",
  "mark_all_read",
  "archive",
  "unarchive",
  "archive_all_read",
]);

export async function GET(request: Request) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Sign in to view notifications." },
        { status: 401 },
      );
    }

    const url = new URL(request.url);
    const rawView = url.searchParams.get("view");
    const view: NotificationView =
      rawView === "archived" ? "archived" : "inbox";
    const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1;
    const pageSize =
      Number.parseInt(url.searchParams.get("pageSize") ?? "6", 10) || 6;

    const data = await listUserNotifications({
      userId: currentUser.id,
      view,
      page,
      pageSize,
    });

    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Failed to load notifications:", error);
    return NextResponse.json(
      { error: "Could not load notifications." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    const trustedOrigin = new URL(
      process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    ).origin;
    if (!origin || origin !== trustedOrigin) {
      return NextResponse.json(
        { error: "Request origin could not be verified." },
        { status: 403 },
      );
    }

    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Sign in to update notifications." },
        { status: 401 },
      );
    }

    const payload = (await request.json().catch(() => null)) as {
      action?: string;
      notificationId?: string;
    } | null;

    if (
      !payload ||
      typeof payload.action !== "string" ||
      !VALID_ACTIONS.has(payload.action as NotificationMutationAction)
    ) {
      return NextResponse.json(
        { error: "Invalid notification action." },
        { status: 400 },
      );
    }

    const result = await mutateUserNotifications({
      userId: currentUser.id,
      action: payload.action as NotificationMutationAction,
      notificationId: payload.notificationId,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Failed to update notifications:", error);
    return NextResponse.json(
      { error: "Could not update notifications." },
      { status: 500 },
    );
  }
}
