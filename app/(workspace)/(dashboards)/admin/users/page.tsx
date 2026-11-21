import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { Suspense } from "react";
import { db } from "@/db";
import { roles, user, userRoles } from "@/db/schema";
import { AssignRoleForm } from "@/components/admin/AssignRoleForm";
import { requireRole } from "@/lib/authorization";
import { WorkspacePageSkeleton } from "@/components/workspace/WorkspacePageSkeleton";

export default function AdminUsersPage({
  searchParams,
}: PageProps<"/admin/users">) {
  return (
    <Suspense fallback={<WorkspacePageSkeleton variant="list" />}>
      <AdminUsersContent searchParams={searchParams} />
    </Suspense>
  );
}

async function AdminUsersContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireRole("admin", "/admin/users");
  const query = await searchParams;
  const [users, roleOptions] = await Promise.all([
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(desc(user.createdAt))
      .limit(100),
    db
      .select({ id: roles.id, key: roles.key, name: roles.name })
      .from(roles)
      .orderBy(roles.name),
  ]);
  const roleRows = users.length
    ? await db
        .select({
          userId: userRoles.userId,
          id: roles.id,
          key: roles.key,
          name: roles.name,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(
          inArray(
            userRoles.userId,
            users.map((item) => item.id),
          ),
        )
    : [];
  const assigned = new Map<string, typeof roleRows>();
  for (const row of roleRows)
    assigned.set(row.userId, [...(assigned.get(row.userId) ?? []), row]);
  const notice =
    query.notice === "exists"
      ? "That role is already assigned."
      : query.error === "unverified"
        ? "Verify the account email before assigning staff access."
        : query.error
          ? "The user or role could not be found."
          : "";

  return (
    <main
      id="main-content"
      className="flex-1 bg-white px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-275">
        <Link
          href="/admin"
          className="text-sm font-semibold text-ceda-burgundy underline underline-offset-4">
          ← Back to administration
        </Link>
        <header className="mt-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ceda-burgundy">
            Access control
          </p>
          <h1 className="mt-2 text-3xl font-bold text-ceda-ink">
            Users and roles
          </h1>
          <p className="mt-2 text-sm text-ceda-muted">
            Assign staff workspace roles. New accounts receive only the
            submitter role.
          </p>
        </header>
        {notice && (
          <p
            className="mt-5 rounded-xl border border-ceda-line bg-[#FFF9F4] p-4 text-sm text-ceda-body"
            role="status">
            {notice}
          </p>
        )}
        {!roleOptions.length && (
          <p className="mt-5 rounded-xl border border-amber-700/30 bg-amber-50 p-4 text-sm text-amber-950">
            No roles are configured. Run the role seed before assigning staff
            access.
          </p>
        )}
        <div className="mt-7 space-y-4">
          {users.map((account) => {
            const current = assigned.get(account.id) ?? [];
            const available = roleOptions.filter(
              (role) => !current.some((item) => item.id === role.id),
            );
            return (
              <article
                key={account.id}
                className="rounded-2xl border border-ceda-line bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2
                      id={`user-title-${account.id}`}
                      className="font-bold text-ceda-ink">
                      {account.name}
                    </h2>
                    <p className="mt-1 text-sm text-ceda-muted">
                      {account.email} ·{" "}
                      {account.emailVerified
                        ? "Email verified"
                        : "Email not verified"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {current.length ? (
                        current.map((role) => (
                          <span
                            key={role.id}
                            className="rounded-full bg-[#FFF1E4] px-3 py-1 text-xs font-semibold text-ceda-burgundy">
                            {role.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-ceda-muted">
                          No roles assigned
                        </span>
                      )}
                    </div>
                  </div>
                  {available.length > 0 && (
                    <AssignRoleForm
                      userId={account.id}
                      availableRoles={available}
                    />
                  )}
                </div>
              </article>
            );
          })}
        </div>
        {users.length === 100 && (
          <p className="mt-4 text-xs text-ceda-muted">
            Showing the 100 most recently created accounts.
          </p>
        )}
      </div>
    </main>
  );
}
