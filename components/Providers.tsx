"use client";

import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { NotificationsModalProvider } from "@/components/notifications/NotificationsModalContext";
import { getQueryClient } from "@/lib/query-client";

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <NotificationsModalProvider>
        {children}
      </NotificationsModalProvider>
      <Toaster position="bottom-right" richColors closeButton={false} duration={4000} />
    </QueryClientProvider>
  );
}
