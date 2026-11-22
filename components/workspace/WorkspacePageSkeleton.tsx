import { Skeleton } from "@/components/ui/Alert";

export type WorkspaceSkeletonVariant =
  | "dashboard"
  | "cards"
  | "list"
  | "table"
  | "form"
  | "detail";

export function WorkspacePageSkeleton({
  variant = "list",
}: {
  variant?: WorkspaceSkeletonVariant;
}) {
  return (
    <main
      id="main-content"
      aria-busy="true"
      aria-label="Loading workspace content"
      className="ds-skeleton-delay flex-1 bg-neutral-50 px-gutter py-ds-6 sm:py-ds-8"
    >
      <div className="mx-auto w-full max-w-(--container-workspace) space-y-ds-6">
        {/* Header skeleton */}
        <div className="space-y-ds-2">
          <Skeleton variant="text" className="h-3 w-28" />
          <Skeleton variant="text" className="h-8 w-64 max-w-full" />
          <Skeleton variant="text" className="h-4 w-96 max-w-full" />
        </div>

        {variant === "dashboard" ? (
          <>
            <div className="grid grid-cols-2 gap-ds-4 lg:grid-cols-4">
              <Skeleton variant="rect" className="h-28" />
              <Skeleton variant="rect" className="h-28" />
              <Skeleton variant="rect" className="h-28" />
              <Skeleton variant="rect" className="h-28" />
            </div>
            <div className="grid gap-ds-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(280px,0.9fr)]">
              <Skeleton variant="rect" className="h-80" />
              <div className="space-y-ds-4">
                <Skeleton variant="rect" className="h-36" />
                <Skeleton variant="rect" className="h-36" />
              </div>
            </div>
          </>
        ) : null}

        {variant === "cards" ? (
          <div className="grid gap-ds-4 md:grid-cols-2">
            <Skeleton variant="rect" className="h-48" />
            <Skeleton variant="rect" className="h-48" />
            <Skeleton variant="rect" className="h-48" />
            <Skeleton variant="rect" className="h-48" />
          </div>
        ) : null}

        {variant === "table" ? (
          <div className="space-y-ds-4">
            <div className="grid gap-ds-4 sm:grid-cols-2 lg:grid-cols-4">
              <Skeleton variant="rect" className="h-24" />
              <Skeleton variant="rect" className="h-24" />
              <Skeleton variant="rect" className="h-24" />
              <Skeleton variant="rect" className="h-24" />
            </div>
            <Skeleton variant="rect" className="h-72" />
          </div>
        ) : null}

        {variant === "form" ? (
          <div className="space-y-ds-5 rounded-card border border-neutral-200 bg-white p-card">
            <Skeleton variant="text" className="h-5 w-40" />
            <Skeleton variant="rect" className="h-12 rounded-control" />
            <Skeleton variant="rect" className="h-12 rounded-control" />
            <Skeleton variant="rect" className="h-28 rounded-control" />
            <Skeleton variant="rect" className="h-11 w-40 rounded-full" />
          </div>
        ) : null}

        {variant === "detail" ? (
          <div className="space-y-ds-5">
            <Skeleton variant="rect" className="h-40" />
            <Skeleton variant="rect" className="h-48" />
            <Skeleton variant="rect" className="h-48" />
          </div>
        ) : null}

        {variant === "list" ? (
          <div className="space-y-ds-3">
            <Skeleton variant="rect" className="h-24" />
            <Skeleton variant="rect" className="h-24" />
            <Skeleton variant="rect" className="h-24" />
          </div>
        ) : null}
      </div>
    </main>
  );
}
