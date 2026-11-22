import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { WorkspacePageSkeleton } from "@/components/workspace/WorkspacePageSkeleton";
import { SubmitterDashboard } from "@/components/dashboard/SubmitterDashboard";
import { getUserRoles, requireUser } from "@/lib/authorization";
import { getSubmitterIdeas } from "@/lib/server/idea-submission";

export default function DashboardPage() {
  return (
    <Suspense fallback={<WorkspacePageSkeleton variant="dashboard" />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  const user = await requireUser("/dashboard");
  const userRoles = await getUserRoles(user.id);
  if (userRoles.length === 0) redirect("/forbidden");
  if (userRoles.length === 1) {
    const workspaceByRole = {
      submitter: "/dashboard",
      evaluator: "/evaluator",
      adjudicator: "/adjudicator",
      admin: "/admin",
      consultant: "/consultant",
      committee_member: "/committee",
    } as const;
    const destination =
      workspaceByRole[userRoles[0] as keyof typeof workspaceByRole];
    if (destination !== "/dashboard") redirect(destination);
  }
  if (userRoles.length > 1) {
    const workspaces = [
      { role: "submitter", title: "Submitter dashboard", href: "/dashboard" },
      { role: "evaluator", title: "Evaluator workspace", href: "/evaluator" },
      {
        role: "adjudicator",
        title: "Adjudicator workspace",
        href: "/adjudicator",
      },
      { role: "admin", title: "Administration", href: "/admin" },
      {
        role: "consultant",
        title: "Consultant workspace",
        href: "/consultant",
      },
      {
        role: "committee_member",
        title: "Committee monitoring",
        href: "/committee",
      },
    ].filter(
      (workspace) =>
        workspace.role !== "submitter" &&
        userRoles.includes(workspace.role as (typeof userRoles)[number]),
    );
    return (
      <main id="main-content" className="flex-1 bg-white px-gutter py-ds-6 sm:py-ds-8">
        <div className="mx-auto w-full max-w-(--container-workspace)">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ceda-burgundy">
            Your account
          </p>
          <h1 className="mt-2 text-3xl font-bold text-ceda-ink">
            Choose a workspace
          </h1>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {workspaces.map((workspace) => (
              <Link
                key={workspace.role}
                href={workspace.href}
                className="rounded-2xl border border-ceda-line bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-ceda-burgundy">
                <span className="font-semibold text-ceda-ink">
                  {workspace.title}
                </span>
                <span className="mt-2 block text-sm text-ceda-muted">
                  Open this role’s portal workspace →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    );
  }
  const ideas = userRoles.includes("submitter")
    ? await getSubmitterIdeas(user.id)
    : [];
  return <SubmitterDashboard name={user.name ?? "Innovator"} ideas={ideas} />;
}
