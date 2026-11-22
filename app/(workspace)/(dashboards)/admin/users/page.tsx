import { Suspense } from "react";
import { UsersDataTable } from "@/components/admin/users/UsersDataTable";
import { WorkspacePageSkeleton } from "@/components/workspace/WorkspacePageSkeleton";
import { resolveUsersAdminNotice } from "@/lib/admin-messages";
import { requireRole } from "@/lib/authorization";
import { loadAdminUsersDirectory } from "@/lib/server/admin-governance";

export default function AdminUsersPage({
  searchParams,
}: PageProps<"/admin/users">) {
  return (
    <Suspense fallback={<WorkspacePageSkeleton variant="table" />}>
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
  const [{ users, roleOptions }, query] = await Promise.all([
    loadAdminUsersDirectory(200),
    searchParams,
  ]);
  const notice = resolveUsersAdminNotice(query);

  return (
    <main
      id="main-content"
      className="flex-1 bg-[#F7F8F9] px-gutter py-ds-6 sm:py-ds-8"
    >
      <div className="mx-auto w-full max-w-(--container-workspace)">
        <header>
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

        {notice ? (
          <p
            className="mt-5 rounded-xl border border-ceda-line bg-white p-4 text-sm text-ceda-body shadow-xs"
            role="status"
          >
            {notice}
          </p>
        ) : null}

        {!roleOptions.length ? (
          <p className="mt-5 rounded-xl border border-amber-700/30 bg-amber-50 p-4 text-sm text-amber-950">
            No roles are configured. Run the role seed before assigning staff
            access.
          </p>
        ) : null}

        <UsersDataTable users={users} roleOptions={roleOptions} />
      </div>
    </main>
  );
}
