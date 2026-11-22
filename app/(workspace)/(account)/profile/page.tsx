import { Suspense } from "react";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { WorkspacePageSkeleton } from "@/components/workspace/WorkspacePageSkeleton";
import { getUserRoles, requireUser } from "@/lib/authorization";
import { loadUserProfileDetails } from "@/lib/server/account";

export default function ProfilePage() {
  return (
    <Suspense fallback={<WorkspacePageSkeleton variant="form" />}>
      <ProfileContent />
    </Suspense>
  );
}

async function ProfileContent() {
  const account = await requireUser("/profile");
  const [profile, roles] = await Promise.all([
    loadUserProfileDetails(account.id),
    getUserRoles(account.id),
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
        <h1 className="mt-2 text-3xl font-bold text-ceda-ink">My profile</h1>
        <p className="mt-2 text-sm leading-6 text-ceda-muted">
          Manage the personal and organisation details linked to your portal
          account.
        </p>

        <section className="mt-7 rounded-2xl border border-white bg-white p-6 shadow-sm sm:p-8">
          <ProfileForm
            name={account.name ?? ""}
            organisation={profile?.organisation ?? ""}
            jobTitle={profile?.jobTitle ?? ""}
          />
        </section>

        <section className="mt-5 rounded-2xl border border-white bg-white p-6 shadow-sm">
          <h2 className="font-bold text-ceda-ink">Sign-in email</h2>
          <p className="mt-2 text-sm text-ceda-body">{account.email}</p>
          <p className="mt-1 text-xs text-ceda-muted">
            To change your password or manage account security, visit account
            settings.
          </p>
          <h3 className="mt-5 text-sm font-semibold text-ceda-ink">
            Portal roles
          </h3>
          <p className="mt-1 text-sm capitalize text-ceda-muted">
            {roles.map((role) => role.replaceAll("_", " ")).join(", ")}
          </p>
        </section>
      </div>
    </main>
  );
}
