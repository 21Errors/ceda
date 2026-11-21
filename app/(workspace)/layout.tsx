import type { ReactNode } from "react";
import { WorkspaceLayoutFrame } from "@/components/workspace/WorkspaceLayoutFrame";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <WorkspaceLayoutFrame>{children}</WorkspaceLayoutFrame>;
}
