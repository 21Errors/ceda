import type { ReactNode } from "react";
import { redirectIfAuthenticated } from "@/lib/authorization";

export async function GuestOnlyGuard({
  searchParams,
  children,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
  children: ReactNode;
}) {
  const params = searchParams ? await searchParams : undefined;
  const rawNext = params?.next;
  const nextPath = Array.isArray(rawNext) ? rawNext[0] : rawNext;
  await redirectIfAuthenticated(nextPath);
  return <>{children}</>;
}
