import { redirect } from "next/navigation";
import { Suspense } from "react";
import { WorkspacePageSkeleton } from "@/components/workspace/WorkspacePageSkeleton";
import { getUserRoles, requireUser } from "@/lib/authorization";
import { getPrimaryWorkspaceHref } from "@/lib/navigation";

export default function NotificationsRedirectPage() {
  return (
    <Suspense fallback={<WorkspacePageSkeleton variant="list" />}>
      <NotificationsRedirectContent />
    </Suspense>
  );
}

async function NotificationsRedirectContent() {
  const account = await requireUser("/notifications");
  const roles = await getUserRoles(account.id);
  redirect(`${getPrimaryWorkspaceHref(roles)}?notifications=open`);
  return null;
}
