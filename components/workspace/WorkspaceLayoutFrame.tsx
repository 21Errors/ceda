import type { ReactNode } from "react";
import { Suspense } from "react";
import { getWorkspaceNavContext } from "@/lib/server/workspace-context";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";

function WorkspaceShellFallback({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#F7F8F9]">
      <aside
        aria-hidden="true"
        className="hidden h-dvh w-[17rem] shrink-0 border-e border-ceda-line bg-[#FCF8F5] p-ds-4 lg:flex lg:flex-col lg:gap-ds-4"
      >
        <div className="h-10 w-28 rounded-control bg-ceda-cream-mid/70" />
        <div className="mt-ds-4 space-y-2">
          <div className="h-9 w-full rounded-control bg-white/80" />
          <div className="h-9 w-full rounded-control bg-white/60" />
          <div className="h-9 w-4/5 rounded-control bg-white/60" />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="h-16 border-b border-ceda-line bg-white/90 px-gutter" />
        <div className="flex flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}

async function ResolvedWorkspaceShell({
  sectionLabel,
  children,
}: {
  sectionLabel?: string;
  children: ReactNode;
}) {
  const context = await getWorkspaceNavContext();

  return (
    <WorkspaceShell
      user={context?.user ?? null}
      roles={context?.roles ?? []}
      unreadNotifications={context?.unreadNotifications ?? 0}
      sectionLabel={sectionLabel}
    >
      {children}
    </WorkspaceShell>
  );
}

export function WorkspaceLayoutFrame({
  sectionLabel,
  children,
}: {
  sectionLabel?: string;
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<WorkspaceShellFallback>{children}</WorkspaceShellFallback>}>
      <ResolvedWorkspaceShell sectionLabel={sectionLabel}>{children}</ResolvedWorkspaceShell>
    </Suspense>
  );
}
