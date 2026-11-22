import { cache } from "react";
import { getCurrentSession, getUserRoles, type PortalRole } from "@/lib/authorization";
import { getNotificationCounts } from "@/lib/server/notifications-inbox";

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

  const [roles, counts] = await Promise.all([
    getUserRoles(session.user.id),
    getNotificationCounts(session.user.id),
  ]);

  return {
    user: {
      id: session.user.id,
      name: session.user.name || "Portal User",
      email: session.user.email || "",
    },
    roles,
    unreadNotifications: counts.unreadCount,
  };
});
