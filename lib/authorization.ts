import { cache } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getPrimaryWorkspaceHref } from "@/lib/navigation";
import { db } from "@/db";
import { roles, userRoles } from "@/db/schema";

export type PortalRole =
  | "submitter"
  | "evaluator"
  | "adjudicator"
  | "admin"
  | "consultant"
  | "committee_member";

export const getCurrentSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export async function requireUser(returnTo = "/dashboard") {
  const session = await getCurrentSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return session.user;
}

export const getUserRoles = cache(async (userId: string): Promise<PortalRole[]> => {
  const rows = await db
    .select({ key: roles.key })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));
  return rows.map((row) => row.key as PortalRole);
});

export async function requireRole(requiredRole: PortalRole, returnTo: string) {
  const user = await requireUser(returnTo);
  const assignedRoles = await getUserRoles(user.id);

  if (!assignedRoles.includes(requiredRole)) redirect("/forbidden");
  return user;
}

export async function redirectIfAuthenticated(nextPath?: string | null) {
  const session = await getCurrentSession();
  if (!session?.user) return;

  if (
    nextPath &&
    nextPath.startsWith("/") &&
    !nextPath.startsWith("//") &&
    !nextPath.startsWith("/login") &&
    !nextPath.startsWith("/signup")
  ) {
    redirect(nextPath);
  }

  const assignedRoles = await getUserRoles(session.user.id);
  redirect(getPrimaryWorkspaceHref(assignedRoles));
}
