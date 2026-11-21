import { cache } from "react";
import { and, count, eq, isNull } from "drizzle-orm";
import { getCurrentSession, getUserRoles, type PortalRole } from "@/lib/authorization";
import { db } from "@/db";
import { notifications } from "@/db/schema";

export interface WorkspaceNavContext {
  user: {
    id: string;
    name: string;
    email: string;
  };
  roles: PortalRole[];
  unreadNotifications: number;
}

/**
 * Per-request deduplicated loader for workspace sidebar RBAC context.
 * Reuses cached session + role lookups shared with page `requireUser` / `requireRole`.
 */
export const getWorkspaceNavContext = cache(async (): Promise<WorkspaceNavContext | null> => {
  const session = await getCurrentSession();
  if (!session?.user) return null;

  const [roles, unreadRows] = await Promise.all([
    getUserRoles(session.user.id),
    db
      .select({ total: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, session.user.id), isNull(notifications.readAt))),
  ]);

  return {
    user: {
      id: session.user.id,
      name: session.user.name || "Portal User",
      email: session.user.email || "",
    },
    roles,
    unreadNotifications: Number(unreadRows[0]?.total ?? 0),
  };
});
