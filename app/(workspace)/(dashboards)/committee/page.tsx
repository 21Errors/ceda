import { Suspense } from "react";
import { WorkspacePageSkeleton } from "@/components/workspace/WorkspacePageSkeleton";
import { requireRole } from "@/lib/authorization";
import { getCommitteeIdeas } from "@/lib/server/committee-workspace";
import { toggleIdeaFollow } from "@/app/(workspace)/(dashboards)/committee/actions";

export default function CommitteePage({
  searchParams,
}: PageProps<"/committee">) {
  return (
    <Suspense fallback={<WorkspacePageSkeleton variant="table" />}>
      <CommitteeContent searchParams={searchParams} />
    </Suspense>
  );
}

async function CommitteeContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireRole("committee_member", "/committee");
  const [ideas, query] = await Promise.all([
    getCommitteeIdeas(user.id),
    searchParams,
  ]);
  const error =
    query.error === "invalid"
      ? "That submission could not be updated. Refresh and try again."
      : query.error === "unavailable"
        ? "That submission is no longer available to follow."
        : "";
  const followedCount = ideas.filter((idea) => idea.followed).length;

  return (
    <main
      id="main-content"
      className="flex-1 bg-[#FFFDFC] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-275">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ceda-burgundy">
            Committee workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold text-ceda-ink">
            Submission progress
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ceda-muted">
            Monitor submitted ideas and follow the ones you want to keep in
            view. This workspace shows workflow status only; evaluator scores
            and internal notes remain restricted.
          </p>
        </header>
        <div
          className="mt-6 flex flex-wrap gap-3"
          aria-label="Submission counts">
          <p className="rounded-xl border border-ceda-line bg-white px-4 py-3 text-sm">
            <strong className="text-ceda-ink">{ideas.length}</strong>
            <span className="ml-2 text-ceda-muted">available submissions</span>
          </p>
          <p className="rounded-xl border border-ceda-line bg-white px-4 py-3 text-sm">
            <strong className="text-ceda-ink">{followedCount}</strong>
            <span className="ml-2 text-ceda-muted">followed by you</span>
          </p>
        </div>
        {error && (
          <p
            className="mt-5 rounded-xl border border-red-800/25 bg-red-50 p-4 text-sm text-red-900"
            role="alert">
            {error}
          </p>
        )}
        <div
          className="mt-6 overflow-x-auto rounded-2xl border border-ceda-line bg-white shadow-sm"
          tabIndex={0}
          role="region"
          aria-label="Submitted idea progress; scroll horizontally to view all columns">
          <table className="w-full min-w-190 border-collapse text-left text-sm">
            <caption className="border-b border-ceda-line px-5 py-4 text-left font-semibold text-ceda-ink">
              Submitted ideas and their current public workflow status
            </caption>
            <thead className="bg-[#FFF9F4] text-xs uppercase tracking-wide text-ceda-body">
              <tr>
                <th scope="col" className="px-5 py-3">
                  Idea
                </th>
                <th scope="col" className="px-5 py-3">
                  Opportunity
                </th>
                <th scope="col" className="px-5 py-3">
                  Current stage
                </th>
                <th scope="col" className="px-5 py-3">
                  Status
                </th>
                <th scope="col" className="px-5 py-3">
                  Tracking
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ceda-line">
              {ideas.map((idea) => (
                <tr key={idea.id}>
                  <th scope="row" className="px-5 py-4 align-top">
                    <span className="block font-semibold text-ceda-ink">
                      {idea.title}
                    </span>
                    <span className="mt-1 block text-xs text-ceda-muted">
                      {idea.referenceNo}
                    </span>
                  </th>
                  <td className="px-5 py-4 align-top text-ceda-body">
                    {idea.callTitle}
                  </td>
                  <td className="px-5 py-4 align-top text-ceda-body">
                    {idea.stageName ?? "Status update pending"}
                  </td>
                  <td className="px-5 py-4 align-top">
                    <span className="inline-flex rounded-full bg-[#FFF1E4] px-3 py-1 text-xs font-semibold capitalize text-ceda-burgundy">
                      {idea.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <form action={toggleIdeaFollow}>
                      <input type="hidden" name="ideaId" value={idea.id} />
                      <input
                        type="hidden"
                        name="follow"
                        value={idea.followed ? "false" : "true"}
                      />
                      <button
                        type="submit"
                        className="min-h-12 rounded-full border border-ceda-burgundy px-4 text-sm font-semibold text-ceda-burgundy hover:bg-[#FFF1E4]">
                        {idea.followed ? "Unfollow" : "Follow"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {ideas.length === 0 && (
          <p className="mt-4 rounded-xl bg-white p-6 text-sm text-ceda-muted">
            No submitted ideas are available yet.
          </p>
        )}
        <p className="mt-4 text-xs leading-5 text-ceda-muted">
          Following records your interest and is included in the audit trail.
          In-portal alerts appear in Notifications; SMS delivery is not
          connected.
        </p>
      </div>
    </main>
  );
}
