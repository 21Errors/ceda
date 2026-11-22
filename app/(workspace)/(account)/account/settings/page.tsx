import { Suspense } from "react";
import { NotificationPreferencesForm } from "@/components/account/NotificationPreferencesForm";
import { PasswordChangeForm } from "@/components/profile/PasswordChangeForm";
import { WorkspacePageSkeleton } from "@/components/workspace/WorkspacePageSkeleton";
import { requireUser } from "@/lib/authorization";
import { loadUserNotificationPreferences } from "@/lib/server/account";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default function AccountSettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<WorkspacePageSkeleton variant="form" />}>
      <SettingsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function SettingsContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const account = await requireUser("/account/settings");
  const [channelState, query] = await Promise.all([
    loadUserNotificationPreferences(account.id),
    searchParams,
  ]);

  return (
    <main
      id="main-content"
      className="flex-1 bg-[#F7F8F9] px-gutter py-ds-6 sm:py-ds-8"
    >
      <div className="mx-auto w-full max-w-(--container-workspace)">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-ceda-burgundy">
          Your account
        </p>
        <h1 className="mt-2 text-3xl font-bold text-ceda-ink">
          Account settings
        </h1>
        <p className="mt-2 text-sm leading-6 text-ceda-muted">
          Manage your password, security, and notification preferences.
        </p>

        <section className="mt-7 rounded-2xl border border-white bg-white p-6 shadow-sm sm:p-8">
          <p className="mb-5 text-sm text-ceda-muted">
            Signed in as{" "}
            <strong className="text-ceda-ink">{account.email}</strong>
          </p>
          <PasswordChangeForm />
        </section>

        <NotificationPreferencesForm
          channelState={channelState}
          saved={query.saved === "notifications"}
        />
      </div>
    </main>
  );
}
